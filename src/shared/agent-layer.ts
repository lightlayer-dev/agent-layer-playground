// ── Agent-Layer middleware using @agent-layer/hono ──
//
// Uses the real agent-layer library instead of hand-rolling features.
// Custom MCP and OpenAPI remain demo-specific since they need tool handlers.

import { Hono } from "hono";
import {
  rateLimits,
  agentErrors,
  notFoundHandler,
  llmsTxtRoutes,
  discoveryRoutes,
  a2aRoutes,
  agentsTxtRoutes,
  robotsTxtRoutes,
  securityHeaders,
} from "@agent-layer/hono";
import type { DemoConfig, EndpointDef, ParameterDef } from "./types";
import { createMcpHandler } from "./mcp";

const BASE_URL = "https://agent-layer-playground.lightlayer.workers.dev";

/** Attach all agent-layer routes to the given Hono app */
export function attachAgentLayer(app: Hono, config: DemoConfig) {
  const { name, description, prefix, version, tools, endpoints, skills } = config;

  // ── Real agent-layer middleware ──

  // Security headers (HSTS, CSP, etc.)
  app.use("*", securityHeaders({
    csp: "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:",
  }));

  // Rate limiting
  app.use("*", rateLimits({ max: 1000, windowMs: 3_600_000 }));

  // Structured error handler
  app.onError(agentErrors());

  // ── llms.txt via @agent-layer/hono ──
  const llmsHandlers = llmsTxtRoutes({
    title: name,
    description,
    sections: [
      {
        title: "Endpoints",
        content: endpoints
          .map(
            (ep) =>
              `### ${ep.method} ${ep.path}\n${ep.summary}\n${ep.description}${
                ep.parameters
                  ? "\nParameters:\n" +
                    ep.parameters
                      .map((p: ParameterDef) => `  - ${p.name} (${p.in}): ${p.description}`)
                      .join("\n")
                  : ""
              }`
          )
          .join("\n\n"),
      },
      {
        title: "Agent Features",
        content: [
          `- MCP endpoint: POST ${prefix}/mcp`,
          `- OpenAPI spec: GET ${prefix}/openapi.json`,
          `- Discovery: GET ${prefix}/.well-known/ai`,
          `- A2A Agent Card: GET ${prefix}/.well-known/agent.json`,
          `- Agent policy: GET ${prefix}/agents.txt`,
          `- robots.txt: GET ${prefix}/robots.txt`,
        ].join("\n"),
      },
    ],
  });
  app.get("/llms.txt", (c) => llmsHandlers.llmsTxt(c));
  app.get("/llms-full.txt", (c) => llmsHandlers.llmsFullTxt(c));

  // ── agents.txt via @agent-layer/hono ──
  const agentsTxtHandlers = agentsTxtRoutes({
    rules: [
      {
        agent: "*",
        allow: ["/"],
        auth: { type: "none" },
        rateLimit: { max: 1000, windowSeconds: 3600 },
        description: `${name} — open demo, no auth required`,
      },
    ],
    siteName: name,
    contact: "https://github.com/lightlayer-dev/agent-layer-playground",
  });
  app.get("/agents.txt", (c) => agentsTxtHandlers.agentsTxt(c));

  // ── Discovery (.well-known/ai) via @agent-layer/hono ──
  const discoveryHandlers = discoveryRoutes({
    manifest: {
      name,
      description,
    },
  });
  app.get("/.well-known/ai", (c) => discoveryHandlers.wellKnownAi(c));

  // ── A2A Agent Card via @agent-layer/hono ──
  const a2aHandlers = a2aRoutes({
    card: {
      protocolVersion: "1.0.0",
      name,
      description,
      url: `${BASE_URL}${prefix}`,
      version,
      capabilities: {
        streaming: false,
        pushNotifications: false,
      },
      skills: skills.map((s) => ({
        id: s.toLowerCase().replace(/\s+/g, "-"),
        name: s,
        description: `${s} capability`,
      })),
      defaultInputModes: ["application/json"],
      defaultOutputModes: ["application/json"],
      provider: {
        organization: "LightLayer",
        url: "https://github.com/lightlayer-dev",
      },
    },
  });
  app.get("/.well-known/agent.json", (c) => a2aHandlers.agentCard(c));

  // ── robots.txt via @agent-layer/hono ──
  const robotsHandlers = robotsTxtRoutes({
    aiAllow: ["/"],
    sitemaps: [`${BASE_URL}/sitemap.xml`],
  });
  app.get("/robots.txt", (c) => robotsHandlers.robotsTxt(c));

  // ── MCP endpoint (custom — uses demo tool handlers) ──
  app.post("/mcp", createMcpHandler(name, version, tools));

  // ── OpenAPI 3.0 spec (custom — uses demo endpoint definitions) ──
  app.get("/openapi.json", (c) => {
    const paths: Record<string, Record<string, unknown>> = {};

    for (const ep of endpoints) {
      const method = ep.method.toLowerCase();
      const pathKey = ep.path;

      if (!paths[pathKey]) paths[pathKey] = {};
      const operation: Record<string, unknown> = {
        summary: ep.summary,
        description: ep.description,
        operationId: ep.summary.toLowerCase().replace(/\s+/g, "_"),
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: ep.responseSchema ?? { type: "object" },
              },
            },
          },
        },
      };

      if (ep.parameters) {
        operation.parameters = ep.parameters.map((p) => ({
          name: p.name,
          in: p.in,
          description: p.description,
          required: p.required ?? false,
          schema: p.schema,
        }));
      }

      if (ep.requestBody) {
        operation.requestBody = {
          description: ep.requestBody.description,
          content: {
            "application/json": { schema: ep.requestBody.schema },
          },
        };
      }

      paths[pathKey][method] = operation;
    }

    return c.json({
      openapi: "3.0.3",
      info: { title: name, description, version },
      servers: [{ url: `${BASE_URL}${prefix}` }],
      paths,
    });
  });

  // ── 404 handler ──
  app.notFound(notFoundHandler());
}

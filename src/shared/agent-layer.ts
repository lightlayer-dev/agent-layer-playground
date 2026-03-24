// ── Agent-Layer middleware factory ──
//
// Creates a Hono sub-app with all agent-readiness features for a demo:
// - llms.txt, agents.txt, .well-known/ai, .well-known/agent.json
// - OpenAPI 3.0 spec, MCP endpoint
// - Structured error handling, rate-limit headers

import { Hono } from "hono";
import type { DemoConfig, EndpointDef, ParameterDef } from "./types";
import { createMcpHandler } from "./mcp";

const BASE_URL = "https://agent-layer-playground.pages.dev";

/** Attach all agent-layer routes to the given Hono app */
export function attachAgentLayer(app: Hono, config: DemoConfig) {
  const { name, description, prefix, version, tools, endpoints, skills } = config;

  // ── Rate-limit headers (simulated) ──
  app.use("*", async (c, next) => {
    await next();
    c.header("X-RateLimit-Limit", "1000");
    c.header("X-RateLimit-Remaining", "999");
    c.header("X-RateLimit-Reset", String(Math.floor(Date.now() / 1000) + 3600));
  });

  // ── Structured error handler ──
  app.onError((err, c) => {
    console.error(`[${name}]`, err);
    return c.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: err.message || "An unexpected error occurred",
        },
      },
      500
    );
  });

  // ── llms.txt — LLM-friendly plain-text documentation ──
  app.get("/llms.txt", (c) => {
    const lines = [
      `# ${name}`,
      `> ${description}`,
      "",
      `Version: ${version}`,
      `Base URL: ${BASE_URL}${prefix}`,
      "",
      "## Endpoints",
      "",
      ...endpoints.map(
        (ep) =>
          `### ${ep.method} ${ep.path}\n${ep.summary}\n${ep.description}${
            ep.parameters
              ? "\nParameters:\n" +
                ep.parameters.map((p: ParameterDef) => `  - ${p.name} (${p.in}): ${p.description}`).join("\n")
              : ""
          }\n`
      ),
      "## Agent Features",
      "",
      `- MCP endpoint: POST ${prefix}/mcp`,
      `- OpenAPI spec: GET ${prefix}/openapi.json`,
      `- Discovery: GET ${prefix}/.well-known/ai`,
      `- A2A Agent Card: GET ${prefix}/.well-known/agent.json`,
      `- Agent policy: GET ${prefix}/agents.txt`,
    ];
    return c.text(lines.join("\n"));
  });

  // ── agents.txt — robot-style policy for AI agents ──
  app.get("/agents.txt", (c) => {
    const lines = [
      `# Agent policy for ${name}`,
      `# ${BASE_URL}${prefix}`,
      "",
      "User-agent: *",
      "Allow: /",
      "",
      `# Discovery`,
      `MCP: ${prefix}/mcp`,
      `OpenAPI: ${prefix}/openapi.json`,
      `AI-Discovery: ${prefix}/.well-known/ai`,
      `A2A: ${prefix}/.well-known/agent.json`,
      "",
      "# Rate limits",
      "Rate-Limit: 1000/hour",
      "",
      "# Skills",
      ...skills.map((s) => `Skill: ${s}`),
    ];
    return c.text(lines.join("\n"));
  });

  // ── /.well-known/ai — JSON discovery manifest ──
  app.get("/.well-known/ai", (c) => {
    return c.json({
      schema_version: "1.0",
      name,
      description,
      url: `${BASE_URL}${prefix}`,
      version,
      capabilities: {
        mcp: { url: `${BASE_URL}${prefix}/mcp`, transport: "streamable-http" },
        openapi: { url: `${BASE_URL}${prefix}/openapi.json` },
        a2a: { url: `${BASE_URL}${prefix}/.well-known/agent.json` },
        llms_txt: { url: `${BASE_URL}${prefix}/llms.txt` },
        agents_txt: { url: `${BASE_URL}${prefix}/agents.txt` },
      },
      skills,
      rate_limits: { requests_per_hour: 1000 },
      contact: "https://github.com/lightlayer-dev/agent-layer-playground",
    });
  });

  // ── /.well-known/agent.json — A2A Agent Card ──
  app.get("/.well-known/agent.json", (c) => {
    return c.json({
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
    });
  });

  // ── MCP endpoint ──
  app.post("/mcp", createMcpHandler(name, version, tools));

  // ── OpenAPI 3.0 spec ──
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
}

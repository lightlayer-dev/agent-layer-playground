// ── Agent-Layer Playground ──
//
// A Cloudflare Workers + Hono application serving 4 demo APIs,
// each with full agent-readiness: MCP, A2A, llms.txt, agents.txt,
// OpenAPI, structured errors, and rate-limit headers.
//
// https://github.com/lightlayer-dev/agent-layer-playground

import { Hono } from "hono";
import { cors } from "hono/cors";
import { getLandingPage } from "./landing";
import ecommerceApp from "./demos/ecommerce";
import saasApp from "./demos/saas";
import contentApp from "./demos/content";
import fintechApp from "./demos/fintech";

const app = new Hono();

// ── CORS (allow all origins for demo purposes) ──
app.use("*", cors());

// ── Landing page ──
app.get("/", (c) => {
  return c.html(getLandingPage());
});

// ── Root-level agent discovery ──
app.get("/llms.txt", (c) => {
  return c.text(`# Agent-Ready API Playground
> 4 live demo APIs with full agent-readiness

## Demo APIs

- /demo/ecommerce — E-Commerce API (products, cart, orders)
- /demo/saas — SaaS Platform API (users, teams, billing)
- /demo/content — Content CMS API (posts, comments, tags)
- /demo/fintech — Fintech Banking API (accounts, transactions)

Each demo has its own:
- MCP endpoint: POST {prefix}/mcp
- OpenAPI spec: GET {prefix}/openapi.json
- LLM docs: GET {prefix}/llms.txt
- Agent policy: GET {prefix}/agents.txt
- Discovery: GET {prefix}/.well-known/ai
- A2A card: GET {prefix}/.well-known/agent.json

## Getting Started

Pick a demo and explore its MCP endpoint to discover available tools.
`);
});

app.get("/agents.txt", (c) => {
  return c.text(`# Agent policy for Agent-Ready API Playground
# https://agent-layer-playground.pages.dev

User-agent: *
Allow: /

# Demo APIs
MCP: /demo/ecommerce/mcp
MCP: /demo/saas/mcp
MCP: /demo/content/mcp
MCP: /demo/fintech/mcp

# Discovery
AI-Discovery: /demo/ecommerce/.well-known/ai
AI-Discovery: /demo/saas/.well-known/ai
AI-Discovery: /demo/content/.well-known/ai
AI-Discovery: /demo/fintech/.well-known/ai

Rate-Limit: 1000/hour
`);
});

app.get("/.well-known/ai", (c) => {
  return c.json({
    schema_version: "1.0",
    name: "Agent-Ready API Playground",
    description: "4 live demo APIs with full agent-readiness",
    url: "https://agent-layer-playground.pages.dev",
    demos: [
      { name: "E-Commerce API", prefix: "/demo/ecommerce", mcp: "/demo/ecommerce/mcp" },
      { name: "SaaS Platform API", prefix: "/demo/saas", mcp: "/demo/saas/mcp" },
      { name: "Content CMS API", prefix: "/demo/content", mcp: "/demo/content/mcp" },
      { name: "Fintech Banking API", prefix: "/demo/fintech", mcp: "/demo/fintech/mcp" },
    ],
  });
});

// ── Mount demo APIs ──
app.route("/demo/ecommerce", ecommerceApp);
app.route("/demo/saas", saasApp);
app.route("/demo/content", contentApp);
app.route("/demo/fintech", fintechApp);

// ── 404 handler ──
app.notFound((c) => {
  return c.json(
    {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${c.req.method} ${c.req.path} not found. Try GET / for the playground.`,
      },
    },
    404
  );
});

// ── Global error handler ──
app.onError((err, c) => {
  console.error("Unhandled error:", err);
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

export default app;

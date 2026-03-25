// ── Agent-Layer Playground ──
//
// A Cloudflare Workers + Hono application serving 4 demo APIs,
// each powered by @agent-layer/hono for real agent-readiness:
// MCP, A2A, llms.txt, agents.txt, robots.txt, security headers,
// structured errors, and rate-limit headers.
//
// https://github.com/lightlayer-dev/agent-layer-playground

import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  rateLimits,
  securityHeaders,
  robotsTxtRoutes,
  agentsTxtRoutes,
  llmsTxtRoutes,
  discoveryRoutes,
  agentErrors,
  notFoundHandler,
} from "@agent-layer/hono";
import { getLandingPage } from "./landing";
import ecommerceApp from "./demos/ecommerce";
import { crmApp } from "./demos/crm";
import contentApp from "./demos/content";
import fintechApp from "./demos/fintech";

const app = new Hono();

// ── Global middleware via @agent-layer/hono ──
app.use("*", cors());
app.use("*", securityHeaders({
  csp: "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:",
}));
app.use("*", rateLimits({ max: 1000, windowMs: 3_600_000 }));
app.onError(agentErrors());

// ── Landing page ──
app.get("/", (c) => {
  return c.html(getLandingPage());
});

// ── Root-level agent discovery via @agent-layer/hono ──
const rootLlms = llmsTxtRoutes({
  title: "Agent-Ready API Playground",
  description: "4 live demo APIs with full agent-readiness",
  sections: [
    {
      title: "Demo APIs",
      content: [
        "- /demo/ecommerce — E-Commerce API (products, cart, orders)",
        "- /demo/crm — CRM API (contacts, companies, deals, pipeline)",
        "- /demo/content — Content CMS API (posts, comments, tags)",
        "- /demo/fintech — Fintech Banking API (accounts, transactions)",
        "",
        "Each demo has its own:",
        "- MCP endpoint: POST {prefix}/mcp",
        "- OpenAPI spec: GET {prefix}/openapi.json",
        "- LLM docs: GET {prefix}/llms.txt",
        "- Agent policy: GET {prefix}/agents.txt",
        "- Discovery: GET {prefix}/.well-known/ai",
        "- A2A card: GET {prefix}/.well-known/agent.json",
        "- robots.txt: GET {prefix}/robots.txt",
      ].join("\n"),
    },
    {
      title: "Getting Started",
      content: "Pick a demo and explore its MCP endpoint to discover available tools.",
    },
  ],
});
app.get("/llms.txt", (c) => rootLlms.llmsTxt(c));
app.get("/llms-full.txt", (c) => rootLlms.llmsFullTxt(c));

const rootAgentsTxt = agentsTxtRoutes({
  rules: [
    {
      agent: "*",
      allow: ["/"],
      rateLimit: { max: 1000, windowSeconds: 3600 },
      description: "Agent-Ready API Playground — open demo, no auth required",
    },
  ],
  siteName: "Agent-Ready API Playground",
  contact: "https://github.com/lightlayer-dev/agent-layer-playground",
});
app.get("/agents.txt", (c) => rootAgentsTxt.agentsTxt(c));

const rootDiscovery = discoveryRoutes({
  manifest: {
    name: "Agent-Ready API Playground",
    description: "4 live demo APIs with full agent-readiness",
  },
});
app.get("/.well-known/ai", (c) => rootDiscovery.wellKnownAi(c));

const rootRobots = robotsTxtRoutes({
  aiAllow: ["/"],
  sitemaps: ["https://agent-layer-playground.lightlayer.workers.dev/sitemap.xml"],
});
app.get("/robots.txt", (c) => rootRobots.robotsTxt(c));

// ── Mount demo APIs ──
app.route("/demo/ecommerce", ecommerceApp);
app.route("/demo/crm", crmApp);
app.route("/demo/content", contentApp);
app.route("/demo/fintech", fintechApp);

// ── 404 handler ──
app.notFound(notFoundHandler());

export default app;

// src/index.ts
import { Hono as Hono3 } from "hono";

// src/agent-errors.ts
import { buildErrorResponse, buildNotFoundResponse } from "@agent-layer/core";
function agentErrors() {
  return (err, c) => {
    const result = buildErrorResponse(
      err,
      c.req.header("accept"),
      c.req.header("user-agent")
    );
    for (const [k, v] of Object.entries(result.headers)) {
      c.header(k, v);
    }
    if (result.isJson) {
      return c.json(result.body, result.status);
    } else {
      return c.html(result.body, result.status);
    }
  };
}
function notFoundHandler() {
  return (c) => {
    const result = buildNotFoundResponse(
      c.req.method,
      c.req.path,
      c.req.header("accept"),
      c.req.header("user-agent")
    );
    if (result.isJson) {
      return c.json(result.body, 404);
    } else {
      return c.html(result.body, 404);
    }
  };
}

// src/rate-limits.ts
import { createRateLimiter, rateLimitError } from "@agent-layer/core";
function rateLimits(config) {
  const check = createRateLimiter(config);
  return async function rateLimitMiddleware(c, next) {
    const result = await check(c.req.raw);
    c.header("X-RateLimit-Limit", String(result.limit));
    c.header("X-RateLimit-Remaining", String(result.remaining));
    c.header(
      "X-RateLimit-Reset",
      String(Math.ceil((Date.now() + result.resetMs) / 1e3))
    );
    if (!result.allowed) {
      const retryAfter = result.retryAfter ?? Math.ceil(result.resetMs / 1e3);
      c.header("Retry-After", String(retryAfter));
      const envelope = rateLimitError(retryAfter);
      return c.json({ error: envelope }, 429);
    }
    await next();
  };
}

// src/llms-txt.ts
import { generateLlmsTxt, generateLlmsFullTxt } from "@agent-layer/core";
function llmsTxtRoutes(config, routes = []) {
  const txt = generateLlmsTxt(config);
  const fullTxt = generateLlmsFullTxt(config, routes);
  return {
    /**
     * GET /llms.txt handler — returns the concise version.
     */
    llmsTxt(c) {
      return c.text(txt);
    },
    /**
     * GET /llms-full.txt handler — returns the full version with route docs.
     */
    llmsFullTxt(c) {
      return c.text(fullTxt);
    }
  };
}

// src/discovery.ts
import { generateAIManifest, generateJsonLd } from "@agent-layer/core";
function discoveryRoutes(config) {
  const manifest = generateAIManifest(config);
  const jsonLd = generateJsonLd(config);
  return {
    /**
     * GET /.well-known/ai handler.
     */
    wellKnownAi(c) {
      return c.json(manifest);
    },
    /**
     * GET /openapi.json handler.
     */
    openApiJson(c) {
      if (config.openApiSpec) {
        return c.json(config.openApiSpec);
      } else {
        return c.json(
          {
            error: {
              type: "not_found_error",
              code: "no_openapi_spec",
              message: "No OpenAPI spec has been configured.",
              status: 404,
              is_retriable: false
            }
          },
          404
        );
      }
    },
    /**
     * Returns JSON-LD structured data for embedding in HTML.
     */
    jsonLd(c) {
      return c.json(jsonLd);
    }
  };
}

// src/agent-meta.ts
function agentMeta(config = {}) {
  const attrName = config.agentIdAttribute ?? "data-agent-id";
  const injectAria = config.ariaLandmarks !== false;
  const metaTags = config.metaTags ?? {};
  return async function agentMetaMiddleware(c, next) {
    await next();
    const contentType = c.res.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      const body = await c.res.text();
      let html = body;
      const metaTagsHtml = Object.entries(metaTags).map(([name, content]) => `<meta name="${name}" content="${content}">`).join("\n    ");
      if (metaTagsHtml && html.includes("</head>")) {
        html = html.replace("</head>", `    ${metaTagsHtml}
</head>`);
      }
      if (html.includes("<body")) {
        html = html.replace("<body", `<body ${attrName}="root"`);
      }
      if (injectAria && html.includes("<main")) {
        html = html.replace(
          /<main(?![^>]*role=)/,
          '<main role="main"'
        );
      }
      c.res = new Response(html, {
        status: c.res.status,
        headers: c.res.headers
      });
    }
  };
}

// src/agent-auth.ts
import { buildOauthDiscoveryDocument, checkRequireAuth } from "@agent-layer/core";
function agentAuth(config) {
  const discovery = buildOauthDiscoveryDocument(config);
  return {
    oauthDiscovery(c) {
      return c.json(discovery);
    },
    requireAuth() {
      return async function requireAuthMiddleware(c, next) {
        const result = checkRequireAuth(config, c.req.header("authorization"));
        if (result.pass) {
          await next();
          return;
        }
        c.header("WWW-Authenticate", result.wwwAuthenticate);
        return c.json({ error: result.envelope }, 401);
      };
    }
  };
}

// src/analytics.ts
import {
  createAnalytics
} from "@agent-layer/core";
function agentAnalytics(config = {}) {
  const instance = createAnalytics(config);
  const middleware = async (c, next) => {
    const userAgent = c.req.header("user-agent") ?? "";
    const agent = instance.detect(userAgent);
    if (!agent && !config.trackAll) {
      await next();
      return;
    }
    const start = Date.now();
    await next();
    const event = {
      agent: agent ?? "unknown",
      userAgent,
      method: c.req.method,
      path: c.req.path,
      statusCode: c.res.status,
      durationMs: Date.now() - start,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      contentType: c.res.headers.get("content-type") ?? void 0,
      responseSize: Number(c.res.headers.get("content-length")) || void 0
    };
    instance.record(event);
  };
  middleware.analytics = instance;
  return middleware;
}

// src/api-keys.ts
import { formatError, validateApiKey, hasScope } from "@agent-layer/core";
function apiKeyAuth(config) {
  const headerName = config.headerName ?? "X-Agent-Key";
  const headerLower = headerName.toLowerCase();
  return async function apiKeyAuthMiddleware(c, next) {
    const rawKey = c.req.header(headerLower);
    if (!rawKey) {
      const envelope = formatError({
        code: "api_key_missing",
        message: `Missing required header: ${headerName}`,
        status: 401
      });
      return c.json({ error: envelope }, 401);
    }
    const result = await validateApiKey(config.store, rawKey);
    if (!result.valid) {
      const envelope = formatError({
        code: result.error,
        message: result.error === "api_key_expired" ? "The API key has expired." : "The API key is invalid.",
        status: 401
      });
      return c.json({ error: envelope }, 401);
    }
    c.set("agentKey", result.key);
    await next();
  };
}
function requireScope(scope) {
  return async function requireScopeMiddleware(c, next) {
    const agentKey = c.get("agentKey");
    if (!agentKey) {
      const envelope = formatError({
        code: "api_key_missing",
        message: "Authentication required before scope check.",
        status: 401
      });
      return c.json({ error: envelope }, 401);
    }
    if (!hasScope(agentKey, scope)) {
      const required = Array.isArray(scope) ? scope.join(", ") : scope;
      const envelope = formatError({
        code: "insufficient_scope",
        message: `Required scope(s): ${required}`,
        status: 403
      });
      return c.json({ error: envelope }, 403);
    }
    await next();
  };
}

// src/a2a.ts
import { generateAgentCard } from "@agent-layer/core";
function a2aRoutes(config) {
  const card = generateAgentCard(config);
  return {
    /**
     * GET /.well-known/agent.json handler.
     */
    agentCard(c) {
      c.header("Cache-Control", "public, max-age=3600");
      return c.json(card);
    }
  };
}

// src/agents-txt.ts
import { generateStandaloneAgentsTxt as generateAgentsTxt, isAgentAllowed } from "@agent-layer/core";
function agentsTxtRoutes(config) {
  const content = generateAgentsTxt(config);
  return {
    agentsTxt(c) {
      c.header("Content-Type", "text/plain; charset=utf-8");
      c.header("Cache-Control", "public, max-age=3600");
      return c.text(content);
    },
    enforce: ((c, next) => {
      if (!config.enforce) {
        return next();
      }
      const userAgent = c.req.header("user-agent") ?? "";
      const allowed = isAgentAllowed(config, userAgent, c.req.path);
      if (allowed === false) {
        return c.json(
          {
            error: {
              type: "forbidden_error",
              code: "agent_denied",
              message: `Access denied for agent "${userAgent}" on path "${c.req.path}". See /agents.txt for access policy.`,
              status: 403,
              is_retriable: false,
              docs_url: "/agents.txt"
            }
          },
          403
        );
      }
      return next();
    })
  };
}

// src/robots-txt.ts
import { generateRobotsTxt } from "@agent-layer/core";
function robotsTxtRoutes(config = {}) {
  const content = generateRobotsTxt(config);
  return {
    robotsTxt(c) {
      c.header("Content-Type", "text/plain; charset=utf-8");
      c.header("Cache-Control", "public, max-age=86400");
      return c.text(content);
    }
  };
}

// src/security-headers.ts
import { generateSecurityHeaders } from "@agent-layer/core";
function securityHeaders(config = {}) {
  const headers = generateSecurityHeaders(config);
  return async function securityHeadersMiddleware(c, next) {
    for (const [key, value] of Object.entries(headers)) {
      c.header(key, value);
    }
    await next();
  };
}

// src/x402.ts
import { handleX402 } from "@agent-layer/core";
import { HEADER_PAYMENT_SIGNATURE } from "@agent-layer/core/x402";
function x402Payment(config) {
  return async function x402Middleware(c, next) {
    const paymentHeader = c.req.header(HEADER_PAYMENT_SIGNATURE);
    const url = new URL(c.req.url).toString();
    const result = await handleX402(c.req.method, c.req.path, url, paymentHeader, config);
    switch (result.action) {
      case "skip":
        await next();
        return;
      case "payment_required":
        for (const [k, v] of Object.entries(result.headers)) {
          c.header(k, v);
        }
        return c.json(result.body, result.status);
      case "error":
        return c.json(result.body, result.status);
      case "success":
        for (const [k, v] of Object.entries(result.headers)) {
          c.header(k, v);
        }
        c.set("x402", {
          payment: result.payment,
          settlement: result.settlement,
          requirements: result.requirements
        });
        await next();
        return;
    }
  };
}

// src/agent-identity.ts
import { handleRequireIdentity, handleOptionalIdentity } from "@agent-layer/core";
function agentIdentity(config) {
  const headerName = (config.headerName ?? "authorization").toLowerCase();
  return {
    requireIdentity() {
      return async function requireIdentityMiddleware(c, next) {
        const rawHeader = c.req.header(headerName);
        const headers = {};
        c.req.raw.headers.forEach((value, key) => {
          headers[key] = value;
        });
        const result = await handleRequireIdentity(rawHeader, config, {
          method: c.req.method,
          path: c.req.path,
          headers
        });
        if ("error" in result) {
          return c.json({ error: result.error.envelope }, result.error.status);
        }
        c.set("agentIdentity", result.claims);
        await next();
      };
    },
    optionalIdentity() {
      return async function optionalIdentityMiddleware(c, next) {
        const rawHeader = c.req.header(headerName);
        const claims = await handleOptionalIdentity(rawHeader, config);
        if (claims) c.set("agentIdentity", claims);
        await next();
      };
    }
  };
}

// src/mcp.ts
import { Hono } from "hono";
import {
  generateToolDefinitions,
  generateServerInfo,
  parseToolName,
  handleJsonRpc
} from "@agent-layer/core";
function mcpServer(config) {
  const serverInfo = generateServerInfo(config);
  const autoTools = config.routes ? generateToolDefinitions(config.routes) : [];
  const manualTools = config.tools || [];
  const allTools = [...autoTools, ...manualTools];
  const toolRouteMap = /* @__PURE__ */ new Map();
  if (config.routes) {
    for (let i = 0; i < config.routes.length; i++) {
      const route = config.routes[i];
      const toolDef = autoTools[i];
      if (toolDef) {
        toolRouteMap.set(toolDef.name, {
          method: route.method.toUpperCase(),
          path: route.path
        });
      }
    }
  }
  const defaultToolCallHandler = async (toolName, args) => {
    const routeInfo = toolRouteMap.get(toolName);
    if (!routeInfo) {
      const parsed = parseToolName(toolName);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `No route handler for tool: ${toolName}`,
              parsed
            })
          }
        ]
      };
    }
    let resolvedPath = routeInfo.path;
    const queryParams = {};
    const bodyParams = {};
    for (const [key, value] of Object.entries(args)) {
      const paramPattern = `:${key}`;
      if (resolvedPath.includes(paramPattern)) {
        resolvedPath = resolvedPath.replace(paramPattern, String(value));
      } else if (routeInfo.method === "GET" || routeInfo.method === "DELETE") {
        queryParams[key] = String(value);
      } else {
        bodyParams[key] = value;
      }
    }
    const qs = new URLSearchParams(queryParams).toString();
    const url = qs ? `${resolvedPath}?${qs}` : resolvedPath;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            tool: toolName,
            method: routeInfo.method,
            url,
            body: Object.keys(bodyParams).length > 0 ? bodyParams : void 0
          })
        }
      ]
    };
  };
  return {
    app() {
      const app = new Hono();
      app.post("/", async (c) => {
        const body = await c.req.json();
        if (!body || !body.jsonrpc || body.jsonrpc !== "2.0") {
          return c.json(
            {
              jsonrpc: "2.0",
              id: null,
              error: { code: -32600, message: "Invalid JSON-RPC request" }
            },
            400
          );
        }
        const result = handleJsonRpc(body, serverInfo, allTools, defaultToolCallHandler);
        if (result === null) {
          return c.text("", 202);
        }
        const response = await Promise.resolve(result);
        return c.json(response);
      });
      app.get("/", (c) => {
        const sessionId = c.req.header("mcp-session-id") || crypto.randomUUID();
        c.header("Content-Type", "text/event-stream");
        c.header("Cache-Control", "no-cache");
        c.header("Connection", "keep-alive");
        c.header("Mcp-Session-Id", sessionId);
        return c.text("");
      });
      app.delete("/", (c) => {
        return c.json({ ok: true });
      });
      return app;
    },
    tools: allTools,
    serverInfo
  };
}

// src/unified-discovery.ts
import { Hono as Hono2 } from "hono";
import {
  generateUnifiedAIManifest,
  generateUnifiedAgentCard,
  generateUnifiedLlmsTxt,
  generateUnifiedLlmsFullTxt,
  generateAgentsTxt as generateAgentsTxt2,
  isFormatEnabled
} from "@agent-layer/core";
function unifiedDiscovery(config) {
  const aiManifest = generateUnifiedAIManifest(config);
  const agentCardDoc = generateUnifiedAgentCard(config);
  const agentsTxtDoc = generateAgentsTxt2(config);
  const llmsTxtDoc = generateUnifiedLlmsTxt(config);
  const llmsFullTxtDoc = generateUnifiedLlmsFullTxt(config);
  const wellKnownAi = (c) => c.json(aiManifest);
  const agentCard = (c) => c.json(agentCardDoc);
  const agentsTxt = (c) => {
    c.header("Content-Type", "text/plain");
    return c.text(agentsTxtDoc);
  };
  const llmsTxt = (c) => {
    c.header("Content-Type", "text/plain");
    return c.text(llmsTxtDoc);
  };
  const llmsFullTxt = (c) => {
    c.header("Content-Type", "text/plain");
    return c.text(llmsFullTxtDoc);
  };
  const app = new Hono2();
  if (isFormatEnabled(config.formats, "wellKnownAi")) {
    app.get("/.well-known/ai", (c) => wellKnownAi(c));
  }
  if (isFormatEnabled(config.formats, "agentCard")) {
    app.get("/.well-known/agent.json", (c) => agentCard(c));
  }
  if (isFormatEnabled(config.formats, "agentsTxt")) {
    app.get("/agents.txt", (c) => agentsTxt(c));
  }
  if (isFormatEnabled(config.formats, "llmsTxt")) {
    app.get("/llms.txt", (c) => llmsTxt(c));
    app.get("/llms-full.txt", (c) => llmsFullTxt(c));
  }
  return { app, wellKnownAi, agentCard, agentsTxt, llmsTxt, llmsFullTxt };
}

// src/ag-ui.ts
import { stream } from "hono/streaming";
import {
  createAgUiEmitter,
  AG_UI_HEADERS
} from "@agent-layer/core";
function agUiStream(handler, options = {}) {
  return (c) => {
    for (const [key, value] of Object.entries(AG_UI_HEADERS)) {
      c.header(key, value);
    }
    return stream(c, async (s) => {
      const body = await c.req.json().catch(() => ({}));
      const emitter = createAgUiEmitter(
        (chunk) => {
          s.write(chunk);
        },
        {
          threadId: options.threadId ?? body?.threadId,
          runId: options.runId
        }
      );
      try {
        await handler(c, emitter);
      } catch (err) {
        if (options.onError) {
          options.onError(err, emitter);
        } else {
          const message = err instanceof Error ? err.message : String(err);
          emitter.runError(message);
        }
      }
    });
  };
}

// src/oauth2.ts
import { handleOAuth2, buildOAuth2Metadata } from "@agent-layer/core";
var OAUTH2_TOKEN_KEY = "oauth2Token";
function oauth2Auth(config) {
  const metadataDoc = buildOAuth2Metadata(config);
  return {
    requireToken(requiredScopes) {
      const mwConfig = {
        oauth2: config,
        requiredScopes
      };
      return async function oauth2Middleware(c, next) {
        const result = await handleOAuth2(c.req.header("authorization"), mwConfig);
        if (result.pass) {
          c.set(OAUTH2_TOKEN_KEY, result.token);
          await next();
          return;
        }
        c.header("WWW-Authenticate", result.wwwAuthenticate);
        return c.json({ error: result.envelope }, result.status);
      };
    },
    metadata(c) {
      return c.json(metadataDoc);
    }
  };
}
function getOAuth2Token(c) {
  return c.get(OAUTH2_TOKEN_KEY);
}

// src/index.ts
function agentLayer(config) {
  const app = new Hono3();
  if (config.errors !== false) {
    app.onError(agentErrors());
  }
  if (config.securityHeaders !== false && config.securityHeaders) {
    app.use("*", securityHeaders(config.securityHeaders));
  }
  if (config.analytics !== false && config.analytics) {
    app.use("*", agentAnalytics(config.analytics));
  }
  if (config.apiKeys !== false && config.apiKeys) {
    app.use("*", apiKeyAuth(config.apiKeys));
  }
  if (config.rateLimit !== false && config.rateLimit) {
    app.use("*", rateLimits(config.rateLimit));
  }
  if (config.agentMeta !== false && config.agentMeta) {
    app.use("*", agentMeta(config.agentMeta));
  }
  if (config.llmsTxt !== false && config.llmsTxt) {
    const handlers = llmsTxtRoutes(config.llmsTxt);
    app.get("/llms.txt", (c) => handlers.llmsTxt(c));
    app.get("/llms-full.txt", (c) => handlers.llmsFullTxt(c));
  }
  if (config.discovery !== false && config.discovery) {
    const handlers = discoveryRoutes(config.discovery);
    app.get("/.well-known/ai", (c) => handlers.wellKnownAi(c));
    app.get("/openapi.json", (c) => handlers.openApiJson(c));
  }
  if (config.a2a !== false && config.a2a) {
    const handlers = a2aRoutes(config.a2a);
    app.get("/.well-known/agent.json", (c) => handlers.agentCard(c));
  }
  if (config.agentsTxt !== false && config.agentsTxt) {
    const handlers = agentsTxtRoutes(config.agentsTxt);
    app.get("/agents.txt", (c) => handlers.agentsTxt(c));
    if (config.agentsTxt.enforce) {
      app.use("*", handlers.enforce);
    }
  }
  if (config.robotsTxt !== false && config.robotsTxt) {
    const handlers = robotsTxtRoutes(config.robotsTxt);
    app.get("/robots.txt", (c) => handlers.robotsTxt(c));
  }
  if (config.agentAuth !== false && config.agentAuth) {
    const handlers = agentAuth(config.agentAuth);
    app.get(
      "/.well-known/oauth-authorization-server",
      (c) => handlers.oauthDiscovery(c)
    );
  }
  if (config.errors !== false) {
    app.notFound(notFoundHandler());
  }
  return app;
}
export {
  a2aRoutes,
  agUiStream,
  agentAnalytics,
  agentAuth,
  agentErrors,
  agentIdentity,
  agentLayer,
  agentMeta,
  agentsTxtRoutes,
  apiKeyAuth,
  discoveryRoutes,
  getOAuth2Token,
  llmsTxtRoutes,
  mcpServer,
  notFoundHandler,
  oauth2Auth,
  rateLimits,
  requireScope,
  robotsTxtRoutes,
  securityHeaders,
  unifiedDiscovery,
  x402Payment
};
//# sourceMappingURL=index.js.map
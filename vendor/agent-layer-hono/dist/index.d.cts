import { ErrorHandler, Context, Next, MiddlewareHandler, Hono } from 'hono';
import { RateLimitConfig, LlmsTxtConfig, RouteMetadata, DiscoveryConfig, AgentMetaConfig, AgentAuthConfig, AnalyticsConfig, AnalyticsInstance, ApiKeyConfig, X402Config, A2AConfig, AgentIdentityConfig, AgentsTxtMiddlewareConfig, McpServerConfig, McpToolDefinition, McpServerInfo, UnifiedDiscoveryConfig, AgUiEmitterOptions, AgUiEmitter, DecodedAccessToken, OAuth2Config, RobotsTxtConfig, SecurityHeadersConfig, AgentLayerConfig } from '@agent-layer/core';
export { AgentEvent, AgentsTxtMiddlewareConfig, AnalyticsConfig, AnalyticsInstance, McpServerConfig, RobotsTxtConfig, SecurityHeadersConfig } from '@agent-layer/core';
import * as hono_types from 'hono/types';
export { X402Config, X402RouteConfig } from '@agent-layer/core/x402';

declare function agentErrors(): ErrorHandler;
declare function notFoundHandler(): (c: Context) => Response;

/**
 * Hono middleware that adds X-RateLimit-* headers to every response
 * and returns 429 with Retry-After when the limit is exceeded.
 */
declare function rateLimits(config: RateLimitConfig): (c: Context, next: Next) => Promise<Response | void>;

/**
 * Create Hono route handlers for GET /llms.txt and /llms-full.txt.
 */
declare function llmsTxtRoutes(config: LlmsTxtConfig, routes?: RouteMetadata[]): {
    /**
     * GET /llms.txt handler — returns the concise version.
     */
    llmsTxt(c: Context): Response;
    /**
     * GET /llms-full.txt handler — returns the full version with route docs.
     */
    llmsFullTxt(c: Context): Response;
};

/**
 * Create Hono route handlers for /.well-known/ai and /openapi.json.
 */
declare function discoveryRoutes(config: DiscoveryConfig): {
    /**
     * GET /.well-known/ai handler.
     */
    wellKnownAi(c: Context): Response;
    /**
     * GET /openapi.json handler.
     */
    openApiJson(c: Context): Response;
    /**
     * Returns JSON-LD structured data for embedding in HTML.
     */
    jsonLd(c: Context): Response;
};

/**
 * Hono response-transform middleware for HTML responses.
 * Injects data-agent-id attributes, ARIA landmarks, and meta tags.
 */
declare function agentMeta(config?: AgentMetaConfig): (c: Context, next: Next) => Promise<void>;

declare function agentAuth(config: AgentAuthConfig): {
    oauthDiscovery(c: Context): Response;
    requireAuth(): (c: Context, next: Next) => Promise<Response | void>;
};

/**
 * Hono middleware for agent traffic analytics.
 *
 * Usage:
 *   import { agentAnalytics } from "@agent-layer/hono";
 *   app.use(agentAnalytics({ endpoint: "https://dash.lightlayer.dev/api/agent-events/" }));
 */

/**
 * Hono middleware that detects AI agent traffic and collects analytics.
 * Returns the middleware function. Access the analytics instance via
 * `middleware.analytics` for manual flush/shutdown.
 */
declare function agentAnalytics(config?: AnalyticsConfig): MiddlewareHandler & {
    analytics: AnalyticsInstance;
};

/**
 * Hono middleware that extracts and validates an API key from a request header.
 * Attaches the resolved key to `c.set("agentKey", key)` on success.
 */
declare function apiKeyAuth(config: ApiKeyConfig): (c: Context, next: Next) => Promise<Response | void>;
/**
 * Hono middleware that checks if the authenticated API key has the required scope(s).
 * Must be used after `apiKeyAuth()`.
 */
declare function requireScope(scope: string | string[]): (c: Context, next: Next) => Promise<Response | void>;

declare function x402Payment(config: X402Config): (c: Context, next: Next) => Promise<Response | void>;

/**
 * Create Hono route handlers for the A2A Agent Card endpoint.
 */
declare function a2aRoutes(config: A2AConfig): {
    /**
     * GET /.well-known/agent.json handler.
     */
    agentCard(c: Context): Response;
};

declare function agentIdentity(config: AgentIdentityConfig): {
    requireIdentity(): (c: Context, next: Next) => Promise<Response | void>;
    optionalIdentity(): (c: Context, next: Next) => Promise<void>;
};

declare function agentsTxtRoutes(config: AgentsTxtMiddlewareConfig): {
    agentsTxt(c: Context): Response;
    enforce: MiddlewareHandler;
};

declare function mcpServer(config: McpServerConfig): {
    app(): Hono;
    tools: McpToolDefinition[];
    serverInfo: McpServerInfo;
};

declare function unifiedDiscovery(config: UnifiedDiscoveryConfig): {
    app: Hono<hono_types.BlankEnv, hono_types.BlankSchema, "/">;
    wellKnownAi: (c: Context) => Response;
    agentCard: (c: Context) => Response;
    agentsTxt: (c: Context) => Response;
    llmsTxt: (c: Context) => Response;
    llmsFullTxt: (c: Context) => Response;
};

/**
 * AG-UI stream handler callback for Hono.
 */
type AgUiStreamHandler = (c: Context, emit: AgUiEmitter) => Promise<void>;
interface AgUiMiddlewareOptions extends AgUiEmitterOptions {
    onError?: (err: unknown, emit: AgUiEmitter) => void;
}
/**
 * Create a Hono handler that streams AG-UI events over SSE.
 *
 * Usage:
 * ```ts
 * import { agUiStream } from '@agent-layer/hono';
 *
 * app.post('/api/agent', agUiStream(async (c, emit) => {
 *   emit.runStarted();
 *   emit.textStart();
 *   emit.textDelta("Hello from Hono!");
 *   emit.textEnd();
 *   emit.runFinished();
 * }));
 * ```
 */
declare function agUiStream(handler: AgUiStreamHandler, options?: AgUiMiddlewareOptions): (c: Context) => Response;

interface HonoOAuth2Handlers {
    /** Middleware that validates Bearer tokens and sets context variable. */
    requireToken(requiredScopes?: string[]): (c: Context, next: Next) => Promise<Response | void>;
    /** Route handler for OAuth2 Authorization Server Metadata. */
    metadata(c: Context): Response;
}
/**
 * Create OAuth2 middleware and route handlers for Hono.
 */
declare function oauth2Auth(config: OAuth2Config): HonoOAuth2Handlers;
/**
 * Helper to retrieve the decoded OAuth2 token from Hono context.
 */
declare function getOAuth2Token(c: Context): DecodedAccessToken | undefined;

/**
 * Hono middleware: serves /robots.txt with AI agent awareness.
 */

interface RobotsTxtHandlers {
    /** GET /robots.txt handler */
    robotsTxt(c: Context): Response;
}
/**
 * Create Hono route handler for /robots.txt.
 */
declare function robotsTxtRoutes(config?: RobotsTxtConfig): RobotsTxtHandlers;

/**
 * Hono middleware: sets security headers on all responses.
 */

/**
 * Hono middleware that sets security headers on every response.
 * Defaults are safe and score 10/10 on agent-readiness checks.
 */
declare function securityHeaders(config?: SecurityHeadersConfig): MiddlewareHandler;

/**
 * One-liner that composes all agent-layer middleware onto a single Hono app.
 * Each feature can be disabled by setting it to `false` in the config.
 */
declare function agentLayer(config: AgentLayerConfig): Hono;

export { type AgUiMiddlewareOptions, type AgUiStreamHandler, type HonoOAuth2Handlers, a2aRoutes, agUiStream, agentAnalytics, agentAuth, agentErrors, agentIdentity, agentLayer, agentMeta, agentsTxtRoutes, apiKeyAuth, discoveryRoutes, getOAuth2Token, llmsTxtRoutes, mcpServer, notFoundHandler, oauth2Auth, rateLimits, requireScope, robotsTxtRoutes, securityHeaders, unifiedDiscovery, x402Payment };

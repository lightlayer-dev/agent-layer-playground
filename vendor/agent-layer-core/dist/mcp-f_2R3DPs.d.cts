/**
 * Security headers for agent-facing APIs.
 *
 * Sets headers that protect the API without blocking legitimate agent access:
 * - HSTS (Strict-Transport-Security)
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - Referrer-Policy
 * - Content-Security-Policy
 */
interface SecurityHeadersConfig {
    /** HSTS max-age in seconds. Default: 31536000 (1 year). Set to 0 to disable. */
    hstsMaxAge?: number;
    /** Include subdomains in HSTS. Default: true */
    hstsIncludeSubdomains?: boolean;
    /** X-Frame-Options value. Default: "DENY" */
    frameOptions?: "DENY" | "SAMEORIGIN" | false;
    /** X-Content-Type-Options. Default: "nosniff" */
    contentTypeOptions?: "nosniff" | false;
    /** Referrer-Policy. Default: "strict-origin-when-cross-origin" */
    referrerPolicy?: string | false;
    /** Content-Security-Policy. Default: "default-src 'self'" */
    csp?: string | false;
    /** Permissions-Policy. Default: false (not set) */
    permissionsPolicy?: string | false;
}
interface SecurityHeaders {
    [key: string]: string;
}
/**
 * Generate a map of security headers based on config.
 * Returns a plain object suitable for setting on any HTTP response.
 */
declare function generateSecurityHeaders(config?: SecurityHeadersConfig): SecurityHeaders;

/**
 * robots.txt generation with AI agent rules.
 *
 * Generates a robots.txt that explicitly addresses AI agents (GPTBot, ClaudeBot, etc.)
 * to signal intentional access control rather than leaving it ambiguous.
 */
declare const AI_AGENTS: readonly ["GPTBot", "ChatGPT-User", "Google-Extended", "Anthropic", "ClaudeBot", "CCBot", "Amazonbot", "Bytespider", "Applebot-Extended", "PerplexityBot", "Cohere-ai"];
interface RobotsTxtRule {
    /** User-Agent string (e.g. "*", "GPTBot", "ClaudeBot") */
    userAgent: string;
    /** Allowed paths */
    allow?: string[];
    /** Disallowed paths */
    disallow?: string[];
    /** Crawl delay in seconds */
    crawlDelay?: number;
}
interface RobotsTxtConfig {
    /** Rules in order. If omitted, generates sensible defaults for AI agents. */
    rules?: RobotsTxtRule[];
    /** Sitemap URL(s) to include */
    sitemaps?: string[];
    /** If true, adds rules for all known AI agents. Default: true */
    includeAiAgents?: boolean;
    /** Default policy for AI agents: "allow" or "disallow". Default: "allow" */
    aiAgentPolicy?: "allow" | "disallow";
    /** Paths to allow for AI agents (when using default AI agent rules) */
    aiAllow?: string[];
    /** Paths to disallow for AI agents (when using default AI agent rules) */
    aiDisallow?: string[];
}
/**
 * Generate a robots.txt string with AI agent awareness.
 */
declare function generateRobotsTxt(config?: RobotsTxtConfig): string;

/**
 * OAuth2 Authorization Code Flow with PKCE
 *
 * Provides framework-agnostic OAuth2 utilities for agent authentication:
 * - PKCE code verifier/challenge generation
 * - Authorization URL construction
 * - Token exchange and refresh
 * - Token validation with scope checking
 *
 * No external dependencies — uses Web Crypto API (Node 18+).
 */
interface OAuth2Config {
    /** OAuth2 client ID. */
    clientId: string;
    /** OAuth2 client secret (for confidential clients). */
    clientSecret?: string;
    /** Authorization endpoint URL. */
    authorizationEndpoint: string;
    /** Token endpoint URL. */
    tokenEndpoint: string;
    /** Redirect URI after authorization. */
    redirectUri: string;
    /** Available scopes with descriptions. */
    scopes?: Record<string, string>;
    /** Token TTL in seconds. Default: 3600. */
    tokenTTL?: number;
    /** Issuer URL for token validation. */
    issuer?: string;
    /** Expected audience for token validation. */
    audience?: string;
}
interface TokenResponse {
    /** Access token. */
    access_token: string;
    /** Token type (always "Bearer"). */
    token_type: "Bearer";
    /** Seconds until the access token expires. */
    expires_in: number;
    /** Refresh token (if issued). */
    refresh_token?: string;
    /** Space-delimited list of granted scopes. */
    scope?: string;
}
interface PKCEPair {
    /** Random code verifier (43-128 chars, unreserved URI chars). */
    codeVerifier: string;
    /** Base64url-encoded SHA-256 hash of the verifier. */
    codeChallenge: string;
}
interface OAuth2Error {
    error: string;
    error_description?: string;
    error_uri?: string;
}
interface DecodedAccessToken {
    /** Subject (user or agent ID). */
    sub: string;
    /** Issuer. */
    iss?: string;
    /** Audience. */
    aud?: string | string[];
    /** Expiration (Unix seconds). */
    exp: number;
    /** Issued at (Unix seconds). */
    iat?: number;
    /** Granted scopes. */
    scopes: string[];
    /** OAuth2 client ID. */
    client_id?: string;
    /** All claims. */
    claims: Record<string, unknown>;
}
interface TokenValidationResult {
    valid: boolean;
    token?: DecodedAccessToken;
    error?: string;
}
/**
 * Pluggable HTTP client for token exchange.
 * Keeps the core library framework-agnostic.
 */
interface OAuth2HttpClient {
    post(url: string, body: URLSearchParams, headers?: Record<string, string>): Promise<{
        status: number;
        json(): Promise<unknown>;
    }>;
}
/**
 * Generate a cryptographically random code verifier.
 * Length defaults to 64 characters (well within the 43-128 range).
 */
declare function generateCodeVerifier(length?: number): string;
/**
 * Compute the S256 code challenge from a code verifier.
 * Returns a base64url-encoded SHA-256 hash.
 */
declare function computeCodeChallenge(verifier: string): Promise<string>;
/**
 * Generate a PKCE code verifier + code challenge pair.
 */
declare function generatePKCE(verifierLength?: number): Promise<PKCEPair>;
/**
 * Build the authorization URL for the code flow with PKCE.
 */
declare function buildAuthorizationUrl(config: OAuth2Config, state: string, codeChallenge: string, scopes?: string[]): string;
/**
 * Exchange an authorization code for tokens.
 */
declare function exchangeCode(config: OAuth2Config, code: string, codeVerifier: string, httpClient?: OAuth2HttpClient): Promise<TokenResponse>;
/**
 * Refresh an access token using a refresh token.
 */
declare function refreshAccessToken(config: OAuth2Config, refreshToken: string, httpClient?: OAuth2HttpClient): Promise<TokenResponse>;
/**
 * Decode and validate an access token (JWT).
 * This performs structural validation only (expiry, issuer, audience, scopes).
 * Signature verification should be done at the framework layer with a proper JWKS.
 */
declare function validateAccessToken(token: string, config: OAuth2Config, requiredScopes?: string[], clockSkewSeconds?: number): TokenValidationResult;
/**
 * Extract a Bearer token from an Authorization header value.
 * Returns null if the header is missing or not a Bearer token.
 */
declare function extractBearerToken(authorizationHeader: string | undefined): string | null;
/**
 * Build an OAuth2 Authorization Server Metadata document (RFC 8414).
 */
declare function buildOAuth2Metadata(config: OAuth2Config): Record<string, unknown>;
declare class OAuth2TokenError extends Error {
    readonly errorCode: string;
    readonly statusCode: number;
    constructor(message: string, errorCode: string, statusCode: number);
}

/**
 * A2A (Agent-to-Agent) Protocol — Agent Card generation.
 *
 * Implements the /.well-known/agent.json endpoint per Google's A2A protocol
 * specification (https://a2a-protocol.org).
 *
 * An Agent Card is a JSON metadata document that describes an agent's
 * capabilities, supported input/output modes, authentication requirements,
 * and skills — enabling machine-readable discovery by other agents.
 */
/** Content type supported by the agent (text, images, files, etc.) */
interface A2AContentType {
    /** MIME type, e.g. "text/plain", "application/json", "image/png" */
    type: string;
}
/** A skill/capability the agent can perform */
interface A2ASkill {
    /** Unique identifier for the skill */
    id: string;
    /** Human-readable name */
    name: string;
    /** Description of what this skill does */
    description?: string;
    /** Tags for categorization and search */
    tags?: string[];
    /** Example prompts/inputs that trigger this skill */
    examples?: string[];
    /** Input content types this skill accepts */
    inputModes?: string[];
    /** Output content types this skill produces */
    outputModes?: string[];
}
/** Authentication scheme the agent supports */
interface A2AAuthScheme {
    /** Auth type: "apiKey", "oauth2", "bearer", "none" */
    type: string;
    /** Where to send the credential: "header", "query" */
    in?: string;
    /** Header/query parameter name */
    name?: string;
    /** OAuth2 authorization URL */
    authorizationUrl?: string;
    /** OAuth2 token URL */
    tokenUrl?: string;
    /** OAuth2 scopes */
    scopes?: Record<string, string>;
}
/** Provider/organization info */
interface A2AProvider {
    /** Organization name */
    organization: string;
    /** URL to the provider's website */
    url?: string;
}
/** Capabilities the agent supports */
interface A2ACapabilities {
    /** Whether the agent supports streaming responses */
    streaming?: boolean;
    /** Whether the agent supports push notifications */
    pushNotifications?: boolean;
    /** Whether the agent maintains state across messages */
    stateTransitionHistory?: boolean;
}
/** The full Agent Card document served at /.well-known/agent.json */
interface A2AAgentCard {
    /** Agent Card spec version */
    protocolVersion: string;
    /** Unique name/identifier for the agent */
    name: string;
    /** Human-readable description */
    description?: string;
    /** URL where this agent can be reached */
    url: string;
    /** Provider/organization */
    provider?: A2AProvider;
    /** Version of this agent */
    version?: string;
    /** URL to documentation */
    documentationUrl?: string;
    /** Agent capabilities */
    capabilities?: A2ACapabilities;
    /** Authentication schemes */
    authentication?: A2AAuthScheme;
    /** Default input content types */
    defaultInputModes?: string[];
    /** Default output content types */
    defaultOutputModes?: string[];
    /** Skills/capabilities this agent offers */
    skills: A2ASkill[];
}
/** Configuration for generating an Agent Card */
interface A2AConfig {
    /** The Agent Card data */
    card: A2AAgentCard;
}
/**
 * Generate a valid A2A Agent Card JSON object.
 *
 * Ensures required fields are present and sets sensible defaults.
 */
declare function generateAgentCard(config: A2AConfig): A2AAgentCard;
/**
 * Validate an Agent Card has the minimum required fields.
 * Returns an array of error messages (empty = valid).
 */
declare function validateAgentCard(card: Partial<A2AAgentCard>): string[];

/**
 * Unified Multi-Format Discovery — single config, all agent discovery formats.
 *
 * Generates:
 * - /.well-known/ai       (AI manifest)
 * - /.well-known/agent.json (A2A Agent Card per Google A2A protocol)
 * - /agents.txt            (robots.txt-style permissions for AI agents)
 * - /llms.txt              (LLM-oriented documentation)
 * - /llms-full.txt         (auto-generated from routes)
 *
 * @see https://github.com/nichochar/open-agent-schema (agents.txt)
 * @see https://a2a-protocol.org (A2A Agent Card)
 * @see https://llmstxt.org (llms.txt)
 */

/** A rule in agents.txt (allow/disallow per user-agent) */
interface AgentsTxtRule$1 {
    /** Path pattern (glob-style), e.g. "/api/*", "/private/*" */
    path: string;
    /** "allow" or "disallow" */
    permission: "allow" | "disallow";
}
/** A block in agents.txt targeting one or more user-agents */
interface AgentsTxtBlock {
    /** User-agent string, or "*" for all agents */
    userAgent: string;
    /** Rules for this user-agent */
    rules: AgentsTxtRule$1[];
}
/** Configuration for agents.txt generation (unified discovery variant) */
interface UnifiedAgentsTxtConfig {
    /** Blocks of user-agent + rules */
    blocks: AgentsTxtBlock[];
    /** Optional sitemap URL for agents */
    sitemapUrl?: string;
    /** Optional comment at the top of the file */
    comment?: string;
}
/** Control which discovery formats are generated */
interface DiscoveryFormats {
    /** /.well-known/ai manifest. Default: true */
    wellKnownAi?: boolean;
    /** /.well-known/agent.json (A2A Agent Card). Default: true */
    agentCard?: boolean;
    /** /agents.txt (robots.txt for AI agents). Default: true */
    agentsTxt?: boolean;
    /** /llms.txt and /llms-full.txt. Default: true */
    llmsTxt?: boolean;
}
/** Auth configuration shared across discovery formats */
interface UnifiedAuthConfig {
    /** Auth type */
    type: "oauth2" | "api_key" | "bearer" | "none";
    /** Where the credential goes (for api_key) */
    in?: "header" | "query";
    /** Header/query param name (for api_key) */
    name?: string;
    /** OAuth2 authorization URL */
    authorizationUrl?: string;
    /** OAuth2 token URL */
    tokenUrl?: string;
    /** OAuth2 scopes */
    scopes?: Record<string, string>;
}
/** A skill/capability (maps to A2A skills, llms.txt sections, etc.) */
interface UnifiedSkill {
    /** Unique ID */
    id: string;
    /** Human-readable name */
    name: string;
    /** Description */
    description?: string;
    /** Tags for categorization */
    tags?: string[];
    /** Example prompts */
    examples?: string[];
    /** Input MIME types */
    inputModes?: string[];
    /** Output MIME types */
    outputModes?: string[];
}
/** Single source of truth for all discovery formats */
interface UnifiedDiscoveryConfig {
    /** Name of the service/agent */
    name: string;
    /** Description */
    description?: string;
    /** Base URL where the service is hosted */
    url: string;
    /** Version */
    version?: string;
    /** Provider/organization info */
    provider?: A2AProvider;
    /** Contact info */
    contact?: {
        email?: string;
        url?: string;
    };
    /** OpenAPI spec URL */
    openApiUrl?: string;
    /** Documentation URL */
    documentationUrl?: string;
    /** Capabilities (string list for AI manifest, A2A flags) */
    capabilities?: string[];
    /** A2A-specific capabilities */
    agentCapabilities?: A2ACapabilities;
    /** Auth config (shared across formats) */
    auth?: UnifiedAuthConfig;
    /** Skills/features the service offers */
    skills?: UnifiedSkill[];
    /** Route metadata for llms-full.txt auto-generation */
    routes?: RouteMetadata[];
    /** Agents.txt rules (if agents.txt format is enabled) */
    agentsTxt?: UnifiedAgentsTxtConfig;
    /** Which formats to serve. All enabled by default. */
    formats?: DiscoveryFormats;
    /** Extra llms.txt sections (appended after auto-generated content) */
    llmsTxtSections?: Array<{
        title: string;
        content: string;
    }>;
}
/** Check if a given format is enabled (defaults to true) */
declare function isFormatEnabled(formats: DiscoveryFormats | undefined, format: keyof DiscoveryFormats): boolean;
/** Generate /.well-known/ai manifest from unified config */
declare function generateUnifiedAIManifest(config: UnifiedDiscoveryConfig): AIManifest;
/** Generate A2A Agent Card from unified config */
declare function generateUnifiedAgentCard(config: UnifiedDiscoveryConfig): A2AAgentCard;
/** Generate /llms.txt from unified config */
declare function generateUnifiedLlmsTxt(config: UnifiedDiscoveryConfig): string;
/** Generate /llms-full.txt from unified config (with routes) */
declare function generateUnifiedLlmsFullTxt(config: UnifiedDiscoveryConfig): string;
/** Generate /agents.txt from unified config */
declare function generateAgentsTxt$1(config: UnifiedDiscoveryConfig): string;
/**
 * Generate all enabled discovery documents from a unified config.
 * Returns a map of path → content (string for text, object for JSON).
 */
declare function generateAllDiscovery(config: UnifiedDiscoveryConfig): Map<string, string | object>;

/**
 * agents.txt — a robots.txt-style permission and capability declaration for AI agents.
 *
 * Generates a human- and machine-readable text file at /agents.txt that tells agents:
 * - What paths they can access
 * - What rate limits apply
 * - What auth is required
 * - What interface (REST, MCP, etc.) is preferred
 *
 * Inspired by robots.txt but purpose-built for the agentic web.
 */
/** Rate limit declaration for agents.txt */
interface AgentsTxtRateLimit {
    /** Maximum requests per window */
    max: number;
    /** Window size in seconds (default: 60) */
    windowSeconds?: number;
}
/** A single rule block in agents.txt */
interface AgentsTxtRule {
    /** Agent name pattern to match (e.g. "*", "GPT-*", "ClaudeBot") */
    agent: string;
    /** Allowed path patterns (glob-style) */
    allow?: string[];
    /** Denied path patterns (glob-style) */
    deny?: string[];
    /** Rate limit for matching agents */
    rateLimit?: AgentsTxtRateLimit;
    /** Preferred interface for interacting with this service */
    preferredInterface?: "rest" | "mcp" | "graphql" | "a2a";
    /** Auth requirement description */
    auth?: {
        type: "bearer" | "api_key" | "oauth2" | "none";
        /** URL to obtain credentials */
        endpoint?: string;
        /** Docs URL for auth */
        docsUrl?: string;
    };
    /** Free-form description/instructions for the agent */
    description?: string;
}
/** Top-level agents.txt configuration */
interface AgentsTxtConfig {
    /** Rules applied in order (first match wins per path, like robots.txt) */
    rules: AgentsTxtRule[];
    /** Optional site-wide metadata */
    siteName?: string;
    /** Contact URL or email for the site owner */
    contact?: string;
    /** URL to the full agent discovery endpoint */
    discoveryUrl?: string;
}
/**
 * Generate the agents.txt file content from configuration.
 *
 * Output format:
 * ```
 * # agents.txt — AI Agent Access Policy
 * # Site: My API
 * # Contact: support@example.com
 * # Discovery: https://example.com/.well-known/ai
 *
 * User-agent: *
 * Allow: /api/public/*
 * Deny: /api/admin/*
 * Rate-limit: 100/60s
 * Preferred-interface: rest
 * Auth: bearer https://example.com/oauth/token
 * ```
 */
declare function generateAgentsTxt(config: AgentsTxtConfig): string;
/**
 * Parse an agents.txt string back into structured rules.
 * Useful for agents that need to read and obey agents.txt from other sites.
 */
declare function parseAgentsTxt(content: string): AgentsTxtConfig;
/**
 * Check whether a given agent + path combination is allowed by the rules.
 *
 * @param config - Parsed agents.txt config
 * @param agentName - The User-Agent or agent identifier
 * @param path - The request path
 * @returns true if allowed, false if denied, undefined if no matching rule
 */
declare function isAgentAllowed(config: AgentsTxtConfig, agentName: string, path: string): boolean | undefined;

/**
 * Agent Identity Module — per IETF draft-klrc-aiagent-auth-00
 *
 * Implements agent identity verification following the AIMS (Agent Identity
 * Management System) model. Treats AI agents as workloads with SPIFFE/WIMSE
 * identifiers, JWT-based credentials, and scoped authorization.
 *
 * Supports:
 * - JWT-based Workload Identity Tokens (WIT) verification
 * - SPIFFE ID extraction and validation
 * - Scoped authorization policies
 * - Audit event generation for the analytics pipeline
 */
/** SPIFFE ID in URI form: spiffe://trust-domain/path */
interface SpiffeId {
    trustDomain: string;
    path: string;
    raw: string;
}
/** Claims extracted from a verified agent identity token. */
interface AgentIdentityClaims {
    /** Unique agent identifier (WIMSE/SPIFFE URI or opaque ID). */
    agentId: string;
    /** Parsed SPIFFE ID if the identifier is a SPIFFE URI. */
    spiffeId?: SpiffeId;
    /** Issuer of the identity token. */
    issuer: string;
    /** Subject claim. */
    subject: string;
    /** Audience(s) the token is valid for. */
    audience: string[];
    /** Token expiration (Unix seconds). */
    expiresAt: number;
    /** Token issued-at (Unix seconds). */
    issuedAt: number;
    /** Scopes/permissions granted. */
    scopes: string[];
    /** Whether the agent is acting on behalf of a user (delegated). */
    delegated: boolean;
    /** The delegating user/system identifier, if delegated. */
    delegatedBy?: string;
    /** Custom claims preserved for policy evaluation. */
    customClaims: Record<string, unknown>;
}
/** A policy rule for agent authorization. */
interface AgentAuthzPolicy {
    /** Human-readable policy name. */
    name: string;
    /** Match agent IDs (exact or glob pattern). */
    agentPattern?: string;
    /** Match trust domains. */
    trustDomains?: string[];
    /** Required scopes (all must be present). */
    requiredScopes?: string[];
    /** Allowed HTTP methods. */
    methods?: string[];
    /** Allowed path patterns (glob). */
    paths?: string[];
    /** Whether delegated access is allowed. */
    allowDelegated?: boolean;
    /** Custom predicate for complex rules. */
    evaluate?: (claims: AgentIdentityClaims, context: AuthzContext) => boolean;
}
interface AuthzContext {
    method: string;
    path: string;
    headers: Record<string, string | undefined>;
}
interface AuthzResult {
    allowed: boolean;
    matchedPolicy?: string;
    deniedReason?: string;
}
/** Configuration for the agent identity module. */
interface AgentIdentityConfig {
    /** Trusted issuers — only tokens from these issuers are accepted. */
    trustedIssuers: string[];
    /** Expected audience(s). Token must contain at least one. */
    audience: string[];
    /** JWKS endpoints keyed by issuer URL. If not set, uses issuer + /.well-known/jwks.json */
    jwksEndpoints?: Record<string, string>;
    /** Trusted SPIFFE trust domains. If set, only these domains are accepted. */
    trustedDomains?: string[];
    /** Authorization policies (evaluated in order, first match wins). */
    policies?: AgentAuthzPolicy[];
    /** Default policy when no rule matches: "deny" (default) or "allow". */
    defaultPolicy?: "allow" | "deny";
    /** Custom token verification function (for testing or custom JWT libs). */
    verifyToken?: (token: string) => Promise<AgentIdentityClaims | null>;
    /** Header name for the agent identity token. Default: "Authorization". */
    headerName?: string;
    /** Token prefix. Default: "Bearer". */
    tokenPrefix?: string;
    /** Clock skew tolerance in seconds. Default: 30. */
    clockSkewSeconds?: number;
    /** Max token lifetime in seconds. Tokens with longer lifetime are rejected. Default: 3600. */
    maxLifetimeSeconds?: number;
}
/**
 * Parse a SPIFFE ID URI.
 * Returns null if the string is not a valid SPIFFE ID.
 */
declare function parseSpiffeId(uri: string): SpiffeId | null;
/**
 * Validate a SPIFFE ID against a list of trusted domains.
 */
declare function isSpiffeTrusted(spiffeId: SpiffeId, trustedDomains: string[]): boolean;
/**
 * Decode JWT claims WITHOUT verification (for inspection only).
 * Use verifyToken for actual validation.
 */
declare function decodeJwtClaims(token: string): Record<string, unknown> | null;
/**
 * Extract AgentIdentityClaims from raw JWT payload.
 */
declare function extractClaims(payload: Record<string, unknown>): AgentIdentityClaims;
interface TokenValidationError {
    code: "missing_token" | "malformed_token" | "untrusted_issuer" | "invalid_audience" | "expired_token" | "token_too_long_lived" | "untrusted_domain" | "verification_failed";
    message: string;
}
/**
 * Validate extracted claims against the identity config.
 * Returns null if valid, or a TokenValidationError.
 */
declare function validateClaims(claims: AgentIdentityClaims, config: AgentIdentityConfig): TokenValidationError | null;
/**
 * Evaluate authorization policies against verified claims.
 */
declare function evaluateAuthz(claims: AgentIdentityClaims, context: AuthzContext, policies: AgentAuthzPolicy[], defaultPolicy?: "allow" | "deny"): AuthzResult;
interface AgentIdentityAuditEvent {
    type: "agent_identity";
    timestamp: string;
    agentId: string;
    spiffeId?: string;
    issuer: string;
    delegated: boolean;
    delegatedBy?: string;
    scopes: string[];
    method: string;
    path: string;
    authzResult: AuthzResult;
}
/**
 * Build an audit event from identity verification results.
 */
declare function buildAuditEvent(claims: AgentIdentityClaims, context: AuthzContext, authzResult: AuthzResult): AgentIdentityAuditEvent;

/**
 * Agent traffic analytics — detect AI agent requests and collect telemetry.
 *
 * Middleware records each agent request and flushes batches to a configurable
 * endpoint (e.g. LightLayer dashboard) or a local callback.
 */
/** Detect an AI agent from a User-Agent string. Returns agent name or null. */
declare function detectAgent(userAgent: string | undefined | null): string | null;
interface AgentEvent {
    /** Detected agent name (e.g. "ChatGPT", "ClaudeBot"). */
    agent: string;
    /** Raw User-Agent string. */
    userAgent: string;
    /** HTTP method. */
    method: string;
    /** Request path. */
    path: string;
    /** Response status code. */
    statusCode: number;
    /** Response time in milliseconds. */
    durationMs: number;
    /** ISO 8601 timestamp. */
    timestamp: string;
    /** Optional: content type of the response. */
    contentType?: string;
    /** Optional: response body size in bytes. */
    responseSize?: number;
}
interface AnalyticsConfig {
    /**
     * Remote endpoint to flush events to (e.g. "https://dash.lightlayer.dev/api/agent-events/").
     * If not set, events are only passed to the onEvent callback.
     */
    endpoint?: string;
    /** API key for authenticating with the remote endpoint. */
    apiKey?: string;
    /**
     * Callback invoked for each agent event. Use for custom logging,
     * local storage, or forwarding to your own analytics system.
     */
    onEvent?: (event: AgentEvent) => void;
    /**
     * Maximum events to buffer before flushing. Default: 50.
     */
    bufferSize?: number;
    /**
     * Flush interval in milliseconds. Default: 30_000 (30 seconds).
     */
    flushIntervalMs?: number;
    /**
     * Whether to also track non-agent requests. Default: false (only AI agents).
     */
    trackAll?: boolean;
    /**
     * Custom agent detection function. If provided, called instead of built-in detection.
     * Return agent name string or null.
     */
    detectAgent?: (userAgent: string) => string | null;
}
declare class EventBuffer {
    private buffer;
    private timer;
    private readonly config;
    constructor(config: AnalyticsConfig);
    push(event: AgentEvent): void;
    flush(): Promise<void>;
    /** Stop the flush timer and flush remaining events. */
    shutdown(): Promise<void>;
    get pending(): number;
}
interface AnalyticsInstance {
    /** Record an agent event manually. */
    record(event: AgentEvent): void;
    /** Flush pending events. */
    flush(): Promise<void>;
    /** Stop the flush timer and flush remaining. */
    shutdown(): Promise<void>;
    /** The underlying event buffer. */
    buffer: EventBuffer;
    /** The detect function in use. */
    detect: (userAgent: string | undefined | null) => string | null;
    /** The config. */
    config: AnalyticsConfig;
}
/**
 * Create an analytics instance. Framework adapters (Express, Fastify, etc.)
 * wrap this to create middleware.
 */
declare function createAnalytics(config: AnalyticsConfig): AnalyticsInstance;

interface ScopedApiKey {
    keyId: string;
    companyId: string;
    userId: string;
    scopes: string[];
    expiresAt?: Date;
    metadata?: Record<string, unknown>;
}
interface ApiKeyStore {
    /** Resolve a raw API key string to a ScopedApiKey, or null if not found. */
    resolve(rawKey: string): Promise<ScopedApiKey | null>;
}
interface ApiKeyValidationResult {
    valid: boolean;
    key?: ScopedApiKey;
    error?: string;
}
interface CreateApiKeyOptions {
    companyId: string;
    userId: string;
    scopes: string[];
    expiresAt?: Date;
    metadata?: Record<string, unknown>;
}
interface CreateApiKeyResult {
    rawKey: string;
    key: ScopedApiKey;
}
/**
 * In-memory API key store for development and testing.
 */
declare class MemoryApiKeyStore implements ApiKeyStore {
    private keys;
    resolve(rawKey: string): Promise<ScopedApiKey | null>;
    /** Store a key mapping. Used internally by createApiKey. */
    set(rawKey: string, key: ScopedApiKey): void;
    /** Remove a key mapping. */
    delete(rawKey: string): void;
    /** Number of stored keys. */
    get size(): number;
}
/**
 * Generate a new scoped API key and store it.
 * Key format: `al_` prefix + 32 random hex characters.
 */
declare function createApiKey(store: MemoryApiKeyStore, opts: CreateApiKeyOptions): CreateApiKeyResult;
/**
 * Validate a raw API key string against a store.
 * Checks existence and expiry.
 */
declare function validateApiKey(store: ApiKeyStore, rawKey: string): Promise<ApiKeyValidationResult>;
/**
 * Check if a scoped API key has the required scope(s).
 * Supports wildcard `*` which grants all scopes.
 */
declare function hasScope(key: ScopedApiKey, required: string | string[]): boolean;

interface AgentErrorEnvelope {
    type: string;
    code: string;
    message: string;
    status: number;
    is_retriable: boolean;
    retry_after?: number;
    param?: string;
    docs_url?: string;
}
interface AgentErrorOptions {
    type?: string;
    code: string;
    message: string;
    status?: number;
    is_retriable?: boolean;
    retry_after?: number;
    param?: string;
    docs_url?: string;
}
interface RateLimitStore {
    /** Increment the counter for a key. Returns the current count after increment. */
    increment(key: string, windowMs: number): Promise<number>;
    /** Get the current count for a key. */
    get(key: string): Promise<number>;
    /** Reset the counter for a key. */
    reset(key: string): Promise<void>;
}
interface RateLimitConfig {
    /** Maximum number of requests per window. */
    max: number;
    /** Window size in milliseconds. Default: 60_000 (1 minute). */
    windowMs?: number;
    /** Key extractor function. Default: returns a fixed key (global limit). */
    keyFn?: (req: unknown) => string;
    /** Pluggable store. Default: MemoryStore. */
    store?: RateLimitStore;
}
interface RateLimitResult {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetMs: number;
    retryAfter?: number;
}
interface LlmsTxtSection {
    title: string;
    content: string;
}
interface LlmsTxtConfig {
    /** Site/API title. */
    title: string;
    /** Short description. */
    description?: string;
    /** Manual sections to include. */
    sections?: LlmsTxtSection[];
}
interface RouteMetadata {
    method: string;
    path: string;
    summary?: string;
    description?: string;
    parameters?: RouteParameter[];
}
interface RouteParameter {
    name: string;
    in: "path" | "query" | "header" | "body";
    required?: boolean;
    description?: string;
}
interface AIManifest {
    /** Human-readable name of the API/service. */
    name: string;
    /** Short description. */
    description?: string;
    /** URL to OpenAPI spec. */
    openapi_url?: string;
    /** URL to llms.txt. */
    llms_txt_url?: string;
    /** Authentication info. */
    auth?: AIManifestAuth;
    /** Contact info. */
    contact?: {
        email?: string;
        url?: string;
    };
    /** Additional capabilities. */
    capabilities?: string[];
}
interface AIManifestAuth {
    type: "oauth2" | "api_key" | "bearer" | "none";
    authorization_url?: string;
    token_url?: string;
    scopes?: Record<string, string>;
}
interface DiscoveryConfig {
    manifest: AIManifest;
    /** OpenAPI spec object — passed through as-is. */
    openApiSpec?: Record<string, unknown>;
}
interface AgentMetaConfig {
    /** Agent identifier attribute name. Default: "data-agent-id". */
    agentIdAttribute?: string;
    /** Inject ARIA landmarks. Default: true. */
    ariaLandmarks?: boolean;
    /** Extra meta tags to inject. */
    metaTags?: Record<string, string>;
}

interface ApiKeyConfig {
    store: ApiKeyStore;
    /** Header name to extract the API key from. Default: "X-Agent-Key". */
    headerName?: string;
}
interface AgentAuthConfig {
    /** OAuth issuer URL. */
    issuer?: string;
    /** Authorization endpoint. */
    authorizationUrl?: string;
    /** Token endpoint. */
    tokenUrl?: string;
    /** Available scopes. */
    scopes?: Record<string, string>;
    /** Realm for WWW-Authenticate header. */
    realm?: string;
}
interface AgentLayerConfig {
    errors?: boolean | Partial<AgentErrorOptions>;
    rateLimit?: false | RateLimitConfig;
    llmsTxt?: false | LlmsTxtConfig;
    discovery?: false | DiscoveryConfig;
    agentMeta?: false | AgentMetaConfig;
    agentAuth?: false | AgentAuthConfig;
    analytics?: false | AnalyticsConfig;
    apiKeys?: false | ApiKeyConfig;
    a2a?: false | A2AConfig;
    agentIdentity?: false | AgentIdentityConfig;
    agentsTxt?: false | (AgentsTxtConfig & {
        enforce?: boolean;
    });
    unifiedDiscovery?: false | UnifiedDiscoveryConfig;
    oauth2?: false | OAuth2Config;
    robotsTxt?: false | RobotsTxtConfig;
    securityHeaders?: false | SecurityHeadersConfig;
}

/**
 * MCP (Model Context Protocol) — Tool definition generation.
 *
 * Converts RouteMetadata into MCP-compatible tool definitions,
 * enabling AI agents to discover and call API endpoints via the
 * Model Context Protocol (https://modelcontextprotocol.io).
 *
 * Implements a lightweight MCP-compatible JSON-RPC server without
 * external SDK dependencies — handles initialize, tools/list, and
 * tools/call per the MCP specification.
 */

/** A single MCP tool definition */
interface McpToolDefinition {
    /** Tool name in snake_case (e.g. get_api_users) */
    name: string;
    /** Human-readable description */
    description: string;
    /** JSON Schema describing the tool's input */
    inputSchema: Record<string, unknown>;
}
/** Server info returned during MCP initialize */
interface McpServerInfo {
    /** Server name */
    name: string;
    /** Server version */
    version: string;
    /** Instructions for the agent */
    instructions?: string;
}
/** Configuration for the MCP server middleware */
interface McpServerConfig {
    /** Manually defined tools (merged with auto-generated ones) */
    tools?: McpToolDefinition[];
    /** Server name */
    name: string;
    /** Server version (default: "1.0.0") */
    version?: string;
    /** Instructions for the agent on how to use these tools */
    instructions?: string;
    /** Route metadata to auto-generate tools from */
    routes?: RouteMetadata[];
}
/** JSON-RPC 2.0 request */
interface JsonRpcRequest {
    jsonrpc: "2.0";
    id?: string | number;
    method: string;
    params?: Record<string, unknown>;
}
/** JSON-RPC 2.0 response */
interface JsonRpcResponse {
    jsonrpc: "2.0";
    id?: string | number | null;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
}
/**
 * Convert HTTP method + path into a snake_case tool name.
 *
 * Examples:
 *   GET  /api/users        → get_api_users
 *   POST /api/users/create → post_api_users_create
 *   GET  /api/users/:id    → get_api_users_by_id
 */
declare function formatToolName(method: string, path: string): string;
/**
 * Build a JSON Schema object from route parameters.
 */
declare function buildInputSchema(params?: RouteParameter[]): Record<string, unknown>;
/**
 * Generate MCP tool definitions from route metadata.
 *
 * Each route becomes a tool with:
 * - snake_case name derived from method + path
 * - description from route summary/description
 * - inputSchema from route parameters
 */
declare function generateToolDefinitions(routes: RouteMetadata[]): McpToolDefinition[];
/**
 * Generate MCP server info from config.
 */
declare function generateServerInfo(config: McpServerConfig): McpServerInfo;
/**
 * Parse a tool name back into HTTP method and path.
 * Reverses formatToolName: get_api_users → { method: "GET", path: "/api/users" }
 */
declare function parseToolName(toolName: string): {
    method: string;
    path: string;
};
/** Tool call handler function type */
type ToolCallHandler = (toolName: string, args: Record<string, unknown>) => Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
}>;
/**
 * Handle a JSON-RPC request per the MCP protocol.
 *
 * Supports: initialize, notifications/initialized, tools/list, tools/call, ping.
 */
declare function handleJsonRpc(request: JsonRpcRequest, serverInfo: McpServerInfo, tools: McpToolDefinition[], toolCallHandler?: ToolCallHandler): JsonRpcResponse | Promise<JsonRpcResponse> | null;

export { OAuth2TokenError as $, type AgentErrorEnvelope as A, type AgentsTxtRateLimit as B, type AgentsTxtRule$1 as C, type DiscoveryConfig as D, type AnalyticsConfig as E, type AnalyticsInstance as F, type ApiKeyConfig as G, type ApiKeyStore as H, type ApiKeyValidationResult as I, type AuthzResult as J, type CreateApiKeyOptions as K, type LlmsTxtConfig as L, type CreateApiKeyResult as M, type DiscoveryFormats as N, type OAuth2Config as O, EventBuffer as P, type JsonRpcRequest as Q, type RateLimitStore as R, type JsonRpcResponse as S, type TokenValidationResult as T, type LlmsTxtSection as U, type McpServerConfig as V, type McpServerInfo as W, type McpToolDefinition as X, MemoryApiKeyStore as Y, type OAuth2Error as Z, type OAuth2HttpClient as _, type AgentErrorOptions as a, type PKCEPair as a0, type RobotsTxtConfig as a1, type RobotsTxtRule as a2, type RouteParameter as a3, type ScopedApiKey as a4, type SecurityHeaders as a5, type SecurityHeadersConfig as a6, type SpiffeId as a7, type TokenResponse as a8, type TokenValidationError as a9, generateServerInfo as aA, generateAgentsTxt as aB, generateToolDefinitions as aC, generateUnifiedAIManifest as aD, generateUnifiedAgentCard as aE, generateUnifiedLlmsFullTxt as aF, generateUnifiedLlmsTxt as aG, handleJsonRpc as aH, hasScope as aI, isAgentAllowed as aJ, isFormatEnabled as aK, isSpiffeTrusted as aL, parseAgentsTxt as aM, parseSpiffeId as aN, parseToolName as aO, refreshAccessToken as aP, validateAccessToken as aQ, validateAgentCard as aR, validateApiKey as aS, validateClaims as aT, type ToolCallHandler as aa, type UnifiedAgentsTxtConfig as ab, type UnifiedAuthConfig as ac, type UnifiedDiscoveryConfig as ad, type UnifiedSkill as ae, buildAuditEvent as af, buildAuthorizationUrl as ag, buildInputSchema as ah, buildOAuth2Metadata as ai, computeCodeChallenge as aj, createAnalytics as ak, createApiKey as al, decodeJwtClaims as am, detectAgent as an, evaluateAuthz as ao, exchangeCode as ap, extractBearerToken as aq, extractClaims as ar, formatToolName as as, generateAgentCard as at, generateAgentsTxt$1 as au, generateAllDiscovery as av, generateCodeVerifier as aw, generatePKCE as ax, generateRobotsTxt as ay, generateSecurityHeaders as az, type RateLimitConfig as b, type RateLimitResult as c, type RouteMetadata as d, type AIManifest as e, type AgentAuthConfig as f, type DecodedAccessToken as g, type AgentIdentityClaims as h, type AgentIdentityConfig as i, type AuthzContext as j, type AgentsTxtConfig as k, type A2AAgentCard as l, type A2AAuthScheme as m, type A2ACapabilities as n, type A2AConfig as o, type A2AContentType as p, type A2AProvider as q, type A2ASkill as r, type AIManifestAuth as s, AI_AGENTS as t, type AgentAuthzPolicy as u, type AgentEvent as v, type AgentIdentityAuditEvent as w, type AgentLayerConfig as x, type AgentMetaConfig as y, type AgentsTxtBlock as z };

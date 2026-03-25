import { A as AgentErrorEnvelope, a as AgentErrorOptions, R as RateLimitStore, b as RateLimitConfig, c as RateLimitResult, L as LlmsTxtConfig, d as RouteMetadata, D as DiscoveryConfig, e as AIManifest, f as AgentAuthConfig, O as OAuth2Config, T as TokenValidationResult, g as DecodedAccessToken, h as AgentIdentityClaims, i as AgentIdentityConfig, j as AuthzContext, k as AgentsTxtConfig } from './mcp-f_2R3DPs.cjs';
export { l as A2AAgentCard, m as A2AAuthScheme, n as A2ACapabilities, o as A2AConfig, p as A2AContentType, q as A2AProvider, r as A2ASkill, s as AIManifestAuth, t as AI_AGENTS, u as AgentAuthzPolicy, v as AgentEvent, w as AgentIdentityAuditEvent, x as AgentLayerConfig, y as AgentMetaConfig, z as AgentsTxtBlock, B as AgentsTxtRateLimit, C as AgentsTxtRule, E as AnalyticsConfig, F as AnalyticsInstance, G as ApiKeyConfig, H as ApiKeyStore, I as ApiKeyValidationResult, J as AuthzResult, K as CreateApiKeyOptions, M as CreateApiKeyResult, N as DiscoveryFormats, P as EventBuffer, Q as JsonRpcRequest, S as JsonRpcResponse, U as LlmsTxtSection, V as McpServerConfig, W as McpServerInfo, X as McpToolDefinition, Y as MemoryApiKeyStore, Z as OAuth2Error, _ as OAuth2HttpClient, $ as OAuth2TokenError, a0 as PKCEPair, a1 as RobotsTxtConfig, a2 as RobotsTxtRule, a3 as RouteParameter, a4 as ScopedApiKey, a5 as SecurityHeaders, a6 as SecurityHeadersConfig, a7 as SpiffeId, a8 as TokenResponse, a9 as TokenValidationError, aa as ToolCallHandler, ab as UnifiedAgentsTxtConfig, ac as UnifiedAuthConfig, ad as UnifiedDiscoveryConfig, ae as UnifiedSkill, af as buildAuditEvent, ag as buildAuthorizationUrl, ah as buildInputSchema, ai as buildOAuth2Metadata, aj as computeCodeChallenge, ak as createAnalytics, al as createApiKey, am as decodeJwtClaims, an as detectAgent, ao as evaluateAuthz, ap as exchangeCode, aq as extractBearerToken, ar as extractClaims, as as formatToolName, at as generateAgentCard, au as generateAgentsTxt, av as generateAllDiscovery, aw as generateCodeVerifier, ax as generatePKCE, ay as generateRobotsTxt, az as generateSecurityHeaders, aA as generateServerInfo, aB as generateStandaloneAgentsTxt, aC as generateToolDefinitions, aD as generateUnifiedAIManifest, aE as generateUnifiedAgentCard, aF as generateUnifiedLlmsFullTxt, aG as generateUnifiedLlmsTxt, aH as handleJsonRpc, aI as hasScope, aJ as isAgentAllowed, aK as isFormatEnabled, aL as isSpiffeTrusted, aM as parseAgentsTxt, aN as parseSpiffeId, aO as parseToolName, aP as refreshAccessToken, aQ as validateAccessToken, aR as validateAgentCard, aS as validateApiKey, aT as validateClaims } from './mcp-f_2R3DPs.cjs';
import { PaymentPayload, SettleResponse, PaymentRequirements, X402Config, PaymentRequired } from './x402.cjs';
export { FacilitatorClient, HEADER_PAYMENT_REQUIRED, HEADER_PAYMENT_RESPONSE, HEADER_PAYMENT_SIGNATURE, HttpFacilitatorClient, Network, Price, ResourceInfo, VerifyResponse, X402RouteConfig, X402_VERSION, buildPaymentRequired, buildRequirements, decodePaymentPayload, encodePaymentRequired, matchRoute, resolvePrice } from './x402.cjs';

/**
 * Format an error into the standard agent-friendly envelope.
 */
declare function formatError(opts: AgentErrorOptions): AgentErrorEnvelope;
/**
 * Custom error class that carries the agent error envelope.
 */
declare class AgentError extends Error {
    readonly envelope: AgentErrorEnvelope;
    constructor(opts: AgentErrorOptions);
    get status(): number;
    toJSON(): {
        error: AgentErrorEnvelope;
    };
}
/**
 * Create a 404 Not Found error envelope.
 */
declare function notFoundError(message?: string): AgentErrorEnvelope;
/**
 * Create a 429 Rate Limit error envelope.
 */
declare function rateLimitError(retryAfter: number): AgentErrorEnvelope;

/**
 * In-memory sliding window counter store.
 * Entries are automatically cleaned up when they expire.
 */
declare class MemoryStore implements RateLimitStore {
    private windows;
    increment(key: string, windowMs: number): Promise<number>;
    get(key: string): Promise<number>;
    reset(key: string): Promise<void>;
    /** Remove expired entries. Useful for long-running processes. */
    cleanup(): void;
}
/**
 * Create a rate limiter with the given configuration.
 * Returns a function that checks whether a request is allowed.
 */
declare function createRateLimiter(config: RateLimitConfig): (req: unknown) => Promise<RateLimitResult>;

/**
 * Generate llms.txt content from manual config sections.
 */
declare function generateLlmsTxt(config: LlmsTxtConfig): string;
/**
 * Auto-generate llms-full.txt from route metadata.
 * Includes all route information in a format optimized for LLM consumption.
 */
declare function generateLlmsFullTxt(config: LlmsTxtConfig, routes: RouteMetadata[]): string;

/**
 * Generate the /.well-known/ai manifest JSON.
 */
declare function generateAIManifest(config: DiscoveryConfig): AIManifest;
/**
 * Generate JSON-LD structured data for the API.
 */
declare function generateJsonLd(config: DiscoveryConfig): Record<string, unknown>;

/**
 * Framework-agnostic error handling helpers.
 *
 * These functions extract the duplicated business logic from Express/Koa/Hono/Fastify
 * agent-errors.ts into a single, testable module.
 */

/**
 * Build an error envelope from an arbitrary Error object.
 * If the error is an AgentError, uses its existing envelope;
 * otherwise, creates a generic internal_error envelope.
 */
declare function buildErrorEnvelope(err: Error): AgentErrorEnvelope;
/**
 * Result of processing an error for response.
 */
interface ErrorResponseAction {
    status: number;
    headers: Record<string, string>;
    body: unknown;
    isJson: boolean;
}
/**
 * Build a complete error response action from an error and request headers.
 * The caller only needs to apply the result to their framework's response object.
 */
declare function buildErrorResponse(err: Error, accept?: string, userAgent?: string): ErrorResponseAction;
/**
 * Build a 404 not-found response action.
 */
declare function buildNotFoundResponse(method: string, path: string, accept?: string, userAgent?: string): ErrorResponseAction;

/**
 * Framework-agnostic agent auth helpers.
 *
 * Extracts the duplicated oauthDiscoveryDocument and requireAuth logic
 * from Express/Koa/Hono/Fastify into a single, testable module.
 */

/**
 * Generate the OAuth 2.0 discovery document from auth config.
 */
declare function buildOauthDiscoveryDocument(config: AgentAuthConfig): Record<string, unknown>;
/**
 * Build the WWW-Authenticate header value.
 */
declare function buildWwwAuthenticate(realm: string, scopes?: Record<string, string>): string;
/**
 * Result of checking an auth requirement.
 * If `pass` is true, the request is authenticated (has an Authorization header).
 * If `pass` is false, the `wwwAuthenticate` and `envelope` fields describe the 401 response.
 */
interface RequireAuthResult {
    pass: boolean;
    wwwAuthenticate?: string;
    envelope?: AgentErrorEnvelope;
}
/**
 * Check whether a request has an Authorization header.
 * Returns a result indicating whether to continue or send a 401.
 */
declare function checkRequireAuth(config: AgentAuthConfig, authorizationHeader: string | undefined): RequireAuthResult;

/**
 * Framework-agnostic OAuth2 middleware handler.
 *
 * Provides shared logic for OAuth2 Bearer token validation
 * that framework adapters (Express, Hono, Fastify, Koa) call into.
 */

interface OAuth2MiddlewareConfig {
    /** OAuth2 configuration for token validation. */
    oauth2: OAuth2Config;
    /** Scopes required for the protected route. */
    requiredScopes?: string[];
    /** Clock skew tolerance in seconds. Default: 30. */
    clockSkewSeconds?: number;
    /** Custom token validator (for signature verification with JWKS, etc.). */
    customValidator?: (token: string) => Promise<TokenValidationResult>;
}
interface OAuth2ValidationSuccess {
    pass: true;
    token: DecodedAccessToken;
}
interface OAuth2ValidationFailure {
    pass: false;
    status: 401 | 403;
    wwwAuthenticate: string;
    envelope: AgentErrorEnvelope;
}
type OAuth2ValidationResult = OAuth2ValidationSuccess | OAuth2ValidationFailure;
/**
 * Validate an OAuth2 Bearer token from the Authorization header.
 * Returns a structured result the framework adapter can use to allow or deny.
 */
declare function handleOAuth2(authorizationHeader: string | undefined, config: OAuth2MiddlewareConfig): Promise<OAuth2ValidationResult>;

/**
 * Framework-agnostic agent identity verification handler.
 *
 * Extracts the duplicated extractAndVerify, requireIdentity, and
 * optionalIdentity logic from all framework adapters.
 */

/**
 * Extract and verify a token from a raw header value.
 * Returns verified claims, or null if extraction/verification fails.
 */
declare function extractAndVerifyToken(rawHeader: string | undefined, config: AgentIdentityConfig): Promise<AgentIdentityClaims | null>;
/**
 * Error result from identity verification.
 */
interface IdentityError {
    status: number;
    envelope: AgentErrorEnvelope;
}
/**
 * Success result from identity verification.
 */
interface IdentitySuccess {
    claims: AgentIdentityClaims;
}
/**
 * Full identity verification and authorization flow.
 *
 * This replaces the duplicated `requireIdentity()` logic across all
 * framework adapters. The caller only needs to:
 * 1. Extract the raw header value from the request
 * 2. Call this function
 * 3. If `error` is returned, send the error response
 * 4. If `claims` is returned, attach to request and continue
 */
declare function handleRequireIdentity(rawHeader: string | undefined, config: AgentIdentityConfig, context: AuthzContext): Promise<IdentitySuccess | {
    error: IdentityError;
}>;
/**
 * Optional identity extraction — extracts and validates identity if present,
 * but does not reject the request if missing or invalid.
 */
declare function handleOptionalIdentity(rawHeader: string | undefined, config: AgentIdentityConfig): Promise<AgentIdentityClaims | null>;

/**
 * Framework-agnostic x402 payment flow handler.
 *
 * Extracts the duplicated verify/settle flow from all framework adapters.
 */

/**
 * Result when the route doesn't require payment — continue normally.
 */
interface X402Skip {
    action: "skip";
}
/**
 * Result when payment is required or payment failed.
 */
interface X402PaymentRequired {
    action: "payment_required";
    status: number;
    headers: Record<string, string>;
    body: unknown;
}
/**
 * Result when payment was verified and settled successfully.
 */
interface X402Success {
    action: "success";
    headers: Record<string, string>;
    payment: PaymentPayload;
    settlement: SettleResponse;
    requirements: PaymentRequirements;
}
/**
 * Result when the facilitator is unreachable or settlement fails.
 */
interface X402Error {
    action: "error";
    status: number;
    body: {
        error: string;
        message: string;
    };
}
type X402FlowResult = X402Skip | X402PaymentRequired | X402Success | X402Error;
/**
 * Process a complete x402 payment flow.
 *
 * @param method - HTTP method
 * @param path - Request path
 * @param url - Full request URL
 * @param paymentSignatureHeader - Value of the x-payment header
 * @param config - x402 configuration
 */
declare function handleX402(method: string, path: string, url: string, paymentSignatureHeader: string | undefined, config: X402Config): Promise<X402FlowResult>;

/**
 * x402 Payment Protocol — Client-side helpers.
 *
 * Utilities for API consumers that need to handle 402 Payment Required
 * responses and automatically retry with payment.
 */

/** Minimal wallet signer — signs a payment for the given requirements. */
interface WalletSigner {
    sign(requirements: PaymentRequirements): Promise<PaymentPayload>;
}
/** Check whether a response is a 402 Payment Required. */
declare function isPaymentRequired(response: Response): boolean;
/** Decode the PAYMENT-REQUIRED header from a 402 response. Returns null if missing or invalid. */
declare function extractPaymentRequirements(response: Response): PaymentRequired | null;
/**
 * Wrap a fetch function to automatically handle 402 responses.
 *
 * When the wrapped fetch receives a 402 with a PAYMENT-REQUIRED header,
 * it signs a payment using the provided wallet signer and retries the
 * request with a PAYMENT-SIGNATURE header.
 */
declare function wrapFetchWithPayment(fetchFn: typeof fetch, walletSigner: WalletSigner): typeof fetch;

/**
 * Shared middleware config for agents.txt across framework adapters.
 */

interface AgentsTxtMiddlewareConfig extends AgentsTxtConfig {
    enforce?: boolean;
}

/**
 * AG-UI (Agent-User Interaction) Protocol — Server-Sent Events streaming.
 *
 * Implements the server side of the AG-UI protocol (https://docs.ag-ui.com):
 * Framework-agnostic types and helpers for streaming agent responses
 * to CopilotKit, Google ADK, and other AG-UI-compatible frontends.
 *
 * @see https://docs.ag-ui.com/concepts/events
 */
type AgUiEventType = "RUN_STARTED" | "RUN_FINISHED" | "RUN_ERROR" | "STEP_STARTED" | "STEP_FINISHED" | "TEXT_MESSAGE_START" | "TEXT_MESSAGE_CONTENT" | "TEXT_MESSAGE_END" | "TOOL_CALL_START" | "TOOL_CALL_ARGS" | "TOOL_CALL_END" | "TOOL_CALL_RESULT" | "STATE_SNAPSHOT" | "STATE_DELTA" | "CUSTOM";
type AgUiRole = "developer" | "system" | "assistant" | "user" | "tool";
interface BaseEvent {
    type: AgUiEventType;
    timestamp?: number;
}
interface RunStartedEvent extends BaseEvent {
    type: "RUN_STARTED";
    threadId: string;
    runId: string;
    parentRunId?: string;
}
interface RunFinishedEvent extends BaseEvent {
    type: "RUN_FINISHED";
    threadId: string;
    runId: string;
    result?: unknown;
}
interface RunErrorEvent extends BaseEvent {
    type: "RUN_ERROR";
    message: string;
    code?: string;
}
interface StepStartedEvent extends BaseEvent {
    type: "STEP_STARTED";
    stepName: string;
}
interface StepFinishedEvent extends BaseEvent {
    type: "STEP_FINISHED";
    stepName: string;
}
interface TextMessageStartEvent extends BaseEvent {
    type: "TEXT_MESSAGE_START";
    messageId: string;
    role: AgUiRole;
}
interface TextMessageContentEvent extends BaseEvent {
    type: "TEXT_MESSAGE_CONTENT";
    messageId: string;
    delta: string;
}
interface TextMessageEndEvent extends BaseEvent {
    type: "TEXT_MESSAGE_END";
    messageId: string;
}
interface ToolCallStartEvent extends BaseEvent {
    type: "TOOL_CALL_START";
    toolCallId: string;
    toolCallName: string;
    parentMessageId?: string;
}
interface ToolCallArgsEvent extends BaseEvent {
    type: "TOOL_CALL_ARGS";
    toolCallId: string;
    delta: string;
}
interface ToolCallEndEvent extends BaseEvent {
    type: "TOOL_CALL_END";
    toolCallId: string;
}
interface ToolCallResultEvent extends BaseEvent {
    type: "TOOL_CALL_RESULT";
    toolCallId: string;
    result: string;
}
interface StateSnapshotEvent extends BaseEvent {
    type: "STATE_SNAPSHOT";
    snapshot: Record<string, unknown>;
}
interface StateDeltaEvent extends BaseEvent {
    type: "STATE_DELTA";
    delta: unknown[];
}
interface CustomEvent extends BaseEvent {
    type: "CUSTOM";
    name: string;
    value: unknown;
}
type AgUiEvent = RunStartedEvent | RunFinishedEvent | RunErrorEvent | StepStartedEvent | StepFinishedEvent | TextMessageStartEvent | TextMessageContentEvent | TextMessageEndEvent | ToolCallStartEvent | ToolCallArgsEvent | ToolCallEndEvent | ToolCallResultEvent | StateSnapshotEvent | StateDeltaEvent | CustomEvent;
/**
 * Encode an AG-UI event as a Server-Sent Events data line.
 */
declare function encodeEvent(event: AgUiEvent): string;
/**
 * Encode multiple AG-UI events.
 */
declare function encodeEvents(events: AgUiEvent[]): string;
interface AgUiEmitterOptions {
    threadId?: string;
    runId?: string;
}
/**
 * High-level AG-UI event emitter. Wraps a `write` function and provides
 * convenient methods for emitting structured events.
 *
 * Usage:
 * ```ts
 * const emitter = createAgUiEmitter((chunk) => res.write(chunk));
 * emitter.runStarted();
 * emitter.textStart();
 * emitter.textDelta("Hello ");
 * emitter.textDelta("world!");
 * emitter.textEnd();
 * emitter.runFinished();
 * ```
 */
declare function createAgUiEmitter(write: (chunk: string) => void, options?: AgUiEmitterOptions): {
    /** Emit raw event. */
    emit: (event: AgUiEvent) => void;
    /** Get current thread/run IDs. */
    readonly threadId: string;
    readonly runId: string;
    runStarted(parentRunId?: string): void;
    runFinished(result?: unknown): void;
    runError(message: string, code?: string): void;
    stepStarted(stepName: string): void;
    stepFinished(stepName: string): void;
    textStart(role?: AgUiRole, messageId?: string): string;
    textDelta(delta: string, messageId?: string): void;
    textEnd(messageId?: string): void;
    /**
     * Convenience: emit a complete text message (start + content + end).
     */
    textMessage(text: string, role?: AgUiRole): string;
    toolCallStart(toolCallName: string, toolCallId?: string, parentMessageId?: string): string;
    toolCallArgs(delta: string, toolCallId?: string): void;
    toolCallEnd(toolCallId?: string): void;
    toolCallResult(result: string, toolCallId?: string): void;
    stateSnapshot(snapshot: Record<string, unknown>): void;
    stateDelta(delta: unknown[]): void;
    custom(name: string, value: unknown): void;
};
type AgUiEmitter = ReturnType<typeof createAgUiEmitter>;
/** Standard SSE response headers for AG-UI streams. */
declare const AG_UI_HEADERS: {
    readonly "Content-Type": "text/event-stream";
    readonly "Cache-Control": "no-cache, no-transform";
    readonly Connection: "keep-alive";
    readonly "X-Accel-Buffering": "no";
};

export { AG_UI_HEADERS, AIManifest, type AgUiEmitter, type AgUiEmitterOptions, type AgUiEvent, type AgUiEventType, type AgUiRole, AgentAuthConfig, AgentError, AgentErrorEnvelope, AgentErrorOptions, AgentIdentityClaims, AgentIdentityConfig, type AgentsTxtMiddlewareConfig, AuthzContext, type BaseEvent, type CustomEvent, DecodedAccessToken, DiscoveryConfig, type ErrorResponseAction, type IdentityError, type IdentitySuccess, LlmsTxtConfig, MemoryStore, OAuth2Config, type OAuth2MiddlewareConfig, type OAuth2ValidationFailure, type OAuth2ValidationResult, type OAuth2ValidationSuccess, PaymentPayload, PaymentRequired, PaymentRequirements, RateLimitConfig, RateLimitResult, RateLimitStore, type RequireAuthResult, RouteMetadata, type RunErrorEvent, type RunFinishedEvent, type RunStartedEvent, SettleResponse, type StateDeltaEvent, type StateSnapshotEvent, type StepFinishedEvent, type StepStartedEvent, type TextMessageContentEvent, type TextMessageEndEvent, type TextMessageStartEvent, TokenValidationResult, type ToolCallArgsEvent, type ToolCallEndEvent, type ToolCallResultEvent, type ToolCallStartEvent, type WalletSigner, X402Config, type X402Error, type X402FlowResult, type X402PaymentRequired, type X402Skip, type X402Success, buildErrorEnvelope, buildErrorResponse, buildNotFoundResponse, buildOauthDiscoveryDocument, buildWwwAuthenticate, checkRequireAuth, createAgUiEmitter, createRateLimiter, encodeEvent, encodeEvents, extractAndVerifyToken, extractPaymentRequirements, formatError, generateAIManifest, generateJsonLd, generateLlmsFullTxt, generateLlmsTxt, handleOAuth2, handleOptionalIdentity, handleRequireIdentity, handleX402, isPaymentRequired, notFoundError, rateLimitError, wrapFetchWithPayment };

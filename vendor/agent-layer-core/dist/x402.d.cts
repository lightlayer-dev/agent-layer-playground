/**
 * x402 Payment Protocol — Core types and helpers for HTTP-native micropayments.
 *
 * Implements the server side of the x402 protocol (https://x402.org):
 * 1. Server declares pricing via PaymentRequirements
 * 2. Unpaid requests receive 402 + PAYMENT-REQUIRED header
 * 3. Client pays and retries with PAYMENT-SIGNATURE header
 * 4. Server verifies payment via facilitator and serves the resource
 *
 * @see https://github.com/coinbase/x402
 */
declare const X402_VERSION = 1;
declare const HEADER_PAYMENT_REQUIRED = "payment-required";
declare const HEADER_PAYMENT_SIGNATURE = "payment-signature";
declare const HEADER_PAYMENT_RESPONSE = "payment-response";
/** A blockchain network identifier (e.g. "eip155:8453" for Base, "solana:mainnet"). */
type Network = `${string}:${string}`;
/** Pricing — either a dollar string like "$0.01" or explicit amount + asset. */
type Price = string | {
    amount: string;
    asset: string;
    extra?: Record<string, unknown>;
};
/** What the server requires for payment on a given route. */
interface PaymentRequirements {
    scheme: string;
    network: Network;
    asset: string;
    amount: string;
    payTo: string;
    maxTimeoutSeconds: number;
    extra: Record<string, unknown>;
}
/** The 402 response body / header payload. */
interface PaymentRequired {
    x402Version: number;
    error?: string;
    resource: ResourceInfo;
    accepts: PaymentRequirements[];
}
/** Metadata about the resource being paid for. */
interface ResourceInfo {
    url: string;
    description?: string;
    mimeType?: string;
}
/** What the client sends back after paying. */
interface PaymentPayload {
    x402Version: number;
    resource?: ResourceInfo;
    accepted: PaymentRequirements;
    payload: Record<string, unknown>;
}
/** Facilitator verify response. */
interface VerifyResponse {
    isValid: boolean;
    invalidReason?: string;
}
/** Facilitator settle response. */
interface SettleResponse {
    success: boolean;
    txHash?: string;
    network?: string;
    errorReason?: string;
}
/** Per-route payment configuration. */
interface X402RouteConfig {
    /** Blockchain address to receive payment. */
    payTo: string;
    /** Payment scheme (default: "exact"). */
    scheme?: string;
    /** Price for this endpoint. */
    price: Price;
    /** Blockchain network. */
    network: Network;
    /** Max seconds to wait for settlement (default: 60). */
    maxTimeoutSeconds?: number;
    /** Human-readable description of what this endpoint does. */
    description?: string;
    /** Extra scheme-specific data. */
    extra?: Record<string, unknown>;
}
/** Top-level x402 config for the middleware. */
interface X402Config {
    /** Route → payment config mapping. Keys are "METHOD /path" (e.g. "GET /api/weather"). */
    routes: Record<string, X402RouteConfig>;
    /** Facilitator URL for payment verification and settlement. */
    facilitatorUrl: string;
    /** Custom facilitator client (overrides facilitatorUrl). */
    facilitator?: FacilitatorClient;
}
/** Interface for communicating with an x402 facilitator. */
interface FacilitatorClient {
    verify(payload: PaymentPayload, requirements: PaymentRequirements): Promise<VerifyResponse>;
    settle(payload: PaymentPayload, requirements: PaymentRequirements): Promise<SettleResponse>;
}
/** Default HTTP-based facilitator client. */
declare class HttpFacilitatorClient implements FacilitatorClient {
    private readonly url;
    constructor(url: string);
    verify(payload: PaymentPayload, requirements: PaymentRequirements): Promise<VerifyResponse>;
    settle(payload: PaymentPayload, requirements: PaymentRequirements): Promise<SettleResponse>;
}
/** Resolve a Price into concrete amount + asset. */
declare function resolvePrice(price: Price): {
    amount: string;
    asset: string;
    extra?: Record<string, unknown>;
};
/** Build PaymentRequirements from a route config. */
declare function buildRequirements(config: X402RouteConfig): PaymentRequirements;
/** Build the 402 response payload. */
declare function buildPaymentRequired(url: string, config: X402RouteConfig, error?: string): PaymentRequired;
/** Encode a PaymentRequired object to a base64 header value. */
declare function encodePaymentRequired(pr: PaymentRequired): string;
/** Decode a base64 PAYMENT-SIGNATURE header to a PaymentPayload. */
declare function decodePaymentPayload(header: string): PaymentPayload;
/** Match an incoming request to a route config key ("METHOD /path").
 *
 * Supports exact matches ("GET /api/weather") and wildcard patterns
 * ("GET /api/*" matches any path starting with /api/).
 * Exact matches take priority over wildcard matches.
 */
declare function matchRoute(method: string, path: string, routes: Record<string, X402RouteConfig>): X402RouteConfig | undefined;

export { type FacilitatorClient, HEADER_PAYMENT_REQUIRED, HEADER_PAYMENT_RESPONSE, HEADER_PAYMENT_SIGNATURE, HttpFacilitatorClient, type Network, type PaymentPayload, type PaymentRequired, type PaymentRequirements, type Price, type ResourceInfo, type SettleResponse, type VerifyResponse, type X402Config, type X402RouteConfig, X402_VERSION, buildPaymentRequired, buildRequirements, decodePaymentPayload, encodePaymentRequired, matchRoute, resolvePrice };

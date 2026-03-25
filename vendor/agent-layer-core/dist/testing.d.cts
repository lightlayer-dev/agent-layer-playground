import { i as AgentIdentityConfig, h as AgentIdentityClaims, V as McpServerConfig, d as RouteMetadata } from './mcp-f_2R3DPs.cjs';

/**
 * Shared test utilities for agent-layer packages.
 *
 * Provides mock JWT builders, common config fixtures, and test helpers
 * shared across Express, Koa, Hono, and Fastify test suites.
 */

/**
 * Create a mock JWT token (unsigned) with the given payload.
 * Suitable for testing — NOT for production.
 */
declare function makeJwt(payload: Record<string, unknown>): string;
declare const validJwtPayload: {
    iss: string;
    sub: string;
    aud: string;
    exp: number;
    iat: number;
    scope: string;
};
declare const baseIdentityConfig: AgentIdentityConfig;
declare const testRoutes: RouteMetadata[];
declare const testMcpConfig: McpServerConfig;
declare function makeCustomVerifier(claims: Partial<AgentIdentityClaims> | null): AgentIdentityConfig["verifyToken"];

export { baseIdentityConfig, makeCustomVerifier, makeJwt, testMcpConfig, testRoutes, validJwtPayload };

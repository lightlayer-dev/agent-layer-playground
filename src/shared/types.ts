// ── Shared types for agent-layer playground ──

/** Configuration for a demo API's agent-layer features */
export interface DemoConfig {
  /** Human-readable name, e.g. "E-Commerce API" */
  name: string;
  /** Short description */
  description: string;
  /** URL prefix, e.g. "/demo/ecommerce" */
  prefix: string;
  /** Version string */
  version: string;
  /** MCP tools this demo exposes */
  tools: McpToolDef[];
  /** OpenAPI endpoint definitions */
  endpoints: EndpointDef[];
  /** Skills / capabilities for agents.txt */
  skills: string[];
}

/** MCP tool definition */
export interface McpToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** Handler that executes the tool and returns a result */
  handler: (args: Record<string, unknown>) => unknown | Promise<unknown>;
}

/** Endpoint definition for OpenAPI + llms.txt generation */
export interface EndpointDef {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  summary: string;
  description: string;
  parameters?: ParameterDef[];
  requestBody?: { description: string; schema: Record<string, unknown> };
  responseSchema?: Record<string, unknown>;
}

export interface ParameterDef {
  name: string;
  in: "query" | "path";
  description: string;
  required?: boolean;
  schema: Record<string, unknown>;
}

/** Standard JSON envelope for API responses */
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
  meta?: { total?: number; page?: number; limit?: number };
}

/** MCP JSON-RPC request */
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

/** MCP JSON-RPC response */
export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// ── MCP (Model Context Protocol) JSON-RPC handler ──
//
// Implements the MCP Streamable HTTP transport for each demo.
// Supports: initialize, ping, tools/list, tools/call
// Each demo registers its own tools; this module handles the protocol layer.

import type { Context } from "hono";
import type { McpToolDef, JsonRpcRequest, JsonRpcResponse } from "./types";

const PROTOCOL_VERSION = "2025-03-26";

/** Build an MCP POST handler for a set of tools */
export function createMcpHandler(
  serverName: string,
  serverVersion: string,
  tools: McpToolDef[]
) {
  return async (c: Context): Promise<Response> => {
    let body: JsonRpcRequest | JsonRpcRequest[];
    try {
      body = await c.req.json();
    } catch {
      return c.json(rpcError(null, -32700, "Parse error"), 400);
    }

    // Batch support
    if (Array.isArray(body)) {
      const results = await Promise.all(body.map((req) => handleSingle(req, serverName, serverVersion, tools)));
      const responses = results.filter((r): r is JsonRpcResponse => r !== null);
      if (responses.length === 0) return new Response(null, { status: 202 });
      return c.json(responses);
    }

    const result = await handleSingle(body, serverName, serverVersion, tools);
    if (result === null) {
      // Notification — no id, no response body
      return new Response(null, { status: 202 });
    }
    return c.json(result);
  };
}

async function handleSingle(
  req: JsonRpcRequest,
  serverName: string,
  serverVersion: string,
  tools: McpToolDef[]
): Promise<JsonRpcResponse | null> {
  // Notifications (no id) get no response
  if (req.id === undefined || req.id === null) {
    // Still process "notifications/initialized" silently
    return null;
  }

  const id = req.id;

  switch (req.method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: serverName, version: serverVersion },
      });

    case "ping":
      return rpcResult(id, {});

    case "tools/list":
      return rpcResult(id, {
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });

    case "tools/call": {
      const toolName = (req.params as Record<string, unknown>)?.name as string;
      const toolArgs = ((req.params as Record<string, unknown>)?.arguments ?? {}) as Record<string, unknown>;

      const tool = tools.find((t) => t.name === toolName);
      if (!tool) {
        return rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify({ error: `Unknown tool: ${toolName}` }) }],
          isError: true,
        });
      }

      try {
        const result = await tool.handler(toolArgs);
        return rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Tool execution failed";
        return rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify({ error: msg }) }],
          isError: true,
        });
      }
    }

    default:
      return rpcError(id, -32601, `Method not found: ${req.method}`);
  }
}

function rpcResult(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? 0, result };
}

function rpcError(id: string | number | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? 0, error: { code, message } };
}

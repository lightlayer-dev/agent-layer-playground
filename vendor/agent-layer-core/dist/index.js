import {
  HEADER_PAYMENT_REQUIRED,
  HEADER_PAYMENT_RESPONSE,
  HEADER_PAYMENT_SIGNATURE,
  HttpFacilitatorClient,
  X402_VERSION,
  buildPaymentRequired,
  buildRequirements,
  decodePaymentPayload,
  encodePaymentRequired,
  matchRoute,
  resolvePrice
} from "./chunk-5IFF46Y4.js";

// src/mcp.ts
function formatToolName(method, path) {
  const cleanPath = path.replace(/^\/+|\/+$/g, "").replace(/:(\w+)/g, "by_$1").replace(/\{(\w+)\}/g, "by_$1").replace(/[^a-zA-Z0-9]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  return `${method.toLowerCase()}_${cleanPath}`.toLowerCase();
}
function buildInputSchema(params) {
  const schema = {
    type: "object",
    properties: {}
  };
  if (!params || params.length === 0) {
    return schema;
  }
  const properties = {};
  const required = [];
  for (const param of params) {
    const prop = {
      type: "string"
    };
    if (param.description) {
      prop.description = param.description;
    }
    properties[param.name] = prop;
    if (param.required) {
      required.push(param.name);
    }
  }
  schema.properties = properties;
  if (required.length > 0) {
    schema.required = required;
  }
  return schema;
}
function generateToolDefinitions(routes) {
  return routes.map((route) => ({
    name: formatToolName(route.method, route.path),
    description: route.summary || route.description || `${route.method.toUpperCase()} ${route.path}`,
    inputSchema: buildInputSchema(route.parameters)
  }));
}
function generateServerInfo(config) {
  const info = {
    name: config.name,
    version: config.version || "1.0.0"
  };
  if (config.instructions) {
    info.instructions = config.instructions;
  }
  return info;
}
function parseToolName(toolName) {
  const parts = toolName.split("_");
  const method = (parts[0] || "get").toUpperCase();
  const pathParts = parts.slice(1);
  const segments = [];
  for (let i = 0; i < pathParts.length; i++) {
    if (pathParts[i] === "by" && i + 1 < pathParts.length) {
      segments.push(`:${pathParts[i + 1]}`);
      i++;
    } else {
      segments.push(pathParts[i]);
    }
  }
  return {
    method,
    path: "/" + segments.join("/")
  };
}
function handleJsonRpc(request, serverInfo, tools, toolCallHandler) {
  if (request.id === void 0 || request.id === null) {
    return null;
  }
  switch (request.method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          protocolVersion: "2025-03-26",
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: serverInfo.name,
            version: serverInfo.version
          },
          ...serverInfo.instructions ? { instructions: serverInfo.instructions } : {}
        }
      };
    case "ping":
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {}
      };
    case "tools/list":
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          tools: tools.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema
          }))
        }
      };
    case "tools/call": {
      const params = request.params;
      if (!params?.name) {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32602,
            message: "Invalid params: tool name is required"
          }
        };
      }
      const tool = tools.find((t) => t.name === params.name);
      if (!tool) {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32602,
            message: `Unknown tool: ${params.name}`
          }
        };
      }
      if (!toolCallHandler) {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32603,
            message: "Tool call handler not configured"
          }
        };
      }
      return toolCallHandler(params.name, params.arguments || {}).then(
        (result) => ({
          jsonrpc: "2.0",
          id: request.id,
          result
        }),
        (err) => ({
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32603,
            message: err instanceof Error ? err.message : "Internal tool error"
          }
        })
      );
    }
    default:
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`
        }
      };
  }
}

// src/a2a.ts
function generateAgentCard(config) {
  const card = { ...config.card };
  if (!card.protocolVersion) {
    card.protocolVersion = "1.0.0";
  }
  if (!card.defaultInputModes) {
    card.defaultInputModes = ["text/plain"];
  }
  if (!card.defaultOutputModes) {
    card.defaultOutputModes = ["text/plain"];
  }
  if (!card.skills) {
    card.skills = [];
  }
  return card;
}
function validateAgentCard(card) {
  const errors = [];
  if (!card.name) errors.push("name is required");
  if (!card.url) errors.push("url is required");
  if (!card.skills) errors.push("skills is required");
  if (!card.protocolVersion) errors.push("protocolVersion is required");
  if (card.url && !card.url.startsWith("http")) {
    errors.push("url must be an HTTP(S) URL");
  }
  if (card.skills && !Array.isArray(card.skills)) {
    errors.push("skills must be an array");
  }
  if (card.skills && Array.isArray(card.skills)) {
    for (const skill of card.skills) {
      if (!skill.id) errors.push("each skill must have an id");
      if (!skill.name) errors.push("each skill must have a name");
    }
  }
  return errors;
}

// src/agent-identity.ts
var SPIFFE_RE = /^spiffe:\/\/([^/]+)(\/.*)?$/;
function parseSpiffeId(uri) {
  const m = SPIFFE_RE.exec(uri);
  if (!m) return null;
  return {
    trustDomain: m[1],
    path: m[2] ?? "/",
    raw: uri
  };
}
function isSpiffeTrusted(spiffeId, trustedDomains) {
  return trustedDomains.includes(spiffeId.trustDomain);
}
function base64urlDecode(str) {
  const padded = str + "=".repeat((4 - str.length % 4) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  return typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("utf-8");
}
function decodeJwtClaims(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(base64urlDecode(parts[1]));
  } catch {
    return null;
  }
}
var KNOWN_CLAIMS = /* @__PURE__ */ new Set([
  "iss",
  "sub",
  "aud",
  "exp",
  "iat",
  "nbf",
  "jti",
  "scope",
  "scopes",
  "scp",
  "act",
  "agent_id"
]);
function extractClaims(payload) {
  const iss = String(payload.iss ?? "");
  const sub = String(payload.sub ?? "");
  const agentId = String(payload.agent_id ?? payload.sub ?? "");
  const spiffeId = parseSpiffeId(agentId) ?? void 0;
  const rawAud = payload.aud;
  const audience = Array.isArray(rawAud) ? rawAud.map(String) : rawAud ? [String(rawAud)] : [];
  let scopes = [];
  if (typeof payload.scope === "string") {
    scopes = payload.scope.split(" ").filter(Boolean);
  } else if (Array.isArray(payload.scopes)) {
    scopes = payload.scopes.map(String);
  } else if (Array.isArray(payload.scp)) {
    scopes = payload.scp.map(String);
  }
  const delegated = payload.act != null;
  const delegatedBy = delegated ? String(payload.act?.sub ?? "") : void 0;
  const customClaims = {};
  for (const [k, v] of Object.entries(payload)) {
    if (!KNOWN_CLAIMS.has(k)) customClaims[k] = v;
  }
  return {
    agentId,
    spiffeId,
    issuer: iss,
    subject: sub,
    audience,
    expiresAt: Number(payload.exp ?? 0),
    issuedAt: Number(payload.iat ?? 0),
    scopes,
    delegated,
    delegatedBy: delegatedBy || void 0,
    customClaims
  };
}
function validateClaims(claims, config) {
  const now = Math.floor(Date.now() / 1e3);
  const skew = config.clockSkewSeconds ?? 30;
  if (!config.trustedIssuers.includes(claims.issuer)) {
    return {
      code: "untrusted_issuer",
      message: `Issuer "${claims.issuer}" is not trusted.`
    };
  }
  const audMatch = claims.audience.some((a) => config.audience.includes(a));
  if (!audMatch && claims.audience.length > 0) {
    return {
      code: "invalid_audience",
      message: "Token audience does not match any expected audience."
    };
  }
  if (claims.expiresAt && claims.expiresAt + skew < now) {
    return {
      code: "expired_token",
      message: "Token has expired."
    };
  }
  const maxLifetime = config.maxLifetimeSeconds ?? 3600;
  if (claims.issuedAt && claims.expiresAt) {
    const lifetime = claims.expiresAt - claims.issuedAt;
    if (lifetime > maxLifetime) {
      return {
        code: "token_too_long_lived",
        message: `Token lifetime ${lifetime}s exceeds maximum ${maxLifetime}s.`
      };
    }
  }
  if (claims.spiffeId && config.trustedDomains) {
    if (!isSpiffeTrusted(claims.spiffeId, config.trustedDomains)) {
      return {
        code: "untrusted_domain",
        message: `SPIFFE trust domain "${claims.spiffeId.trustDomain}" is not trusted.`
      };
    }
  }
  return null;
}
function globMatch(pattern, value) {
  const regex = new RegExp(
    "^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"
  );
  return regex.test(value);
}
function evaluateAuthz(claims, context, policies, defaultPolicy = "deny") {
  for (const policy of policies) {
    if (policy.agentPattern && !globMatch(policy.agentPattern, claims.agentId)) {
      continue;
    }
    if (policy.trustDomains && claims.spiffeId) {
      if (!policy.trustDomains.includes(claims.spiffeId.trustDomain)) continue;
    }
    if (policy.methods && !policy.methods.includes(context.method.toUpperCase())) {
      continue;
    }
    if (policy.paths) {
      const pathMatch = policy.paths.some((p) => globMatch(p, context.path));
      if (!pathMatch) continue;
    }
    if (policy.allowDelegated === false && claims.delegated) {
      return {
        allowed: false,
        matchedPolicy: policy.name,
        deniedReason: "Delegated access not allowed by policy."
      };
    }
    if (policy.requiredScopes) {
      const missing = policy.requiredScopes.filter((s) => !claims.scopes.includes(s));
      if (missing.length > 0) {
        return {
          allowed: false,
          matchedPolicy: policy.name,
          deniedReason: `Missing required scopes: ${missing.join(", ")}`
        };
      }
    }
    if (policy.evaluate && !policy.evaluate(claims, context)) {
      return {
        allowed: false,
        matchedPolicy: policy.name,
        deniedReason: "Custom policy evaluation denied access."
      };
    }
    return { allowed: true, matchedPolicy: policy.name };
  }
  return {
    allowed: defaultPolicy === "allow",
    deniedReason: defaultPolicy === "deny" ? "No matching authorization policy." : void 0
  };
}
function buildAuditEvent(claims, context, authzResult) {
  return {
    type: "agent_identity",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    agentId: claims.agentId,
    spiffeId: claims.spiffeId?.raw,
    issuer: claims.issuer,
    delegated: claims.delegated,
    delegatedBy: claims.delegatedBy,
    scopes: claims.scopes,
    method: context.method,
    path: context.path,
    authzResult
  };
}

// src/errors.ts
var STATUS_TYPES = {
  400: "invalid_request_error",
  401: "authentication_error",
  403: "permission_error",
  404: "not_found_error",
  409: "conflict_error",
  422: "validation_error",
  429: "rate_limit_error",
  500: "api_error"
};
function typeForStatus(status) {
  return STATUS_TYPES[status] ?? "api_error";
}
function formatError(opts) {
  const status = opts.status ?? 500;
  return {
    type: opts.type ?? typeForStatus(status),
    code: opts.code,
    message: opts.message,
    status,
    is_retriable: opts.is_retriable ?? (status === 429 || status >= 500),
    ...opts.retry_after != null && { retry_after: opts.retry_after },
    ...opts.param != null && { param: opts.param },
    ...opts.docs_url != null && { docs_url: opts.docs_url }
  };
}
var AgentError = class extends Error {
  envelope;
  constructor(opts) {
    super(opts.message);
    this.name = "AgentError";
    this.envelope = formatError(opts);
  }
  get status() {
    return this.envelope.status;
  }
  toJSON() {
    return { error: this.envelope };
  }
};
function notFoundError(message = "The requested resource was not found.") {
  return formatError({ code: "not_found", message, status: 404 });
}
function rateLimitError(retryAfter) {
  return formatError({
    code: "rate_limit_exceeded",
    message: "Too many requests. Please retry after the specified time.",
    status: 429,
    is_retriable: true,
    retry_after: retryAfter
  });
}

// src/rate-limit.ts
var MemoryStore = class {
  windows = /* @__PURE__ */ new Map();
  async increment(key, windowMs) {
    const now = Date.now();
    const entry = this.windows.get(key);
    if (!entry || now >= entry.expiresAt) {
      this.windows.set(key, { count: 1, expiresAt: now + windowMs });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }
  async get(key) {
    const now = Date.now();
    const entry = this.windows.get(key);
    if (!entry || now >= entry.expiresAt) {
      return 0;
    }
    return entry.count;
  }
  async reset(key) {
    this.windows.delete(key);
  }
  /** Remove expired entries. Useful for long-running processes. */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.windows) {
      if (now >= entry.expiresAt) {
        this.windows.delete(key);
      }
    }
  }
};
var DEFAULT_WINDOW_MS = 6e4;
function createRateLimiter(config) {
  const windowMs = config.windowMs ?? DEFAULT_WINDOW_MS;
  const store = config.store ?? new MemoryStore();
  const keyFn = config.keyFn ?? (() => "__global__");
  return async function checkRateLimit(req) {
    const key = keyFn(req);
    const count = await store.increment(key, windowMs);
    const allowed = count <= config.max;
    const remaining = Math.max(0, config.max - count);
    const result = {
      allowed,
      limit: config.max,
      remaining,
      resetMs: windowMs
    };
    if (!allowed) {
      result.retryAfter = Math.ceil(windowMs / 1e3);
    }
    return result;
  };
}

// src/llms-txt.ts
function generateLlmsTxt(config) {
  const lines = [];
  lines.push(`# ${config.title}`);
  if (config.description) {
    lines.push("");
    lines.push(`> ${config.description}`);
  }
  if (config.sections) {
    for (const section of config.sections) {
      lines.push("");
      lines.push(`## ${section.title}`);
      lines.push("");
      lines.push(section.content);
    }
  }
  return lines.join("\n") + "\n";
}
function generateLlmsFullTxt(config, routes) {
  const lines = [];
  lines.push(`# ${config.title}`);
  if (config.description) {
    lines.push("");
    lines.push(`> ${config.description}`);
  }
  if (config.sections) {
    for (const section of config.sections) {
      lines.push("");
      lines.push(`## ${section.title}`);
      lines.push("");
      lines.push(section.content);
    }
  }
  if (routes.length > 0) {
    lines.push("");
    lines.push("## API Endpoints");
    for (const route of routes) {
      lines.push("");
      lines.push(`### ${route.method.toUpperCase()} ${route.path}`);
      if (route.summary) {
        lines.push("");
        lines.push(route.summary);
      }
      if (route.description) {
        lines.push("");
        lines.push(route.description);
      }
      if (route.parameters && route.parameters.length > 0) {
        lines.push("");
        lines.push("**Parameters:**");
        for (const param of route.parameters) {
          const required = param.required ? " (required)" : "";
          const desc = param.description ? ` \u2014 ${param.description}` : "";
          lines.push(`- \`${param.name}\` (${param.in})${required}${desc}`);
        }
      }
    }
  }
  return lines.join("\n") + "\n";
}

// src/discovery.ts
function generateAIManifest(config) {
  return { ...config.manifest };
}
function generateJsonLd(config) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebAPI",
    name: config.manifest.name
  };
  if (config.manifest.description) {
    jsonLd["description"] = config.manifest.description;
  }
  if (config.manifest.openapi_url) {
    jsonLd["documentation"] = config.manifest.openapi_url;
  }
  if (config.manifest.contact?.url) {
    jsonLd["url"] = config.manifest.contact.url;
  }
  if (config.manifest.contact?.email) {
    jsonLd["contactPoint"] = {
      "@type": "ContactPoint",
      email: config.manifest.contact.email
    };
  }
  if (config.manifest.capabilities && config.manifest.capabilities.length > 0) {
    jsonLd["potentialAction"] = config.manifest.capabilities.map((cap) => ({
      "@type": "Action",
      name: cap
    }));
  }
  return jsonLd;
}

// src/analytics.ts
var AGENT_PATTERNS = [
  { pattern: /ChatGPT-User/i, name: "ChatGPT" },
  { pattern: /GPTBot/i, name: "GPTBot" },
  { pattern: /Google-Extended/i, name: "Google-Extended" },
  { pattern: /Googlebot/i, name: "Googlebot" },
  { pattern: /Bingbot/i, name: "Bingbot" },
  { pattern: /ClaudeBot/i, name: "ClaudeBot" },
  { pattern: /Claude-Web/i, name: "Claude-Web" },
  { pattern: /Anthropic/i, name: "Anthropic" },
  { pattern: /PerplexityBot/i, name: "PerplexityBot" },
  { pattern: /Cohere-AI/i, name: "Cohere" },
  { pattern: /YouBot/i, name: "YouBot" },
  { pattern: /CCBot/i, name: "CCBot" },
  { pattern: /Bytespider/i, name: "Bytespider" },
  { pattern: /Applebot/i, name: "Applebot" },
  { pattern: /Meta-ExternalAgent/i, name: "Meta-ExternalAgent" },
  { pattern: /AI2Bot/i, name: "AI2Bot" },
  { pattern: /Diffbot/i, name: "Diffbot" },
  { pattern: /Amazonbot/i, name: "Amazonbot" }
];
function detectAgent(userAgent) {
  if (!userAgent) return null;
  for (const { pattern, name } of AGENT_PATTERNS) {
    if (pattern.test(userAgent)) return name;
  }
  return null;
}
var EventBuffer = class {
  buffer = [];
  timer = null;
  config;
  constructor(config) {
    this.config = {
      bufferSize: config.bufferSize ?? 50,
      flushIntervalMs: config.flushIntervalMs ?? 3e4,
      endpoint: config.endpoint,
      apiKey: config.apiKey,
      onEvent: config.onEvent
    };
    if (this.config.endpoint) {
      this.timer = setInterval(() => this.flush(), this.config.flushIntervalMs);
      if (this.timer && typeof this.timer === "object" && "unref" in this.timer) {
        this.timer.unref();
      }
    }
  }
  push(event) {
    this.config.onEvent?.(event);
    if (this.config.endpoint) {
      this.buffer.push(event);
      if (this.buffer.length >= this.config.bufferSize) {
        void this.flush();
      }
    }
  }
  async flush() {
    if (this.buffer.length === 0 || !this.config.endpoint) return;
    const batch = this.buffer.splice(0, this.buffer.length);
    try {
      const headers = {
        "Content-Type": "application/json"
      };
      if (this.config.apiKey) {
        headers["X-API-Key"] = this.config.apiKey;
      }
      await fetch(this.config.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ events: batch }),
        signal: AbortSignal.timeout(1e4)
      });
    } catch {
      if (this.buffer.length < this.config.bufferSize * 3) {
        this.buffer.unshift(...batch);
      }
    }
  }
  /** Stop the flush timer and flush remaining events. */
  async shutdown() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
  get pending() {
    return this.buffer.length;
  }
};
function createAnalytics(config) {
  const buffer = new EventBuffer(config);
  const detect = config.detectAgent ? (ua) => ua ? config.detectAgent(ua) : null : detectAgent;
  return {
    record: (event) => buffer.push(event),
    flush: () => buffer.flush(),
    shutdown: () => buffer.shutdown(),
    buffer,
    detect,
    config
  };
}

// src/api-keys.ts
var MemoryApiKeyStore = class {
  keys = /* @__PURE__ */ new Map();
  async resolve(rawKey) {
    return this.keys.get(rawKey) ?? null;
  }
  /** Store a key mapping. Used internally by createApiKey. */
  set(rawKey, key) {
    this.keys.set(rawKey, key);
  }
  /** Remove a key mapping. */
  delete(rawKey) {
    this.keys.delete(rawKey);
  }
  /** Number of stored keys. */
  get size() {
    return this.keys.size;
  }
};
function toHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
function randomHex(byteLength) {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return toHex(bytes);
}
function createApiKey(store, opts) {
  const rawKey = `al_${randomHex(16)}`;
  const keyId = randomHex(8);
  const key = {
    keyId,
    companyId: opts.companyId,
    userId: opts.userId,
    scopes: opts.scopes,
    ...opts.expiresAt != null && { expiresAt: opts.expiresAt },
    ...opts.metadata != null && { metadata: opts.metadata }
  };
  store.set(rawKey, key);
  return { rawKey, key };
}
async function validateApiKey(store, rawKey) {
  const key = await store.resolve(rawKey);
  if (!key) {
    return { valid: false, error: "invalid_api_key" };
  }
  if (key.expiresAt && key.expiresAt.getTime() <= Date.now()) {
    return { valid: false, error: "api_key_expired" };
  }
  return { valid: true, key };
}
function hasScope(key, required) {
  if (key.scopes.includes("*")) {
    return true;
  }
  const requiredScopes = Array.isArray(required) ? required : [required];
  return requiredScopes.every((scope) => key.scopes.includes(scope));
}

// src/unified-discovery.ts
function isFormatEnabled(formats, format) {
  if (!formats) return true;
  return formats[format] !== false;
}
function generateUnifiedAIManifest(config) {
  const auth = config.auth ? {
    type: config.auth.type === "bearer" ? "api_key" : config.auth.type,
    authorization_url: config.auth.authorizationUrl,
    token_url: config.auth.tokenUrl,
    scopes: config.auth.scopes
  } : void 0;
  const discoveryConfig = {
    manifest: {
      name: config.name,
      description: config.description,
      openapi_url: config.openApiUrl,
      llms_txt_url: isFormatEnabled(config.formats, "llmsTxt") ? `${config.url}/llms.txt` : void 0,
      auth,
      contact: config.contact,
      capabilities: config.capabilities
    }
  };
  return generateAIManifest(discoveryConfig);
}
function generateUnifiedAgentCard(config) {
  const authScheme = config.auth ? {
    type: config.auth.type === "api_key" ? "apiKey" : config.auth.type,
    in: config.auth.in,
    name: config.auth.name,
    authorizationUrl: config.auth.authorizationUrl,
    tokenUrl: config.auth.tokenUrl,
    scopes: config.auth.scopes
  } : void 0;
  const skills = (config.skills ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    tags: s.tags,
    examples: s.examples,
    inputModes: s.inputModes,
    outputModes: s.outputModes
  }));
  return generateAgentCard({
    card: {
      protocolVersion: "1.0.0",
      name: config.name,
      description: config.description,
      url: config.url,
      provider: config.provider,
      version: config.version,
      documentationUrl: config.documentationUrl ?? config.openApiUrl,
      capabilities: config.agentCapabilities,
      authentication: authScheme,
      skills
    }
  });
}
function generateUnifiedLlmsTxt(config) {
  const sections = [
    ...(config.skills ?? []).map((s) => ({
      title: s.name,
      content: [
        s.description ?? "",
        s.examples?.length ? `
Examples:
${s.examples.map((e) => `- ${e}`).join("\n")}` : ""
      ].filter(Boolean).join("\n")
    })),
    ...config.llmsTxtSections ?? []
  ];
  const llmsConfig = {
    title: config.name,
    description: config.description,
    sections
  };
  return generateLlmsTxt(llmsConfig);
}
function generateUnifiedLlmsFullTxt(config) {
  const sections = [
    ...(config.skills ?? []).map((s) => ({
      title: s.name,
      content: [
        s.description ?? "",
        s.examples?.length ? `
Examples:
${s.examples.map((e) => `- ${e}`).join("\n")}` : ""
      ].filter(Boolean).join("\n")
    })),
    ...config.llmsTxtSections ?? []
  ];
  const llmsConfig = {
    title: config.name,
    description: config.description,
    sections
  };
  return generateLlmsFullTxt(llmsConfig, config.routes ?? []);
}
function generateAgentsTxt(config) {
  const agentsTxtConfig = config.agentsTxt;
  if (!agentsTxtConfig) {
    return `# agents.txt \u2014 AI agent access rules for ${config.name}
# See https://github.com/nichochar/open-agent-schema

User-agent: *
Allow: /
`;
  }
  const lines = [];
  if (agentsTxtConfig.comment) {
    for (const line of agentsTxtConfig.comment.split("\n")) {
      lines.push(`# ${line}`);
    }
    lines.push("");
  }
  for (const block of agentsTxtConfig.blocks) {
    lines.push(`User-agent: ${block.userAgent}`);
    for (const rule of block.rules) {
      const directive = rule.permission === "allow" ? "Allow" : "Disallow";
      lines.push(`${directive}: ${rule.path}`);
    }
    lines.push("");
  }
  if (agentsTxtConfig.sitemapUrl) {
    lines.push(`Sitemap: ${agentsTxtConfig.sitemapUrl}`);
    lines.push("");
  }
  return lines.join("\n");
}
function generateAllDiscovery(config) {
  const result = /* @__PURE__ */ new Map();
  if (isFormatEnabled(config.formats, "wellKnownAi")) {
    result.set("/.well-known/ai", generateUnifiedAIManifest(config));
  }
  if (isFormatEnabled(config.formats, "agentCard")) {
    result.set("/.well-known/agent.json", generateUnifiedAgentCard(config));
  }
  if (isFormatEnabled(config.formats, "llmsTxt")) {
    result.set("/llms.txt", generateUnifiedLlmsTxt(config));
    result.set("/llms-full.txt", generateUnifiedLlmsFullTxt(config));
  }
  if (isFormatEnabled(config.formats, "agentsTxt")) {
    result.set("/agents.txt", generateAgentsTxt(config));
  }
  return result;
}

// src/agents-txt.ts
function generateAgentsTxt2(config) {
  const lines = [];
  lines.push("# agents.txt \u2014 AI Agent Access Policy");
  if (config.siteName) {
    lines.push(`# Site: ${config.siteName}`);
  }
  if (config.contact) {
    lines.push(`# Contact: ${config.contact}`);
  }
  if (config.discoveryUrl) {
    lines.push(`# Discovery: ${config.discoveryUrl}`);
  }
  for (const rule of config.rules) {
    lines.push("");
    lines.push(`User-agent: ${rule.agent}`);
    if (rule.description) {
      lines.push(`# ${rule.description}`);
    }
    if (rule.allow) {
      for (const path of rule.allow) {
        lines.push(`Allow: ${path}`);
      }
    }
    if (rule.deny) {
      for (const path of rule.deny) {
        lines.push(`Deny: ${path}`);
      }
    }
    if (rule.rateLimit) {
      const window = rule.rateLimit.windowSeconds ?? 60;
      lines.push(`Rate-limit: ${rule.rateLimit.max}/${window}s`);
    }
    if (rule.preferredInterface) {
      lines.push(`Preferred-interface: ${rule.preferredInterface}`);
    }
    if (rule.auth) {
      const authParts = [rule.auth.type];
      if (rule.auth.endpoint) authParts.push(rule.auth.endpoint);
      lines.push(`Auth: ${authParts.join(" ")}`);
      if (rule.auth.docsUrl) {
        lines.push(`Auth-docs: ${rule.auth.docsUrl}`);
      }
    }
  }
  return lines.join("\n") + "\n";
}
function parseAgentsTxt(content) {
  const lines = content.split("\n");
  const config = { rules: [] };
  let currentRule = null;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("# Site:")) {
      config.siteName = line.slice("# Site:".length).trim();
      continue;
    }
    if (line.startsWith("# Contact:")) {
      config.contact = line.slice("# Contact:".length).trim();
      continue;
    }
    if (line.startsWith("# Discovery:")) {
      config.discoveryUrl = line.slice("# Discovery:".length).trim();
      continue;
    }
    if (line === "" || line.startsWith("#") && !currentRule) {
      continue;
    }
    if (line.startsWith("#") && currentRule) {
      continue;
    }
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const directive = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();
    if (directive === "user-agent") {
      currentRule = { agent: value };
      config.rules.push(currentRule);
      continue;
    }
    if (!currentRule) continue;
    switch (directive) {
      case "allow":
        if (!currentRule.allow) currentRule.allow = [];
        currentRule.allow.push(value);
        break;
      case "deny":
        if (!currentRule.deny) currentRule.deny = [];
        currentRule.deny.push(value);
        break;
      case "rate-limit": {
        const match = value.match(/^(\d+)\/(\d+)s$/);
        if (match) {
          currentRule.rateLimit = {
            max: parseInt(match[1], 10),
            windowSeconds: parseInt(match[2], 10)
          };
        }
        break;
      }
      case "preferred-interface":
        if (["rest", "mcp", "graphql", "a2a"].includes(value)) {
          currentRule.preferredInterface = value;
        }
        break;
      case "auth": {
        const parts = value.split(/\s+/);
        const type = parts[0];
        currentRule.auth = {
          type,
          endpoint: parts[1]
        };
        break;
      }
      case "auth-docs":
        if (currentRule.auth) {
          currentRule.auth.docsUrl = value;
        }
        break;
    }
  }
  return config;
}
function isAgentAllowed(config, agentName, path) {
  const matchingRule = findMatchingRule(config.rules, agentName);
  if (!matchingRule) return void 0;
  if (matchingRule.deny) {
    for (const pattern of matchingRule.deny) {
      if (pathMatches(path, pattern)) return false;
    }
  }
  if (matchingRule.allow) {
    for (const pattern of matchingRule.allow) {
      if (pathMatches(path, pattern)) return true;
    }
    return false;
  }
  return true;
}
function findMatchingRule(rules, agentName) {
  let wildcardRule;
  let patternRule;
  let exactRule;
  for (const rule of rules) {
    if (rule.agent === "*") {
      wildcardRule = rule;
    } else if (rule.agent.endsWith("*")) {
      const prefix = rule.agent.slice(0, -1);
      if (agentName.startsWith(prefix)) {
        patternRule = rule;
      }
    } else if (rule.agent === agentName) {
      exactRule = rule;
    }
  }
  return exactRule ?? patternRule ?? wildcardRule;
}
function pathMatches(path, pattern) {
  if (pattern === "*" || pattern === "/*") return true;
  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    return path.startsWith(prefix);
  }
  return path === pattern;
}

// src/error-handler.ts
function prefersJson(accept, userAgent) {
  const a = accept ?? "";
  if (a.includes("application/json")) return true;
  if (a.includes("text/html")) return false;
  const ua = userAgent ?? "";
  if (!ua || /bot|crawl|spider|agent|curl|httpie|python|node|go-http/i.test(ua)) {
    return true;
  }
  return false;
}
function renderHtmlError(envelope) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Error ${envelope.status}</title></head>
<body>
  <h1>${envelope.status} \u2014 ${envelope.code}</h1>
  <p>${envelope.message}</p>
</body>
</html>`;
}
function buildErrorEnvelope(err) {
  if (err instanceof AgentError) {
    return err.envelope;
  }
  const status = err.status ?? err.statusCode ?? 500;
  return formatError({
    code: "internal_error",
    message: err.message || "An unexpected error occurred.",
    status
  });
}
function buildErrorResponse(err, accept, userAgent) {
  const envelope = buildErrorEnvelope(err);
  const headers = {};
  if (envelope.retry_after != null) {
    headers["Retry-After"] = String(envelope.retry_after);
  }
  const isJson = prefersJson(accept, userAgent);
  return {
    status: envelope.status,
    headers,
    body: isJson ? { error: envelope } : renderHtmlError(envelope),
    isJson
  };
}
function buildNotFoundResponse(method, path, accept, userAgent) {
  const envelope = formatError({
    code: "not_found",
    message: `No route matches ${method} ${path}`,
    status: 404
  });
  const isJson = prefersJson(accept, userAgent);
  return {
    status: 404,
    headers: {},
    body: isJson ? { error: envelope } : renderHtmlError(envelope),
    isJson
  };
}

// src/auth-handler.ts
function buildOauthDiscoveryDocument(config) {
  const doc = {};
  if (config.issuer) doc["issuer"] = config.issuer;
  if (config.authorizationUrl) doc["authorization_endpoint"] = config.authorizationUrl;
  if (config.tokenUrl) doc["token_endpoint"] = config.tokenUrl;
  if (config.scopes) doc["scopes_supported"] = Object.keys(config.scopes);
  return doc;
}
function buildWwwAuthenticate(realm, scopes) {
  const parts = [`Bearer realm="${realm}"`];
  if (scopes) {
    parts.push(`scope="${Object.keys(scopes).join(" ")}"`);
  }
  return parts.join(", ");
}
function checkRequireAuth(config, authorizationHeader) {
  if (authorizationHeader) {
    return { pass: true };
  }
  const realm = config.realm ?? "api";
  const wwwAuthenticate = buildWwwAuthenticate(realm, config.scopes);
  const envelope = formatError({
    code: "authentication_required",
    message: "This endpoint requires authentication.",
    status: 401,
    docs_url: config.authorizationUrl
  });
  return { pass: false, wwwAuthenticate, envelope };
}

// src/oauth2.ts
var UNRESERVED = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
function generateCodeVerifier(length = 64) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => UNRESERVED[b % UNRESERVED.length]).join("");
}
async function computeCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", data);
  return base64urlEncode(new Uint8Array(hash));
}
async function generatePKCE(verifierLength = 64) {
  const codeVerifier = generateCodeVerifier(verifierLength);
  const codeChallenge = await computeCodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}
function buildAuthorizationUrl(config, state, codeChallenge, scopes) {
  const url = new URL(config.authorizationEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  const scopeList = scopes ?? (config.scopes ? Object.keys(config.scopes) : []);
  if (scopeList.length > 0) {
    url.searchParams.set("scope", scopeList.join(" "));
  }
  return url.toString();
}
var defaultHttpClient = {
  async post(url, body, headers) {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
      body: body.toString()
    });
    return { status: resp.status, json: () => resp.json() };
  }
};
async function exchangeCode(config, code, codeVerifier, httpClient = defaultHttpClient) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: codeVerifier
  });
  if (config.clientSecret) {
    body.set("client_secret", config.clientSecret);
  }
  const resp = await httpClient.post(config.tokenEndpoint, body);
  if (resp.status !== 200) {
    const err = await resp.json();
    throw new OAuth2TokenError(
      err.error_description ?? err.error ?? "Token exchange failed",
      err.error ?? "server_error",
      resp.status
    );
  }
  return await resp.json();
}
async function refreshAccessToken(config, refreshToken, httpClient = defaultHttpClient) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId
  });
  if (config.clientSecret) {
    body.set("client_secret", config.clientSecret);
  }
  const resp = await httpClient.post(config.tokenEndpoint, body);
  if (resp.status !== 200) {
    const err = await resp.json();
    throw new OAuth2TokenError(
      err.error_description ?? err.error ?? "Token refresh failed",
      err.error ?? "server_error",
      resp.status
    );
  }
  return await resp.json();
}
function validateAccessToken(token, config, requiredScopes, clockSkewSeconds = 30) {
  const decoded = decodeJwtPayload(token);
  if (!decoded) {
    return { valid: false, error: "malformed_token" };
  }
  const now = Math.floor(Date.now() / 1e3);
  const exp = Number(decoded.exp ?? 0);
  if (exp && exp + clockSkewSeconds < now) {
    return { valid: false, error: "token_expired" };
  }
  if (config.issuer && decoded.iss !== config.issuer) {
    return { valid: false, error: "invalid_issuer" };
  }
  if (config.audience) {
    const aud = decoded.aud;
    const audList = Array.isArray(aud) ? aud : aud ? [aud] : [];
    if (!audList.includes(config.audience)) {
      return { valid: false, error: "invalid_audience" };
    }
  }
  const scopes = extractScopes(decoded);
  if (requiredScopes && requiredScopes.length > 0) {
    const missing = requiredScopes.filter((s) => !scopes.includes(s));
    if (missing.length > 0) {
      return { valid: false, error: `missing_scopes: ${missing.join(", ")}` };
    }
  }
  const decodedToken = {
    sub: String(decoded.sub ?? ""),
    iss: decoded.iss != null ? String(decoded.iss) : void 0,
    aud: decoded.aud,
    exp,
    iat: decoded.iat != null ? Number(decoded.iat) : void 0,
    scopes,
    client_id: decoded.client_id != null ? String(decoded.client_id) : void 0,
    claims: decoded
  };
  return { valid: true, token: decodedToken };
}
function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader) return null;
  const parts = authorizationHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;
  return parts[1];
}
function buildOAuth2Metadata(config) {
  const metadata = {
    authorization_endpoint: config.authorizationEndpoint,
    token_endpoint: config.tokenEndpoint,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: config.clientSecret ? ["client_secret_post"] : ["none"]
  };
  if (config.issuer) metadata.issuer = config.issuer;
  if (config.scopes) metadata.scopes_supported = Object.keys(config.scopes);
  return metadata;
}
var OAuth2TokenError = class extends Error {
  constructor(message, errorCode, statusCode) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.name = "OAuth2TokenError";
  }
};
function base64urlEncode(bytes) {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64urlDecode2(str) {
  const padded = str + "=".repeat((4 - str.length % 4) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  return typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("utf-8");
}
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(base64urlDecode2(parts[1]));
  } catch {
    return null;
  }
}
function extractScopes(payload) {
  if (typeof payload.scope === "string") {
    return payload.scope.split(" ").filter(Boolean);
  }
  if (Array.isArray(payload.scopes)) return payload.scopes.map(String);
  if (Array.isArray(payload.scp)) return payload.scp.map(String);
  return [];
}

// src/oauth2-handler.ts
async function handleOAuth2(authorizationHeader, config) {
  const rawToken = extractBearerToken(authorizationHeader);
  if (!rawToken) {
    const realm = config.oauth2.issuer ?? "api";
    const scopeStr = config.requiredScopes?.join(" ");
    const wwwAuth = scopeStr ? `Bearer realm="${realm}", scope="${scopeStr}"` : `Bearer realm="${realm}"`;
    return {
      pass: false,
      status: 401,
      wwwAuthenticate: wwwAuth,
      envelope: formatError({
        code: "authentication_required",
        message: "Bearer token required. Obtain one via the OAuth2 authorization flow.",
        status: 401,
        docs_url: config.oauth2.authorizationEndpoint
      })
    };
  }
  let result;
  if (config.customValidator) {
    result = await config.customValidator(rawToken);
  } else {
    result = validateAccessToken(
      rawToken,
      config.oauth2,
      config.requiredScopes,
      config.clockSkewSeconds
    );
  }
  if (!result.valid) {
    const isExpiredOrInvalid = result.error === "token_expired" || result.error === "malformed_token" || result.error === "invalid_issuer" || result.error === "invalid_audience";
    const status = result.error?.startsWith("missing_scopes") ? 403 : 401;
    const code = status === 403 ? "insufficient_scope" : "invalid_token";
    const message = result.error?.startsWith("missing_scopes") ? `Insufficient scope. Required: ${config.requiredScopes?.join(", ")}` : `Invalid token: ${result.error}`;
    const realm = config.oauth2.issuer ?? "api";
    const wwwAuth = status === 403 ? `Bearer realm="${realm}", error="insufficient_scope", scope="${config.requiredScopes?.join(" ")}"` : `Bearer realm="${realm}", error="invalid_token"`;
    return {
      pass: false,
      status,
      wwwAuthenticate: wwwAuth,
      envelope: formatError({ code, message, status })
    };
  }
  return { pass: true, token: result.token };
}

// src/identity-handler.ts
async function extractAndVerifyToken(rawHeader, config) {
  if (!rawHeader) return null;
  const prefix = config.tokenPrefix ?? "Bearer";
  const token = rawHeader.startsWith(prefix + " ") ? rawHeader.slice(prefix.length + 1) : rawHeader;
  if (config.verifyToken) {
    return config.verifyToken(token);
  }
  const payload = decodeJwtClaims(token);
  if (!payload) return null;
  return extractClaims(payload);
}
async function handleRequireIdentity(rawHeader, config, context) {
  if (!rawHeader) {
    return {
      error: {
        status: 401,
        envelope: formatError({
          code: "agent_identity_required",
          message: "Agent identity token is required.",
          status: 401
        })
      }
    };
  }
  const claims = await extractAndVerifyToken(rawHeader, config);
  if (!claims) {
    return {
      error: {
        status: 401,
        envelope: formatError({
          code: config.verifyToken ? "verification_failed" : "malformed_token",
          message: config.verifyToken ? "Agent identity token verification failed." : "Agent identity token is malformed.",
          status: 401
        })
      }
    };
  }
  const validationError = validateClaims(claims, config);
  if (validationError) {
    const status = validationError.code === "expired_token" ? 401 : 403;
    return {
      error: {
        status,
        envelope: formatError({
          code: validationError.code,
          message: validationError.message,
          status
        })
      }
    };
  }
  if (config.policies && config.policies.length > 0) {
    const authzResult = evaluateAuthz(
      claims,
      context,
      config.policies,
      config.defaultPolicy
    );
    if (!authzResult.allowed) {
      return {
        error: {
          status: 403,
          envelope: formatError({
            code: "agent_unauthorized",
            message: authzResult.deniedReason ?? "Agent is not authorized.",
            status: 403
          })
        }
      };
    }
  }
  return { claims };
}
async function handleOptionalIdentity(rawHeader, config) {
  if (!rawHeader) return null;
  try {
    const claims = await extractAndVerifyToken(rawHeader, config);
    if (!claims) return null;
    const err = validateClaims(claims, config);
    if (err) return null;
    return claims;
  } catch {
    return null;
  }
}

// src/x402-handler.ts
async function handleX402(method, path, url, paymentSignatureHeader, config) {
  const facilitator = config.facilitator ?? new HttpFacilitatorClient(config.facilitatorUrl);
  const routeConfig = matchRoute(method, path, config.routes);
  if (!routeConfig) {
    return { action: "skip" };
  }
  if (!paymentSignatureHeader) {
    const paymentRequired = buildPaymentRequired(url, routeConfig);
    const encoded = encodePaymentRequired(paymentRequired);
    return {
      action: "payment_required",
      status: 402,
      headers: { [HEADER_PAYMENT_REQUIRED]: encoded },
      body: paymentRequired
    };
  }
  let payload;
  try {
    payload = decodePaymentPayload(paymentSignatureHeader);
  } catch {
    const paymentRequired = buildPaymentRequired(
      url,
      routeConfig,
      "Invalid payment signature format"
    );
    return {
      action: "payment_required",
      status: 402,
      headers: {
        [HEADER_PAYMENT_REQUIRED]: encodePaymentRequired(paymentRequired)
      },
      body: paymentRequired
    };
  }
  const requirements = buildRequirements(routeConfig);
  let verifyResult;
  try {
    verifyResult = await facilitator.verify(payload, requirements);
  } catch {
    return {
      action: "error",
      status: 502,
      body: {
        error: "payment_verification_failed",
        message: "Could not verify payment with facilitator"
      }
    };
  }
  if (!verifyResult.isValid) {
    const paymentRequired = buildPaymentRequired(
      url,
      routeConfig,
      verifyResult.invalidReason ?? "Payment verification failed"
    );
    return {
      action: "payment_required",
      status: 402,
      headers: {
        [HEADER_PAYMENT_REQUIRED]: encodePaymentRequired(paymentRequired)
      },
      body: paymentRequired
    };
  }
  let settleResult;
  try {
    settleResult = await facilitator.settle(payload, requirements);
  } catch {
    return {
      action: "error",
      status: 502,
      body: {
        error: "payment_settlement_failed",
        message: "Could not settle payment with facilitator"
      }
    };
  }
  if (!settleResult.success) {
    const paymentRequired = buildPaymentRequired(
      url,
      routeConfig,
      settleResult.errorReason ?? "Payment settlement failed"
    );
    return {
      action: "payment_required",
      status: 402,
      headers: {
        [HEADER_PAYMENT_REQUIRED]: encodePaymentRequired(paymentRequired)
      },
      body: paymentRequired
    };
  }
  const settlementResponse = Buffer.from(
    JSON.stringify(settleResult)
  ).toString("base64");
  return {
    action: "success",
    headers: { [HEADER_PAYMENT_RESPONSE]: settlementResponse },
    payment: payload,
    settlement: settleResult,
    requirements
  };
}

// src/x402-client.ts
function isPaymentRequired(response) {
  return response.status === 402;
}
function extractPaymentRequirements(response) {
  const header = response.headers.get(HEADER_PAYMENT_REQUIRED);
  if (!header) return null;
  try {
    return JSON.parse(Buffer.from(header, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}
function wrapFetchWithPayment(fetchFn, walletSigner) {
  return async (input, init) => {
    const response = await fetchFn(input, init);
    if (!isPaymentRequired(response)) {
      return response;
    }
    const requirements = extractPaymentRequirements(response);
    if (!requirements || requirements.accepts.length === 0) {
      return response;
    }
    const accepted = requirements.accepts[0];
    const payload = await walletSigner.sign(accepted);
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
    const headers = new Headers(init?.headers);
    headers.set(HEADER_PAYMENT_SIGNATURE, encoded);
    return fetchFn(input, { ...init, headers });
  };
}

// src/ag-ui.ts
import { randomUUID } from "crypto";
function encodeEvent(event) {
  const data = JSON.stringify(event);
  return `event: ${event.type}
data: ${data}

`;
}
function encodeEvents(events) {
  return events.map(encodeEvent).join("");
}
function createAgUiEmitter(write, options = {}) {
  const threadId = options.threadId ?? randomUUID();
  const runId = options.runId ?? randomUUID();
  let currentMessageId = null;
  let currentToolCallId = null;
  function emit(event) {
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }
    write(encodeEvent(event));
  }
  return {
    /** Emit raw event. */
    emit,
    /** Get current thread/run IDs. */
    get threadId() {
      return threadId;
    },
    get runId() {
      return runId;
    },
    // ── Lifecycle ──
    runStarted(parentRunId) {
      emit({ type: "RUN_STARTED", threadId, runId, parentRunId });
    },
    runFinished(result) {
      emit({ type: "RUN_FINISHED", threadId, runId, result });
    },
    runError(message, code) {
      emit({ type: "RUN_ERROR", message, code });
    },
    stepStarted(stepName) {
      emit({ type: "STEP_STARTED", stepName });
    },
    stepFinished(stepName) {
      emit({ type: "STEP_FINISHED", stepName });
    },
    // ── Text messages ──
    textStart(role = "assistant", messageId) {
      currentMessageId = messageId ?? randomUUID();
      emit({ type: "TEXT_MESSAGE_START", messageId: currentMessageId, role });
      return currentMessageId;
    },
    textDelta(delta, messageId) {
      const id = messageId ?? currentMessageId;
      if (!id) throw new Error("textDelta called without an active message. Call textStart() first.");
      emit({ type: "TEXT_MESSAGE_CONTENT", messageId: id, delta });
    },
    textEnd(messageId) {
      const id = messageId ?? currentMessageId;
      if (!id) throw new Error("textEnd called without an active message. Call textStart() first.");
      emit({ type: "TEXT_MESSAGE_END", messageId: id });
      if (id === currentMessageId) currentMessageId = null;
    },
    /**
     * Convenience: emit a complete text message (start + content + end).
     */
    textMessage(text, role = "assistant") {
      const id = randomUUID();
      emit({ type: "TEXT_MESSAGE_START", messageId: id, role });
      emit({ type: "TEXT_MESSAGE_CONTENT", messageId: id, delta: text });
      emit({ type: "TEXT_MESSAGE_END", messageId: id });
      return id;
    },
    // ── Tool calls ──
    toolCallStart(toolCallName, toolCallId, parentMessageId) {
      currentToolCallId = toolCallId ?? randomUUID();
      emit({ type: "TOOL_CALL_START", toolCallId: currentToolCallId, toolCallName, parentMessageId });
      return currentToolCallId;
    },
    toolCallArgs(delta, toolCallId) {
      const id = toolCallId ?? currentToolCallId;
      if (!id) throw new Error("toolCallArgs called without an active tool call. Call toolCallStart() first.");
      emit({ type: "TOOL_CALL_ARGS", toolCallId: id, delta });
    },
    toolCallEnd(toolCallId) {
      const id = toolCallId ?? currentToolCallId;
      if (!id) throw new Error("toolCallEnd called without an active tool call. Call toolCallStart() first.");
      emit({ type: "TOOL_CALL_END", toolCallId: id });
    },
    toolCallResult(result, toolCallId) {
      const id = toolCallId ?? currentToolCallId;
      if (!id) throw new Error("toolCallResult called without an active tool call.");
      emit({ type: "TOOL_CALL_RESULT", toolCallId: id, result });
      if (id === currentToolCallId) currentToolCallId = null;
    },
    // ── State ──
    stateSnapshot(snapshot) {
      emit({ type: "STATE_SNAPSHOT", snapshot });
    },
    stateDelta(delta) {
      emit({ type: "STATE_DELTA", delta });
    },
    // ── Custom ──
    custom(name, value) {
      emit({ type: "CUSTOM", name, value });
    }
  };
}
var AG_UI_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  "Connection": "keep-alive",
  "X-Accel-Buffering": "no"
  // Disable nginx buffering
};

// src/robots-txt.ts
var AI_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "Google-Extended",
  "Anthropic",
  "ClaudeBot",
  "CCBot",
  "Amazonbot",
  "Bytespider",
  "Applebot-Extended",
  "PerplexityBot",
  "Cohere-ai"
];
function generateRobotsTxt(config = {}) {
  const lines = [];
  if (config.rules) {
    for (const rule of config.rules) {
      lines.push(`User-agent: ${rule.userAgent}`);
      if (rule.allow) {
        for (const path of rule.allow) lines.push(`Allow: ${path}`);
      }
      if (rule.disallow) {
        for (const path of rule.disallow) lines.push(`Disallow: ${path}`);
      }
      if (rule.crawlDelay) {
        lines.push(`Crawl-delay: ${rule.crawlDelay}`);
      }
      lines.push("");
    }
  } else {
    lines.push("User-agent: *");
    lines.push("Allow: /");
    lines.push("");
  }
  const includeAi = config.includeAiAgents !== false;
  if (includeAi && !config.rules) {
    const policy = config.aiAgentPolicy ?? "allow";
    const aiAllow = config.aiAllow ?? ["/"];
    const aiDisallow = config.aiDisallow ?? [];
    for (const agent of AI_AGENTS) {
      lines.push(`User-agent: ${agent}`);
      if (policy === "allow") {
        for (const path of aiAllow) lines.push(`Allow: ${path}`);
        for (const path of aiDisallow) lines.push(`Disallow: ${path}`);
      } else {
        lines.push("Disallow: /");
      }
      lines.push("");
    }
  }
  if (config.sitemaps) {
    for (const sitemap of config.sitemaps) {
      lines.push(`Sitemap: ${sitemap}`);
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}

// src/security-headers.ts
function generateSecurityHeaders(config = {}) {
  const headers = {};
  const maxAge = config.hstsMaxAge ?? 31536e3;
  if (maxAge > 0) {
    const sub = config.hstsIncludeSubdomains !== false ? "; includeSubDomains" : "";
    headers["Strict-Transport-Security"] = `max-age=${maxAge}${sub}`;
  }
  if (config.contentTypeOptions !== false) {
    headers["X-Content-Type-Options"] = config.contentTypeOptions ?? "nosniff";
  }
  if (config.frameOptions !== false) {
    headers["X-Frame-Options"] = config.frameOptions ?? "DENY";
  }
  if (config.referrerPolicy !== false) {
    headers["Referrer-Policy"] = config.referrerPolicy ?? "strict-origin-when-cross-origin";
  }
  if (config.csp !== false) {
    headers["Content-Security-Policy"] = config.csp ?? "default-src 'self'";
  }
  if (config.permissionsPolicy) {
    headers["Permissions-Policy"] = config.permissionsPolicy;
  }
  return headers;
}
export {
  AG_UI_HEADERS,
  AI_AGENTS,
  AgentError,
  EventBuffer,
  HEADER_PAYMENT_REQUIRED,
  HEADER_PAYMENT_RESPONSE,
  HEADER_PAYMENT_SIGNATURE,
  HttpFacilitatorClient,
  MemoryApiKeyStore,
  MemoryStore,
  OAuth2TokenError,
  X402_VERSION,
  buildAuditEvent,
  buildAuthorizationUrl,
  buildErrorEnvelope,
  buildErrorResponse,
  buildInputSchema,
  buildNotFoundResponse,
  buildOAuth2Metadata,
  buildOauthDiscoveryDocument,
  buildPaymentRequired,
  buildRequirements,
  buildWwwAuthenticate,
  checkRequireAuth,
  computeCodeChallenge,
  createAgUiEmitter,
  createAnalytics,
  createApiKey,
  createRateLimiter,
  decodeJwtClaims,
  decodePaymentPayload,
  detectAgent,
  encodeEvent,
  encodeEvents,
  encodePaymentRequired,
  evaluateAuthz,
  exchangeCode,
  extractAndVerifyToken,
  extractBearerToken,
  extractClaims,
  extractPaymentRequirements,
  formatError,
  formatToolName,
  generateAIManifest,
  generateAgentCard,
  generateAgentsTxt,
  generateAllDiscovery,
  generateCodeVerifier,
  generateJsonLd,
  generateLlmsFullTxt,
  generateLlmsTxt,
  generatePKCE,
  generateRobotsTxt,
  generateSecurityHeaders,
  generateServerInfo,
  generateAgentsTxt2 as generateStandaloneAgentsTxt,
  generateToolDefinitions,
  generateUnifiedAIManifest,
  generateUnifiedAgentCard,
  generateUnifiedLlmsFullTxt,
  generateUnifiedLlmsTxt,
  handleJsonRpc,
  handleOAuth2,
  handleOptionalIdentity,
  handleRequireIdentity,
  handleX402,
  hasScope,
  isAgentAllowed,
  isFormatEnabled,
  isPaymentRequired,
  isSpiffeTrusted,
  matchRoute,
  notFoundError,
  parseAgentsTxt,
  parseSpiffeId,
  parseToolName,
  rateLimitError,
  refreshAccessToken,
  resolvePrice,
  validateAccessToken,
  validateAgentCard,
  validateApiKey,
  validateClaims,
  wrapFetchWithPayment
};
//# sourceMappingURL=index.js.map
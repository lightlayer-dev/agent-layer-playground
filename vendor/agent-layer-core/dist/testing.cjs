"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/testing.ts
var testing_exports = {};
__export(testing_exports, {
  baseIdentityConfig: () => baseIdentityConfig,
  makeCustomVerifier: () => makeCustomVerifier,
  makeJwt: () => makeJwt,
  testMcpConfig: () => testMcpConfig,
  testRoutes: () => testRoutes,
  validJwtPayload: () => validJwtPayload
});
module.exports = __toCommonJS(testing_exports);

// src/test-utils.ts
function makeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.nosig`;
}
var now = Math.floor(Date.now() / 1e3);
var validJwtPayload = {
  iss: "https://auth.example.com",
  sub: "spiffe://example.com/agent/test-bot",
  aud: "https://api.example.com",
  exp: now + 600,
  iat: now,
  scope: "read:data write:data"
};
var baseIdentityConfig = {
  trustedIssuers: ["https://auth.example.com"],
  audience: ["https://api.example.com"]
};
var testRoutes = [
  {
    method: "GET",
    path: "/api/users",
    summary: "List all users",
    parameters: [
      { name: "limit", in: "query", description: "Max results" }
    ]
  },
  {
    method: "POST",
    path: "/api/users",
    summary: "Create a user",
    parameters: [
      { name: "name", in: "body", required: true },
      { name: "email", in: "body", required: true }
    ]
  },
  {
    method: "GET",
    path: "/api/users/:id",
    summary: "Get user by ID",
    parameters: [{ name: "id", in: "path", required: true }]
  }
];
var testMcpConfig = {
  name: "test-api",
  version: "1.0.0",
  instructions: "Use these tools to manage users",
  routes: testRoutes
};
function makeCustomVerifier(claims) {
  return async () => {
    if (!claims) return null;
    return {
      agentId: claims.agentId ?? "custom-agent",
      issuer: claims.issuer ?? "https://auth.example.com",
      subject: claims.subject ?? "custom-agent",
      audience: claims.audience ?? ["https://api.example.com"],
      expiresAt: claims.expiresAt ?? now + 600,
      issuedAt: claims.issuedAt ?? now,
      scopes: claims.scopes ?? ["all"],
      delegated: claims.delegated ?? false,
      customClaims: claims.customClaims ?? {}
    };
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  baseIdentityConfig,
  makeCustomVerifier,
  makeJwt,
  testMcpConfig,
  testRoutes,
  validJwtPayload
});
//# sourceMappingURL=testing.cjs.map
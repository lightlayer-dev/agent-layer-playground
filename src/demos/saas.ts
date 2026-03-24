// ── SaaS Demo API ──
// Users, teams, and billing with full agent-readiness

import { Hono } from "hono";
import { attachAgentLayer } from "../shared/agent-layer";
import type { DemoConfig, McpToolDef, EndpointDef } from "../shared/types";

// ── Seed Data ──

const users = [
  { id: "usr-1", name: "Alice Chen", email: "alice@acme.io", role: "admin", teamId: "team-1", createdAt: "2024-01-15T08:00:00Z" },
  { id: "usr-2", name: "Bob Martinez", email: "bob@acme.io", role: "member", teamId: "team-1", createdAt: "2024-02-01T10:30:00Z" },
  { id: "usr-3", name: "Carol Johnson", email: "carol@acme.io", role: "member", teamId: "team-1", createdAt: "2024-02-10T14:00:00Z" },
  { id: "usr-4", name: "David Kim", email: "david@startup.co", role: "admin", teamId: "team-2", createdAt: "2024-03-05T09:00:00Z" },
  { id: "usr-5", name: "Eva Müller", email: "eva@startup.co", role: "member", teamId: "team-2", createdAt: "2024-03-10T11:00:00Z" },
  { id: "usr-6", name: "Frank Osei", email: "frank@bigcorp.com", role: "admin", teamId: "team-3", createdAt: "2024-04-01T08:00:00Z" },
  { id: "usr-7", name: "Grace Lee", email: "grace@bigcorp.com", role: "billing", teamId: "team-3", createdAt: "2024-04-05T09:00:00Z" },
  { id: "usr-8", name: "Hiroshi Tanaka", email: "hiroshi@bigcorp.com", role: "member", teamId: "team-3", createdAt: "2024-04-10T13:00:00Z" },
  { id: "usr-9", name: "Ines Santos", email: "ines@bigcorp.com", role: "member", teamId: "team-3", createdAt: "2024-05-01T10:00:00Z" },
  { id: "usr-10", name: "Jake Wilson", email: "jake@solo.dev", role: "admin", teamId: null, createdAt: "2024-06-15T16:00:00Z" },
];

const teams = [
  { id: "team-1", name: "Acme Engineering", plan: "pro", memberCount: 3, createdAt: "2024-01-10T08:00:00Z" },
  { id: "team-2", name: "Startup Labs", plan: "starter", memberCount: 2, createdAt: "2024-03-01T09:00:00Z" },
  { id: "team-3", name: "BigCorp DevOps", plan: "enterprise", memberCount: 4, createdAt: "2024-04-01T08:00:00Z" },
];
let teamCounter = 3;

const plans = [
  { id: "starter", name: "Starter", price: 9, interval: "month", features: ["5 users", "10GB storage", "Email support"], limits: { users: 5, storage: 10, apiCalls: 10000 } },
  { id: "pro", name: "Pro", price: 29, interval: "month", features: ["25 users", "100GB storage", "Priority support", "SSO"], limits: { users: 25, storage: 100, apiCalls: 100000 } },
  { id: "enterprise", name: "Enterprise", price: 99, interval: "month", features: ["Unlimited users", "1TB storage", "24/7 support", "SSO", "Audit logs", "Custom integrations"], limits: { users: -1, storage: 1000, apiCalls: 1000000 } },
];

const usage = {
  apiCalls: { used: 45230, limit: 100000, period: "2024-12" },
  storage: { used: 42.7, limit: 100, unit: "GB" },
  users: { active: 9, limit: 25 },
  bandwidth: { used: 128.5, limit: 500, unit: "GB" },
};

// ── Handlers ──

function listUsers() {
  return { ok: true, data: users, meta: { total: users.length } };
}

function getUser(args: Record<string, unknown>) {
  const u = users.find((u) => u.id === String(args.id));
  if (!u) return { ok: false, error: { code: "NOT_FOUND", message: `User ${args.id} not found` } };
  const team = teams.find((t) => t.id === u.teamId);
  return { ok: true, data: { ...u, team } };
}

function listTeams() {
  return { ok: true, data: teams, meta: { total: teams.length } };
}

function createTeam(args: Record<string, unknown>) {
  const name = String(args.name || "New Team");
  const plan = String(args.plan || "starter");
  if (!plans.find((p) => p.id === plan)) {
    return { ok: false, error: { code: "INVALID_PLAN", message: `Plan "${plan}" does not exist` } };
  }
  const team = { id: `team-${++teamCounter}`, name, plan, memberCount: 0, createdAt: new Date().toISOString() };
  teams.push(team);
  return { ok: true, data: team };
}

function listPlans() {
  return { ok: true, data: plans };
}

function getUsage() {
  return { ok: true, data: usage };
}

// ── Config ──

const tools: McpToolDef[] = [
  { name: "list_users", description: "List all users in the SaaS platform", inputSchema: { type: "object", properties: {} }, handler: listUsers },
  { name: "get_user", description: "Get a user by ID with team info", inputSchema: { type: "object", properties: { id: { type: "string", description: "User ID" } }, required: ["id"] }, handler: getUser },
  { name: "list_teams", description: "List all teams", inputSchema: { type: "object", properties: {} }, handler: listTeams },
  { name: "create_team", description: "Create a new team", inputSchema: { type: "object", properties: { name: { type: "string" }, plan: { type: "string", enum: ["starter", "pro", "enterprise"] } }, required: ["name"] }, handler: createTeam },
  { name: "list_billing_plans", description: "List available billing plans", inputSchema: { type: "object", properties: {} }, handler: listPlans },
  { name: "get_usage", description: "Get current usage statistics", inputSchema: { type: "object", properties: {} }, handler: getUsage },
];

const endpoints: EndpointDef[] = [
  { method: "GET", path: "/users", summary: "List users", description: "Returns all users in the platform." },
  { method: "GET", path: "/users/:id", summary: "Get user", description: "Returns a user with their team info.", parameters: [{ name: "id", in: "path", description: "User ID", required: true, schema: { type: "string" } }] },
  { method: "GET", path: "/teams", summary: "List teams", description: "Returns all teams." },
  { method: "POST", path: "/teams", summary: "Create team", description: "Creates a new team.", requestBody: { description: "Team to create", schema: { type: "object", properties: { name: { type: "string" }, plan: { type: "string" } }, required: ["name"] } } },
  { method: "GET", path: "/billing/plans", summary: "List billing plans", description: "Returns all available billing plans with features and limits." },
  { method: "GET", path: "/billing/usage", summary: "Get usage stats", description: "Returns current usage statistics for the account." },
];

const config: DemoConfig = {
  name: "SaaS Platform API",
  description: "User management, team organization, and billing demo",
  prefix: "/demo/saas",
  version: "1.0.0",
  tools,
  endpoints,
  skills: ["User Management", "Team Management", "Billing & Plans"],
};

// ── Build App ──

const app = new Hono();
attachAgentLayer(app, config);

app.get("/users", (c) => c.json(listUsers()));
app.get("/users/:id", (c) => c.json(getUser({ id: c.req.param("id") })));
app.get("/teams", (c) => c.json(listTeams()));
app.post("/teams", async (c) => c.json(createTeam(await c.req.json())));
app.get("/billing/plans", (c) => c.json(listPlans()));
app.get("/billing/usage", (c) => c.json(getUsage()));

export default app;

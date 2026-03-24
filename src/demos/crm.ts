// ── CRM Demo API ──
// Contacts, companies, deals, and activities with full agent-readiness

import { Hono } from "hono";
import { attachAgentLayer } from "../shared/agent-layer";
import type { DemoConfig, McpToolDef, EndpointDef } from "../shared/types";

// ── Seed Data ──

const contacts = [
  { id: "con-1", name: "Sarah Chen", email: "sarah@acmecorp.com", phone: "+1-415-555-0101", companyId: "comp-1", stage: "customer", value: 125000, lastContactedAt: "2024-11-20T14:00:00Z", createdAt: "2024-01-15T08:00:00Z" },
  { id: "con-2", name: "James Rodriguez", email: "james@techstart.io", phone: "+1-650-555-0102", companyId: "comp-2", stage: "lead", value: 50000, lastContactedAt: "2024-12-01T10:30:00Z", createdAt: "2024-02-01T10:30:00Z" },
  { id: "con-3", name: "Priya Patel", email: "priya@globalfin.com", phone: "+44-20-7946-0103", companyId: "comp-3", stage: "qualified", value: 300000, lastContactedAt: "2024-11-28T09:00:00Z", createdAt: "2024-02-10T14:00:00Z" },
  { id: "con-4", name: "Marcus Thompson", email: "marcus@retailmax.com", phone: "+1-212-555-0104", companyId: "comp-4", stage: "negotiation", value: 75000, lastContactedAt: "2024-12-05T16:00:00Z", createdAt: "2024-03-05T09:00:00Z" },
  { id: "con-5", name: "Yuki Tanaka", email: "yuki@designlab.jp", phone: "+81-3-5555-0105", companyId: "comp-5", stage: "lead", value: 40000, lastContactedAt: "2024-11-15T11:00:00Z", createdAt: "2024-03-10T11:00:00Z" },
  { id: "con-6", name: "Elena Volkov", email: "elena@cloudscape.eu", phone: "+49-30-555-0106", companyId: "comp-6", stage: "customer", value: 200000, lastContactedAt: "2024-12-10T08:00:00Z", createdAt: "2024-04-01T08:00:00Z" },
  { id: "con-7", name: "Daniel Okafor", email: "daniel@paybridge.ng", phone: "+234-1-555-0107", companyId: "comp-7", stage: "qualified", value: 90000, lastContactedAt: "2024-12-08T13:00:00Z", createdAt: "2024-04-05T09:00:00Z" },
  { id: "con-8", name: "Lisa Park", email: "lisa@healthnet.com", phone: "+1-310-555-0108", companyId: "comp-8", stage: "proposal", value: 175000, lastContactedAt: "2024-12-12T10:00:00Z", createdAt: "2024-05-01T10:00:00Z" },
  { id: "con-9", name: "Omar Hassan", email: "omar@logisticspro.ae", phone: "+971-4-555-0109", companyId: "comp-9", stage: "lead", value: 60000, lastContactedAt: null, createdAt: "2024-06-15T16:00:00Z" },
  { id: "con-10", name: "Anna Björk", email: "anna@nordicai.se", phone: "+46-8-555-0110", companyId: "comp-10", stage: "customer", value: 350000, lastContactedAt: "2024-12-14T09:30:00Z", createdAt: "2024-07-01T08:00:00Z" },
];

const companies = [
  { id: "comp-1", name: "Acme Corp", industry: "Technology", size: "enterprise", website: "https://acmecorp.com", revenue: 50000000, contactCount: 1 },
  { id: "comp-2", name: "TechStart", industry: "Technology", size: "startup", website: "https://techstart.io", revenue: 2000000, contactCount: 1 },
  { id: "comp-3", name: "Global Finance", industry: "Finance", size: "enterprise", website: "https://globalfin.com", revenue: 200000000, contactCount: 1 },
  { id: "comp-4", name: "RetailMax", industry: "Retail", size: "mid-market", website: "https://retailmax.com", revenue: 15000000, contactCount: 1 },
  { id: "comp-5", name: "DesignLab", industry: "Design", size: "startup", website: "https://designlab.jp", revenue: 1500000, contactCount: 1 },
  { id: "comp-6", name: "CloudScape", industry: "Technology", size: "mid-market", website: "https://cloudscape.eu", revenue: 30000000, contactCount: 1 },
  { id: "comp-7", name: "PayBridge", industry: "Finance", size: "startup", website: "https://paybridge.ng", revenue: 5000000, contactCount: 1 },
  { id: "comp-8", name: "HealthNet", industry: "Healthcare", size: "enterprise", website: "https://healthnet.com", revenue: 80000000, contactCount: 1 },
  { id: "comp-9", name: "LogisticsPro", industry: "Logistics", size: "mid-market", website: "https://logisticspro.ae", revenue: 20000000, contactCount: 1 },
  { id: "comp-10", name: "Nordic AI", industry: "Technology", size: "startup", website: "https://nordicai.se", revenue: 4000000, contactCount: 1 },
];

const deals = [
  { id: "deal-1", title: "Acme Enterprise License", contactId: "con-1", companyId: "comp-1", value: 125000, stage: "closed-won", probability: 100, expectedCloseDate: "2024-12-01", createdAt: "2024-06-01T08:00:00Z" },
  { id: "deal-2", title: "TechStart Pilot Program", contactId: "con-2", companyId: "comp-2", value: 50000, stage: "discovery", probability: 20, expectedCloseDate: "2025-03-15", createdAt: "2024-10-01T10:00:00Z" },
  { id: "deal-3", title: "Global Finance Platform Deal", contactId: "con-3", companyId: "comp-3", value: 300000, stage: "proposal", probability: 60, expectedCloseDate: "2025-02-01", createdAt: "2024-08-15T09:00:00Z" },
  { id: "deal-4", title: "RetailMax Integration", contactId: "con-4", companyId: "comp-4", value: 75000, stage: "negotiation", probability: 75, expectedCloseDate: "2025-01-15", createdAt: "2024-09-01T14:00:00Z" },
  { id: "deal-5", title: "DesignLab Starter", contactId: "con-5", companyId: "comp-5", value: 40000, stage: "lead", probability: 10, expectedCloseDate: "2025-06-01", createdAt: "2024-11-01T11:00:00Z" },
  { id: "deal-6", title: "CloudScape Renewal", contactId: "con-6", companyId: "comp-6", value: 200000, stage: "closed-won", probability: 100, expectedCloseDate: "2024-11-15", createdAt: "2024-07-01T08:00:00Z" },
  { id: "deal-7", title: "PayBridge API Access", contactId: "con-7", companyId: "comp-7", value: 90000, stage: "qualified", probability: 40, expectedCloseDate: "2025-04-01", createdAt: "2024-10-15T13:00:00Z" },
  { id: "deal-8", title: "HealthNet Suite", contactId: "con-8", companyId: "comp-8", value: 175000, stage: "proposal", probability: 55, expectedCloseDate: "2025-02-15", createdAt: "2024-09-15T10:00:00Z" },
];

const activities = [
  { id: "act-1", type: "email", contactId: "con-1", dealId: "deal-1", subject: "Contract signed — welcome aboard!", createdAt: "2024-11-20T14:00:00Z" },
  { id: "act-2", type: "call", contactId: "con-3", dealId: "deal-3", subject: "Discussed pricing tiers and implementation timeline", createdAt: "2024-11-28T09:00:00Z" },
  { id: "act-3", type: "meeting", contactId: "con-4", dealId: "deal-4", subject: "On-site demo with engineering team", createdAt: "2024-12-05T16:00:00Z" },
  { id: "act-4", type: "email", contactId: "con-8", dealId: "deal-8", subject: "Sent revised proposal with volume discount", createdAt: "2024-12-12T10:00:00Z" },
  { id: "act-5", type: "note", contactId: "con-2", dealId: "deal-2", subject: "Interested but waiting on Q1 budget approval", createdAt: "2024-12-01T10:30:00Z" },
  { id: "act-6", type: "call", contactId: "con-7", dealId: "deal-7", subject: "Technical deep-dive on API integration", createdAt: "2024-12-08T13:00:00Z" },
  { id: "act-7", type: "email", contactId: "con-10", dealId: null, subject: "Quarterly business review scheduled", createdAt: "2024-12-14T09:30:00Z" },
  { id: "act-8", type: "meeting", contactId: "con-6", dealId: "deal-6", subject: "Renewal kickoff — discussed expansion", createdAt: "2024-12-10T08:00:00Z" },
];
let dealCounter = 8;
let activityCounter = 8;

// ── Hono App ──

const app = new Hono();

// ── Contacts ──

app.get("/contacts", (c) => {
  const stage = c.req.query("stage");
  const company = c.req.query("company");
  const search = c.req.query("search");
  let result = [...contacts];
  if (stage) result = result.filter((x) => x.stage === stage);
  if (company) result = result.filter((x) => x.companyId === company);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter((x) => x.name.toLowerCase().includes(q) || x.email.toLowerCase().includes(q));
  }
  return c.json({ ok: true, data: result, total: result.length });
});

app.get("/contacts/:id", (c) => {
  const contact = contacts.find((x) => x.id === c.req.param("id"));
  if (!contact) return c.json({ ok: false, error: { code: "NOT_FOUND", message: "Contact not found" } }, 404);
  const company = companies.find((x) => x.id === contact.companyId);
  const contactDeals = deals.filter((x) => x.contactId === contact.id);
  const contactActivities = activities.filter((x) => x.contactId === contact.id);
  return c.json({ ok: true, data: { ...contact, company, deals: contactDeals, recentActivities: contactActivities.slice(0, 5) } });
});

// ── Companies ──

app.get("/companies", (c) => {
  const industry = c.req.query("industry");
  const size = c.req.query("size");
  let result = [...companies];
  if (industry) result = result.filter((x) => x.industry.toLowerCase() === industry.toLowerCase());
  if (size) result = result.filter((x) => x.size === size);
  return c.json({ ok: true, data: result, total: result.length });
});

app.get("/companies/:id", (c) => {
  const company = companies.find((x) => x.id === c.req.param("id"));
  if (!company) return c.json({ ok: false, error: { code: "NOT_FOUND", message: "Company not found" } }, 404);
  const companyContacts = contacts.filter((x) => x.companyId === company.id);
  const companyDeals = deals.filter((x) => x.companyId === company.id);
  return c.json({ ok: true, data: { ...company, contacts: companyContacts, deals: companyDeals } });
});

// ── Deals / Pipeline ──

app.get("/deals", (c) => {
  const stage = c.req.query("stage");
  const sort = c.req.query("sort");
  let result = [...deals];
  if (stage) result = result.filter((x) => x.stage === stage);
  if (sort === "value") result.sort((a, b) => b.value - a.value);
  if (sort === "probability") result.sort((a, b) => b.probability - a.probability);
  const totalValue = result.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = result.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
  return c.json({ ok: true, data: result, total: result.length, pipeline: { totalValue, weightedValue } });
});

app.post("/deals", async (c) => {
  const body = await c.req.json();
  if (!body.title || !body.contactId || !body.value) {
    return c.json({ ok: false, error: { code: "VALIDATION_ERROR", message: "title, contactId, and value are required" } }, 400);
  }
  dealCounter++;
  const deal = {
    id: `deal-${dealCounter}`,
    title: body.title,
    contactId: body.contactId,
    companyId: body.companyId || null,
    value: body.value,
    stage: body.stage || "lead",
    probability: body.probability || 10,
    expectedCloseDate: body.expectedCloseDate || null,
    createdAt: new Date().toISOString(),
  };
  deals.push(deal);
  return c.json({ ok: true, data: deal }, 201);
});

// ── Activities ──

app.get("/activities", (c) => {
  const contactId = c.req.query("contact");
  const dealId = c.req.query("deal");
  const type = c.req.query("type");
  let result = [...activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (contactId) result = result.filter((x) => x.contactId === contactId);
  if (dealId) result = result.filter((x) => x.dealId === dealId);
  if (type) result = result.filter((x) => x.type === type);
  return c.json({ ok: true, data: result, total: result.length });
});

app.post("/activities", async (c) => {
  const body = await c.req.json();
  if (!body.type || !body.contactId || !body.subject) {
    return c.json({ ok: false, error: { code: "VALIDATION_ERROR", message: "type, contactId, and subject are required" } }, 400);
  }
  activityCounter++;
  const activity = {
    id: `act-${activityCounter}`,
    type: body.type,
    contactId: body.contactId,
    dealId: body.dealId || null,
    subject: body.subject,
    createdAt: new Date().toISOString(),
  };
  activities.push(activity);
  return c.json({ ok: true, data: activity }, 201);
});

// ── Pipeline Summary ──

app.get("/pipeline", (c) => {
  const stages = ["lead", "discovery", "qualified", "proposal", "negotiation", "closed-won", "closed-lost"];
  const pipeline = stages.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    return {
      stage,
      count: stageDeals.length,
      totalValue: stageDeals.reduce((sum, d) => sum + d.value, 0),
      weightedValue: stageDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0),
    };
  });
  return c.json({ ok: true, data: pipeline });
});

// ── Helper handlers for MCP tools ──

function listContactsHandler(args: Record<string, unknown>) {
  let result = [...contacts];
  if (args.stage) result = result.filter((x) => x.stage === args.stage);
  if (args.company) result = result.filter((x) => x.companyId === args.company);
  if (args.search) {
    const q = String(args.search).toLowerCase();
    result = result.filter((x) => x.name.toLowerCase().includes(q) || x.email.toLowerCase().includes(q));
  }
  return { data: result, total: result.length };
}

function getContactHandler(args: Record<string, unknown>) {
  const contact = contacts.find((x) => x.id === args.id);
  if (!contact) return { error: "Contact not found" };
  const company = companies.find((x) => x.id === contact.companyId);
  const contactDeals = deals.filter((x) => x.contactId === contact.id);
  return { data: { ...contact, company, deals: contactDeals } };
}

function listCompaniesHandler(args: Record<string, unknown>) {
  let result = [...companies];
  if (args.industry) result = result.filter((x) => x.industry.toLowerCase() === String(args.industry).toLowerCase());
  if (args.size) result = result.filter((x) => x.size === args.size);
  return { data: result, total: result.length };
}

function listDealsHandler(args: Record<string, unknown>) {
  let result = [...deals];
  if (args.stage) result = result.filter((x) => x.stage === args.stage);
  if (args.sort === "value") result.sort((a, b) => b.value - a.value);
  if (args.sort === "probability") result.sort((a, b) => b.probability - a.probability);
  const totalValue = result.reduce((sum, d) => sum + d.value, 0);
  return { data: result, total: result.length, pipeline: { totalValue } };
}

function getPipelineHandler() {
  const stages = ["lead", "discovery", "qualified", "proposal", "negotiation", "closed-won", "closed-lost"];
  return { data: stages.map((stage) => {
    const sd = deals.filter((d) => d.stage === stage);
    return { stage, count: sd.length, totalValue: sd.reduce((s, d) => s + d.value, 0) };
  })};
}

function listActivitiesHandler(args: Record<string, unknown>) {
  let result = [...activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (args.contact) result = result.filter((x) => x.contactId === args.contact);
  if (args.deal) result = result.filter((x) => x.dealId === args.deal);
  if (args.type) result = result.filter((x) => x.type === args.type);
  return { data: result, total: result.length };
}

// ── Agent Layer config ──

const tools: McpToolDef[] = [
  {
    name: "list_contacts", description: "List and search CRM contacts. Filter by stage, company, or search by name/email.",
    inputSchema: { type: "object", properties: {
      stage: { type: "string", description: "Filter by stage (lead, qualified, customer, etc.)" },
      company: { type: "string", description: "Filter by company ID" },
      search: { type: "string", description: "Search by name or email" },
    }},
    handler: listContactsHandler,
  },
  {
    name: "get_contact", description: "Get detailed info on a contact including company, deals, and activities.",
    inputSchema: { type: "object", properties: { id: { type: "string", description: "Contact ID" } }, required: ["id"] },
    handler: getContactHandler,
  },
  {
    name: "list_companies", description: "List companies. Filter by industry or size.",
    inputSchema: { type: "object", properties: {
      industry: { type: "string", description: "Filter by industry (Technology, Finance, etc.)" },
      size: { type: "string", description: "Filter by size (startup, mid-market, enterprise)" },
    }},
    handler: listCompaniesHandler,
  },
  {
    name: "list_deals", description: "List deals in pipeline. Filter by stage, sort by value or probability.",
    inputSchema: { type: "object", properties: {
      stage: { type: "string", description: "Pipeline stage filter" },
      sort: { type: "string", enum: ["value", "probability"], description: "Sort order" },
    }},
    handler: listDealsHandler,
  },
  {
    name: "get_pipeline", description: "Get pipeline summary — deal count and value by stage.",
    inputSchema: { type: "object", properties: {} },
    handler: getPipelineHandler,
  },
  {
    name: "list_activities", description: "List activities (calls, emails, meetings, notes). Filter by contact, deal, or type.",
    inputSchema: { type: "object", properties: {
      contact: { type: "string", description: "Filter by contact ID" },
      deal: { type: "string", description: "Filter by deal ID" },
      type: { type: "string", enum: ["email", "call", "meeting", "note"], description: "Activity type" },
    }},
    handler: listActivitiesHandler,
  },
];

const endpoints: EndpointDef[] = [
  { method: "GET", path: "/contacts", summary: "List/search contacts", description: "Returns contacts, filterable by stage, company, or search query.", parameters: [
    { name: "stage", in: "query", description: "Pipeline stage filter", schema: { type: "string" } },
    { name: "company", in: "query", description: "Company ID filter", schema: { type: "string" } },
    { name: "search", in: "query", description: "Search by name/email", schema: { type: "string" } },
  ]},
  { method: "GET", path: "/contacts/:id", summary: "Get contact details", description: "Returns contact with company, deals, and recent activities.", parameters: [
    { name: "id", in: "path", description: "Contact ID", required: true, schema: { type: "string" } },
  ]},
  { method: "GET", path: "/companies", summary: "List companies", description: "Returns companies, filterable by industry and size.", parameters: [
    { name: "industry", in: "query", description: "Industry filter", schema: { type: "string" } },
    { name: "size", in: "query", description: "Company size filter", schema: { type: "string" } },
  ]},
  { method: "GET", path: "/companies/:id", summary: "Get company", description: "Returns company with its contacts and deals.", parameters: [
    { name: "id", in: "path", description: "Company ID", required: true, schema: { type: "string" } },
  ]},
  { method: "GET", path: "/deals", summary: "List deals", description: "Returns deals in pipeline, filterable by stage.", parameters: [
    { name: "stage", in: "query", description: "Stage filter", schema: { type: "string" } },
    { name: "sort", in: "query", description: "Sort by value or probability", schema: { type: "string" } },
  ]},
  { method: "POST", path: "/deals", summary: "Create deal", description: "Create a new deal. Requires title, contactId, and value." },
  { method: "GET", path: "/pipeline", summary: "Pipeline summary", description: "Returns deal count and total value by pipeline stage." },
  { method: "GET", path: "/activities", summary: "List activities", description: "Returns activities, filterable by contact, deal, or type.", parameters: [
    { name: "contact", in: "query", description: "Contact ID filter", schema: { type: "string" } },
    { name: "deal", in: "query", description: "Deal ID filter", schema: { type: "string" } },
    { name: "type", in: "query", description: "Activity type filter", schema: { type: "string" } },
  ]},
  { method: "POST", path: "/activities", summary: "Log activity", description: "Log a call, email, meeting, or note against a contact." },
];

const config: DemoConfig = {
  name: "CRM API",
  description: "Customer relationship management — contacts, companies, deals, pipeline, and activity tracking.",
  prefix: "/demo/crm",
  version: "1.0.0",
  tools,
  endpoints,
  skills: ["Contact Management", "Deal Pipeline", "Activity Tracking", "Pipeline Analytics"],
};

attachAgentLayer(app, config);

export { app as crmApp };

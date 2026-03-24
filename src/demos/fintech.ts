// ── Fintech Demo API ──
// Accounts, transactions, and balance with full agent-readiness

import { Hono } from "hono";
import { attachAgentLayer } from "../shared/agent-layer";
import type { DemoConfig, McpToolDef, EndpointDef } from "../shared/types";

// ── Seed Data ──

const accounts = [
  { id: "acc-1", name: "Main Checking", type: "checking", currency: "USD", balance: 12450.67, status: "active", createdAt: "2023-01-15T08:00:00Z" },
  { id: "acc-2", name: "Savings", type: "savings", currency: "USD", balance: 45200.00, status: "active", createdAt: "2023-01-15T08:00:00Z" },
  { id: "acc-3", name: "Business Account", type: "checking", currency: "USD", balance: 87320.45, status: "active", createdAt: "2023-06-01T10:00:00Z" },
  { id: "acc-4", name: "EUR Travel Fund", type: "savings", currency: "EUR", balance: 3200.00, status: "active", createdAt: "2024-03-10T09:00:00Z" },
  { id: "acc-5", name: "Old Account", type: "checking", currency: "USD", balance: 0, status: "closed", createdAt: "2020-05-20T12:00:00Z" },
];

const transactions: { id: string; accountId: string; type: string; amount: number; currency: string; description: string; category: string; date: string; status: string }[] = [
  { id: "txn-1", accountId: "acc-1", type: "debit", amount: 42.50, currency: "USD", description: "Grocery Store", category: "groceries", date: "2024-12-20T14:30:00Z", status: "completed" },
  { id: "txn-2", accountId: "acc-1", type: "debit", amount: 9.99, currency: "USD", description: "Netflix Subscription", category: "entertainment", date: "2024-12-19T00:00:00Z", status: "completed" },
  { id: "txn-3", accountId: "acc-1", type: "credit", amount: 3500.00, currency: "USD", description: "Salary Deposit", category: "income", date: "2024-12-15T08:00:00Z", status: "completed" },
  { id: "txn-4", accountId: "acc-1", type: "debit", amount: 1200.00, currency: "USD", description: "Rent Payment", category: "housing", date: "2024-12-01T09:00:00Z", status: "completed" },
  { id: "txn-5", accountId: "acc-1", type: "debit", amount: 65.00, currency: "USD", description: "Electric Bill", category: "utilities", date: "2024-12-05T10:00:00Z", status: "completed" },
  { id: "txn-6", accountId: "acc-1", type: "debit", amount: 28.90, currency: "USD", description: "Gas Station", category: "transport", date: "2024-12-18T16:00:00Z", status: "completed" },
  { id: "txn-7", accountId: "acc-1", type: "debit", amount: 89.99, currency: "USD", description: "Online Shopping", category: "shopping", date: "2024-12-17T20:00:00Z", status: "completed" },
  { id: "txn-8", accountId: "acc-1", type: "credit", amount: 150.00, currency: "USD", description: "Refund - Amazon", category: "shopping", date: "2024-12-16T12:00:00Z", status: "completed" },
  { id: "txn-9", accountId: "acc-2", type: "credit", amount: 500.00, currency: "USD", description: "Auto-Save Transfer", category: "savings", date: "2024-12-15T08:01:00Z", status: "completed" },
  { id: "txn-10", accountId: "acc-2", type: "credit", amount: 500.00, currency: "USD", description: "Auto-Save Transfer", category: "savings", date: "2024-11-15T08:01:00Z", status: "completed" },
  { id: "txn-11", accountId: "acc-2", type: "credit", amount: 2000.00, currency: "USD", description: "Bonus Deposit", category: "income", date: "2024-12-20T09:00:00Z", status: "completed" },
  { id: "txn-12", accountId: "acc-3", type: "credit", amount: 15000.00, currency: "USD", description: "Client Payment - Acme Corp", category: "income", date: "2024-12-10T10:00:00Z", status: "completed" },
  { id: "txn-13", accountId: "acc-3", type: "debit", amount: 4500.00, currency: "USD", description: "Contractor Payment", category: "business", date: "2024-12-12T11:00:00Z", status: "completed" },
  { id: "txn-14", accountId: "acc-3", type: "debit", amount: 299.00, currency: "USD", description: "Cloud Hosting", category: "business", date: "2024-12-01T00:00:00Z", status: "completed" },
  { id: "txn-15", accountId: "acc-3", type: "debit", amount: 49.99, currency: "USD", description: "SaaS Subscription", category: "business", date: "2024-12-01T00:00:00Z", status: "completed" },
  { id: "txn-16", accountId: "acc-3", type: "credit", amount: 8500.00, currency: "USD", description: "Client Payment - StartupCo", category: "income", date: "2024-12-18T14:00:00Z", status: "completed" },
  { id: "txn-17", accountId: "acc-3", type: "debit", amount: 1200.00, currency: "USD", description: "Office Supplies", category: "business", date: "2024-12-15T13:00:00Z", status: "completed" },
  { id: "txn-18", accountId: "acc-3", type: "debit", amount: 250.00, currency: "USD", description: "Business Insurance", category: "business", date: "2024-12-01T08:00:00Z", status: "completed" },
  { id: "txn-19", accountId: "acc-4", type: "credit", amount: 500.00, currency: "EUR", description: "EUR Transfer", category: "transfer", date: "2024-12-10T09:00:00Z", status: "completed" },
  { id: "txn-20", accountId: "acc-4", type: "debit", amount: 120.00, currency: "EUR", description: "Hotel Booking", category: "travel", date: "2024-12-15T11:00:00Z", status: "completed" },
  { id: "txn-21", accountId: "acc-1", type: "debit", amount: 15.50, currency: "USD", description: "Coffee Shop", category: "food", date: "2024-12-21T07:30:00Z", status: "completed" },
  { id: "txn-22", accountId: "acc-1", type: "debit", amount: 55.00, currency: "USD", description: "Gym Membership", category: "health", date: "2024-12-01T00:00:00Z", status: "completed" },
  { id: "txn-23", accountId: "acc-3", type: "credit", amount: 3200.00, currency: "USD", description: "Consulting Fee", category: "income", date: "2024-12-22T10:00:00Z", status: "completed" },
  { id: "txn-24", accountId: "acc-1", type: "debit", amount: 120.00, currency: "USD", description: "Phone Bill", category: "utilities", date: "2024-12-10T09:00:00Z", status: "completed" },
  { id: "txn-25", accountId: "acc-1", type: "debit", amount: 34.99, currency: "USD", description: "Spotify + Hulu Bundle", category: "entertainment", date: "2024-12-01T00:00:00Z", status: "completed" },
  { id: "txn-26", accountId: "acc-2", type: "debit", amount: 1000.00, currency: "USD", description: "Emergency Fund Transfer", category: "transfer", date: "2024-12-08T15:00:00Z", status: "completed" },
  { id: "txn-27", accountId: "acc-3", type: "debit", amount: 89.00, currency: "USD", description: "Domain Renewals", category: "business", date: "2024-12-05T09:00:00Z", status: "completed" },
  { id: "txn-28", accountId: "acc-4", type: "debit", amount: 45.00, currency: "EUR", description: "Museum Tickets", category: "travel", date: "2024-12-18T14:00:00Z", status: "completed" },
  { id: "txn-29", accountId: "acc-1", type: "credit", amount: 200.00, currency: "USD", description: "Freelance Payment", category: "income", date: "2024-12-22T16:00:00Z", status: "pending" },
  { id: "txn-30", accountId: "acc-3", type: "debit", amount: 2400.00, currency: "USD", description: "Tax Payment Q4", category: "taxes", date: "2024-12-20T08:00:00Z", status: "pending" },
];

let txnCounter = 30;

// ── Handlers ──

function listAccounts() {
  return { ok: true, data: accounts.filter((a) => a.status === "active"), meta: { total: accounts.filter((a) => a.status === "active").length } };
}

function getAccount(args: Record<string, unknown>) {
  const a = accounts.find((a) => a.id === String(args.id));
  if (!a) return { ok: false, error: { code: "NOT_FOUND", message: `Account ${args.id} not found` } };
  const acctTxns = transactions.filter((t) => t.accountId === a.id).slice(-5);
  return { ok: true, data: { ...a, recentTransactions: acctTxns } };
}

function listTransactions(args: Record<string, unknown>) {
  let result = [...transactions];
  if (args.account) result = result.filter((t) => t.accountId === String(args.account));
  if (args.type) result = result.filter((t) => t.type === String(args.type));
  if (args.category) result = result.filter((t) => t.category === String(args.category));
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return { ok: true, data: result, meta: { total: result.length } };
}

function createTransaction(args: Record<string, unknown>) {
  const accountId = String(args.accountId);
  const account = accounts.find((a) => a.id === accountId);
  if (!account) return { ok: false, error: { code: "NOT_FOUND", message: `Account ${accountId} not found` } };
  if (account.status !== "active") return { ok: false, error: { code: "INACTIVE_ACCOUNT", message: "Account is not active" } };

  const type = String(args.type || "debit");
  const amount = Number(args.amount);
  if (!amount || amount <= 0) return { ok: false, error: { code: "INVALID_AMOUNT", message: "Amount must be positive" } };

  if (type === "debit" && account.balance < amount) {
    return { ok: false, error: { code: "INSUFFICIENT_FUNDS", message: `Insufficient funds. Available: ${account.balance}` } };
  }

  const txn = {
    id: `txn-${++txnCounter}`,
    accountId,
    type,
    amount,
    currency: account.currency,
    description: String(args.description || ""),
    category: String(args.category || "other"),
    date: new Date().toISOString(),
    status: "completed",
  };

  transactions.push(txn);
  account.balance += type === "credit" ? amount : -amount;
  account.balance = Math.round(account.balance * 100) / 100;

  return { ok: true, data: txn };
}

function getBalance() {
  const active = accounts.filter((a) => a.status === "active");
  const byAccount = active.map((a) => ({ id: a.id, name: a.name, balance: a.balance, currency: a.currency }));
  const totalUSD = active.filter((a) => a.currency === "USD").reduce((sum, a) => sum + a.balance, 0);
  return { ok: true, data: { accounts: byAccount, totalUSD: Math.round(totalUSD * 100) / 100 } };
}

// ── Config ──

const tools: McpToolDef[] = [
  { name: "list_accounts", description: "List all active bank accounts", inputSchema: { type: "object", properties: {} }, handler: listAccounts },
  { name: "get_account", description: "Get account details with recent transactions", inputSchema: { type: "object", properties: { id: { type: "string", description: "Account ID" } }, required: ["id"] }, handler: getAccount },
  { name: "list_transactions", description: "List transactions with optional filters", inputSchema: { type: "object", properties: { account: { type: "string", description: "Filter by account ID" }, type: { type: "string", enum: ["credit", "debit"], description: "Filter by type" }, category: { type: "string", description: "Filter by category" } } }, handler: listTransactions },
  { name: "create_transaction", description: "Create a new transaction (debit or credit)", inputSchema: { type: "object", properties: { accountId: { type: "string" }, type: { type: "string", enum: ["credit", "debit"] }, amount: { type: "number" }, description: { type: "string" }, category: { type: "string" } }, required: ["accountId", "type", "amount"] }, handler: createTransaction },
  { name: "get_balance", description: "Get balance summary across all accounts", inputSchema: { type: "object", properties: {} }, handler: getBalance },
];

const endpoints: EndpointDef[] = [
  { method: "GET", path: "/accounts", summary: "List accounts", description: "Returns all active bank accounts." },
  { method: "GET", path: "/accounts/:id", summary: "Get account", description: "Returns account details with recent transactions.", parameters: [{ name: "id", in: "path", description: "Account ID", required: true, schema: { type: "string" } }] },
  { method: "GET", path: "/transactions", summary: "List transactions", description: "Returns transactions, filterable by account, type, and category.", parameters: [{ name: "account", in: "query", description: "Account ID filter", schema: { type: "string" } }, { name: "type", in: "query", description: "credit or debit", schema: { type: "string" } }, { name: "category", in: "query", description: "Category filter", schema: { type: "string" } }] },
  { method: "POST", path: "/transactions", summary: "Create transaction", description: "Creates a new transaction.", requestBody: { description: "Transaction details", schema: { type: "object", properties: { accountId: { type: "string" }, type: { type: "string" }, amount: { type: "number" }, description: { type: "string" }, category: { type: "string" } }, required: ["accountId", "type", "amount"] } } },
  { method: "GET", path: "/balance", summary: "Get balance", description: "Returns balance summary across all active accounts." },
];

const config: DemoConfig = {
  name: "Fintech Banking API",
  description: "Bank accounts, transactions, and balance management demo",
  prefix: "/demo/fintech",
  version: "1.0.0",
  tools,
  endpoints,
  skills: ["Account Management", "Transaction Processing", "Balance Reporting"],
};

// ── Build App ──

const app = new Hono();
attachAgentLayer(app, config);

app.get("/accounts", (c) => c.json(listAccounts()));
app.get("/accounts/:id", (c) => c.json(getAccount({ id: c.req.param("id") })));
app.get("/transactions", (c) => c.json(listTransactions({ account: c.req.query("account"), type: c.req.query("type"), category: c.req.query("category") })));
app.post("/transactions", async (c) => c.json(createTransaction(await c.req.json())));
app.get("/balance", (c) => c.json(getBalance()));

export default app;

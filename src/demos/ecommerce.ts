// ── E-Commerce Demo API ──
// Products, cart, and orders with full agent-readiness

import { Hono } from "hono";
import { attachAgentLayer } from "../shared/agent-layer";
import type { DemoConfig, McpToolDef, EndpointDef } from "../shared/types";

// ── Seed Data ──

const products = [
  { id: "prod-1", name: "Wireless Earbuds Pro", category: "electronics", price: 79.99, stock: 142, description: "Premium noise-cancelling earbuds with 30h battery" },
  { id: "prod-2", name: "USB-C Hub 7-in-1", category: "electronics", price: 49.99, stock: 88, description: "Aluminum hub with HDMI, USB-A, SD card reader" },
  { id: "prod-3", name: "Mechanical Keyboard", category: "electronics", price: 129.99, stock: 56, description: "Cherry MX Brown switches, RGB backlit, hot-swappable" },
  { id: "prod-4", name: "4K Webcam", category: "electronics", price: 89.99, stock: 73, description: "Auto-focus webcam with built-in ring light" },
  { id: "prod-5", name: "Portable SSD 1TB", category: "electronics", price: 109.99, stock: 201, description: "NVMe external drive, 1050MB/s read speed" },
  { id: "prod-6", name: "Classic Oxford Shirt", category: "clothing", price: 59.99, stock: 320, description: "100% cotton, wrinkle-resistant, slim fit" },
  { id: "prod-7", name: "Merino Wool Sweater", category: "clothing", price: 89.99, stock: 145, description: "Lightweight merino, anti-odor, machine washable" },
  { id: "prod-8", name: "Running Shorts", category: "clothing", price: 34.99, stock: 500, description: "Quick-dry fabric with zippered pocket" },
  { id: "prod-9", name: "Denim Jacket", category: "clothing", price: 79.99, stock: 92, description: "Vintage wash, stretch denim, trucker style" },
  { id: "prod-10", name: "Canvas Sneakers", category: "clothing", price: 44.99, stock: 230, description: "Classic low-top, cushioned insole" },
  { id: "prod-11", name: "Pour-Over Coffee Set", category: "home", price: 39.99, stock: 175, description: "Ceramic dripper, glass carafe, 40 filters included" },
  { id: "prod-12", name: "Cast Iron Skillet 12\"", category: "home", price: 54.99, stock: 89, description: "Pre-seasoned, oven-safe to 500°F" },
  { id: "prod-13", name: "Bamboo Desk Organizer", category: "home", price: 29.99, stock: 310, description: "5-compartment organizer with phone stand" },
  { id: "prod-14", name: "LED Desk Lamp", category: "home", price: 44.99, stock: 156, description: "Touch dimming, USB charging port, adjustable arm" },
  { id: "prod-15", name: "Weighted Blanket 15lb", category: "home", price: 69.99, stock: 67, description: "Glass bead filling, breathable cotton cover" },
];

let cart: { productId: string; quantity: number }[] = [];
let orders: { id: string; items: typeof cart; total: number; status: string; createdAt: string }[] = [];
let orderCounter = 0;

// ── Tool Handlers (reusable by both routes and MCP) ──

function listProducts(args: Record<string, unknown>) {
  let result = [...products];
  if (args.search) {
    const q = String(args.search).toLowerCase();
    result = result.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }
  if (args.category) {
    result = result.filter((p) => p.category === String(args.category));
  }
  return { ok: true, data: result, meta: { total: result.length } };
}

function getProduct(args: Record<string, unknown>) {
  const p = products.find((p) => p.id === String(args.id));
  if (!p) return { ok: false, error: { code: "NOT_FOUND", message: `Product ${args.id} not found` } };
  return { ok: true, data: p };
}

function addToCart(args: Record<string, unknown>) {
  const productId = String(args.productId);
  const quantity = Number(args.quantity) || 1;
  const product = products.find((p) => p.id === productId);
  if (!product) return { ok: false, error: { code: "NOT_FOUND", message: `Product ${productId} not found` } };
  const existing = cart.find((i) => i.productId === productId);
  if (existing) existing.quantity += quantity;
  else cart.push({ productId, quantity });
  return { ok: true, data: { message: "Added to cart", cart } };
}

function viewCart() {
  const items = cart.map((i) => {
    const p = products.find((p) => p.id === i.productId);
    return { ...i, product: p, subtotal: (p?.price ?? 0) * i.quantity };
  });
  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  return { ok: true, data: { items, total: Math.round(total * 100) / 100 } };
}

function createOrder() {
  if (cart.length === 0) return { ok: false, error: { code: "EMPTY_CART", message: "Cart is empty" } };
  const total = cart.reduce((sum, i) => {
    const p = products.find((p) => p.id === i.productId);
    return sum + (p?.price ?? 0) * i.quantity;
  }, 0);
  const order = {
    id: `ord-${++orderCounter}`,
    items: [...cart],
    total: Math.round(total * 100) / 100,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  cart = [];
  return { ok: true, data: order };
}

function listOrders() {
  return { ok: true, data: orders, meta: { total: orders.length } };
}

// ── Config ──

const tools: McpToolDef[] = [
  {
    name: "list_products",
    description: "List products with optional search and category filter",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search query for product name/description" },
        category: { type: "string", enum: ["electronics", "clothing", "home"], description: "Filter by category" },
      },
    },
    handler: listProducts,
  },
  {
    name: "get_product",
    description: "Get a single product by ID",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Product ID (e.g. prod-1)" } },
      required: ["id"],
    },
    handler: getProduct,
  },
  {
    name: "add_to_cart",
    description: "Add a product to the shopping cart",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Product ID to add" },
        quantity: { type: "number", description: "Quantity (default 1)" },
      },
      required: ["productId"],
    },
    handler: addToCart,
  },
  {
    name: "view_cart",
    description: "View the current shopping cart contents and total",
    inputSchema: { type: "object", properties: {} },
    handler: viewCart,
  },
  {
    name: "create_order",
    description: "Create an order from the current cart contents",
    inputSchema: { type: "object", properties: {} },
    handler: createOrder,
  },
  {
    name: "list_orders",
    description: "List all orders",
    inputSchema: { type: "object", properties: {} },
    handler: listOrders,
  },
];

const endpoints: EndpointDef[] = [
  {
    method: "GET", path: "/products", summary: "List products",
    description: "Returns all products, filterable by search query and category.",
    parameters: [
      { name: "search", in: "query", description: "Search term", schema: { type: "string" } },
      { name: "category", in: "query", description: "Category filter", schema: { type: "string", enum: ["electronics", "clothing", "home"] } },
    ],
  },
  {
    method: "GET", path: "/products/:id", summary: "Get product",
    description: "Returns a single product by its ID.",
    parameters: [{ name: "id", in: "path", description: "Product ID", required: true, schema: { type: "string" } }],
  },
  {
    method: "POST", path: "/cart", summary: "Add to cart",
    description: "Adds a product to the shopping cart.",
    requestBody: {
      description: "Product to add",
      schema: { type: "object", properties: { productId: { type: "string" }, quantity: { type: "number" } }, required: ["productId"] },
    },
  },
  { method: "GET", path: "/cart", summary: "View cart", description: "Returns current cart contents with totals." },
  { method: "POST", path: "/orders", summary: "Create order", description: "Creates an order from the current cart and clears the cart." },
  { method: "GET", path: "/orders", summary: "List orders", description: "Returns all orders." },
];

const config: DemoConfig = {
  name: "E-Commerce API",
  description: "Product catalog, shopping cart, and order management demo",
  prefix: "/demo/ecommerce",
  version: "1.0.0",
  tools,
  endpoints,
  skills: ["Product Search", "Shopping Cart", "Order Management"],
};

// ── Build Hono App ──

const app = new Hono();

// Attach agent-layer features
attachAgentLayer(app, config);

// ── REST Endpoints ──

app.get("/products", (c) => {
  const search = c.req.query("search");
  const category = c.req.query("category");
  return c.json(listProducts({ search, category }));
});

app.get("/products/:id", (c) => {
  return c.json(getProduct({ id: c.req.param("id") }));
});

app.post("/cart", async (c) => {
  const body = await c.req.json();
  return c.json(addToCart(body));
});

app.get("/cart", (c) => {
  return c.json(viewCart());
});

app.post("/orders", (c) => {
  return c.json(createOrder());
});

app.get("/orders", (c) => {
  return c.json(listOrders());
});

export default app;

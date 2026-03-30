/**
 * E-Commerce API — Express + agent-layer
 *
 * Run:
 *   npm i express @agent-layer/core @agent-layer/express
 *   npx tsx ecommerce-express.ts
 *
 * Then visit:
 *   http://localhost:3000/products
 *   http://localhost:3000/llms.txt
 *   http://localhost:3000/.well-known/ai
 *   http://localhost:3000/.well-known/agent.json
 */

import express, { Request, Response } from "express";
import { agentLayer } from "@agent-layer/express";

const app = express();
app.use(express.json());

// One line — adds llms.txt, agents.txt, discovery, A2A, rate limits, structured errors
app.use(
  agentLayer({
    errors: true,
    rateLimit: { max: 100, windowMs: 60_000 },
    llmsTxt: {
      title: "E-Commerce API",
      description: "Browse products, manage a shopping cart, and place orders.",
    },
    agentsTxt: {
      rules: [{ agent: "*", allow: ["/products", "/cart", "/orders"] }],
    },
    discovery: {
      manifest: {
        name: "E-Commerce API",
        description: "Products, cart, and orders",
      },
    },
    a2a: {
      card: {
        name: "E-Commerce",
        description: "Shop for products and manage orders",
        skills: [
          { id: "browse", name: "Browse Products", description: "Search and filter products" },
          { id: "order", name: "Place Orders", description: "Add to cart and checkout" },
        ],
      },
    },
  })
);

// --- Demo data ---
const products = [
  { id: "1", name: "Wireless Headphones", price: 79.99, category: "electronics" },
  { id: "2", name: "Running Shoes", price: 129.99, category: "sports" },
  { id: "3", name: "Coffee Maker", price: 49.99, category: "kitchen" },
];

const cart: { productId: string; quantity: number }[] = [];

// --- Routes ---
app.get("/products", (_req: Request, res: Response) => {
  const { category, search } = _req.query;
  let result = products;
  if (category) result = result.filter((p) => p.category === category);
  if (search) result = result.filter((p) => p.name.toLowerCase().includes(String(search).toLowerCase()));
  res.json({ products: result });
});

app.get("/products/:id", (req: Request, res: Response) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: { message: "Product not found", status: 404 } });
  res.json(product);
});

app.post("/cart", (req: Request, res: Response) => {
  const { productId, quantity = 1 } = req.body;
  cart.push({ productId, quantity });
  res.status(201).json({ cart });
});

app.get("/cart", (_req: Request, res: Response) => {
  res.json({ cart });
});

app.listen(3000, () => console.log("E-Commerce API running on http://localhost:3000"));

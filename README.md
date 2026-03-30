# 🧪 Agent-Ready API Playground

> **4 live demo APIs with full agent-readiness.** Try MCP, A2A, llms.txt, agents.txt in action.

A showcase Cloudflare Workers application demonstrating how to make APIs fully discoverable and usable by AI agents. Each demo API implements every agent-readiness feature inline — no external dependencies needed.

## 🎯 What's Inside

| Demo | Prefix | Description |
|------|--------|-------------|
| 🛒 **E-Commerce** | `/demo/ecommerce` | Products, shopping cart, orders |
| 🏢 **SaaS Platform** | `/demo/saas` | Users, teams, billing plans |
| 📝 **Content CMS** | `/demo/content` | Blog posts, comments, tags |
| 💰 **Fintech Banking** | `/demo/fintech` | Accounts, transactions, balances |

Each demo scores **100/100** on the [Agent-Readiness Score](https://agent-readiness-score.pages.dev) by implementing:

- ⚡ **MCP** — Model Context Protocol server (Streamable HTTP)
- 📄 **llms.txt** — LLM-friendly documentation
- 🤖 **agents.txt** — Agent discovery policy
- 🔍 **/.well-known/ai** — AI discovery manifest
- 🤝 **/.well-known/agent.json** — A2A Agent Card
- 📋 **OpenAPI 3.0** — Machine-readable API spec
- 🛡️ **Structured errors** — Consistent JSON error envelopes
- 📊 **Rate-limit headers** — X-RateLimit-* on all responses

## 🚀 Quick Start

### Deploy to Cloudflare

```bash
# Clone the repo
git clone https://github.com/lightlayer-dev/agent-layer-playground
cd agent-layer-playground

# Install dependencies
npm install

# Run locally
npm run dev

# Deploy to Cloudflare Workers
npm run deploy
```

### Requirements

- [Node.js](https://nodejs.org) 18+
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (included as dev dependency)

## 📡 API Endpoints

### E-Commerce API (`/demo/ecommerce`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/demo/ecommerce/products` | List products (`?search`, `?category`) |
| GET | `/demo/ecommerce/products/:id` | Get product by ID |
| POST | `/demo/ecommerce/cart` | Add product to cart |
| GET | `/demo/ecommerce/cart` | View cart |
| POST | `/demo/ecommerce/orders` | Create order from cart |
| GET | `/demo/ecommerce/orders` | List orders |

### SaaS Platform API (`/demo/saas`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/demo/saas/users` | List users |
| GET | `/demo/saas/users/:id` | Get user with team info |
| GET | `/demo/saas/teams` | List teams |
| POST | `/demo/saas/teams` | Create team |
| GET | `/demo/saas/billing/plans` | List billing plans |
| GET | `/demo/saas/billing/usage` | Get usage stats |

### Content CMS API (`/demo/content`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/demo/content/posts` | List posts (`?tag`, `?author`) |
| GET | `/demo/content/posts/:id` | Get post with comments |
| POST | `/demo/content/posts` | Create post |
| POST | `/demo/content/posts/:id/comments` | Add comment |
| GET | `/demo/content/tags` | List tags |

### Fintech Banking API (`/demo/fintech`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/demo/fintech/accounts` | List accounts |
| GET | `/demo/fintech/accounts/:id` | Get account with recent transactions |
| GET | `/demo/fintech/transactions` | List transactions (`?account`, `?type`, `?category`) |
| POST | `/demo/fintech/transactions` | Create transaction |
| GET | `/demo/fintech/balance` | Get balance summary |

## 🤖 Using with AI Agents

### Claude Desktop / Claude Code

Add any demo as an MCP server in your Claude config:

```json
{
  "mcpServers": {
    "ecommerce-demo": {
      "url": "https://agent-layer-playground.pages.dev/demo/ecommerce/mcp"
    }
  }
}
```

### Testing MCP manually

```bash
# Initialize
curl -X POST https://agent-layer-playground.pages.dev/demo/ecommerce/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'

# List tools
curl -X POST https://agent-layer-playground.pages.dev/demo/ecommerce/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

# Call a tool
curl -X POST https://agent-layer-playground.pages.dev/demo/ecommerce/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_products","arguments":{"category":"electronics"}}}'
```

### Discovery endpoints

Each demo exposes discovery at:
- `GET {prefix}/llms.txt` — Human/LLM-readable docs
- `GET {prefix}/agents.txt` — Agent policy (robots.txt-style)
- `GET {prefix}/.well-known/ai` — JSON discovery manifest
- `GET {prefix}/.well-known/agent.json` — A2A Agent Card
- `GET {prefix}/openapi.json` — OpenAPI 3.0 specification

## 🏗️ Architecture

```
src/
  index.ts              # Main Hono app, mounts demos + landing page
  landing.ts            # Landing page HTML (dark-themed)
  shared/
    agent-layer.ts      # Reusable middleware for agent-readiness features
    mcp.ts              # MCP JSON-RPC handler (Streamable HTTP)
    types.ts            # Shared TypeScript types
  demos/
    ecommerce.ts        # E-Commerce demo with 15 products
    saas.ts             # SaaS demo with 10 users, 3 teams
    content.ts          # Content demo with 8 posts, 20 comments
    fintech.ts          # Fintech demo with 5 accounts, 30 transactions
```

All agent-layer features are implemented **inline** — no external agent-layer packages required. This makes the project fully self-contained and easy to deploy.

## 🧩 Build Your Own with agent-layer Middleware

This playground implements all agent-readiness features **inline** for demonstration purposes. For your own apps, use the **agent-layer** middleware libraries — one line of code gets you everything:

### Supported Frameworks

| Language | Library | Frameworks | Install |
|----------|---------|------------|---------|
| **TypeScript** | [agent-layer-ts](https://github.com/lightlayer-dev/agent-layer-ts) | Express, Koa, Hono, Fastify | `npm i @agent-layer/core @agent-layer/express` |
| **Python** | [agent-layer-python](https://github.com/lightlayer-dev/agent-layer-python) | FastAPI, Flask, Django | `pip install agent-layer[fastapi]` |
| **Go** | [agent-layer-go](https://github.com/lightlayer-dev/agent-layer-go) | Gin, Echo, Chi | `go get github.com/lightlayer-dev/agent-layer-go` |

### Example: E-Commerce API with Each Framework

<details>
<summary><strong>Express (TypeScript)</strong></summary>

```ts
import express from "express";
import { agentLayer } from "@agent-layer/express";

const app = express();
app.use(agentLayer({
  errors: true,
  rateLimit: { max: 100, windowMs: 60_000 },
  llmsTxt: { title: "E-Commerce API", description: "Products, cart, and orders" },
  discovery: { manifest: { name: "E-Commerce API", description: "Products, cart, and orders" } },
}));

app.get("/products", (req, res) => { /* ... */ });
app.post("/cart", (req, res) => { /* ... */ });
app.listen(3000);
```
</details>

<details>
<summary><strong>FastAPI (Python)</strong></summary>

```python
from fastapi import FastAPI
from agent_layer.fastapi import AgentLayer
from agent_layer.core.llms_txt import LlmsTxtConfig
from agent_layer.core.discovery import DiscoveryConfig, AIManifest

app = FastAPI()
agent = AgentLayer(
    llms_txt=LlmsTxtConfig(title="E-Commerce API", description="Products, cart, and orders"),
    discovery=DiscoveryConfig(manifest=AIManifest(name="E-Commerce API")),
)
agent.install(app)

@app.get("/products")
async def list_products(): ...
```
</details>

<details>
<summary><strong>Gin (Go)</strong></summary>

```go
package main

import (
    "github.com/gin-gonic/gin"
    agentlayer "github.com/lightlayer-dev/agent-layer-go/gin"
)

func main() {
    r := gin.Default()
    r.Use(agentlayer.Middleware(agentlayer.Config{
        LlmsTxt:   &agentlayer.LlmsTxtConfig{Title: "E-Commerce API", Description: "Products, cart, and orders"},
        Discovery: &agentlayer.DiscoveryConfig{Name: "E-Commerce API"},
        RateLimit: &agentlayer.RateLimitConfig{Max: 100, WindowMs: 60000},
    }))

    r.GET("/products", listProducts)
    r.Run(":3000")
}
```
</details>

See the [`examples/`](examples/) directory for complete, runnable versions of these snippets.

## 🔗 Related

- [agent-layer-ts](https://github.com/lightlayer-dev/agent-layer-ts) — TypeScript middleware (Express, Koa, Hono, Fastify)
- [agent-layer-python](https://github.com/lightlayer-dev/agent-layer-python) — Python middleware (FastAPI, Flask, Django)
- [agent-layer-go](https://github.com/lightlayer-dev/agent-layer-go) — Go middleware (Gin, Echo, Chi)
- [Agent-Readiness Score](https://agent-readiness-score.pages.dev) — Score your API's agent-readiness

## 📄 License

MIT

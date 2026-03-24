// ── Landing page — dark-themed HTML ──

interface DemoCardData {
  icon: string;
  name: string;
  desc: string;
  prefix: string;
  endpoints: string[];
}

function renderDemoCard(d: DemoCardData): string {
  const tags = d.endpoints.map((ep) => '<span class="endpoint-tag">' + ep + "</span>").join("");
  const links = [
    { href: d.prefix + "/llms.txt", label: "📄 llms.txt" },
    { href: d.prefix + "/agents.txt", label: "🤖 agents.txt" },
    { href: d.prefix + "/.well-known/ai", label: "🔍 Discovery" },
    { href: d.prefix + "/.well-known/agent.json", label: "🤝 A2A" },
    { href: d.prefix + "/openapi.json", label: "📋 OpenAPI" },
    { href: d.prefix + "/mcp", label: "⚡ MCP" },
  ]
    .map((l) => '<a href="' + l.href + '" class="agent-link">' + l.label + "</a>")
    .join("\n        ");

  return [
    '<div class="demo-card">',
    '  <div class="demo-header">',
    "    <div>",
    '      <div class="demo-icon">' + d.icon + "</div>",
    "      <h3>" + d.name + "</h3>",
    "    </div>",
    '    <span class="score-badge">✓ 100/100</span>',
    "  </div>",
    '  <p class="desc">' + d.desc + "</p>",
    '  <div class="endpoint-list">' + tags + "</div>",
    '  <div class="agent-links">' + links + "</div>",
    "</div>",
  ].join("\n      ");
}

const demos: DemoCardData[] = [
  {
    icon: "🛒",
    name: "E-Commerce API",
    desc: "Product catalog, shopping cart, and order management",
    prefix: "/demo/ecommerce",
    endpoints: ["GET /products", "GET /products/:id", "POST /cart", "GET /cart", "POST /orders", "GET /orders"],
  },
  {
    icon: "🏢",
    name: "SaaS Platform API",
    desc: "User management, team organization, and billing",
    prefix: "/demo/saas",
    endpoints: ["GET /users", "GET /users/:id", "GET /teams", "POST /teams", "GET /billing/plans", "GET /billing/usage"],
  },
  {
    icon: "📝",
    name: "Content CMS API",
    desc: "Blog posts, comments, and tag management",
    prefix: "/demo/content",
    endpoints: ["GET /posts", "GET /posts/:id", "POST /posts", "POST /posts/:id/comments", "GET /tags"],
  },
  {
    icon: "💰",
    name: "Fintech Banking API",
    desc: "Bank accounts, transactions, and balance reporting",
    prefix: "/demo/fintech",
    endpoints: ["GET /accounts", "GET /accounts/:id", "GET /transactions", "POST /transactions", "GET /balance"],
  },
];

export function getLandingPage(): string {
  const demoCards = demos.map(renderDemoCard).join("\n      ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent-Ready API Playground</title>
  <meta name="description" content="4 live demo APIs with full agent-readiness. Try MCP, A2A, llms.txt, agents.txt in action.">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0a0a0f;
      --surface: #12121a;
      --surface-hover: #1a1a28;
      --border: #2a2a3a;
      --text: #e4e4ef;
      --text-muted: #8888a0;
      --accent: #6366f1;
      --accent-glow: rgba(99, 102, 241, 0.15);
      --green: #22c55e;
      --green-glow: rgba(34, 197, 94, 0.15);
      --radius: 12px;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
    }

    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

    .hero {
      text-align: center;
      padding: 80px 0 48px;
    }
    .hero-badge {
      display: inline-block;
      padding: 6px 16px;
      background: var(--accent-glow);
      border: 1px solid var(--accent);
      border-radius: 20px;
      font-size: 13px;
      color: var(--accent);
      margin-bottom: 24px;
      letter-spacing: 0.5px;
    }
    .hero h1 {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #fff 0%, #6366f1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero p {
      font-size: 1.15rem;
      color: var(--text-muted);
      max-width: 600px;
      margin: 0 auto 32px;
    }
    .hero-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: var(--accent);
      color: #fff;
    }
    .btn-primary:hover { background: #5558e6; transform: translateY(-1px); }
    .btn-ghost {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-ghost:hover { background: var(--surface-hover); border-color: var(--text-muted); }

    .demos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
      gap: 20px;
      padding: 24px 0 64px;
    }
    @media (max-width: 560px) {
      .demos { grid-template-columns: 1fr; }
    }
    .demo-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 28px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .demo-card:hover {
      border-color: var(--accent);
      box-shadow: 0 0 30px var(--accent-glow);
    }
    .demo-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .demo-icon { font-size: 28px; margin-bottom: 8px; }
    .demo-card h3 { font-size: 1.2rem; font-weight: 700; }
    .demo-card .desc {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 16px;
    }
    .score-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: var(--green-glow);
      border: 1px solid var(--green);
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
      color: var(--green);
      white-space: nowrap;
    }
    .endpoint-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }
    .endpoint-tag {
      padding: 3px 8px;
      background: var(--surface-hover);
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 12px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      color: var(--text-muted);
    }
    .agent-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .agent-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 10px;
      background: var(--accent-glow);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--accent);
      text-decoration: none;
      transition: all 0.15s;
    }
    .agent-link:hover {
      background: rgba(99, 102, 241, 0.25);
      border-color: var(--accent);
    }
    .cta {
      text-align: center;
      padding: 48px 0;
      border-top: 1px solid var(--border);
    }
    .cta h2 { font-size: 1.8rem; font-weight: 700; margin-bottom: 12px; }
    .cta p {
      color: var(--text-muted);
      margin-bottom: 24px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }
    .code-block {
      display: inline-block;
      padding: 12px 24px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 14px;
      color: var(--green);
      margin-bottom: 16px;
    }
    footer {
      text-align: center;
      padding: 32px 0;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 14px;
    }
    footer a { color: var(--accent); text-decoration: none; }
    footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <section class="hero">
      <span class="hero-badge">🧪 Live Playground</span>
      <h1>Agent-Ready API Playground</h1>
      <p>4 live demo APIs with full agent-readiness. Try MCP, A2A, llms.txt, agents.txt in action.</p>
      <div class="hero-actions">
        <a href="https://agent-readiness-score.pages.dev" class="btn btn-primary" target="_blank">🎯 Score YOUR API</a>
        <a href="https://github.com/lightlayer-dev/agent-layer-playground" class="btn btn-ghost" target="_blank">⭐ GitHub</a>
      </div>
    </section>

    <section class="demos">
      ${demoCards}
    </section>

    <section class="cta">
      <h2>Make YOUR API Agent-Ready</h2>
      <p>Add MCP, llms.txt, agents.txt, A2A, and more to any API in minutes with agent-layer.</p>
      <div class="code-block">npm install @agent-layer/kit</div>
      <br><br>
      <a href="https://github.com/lightlayer-dev/agent-layer" class="btn btn-primary">📦 View on GitHub</a>
    </section>
  </div>

  <footer>
    <p>
      Built with <a href="https://github.com/lightlayer-dev/agent-layer">agent-layer</a> ·
      <a href="https://github.com/lightlayer-dev/agent-layer-playground">Source on GitHub</a> ·
      Powered by <a href="https://workers.cloudflare.com">Cloudflare Workers</a>
    </p>
  </footer>
</body>
</html>`;
}

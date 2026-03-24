// ── Content/CMS Demo API ──
// Blog posts, comments, and tags with full agent-readiness

import { Hono } from "hono";
import { attachAgentLayer } from "../shared/agent-layer";
import type { DemoConfig, McpToolDef, EndpointDef } from "../shared/types";

// ── Seed Data ──

const tags = [
  { id: "tag-1", name: "engineering", postCount: 3 },
  { id: "tag-2", name: "product", postCount: 2 },
  { id: "tag-3", name: "design", postCount: 2 },
  { id: "tag-4", name: "ai", postCount: 2 },
  { id: "tag-5", name: "devops", postCount: 1 },
];

const posts = [
  { id: "post-1", title: "Building Agent-Ready APIs", author: "Alice Chen", tags: ["engineering", "ai"], excerpt: "How to make your API discoverable by AI agents", body: "Agent-readiness is the next frontier in API design. By implementing standards like MCP, llms.txt, and agents.txt, your API becomes natively accessible to AI agents...", publishedAt: "2024-12-01T10:00:00Z", status: "published" },
  { id: "post-2", title: "The Future of MCP", author: "Bob Martinez", tags: ["engineering", "ai"], excerpt: "Model Context Protocol is changing how AI interacts with APIs", body: "MCP provides a standardized way for AI models to discover and call API tools. Think of it as GraphQL for AI — a universal interface that any model can understand...", publishedAt: "2024-12-05T14:00:00Z", status: "published" },
  { id: "post-3", title: "Design Systems at Scale", author: "Carol Johnson", tags: ["design", "engineering"], excerpt: "Lessons from building a design system for 50+ teams", body: "After three years of building and maintaining our design system, here are the key lessons we've learned about scaling visual consistency across a large organization...", publishedAt: "2024-12-08T09:00:00Z", status: "published" },
  { id: "post-4", title: "Product-Led Growth Strategies", author: "David Kim", tags: ["product"], excerpt: "How PLG is reshaping SaaS business models", body: "Product-led growth flips the traditional sales funnel. Instead of top-down enterprise sales, you let the product itself drive acquisition, activation, and retention...", publishedAt: "2024-12-10T11:00:00Z", status: "published" },
  { id: "post-5", title: "Zero-Downtime Deployments", author: "Eva Müller", tags: ["devops", "engineering"], excerpt: "Blue-green deployments made simple with Cloudflare Workers", body: "Deploying without downtime sounds hard, but modern edge platforms make it trivial. Here's how we achieved zero-downtime deploys using Cloudflare Workers...", publishedAt: "2024-12-12T15:00:00Z", status: "published" },
  { id: "post-6", title: "Accessible Color Systems", author: "Frank Osei", tags: ["design"], excerpt: "Creating WCAG-compliant color palettes programmatically", body: "Color accessibility isn't just a nice-to-have — it's a requirement. Here's how we built a color system that automatically generates accessible combinations...", publishedAt: "2024-12-15T10:00:00Z", status: "published" },
  { id: "post-7", title: "Launching Your First API Product", author: "Grace Lee", tags: ["product"], excerpt: "From internal tool to developer platform", body: "Every great API platform started as an internal tool. Here's the playbook for transforming your internal API into a product that developers love...", publishedAt: "2024-12-18T13:00:00Z", status: "published" },
  { id: "post-8", title: "Edge Computing Patterns", author: "Hiroshi Tanaka", tags: ["engineering"], excerpt: "Common patterns for edge-first application architecture", body: "Edge computing moves computation closer to users. Here are the most common patterns we've seen for building edge-first applications with Workers...", publishedAt: "2024-12-20T09:00:00Z", status: "draft" },
];

let postCounter = 8;

const comments: { id: string; postId: string; author: string; body: string; createdAt: string }[] = [
  { id: "cmt-1", postId: "post-1", author: "reader42", body: "Great overview! The agents.txt spec is really clever.", createdAt: "2024-12-01T12:00:00Z" },
  { id: "cmt-2", postId: "post-1", author: "devjane", body: "We implemented this in our API last week. Huge improvement in AI discoverability.", createdAt: "2024-12-01T15:30:00Z" },
  { id: "cmt-3", postId: "post-1", author: "apidesigner", body: "How does this compare to just having good OpenAPI docs?", createdAt: "2024-12-02T08:00:00Z" },
  { id: "cmt-4", postId: "post-2", author: "mleng", body: "MCP is a game changer for tool-use in LLMs.", createdAt: "2024-12-05T16:00:00Z" },
  { id: "cmt-5", postId: "post-2", author: "skeptic99", body: "Isn't this just another standard that will be replaced next year?", createdAt: "2024-12-05T18:00:00Z" },
  { id: "cmt-6", postId: "post-2", author: "pragmatist", body: "Even if it evolves, the concept of standardized tool discovery is here to stay.", createdAt: "2024-12-06T09:00:00Z" },
  { id: "cmt-7", postId: "post-3", author: "designlead", body: "The token system approach is brilliant. We're adopting something similar.", createdAt: "2024-12-08T12:00:00Z" },
  { id: "cmt-8", postId: "post-3", author: "newdesigner", body: "Any recommendations for getting started with design tokens?", createdAt: "2024-12-08T14:00:00Z" },
  { id: "cmt-9", postId: "post-4", author: "saasfounder", body: "PLG only works if your product has a natural viral loop.", createdAt: "2024-12-10T14:00:00Z" },
  { id: "cmt-10", postId: "post-4", author: "growthpm", body: "Disagree — you can engineer virality through collaboration features.", createdAt: "2024-12-10T16:00:00Z" },
  { id: "cmt-11", postId: "post-5", author: "sre_hero", body: "We use a similar approach but with canary deployments.", createdAt: "2024-12-12T17:00:00Z" },
  { id: "cmt-12", postId: "post-5", author: "cfworker", body: "Workers make this so easy compared to traditional infrastructure.", createdAt: "2024-12-12T19:00:00Z" },
  { id: "cmt-13", postId: "post-5", author: "devops_daily", body: "What's your rollback strategy?", createdAt: "2024-12-13T08:00:00Z" },
  { id: "cmt-14", postId: "post-6", author: "a11y_advocate", body: "Finally! This should be the default approach.", createdAt: "2024-12-15T12:00:00Z" },
  { id: "cmt-15", postId: "post-6", author: "colorblind_dev", body: "As someone with deuteranopia, thank you for writing this.", createdAt: "2024-12-15T14:00:00Z" },
  { id: "cmt-16", postId: "post-7", author: "api_first", body: "The hardest part is pricing. Any tips?", createdAt: "2024-12-18T15:00:00Z" },
  { id: "cmt-17", postId: "post-7", author: "founder_life", body: "We went through this exact journey. Documentation was the key.", createdAt: "2024-12-18T17:00:00Z" },
  { id: "cmt-18", postId: "post-7", author: "devrel_pro", body: "Developer experience is the product when you're selling APIs.", createdAt: "2024-12-19T09:00:00Z" },
  { id: "cmt-19", postId: "post-8", author: "edge_enthusiast", body: "Edge caching patterns would be a great follow-up topic.", createdAt: "2024-12-20T11:00:00Z" },
  { id: "cmt-20", postId: "post-8", author: "latency_nerd", body: "The p99 improvements from edge computing are insane.", createdAt: "2024-12-20T13:00:00Z" },
];

let commentCounter = 20;

// ── Handlers ──

function listPosts(args: Record<string, unknown>) {
  let result = posts.filter((p) => p.status === "published");
  if (args.tag) result = result.filter((p) => p.tags.includes(String(args.tag)));
  if (args.author) result = result.filter((p) => p.author.toLowerCase().includes(String(args.author).toLowerCase()));
  return { ok: true, data: result.map(({ body: _b, ...rest }) => rest), meta: { total: result.length } };
}

function getPost(args: Record<string, unknown>) {
  const p = posts.find((p) => p.id === String(args.id));
  if (!p) return { ok: false, error: { code: "NOT_FOUND", message: `Post ${args.id} not found` } };
  const postComments = comments.filter((c) => c.postId === p.id);
  return { ok: true, data: { ...p, comments: postComments } };
}

function createPost(args: Record<string, unknown>) {
  const post = {
    id: `post-${++postCounter}`,
    title: String(args.title || "Untitled"),
    author: String(args.author || "Anonymous"),
    tags: (args.tags as string[]) || [],
    excerpt: String(args.excerpt || ""),
    body: String(args.body || ""),
    publishedAt: new Date().toISOString(),
    status: "draft" as const,
  };
  posts.push(post);
  return { ok: true, data: post };
}

function addComment(args: Record<string, unknown>) {
  const postId = String(args.postId || args.id);
  const post = posts.find((p) => p.id === postId);
  if (!post) return { ok: false, error: { code: "NOT_FOUND", message: `Post ${postId} not found` } };
  const comment = {
    id: `cmt-${++commentCounter}`,
    postId,
    author: String(args.author || "Anonymous"),
    body: String(args.body || ""),
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  return { ok: true, data: comment };
}

function listTags() {
  return { ok: true, data: tags };
}

// ── Config ──

const tools: McpToolDef[] = [
  { name: "list_posts", description: "List published blog posts with optional tag/author filter", inputSchema: { type: "object", properties: { tag: { type: "string", description: "Filter by tag name" }, author: { type: "string", description: "Filter by author name" } } }, handler: listPosts },
  { name: "get_post", description: "Get a post by ID with its comments", inputSchema: { type: "object", properties: { id: { type: "string", description: "Post ID" } }, required: ["id"] }, handler: getPost },
  { name: "create_post", description: "Create a new blog post (draft)", inputSchema: { type: "object", properties: { title: { type: "string" }, author: { type: "string" }, tags: { type: "array", items: { type: "string" } }, excerpt: { type: "string" }, body: { type: "string" } }, required: ["title", "body"] }, handler: createPost },
  { name: "add_comment", description: "Add a comment to a post", inputSchema: { type: "object", properties: { postId: { type: "string" }, author: { type: "string" }, body: { type: "string" } }, required: ["postId", "body"] }, handler: addComment },
  { name: "list_tags", description: "List all content tags", inputSchema: { type: "object", properties: {} }, handler: listTags },
];

const endpoints: EndpointDef[] = [
  { method: "GET", path: "/posts", summary: "List posts", description: "Returns published posts, filterable by tag and author.", parameters: [{ name: "tag", in: "query", description: "Filter by tag", schema: { type: "string" } }, { name: "author", in: "query", description: "Filter by author", schema: { type: "string" } }] },
  { method: "GET", path: "/posts/:id", summary: "Get post", description: "Returns a post with its comments.", parameters: [{ name: "id", in: "path", description: "Post ID", required: true, schema: { type: "string" } }] },
  { method: "POST", path: "/posts", summary: "Create post", description: "Creates a new blog post as draft.", requestBody: { description: "Post content", schema: { type: "object", properties: { title: { type: "string" }, author: { type: "string" }, tags: { type: "array" }, excerpt: { type: "string" }, body: { type: "string" } }, required: ["title", "body"] } } },
  { method: "POST", path: "/posts/:id/comments", summary: "Add comment", description: "Adds a comment to a post.", parameters: [{ name: "id", in: "path", description: "Post ID", required: true, schema: { type: "string" } }], requestBody: { description: "Comment", schema: { type: "object", properties: { author: { type: "string" }, body: { type: "string" } }, required: ["body"] } } },
  { method: "GET", path: "/tags", summary: "List tags", description: "Returns all content tags with post counts." },
];

const config: DemoConfig = {
  name: "Content CMS API",
  description: "Blog posts, comments, and tag management demo",
  prefix: "/demo/content",
  version: "1.0.0",
  tools,
  endpoints,
  skills: ["Content Management", "Blog Publishing", "Comment Moderation"],
};

// ── Build App ──

const app = new Hono();
attachAgentLayer(app, config);

app.get("/posts", (c) => c.json(listPosts({ tag: c.req.query("tag"), author: c.req.query("author") })));
app.get("/posts/:id", (c) => c.json(getPost({ id: c.req.param("id") })));
app.post("/posts", async (c) => c.json(createPost(await c.req.json())));
app.post("/posts/:id/comments", async (c) => {
  const body = await c.req.json();
  return c.json(addComment({ ...body, postId: c.req.param("id") }));
});
app.get("/tags", (c) => c.json(listTags()));

export default app;

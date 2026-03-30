"""
E-Commerce API — FastAPI + agent-layer

Run:
    pip install fastapi uvicorn agent-layer[fastapi]
    uvicorn ecommerce_fastapi:app --reload

Then visit:
    http://localhost:8000/products
    http://localhost:8000/llms.txt
    http://localhost:8000/.well-known/ai
    http://localhost:8000/.well-known/agent.json
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from agent_layer.fastapi import AgentLayer
from agent_layer.core.agents_txt import AgentsTxtConfig, AgentsTxtRule, Permission
from agent_layer.core.llms_txt import LlmsTxtConfig
from agent_layer.core.discovery import DiscoveryConfig, AIManifest
from agent_layer.core.a2a import A2AConfig, A2AAgentCard, A2ASkill
from agent_layer.core.rate_limit import RateLimitConfig

app = FastAPI(title="E-Commerce API")

# One call — adds llms.txt, agents.txt, discovery, A2A, rate limits, structured errors
agent = AgentLayer(
    agents_txt=AgentsTxtConfig(
        rules=[
            AgentsTxtRule(agent="*", permission=Permission.ALLOW, paths=["/products", "/cart", "/orders"]),
        ]
    ),
    llms_txt=LlmsTxtConfig(
        title="E-Commerce API",
        description="Browse products, manage a shopping cart, and place orders.",
    ),
    discovery=DiscoveryConfig(
        manifest=AIManifest(
            name="E-Commerce API",
            description="Products, cart, and orders",
        )
    ),
    a2a=A2AConfig(
        card=A2AAgentCard(
            name="E-Commerce",
            url="http://localhost:8000",
            skills=[
                A2ASkill(id="browse", name="Browse Products", description="Search and filter products"),
                A2ASkill(id="order", name="Place Orders", description="Add to cart and checkout"),
            ],
        )
    ),
    rate_limit=RateLimitConfig(max=100, window_ms=60_000),
)
agent.install(app)

# --- Demo data ---
products = [
    {"id": "1", "name": "Wireless Headphones", "price": 79.99, "category": "electronics"},
    {"id": "2", "name": "Running Shoes", "price": 129.99, "category": "sports"},
    {"id": "3", "name": "Coffee Maker", "price": 49.99, "category": "kitchen"},
]

cart: list[dict] = []


# --- Routes ---
@app.get("/products")
async def list_products(category: str | None = None, search: str | None = None):
    result = products
    if category:
        result = [p for p in result if p["category"] == category]
    if search:
        result = [p for p in result if search.lower() in p["name"].lower()]
    return {"products": result}


@app.get("/products/{product_id}")
async def get_product(product_id: str):
    product = next((p for p in products if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


class CartItem(BaseModel):
    productId: str
    quantity: int = 1


@app.post("/cart", status_code=201)
async def add_to_cart(item: CartItem):
    cart.append(item.model_dump())
    return {"cart": cart}


@app.get("/cart")
async def view_cart():
    return {"cart": cart}

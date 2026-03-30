/*
E-Commerce API — Gin + agent-layer

Run:
    go mod init ecommerce-demo
    go get github.com/gin-gonic/gin
    go get github.com/lightlayer-dev/agent-layer-go
    go run ecommerce-gin.go

Then visit:
    http://localhost:3000/products
    http://localhost:3000/llms.txt
    http://localhost:3000/.well-known/ai
    http://localhost:3000/.well-known/agent.json
*/

package main

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	agentlayer "github.com/lightlayer-dev/agent-layer-go/gin"
)

type Product struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Price    float64 `json:"price"`
	Category string  `json:"category"`
}

type CartItem struct {
	ProductID string `json:"productId"`
	Quantity  int    `json:"quantity"`
}

var products = []Product{
	{ID: "1", Name: "Wireless Headphones", Price: 79.99, Category: "electronics"},
	{ID: "2", Name: "Running Shoes", Price: 129.99, Category: "sports"},
	{ID: "3", Name: "Coffee Maker", Price: 49.99, Category: "kitchen"},
}

var cart []CartItem

func main() {
	r := gin.Default()

	// One line — adds llms.txt, agents.txt, discovery, A2A, rate limits, structured errors
	r.Use(agentlayer.Middleware(agentlayer.Config{
		LlmsTxt: &agentlayer.LlmsTxtConfig{
			Title:       "E-Commerce API",
			Description: "Browse products, manage a shopping cart, and place orders.",
		},
		AgentsTxt: &agentlayer.AgentsTxtConfig{
			Rules: []agentlayer.AgentsTxtRule{
				{Agent: "*", Allow: []string{"/products", "/cart", "/orders"}},
			},
		},
		Discovery: &agentlayer.DiscoveryConfig{
			Name:        "E-Commerce API",
			Description: "Products, cart, and orders",
		},
		A2A: &agentlayer.A2AConfig{
			Name:        "E-Commerce",
			Description: "Shop for products and manage orders",
			Skills: []agentlayer.A2ASkill{
				{ID: "browse", Name: "Browse Products", Description: "Search and filter products"},
				{ID: "order", Name: "Place Orders", Description: "Add to cart and checkout"},
			},
		},
		RateLimit: &agentlayer.RateLimitConfig{Max: 100, WindowMs: 60000},
	}))

	r.GET("/products", listProducts)
	r.GET("/products/:id", getProduct)
	r.POST("/cart", addToCart)
	r.GET("/cart", viewCart)

	r.Run(":3000")
}

func listProducts(c *gin.Context) {
	category := c.Query("category")
	search := c.Query("search")

	result := make([]Product, 0)
	for _, p := range products {
		if category != "" && p.Category != category {
			continue
		}
		if search != "" && !strings.Contains(strings.ToLower(p.Name), strings.ToLower(search)) {
			continue
		}
		result = append(result, p)
	}
	c.JSON(http.StatusOK, gin.H{"products": result})
}

func getProduct(c *gin.Context) {
	id := c.Param("id")
	for _, p := range products {
		if p.ID == id {
			c.JSON(http.StatusOK, p)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"message": "Product not found", "status": 404}})
}

func addToCart(c *gin.Context) {
	var item CartItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request", "status": 400}})
		return
	}
	if item.Quantity == 0 {
		item.Quantity = 1
	}
	cart = append(cart, item)
	c.JSON(http.StatusCreated, gin.H{"cart": cart})
}

func viewCart(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"cart": cart})
}

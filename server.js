import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const {
  PORT = 8080,
  API_KEY, // Your Render API key (single name)
  WP_BASEURL,
  WP_USER,
  WP_APP_PASSWORD
} = process.env;

// WordPress Basic Auth
const wpAuthHeader = "Basic " + Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString("base64");

// Security middleware
app.use((req, res, next) => {
  const key = req.headers["x-api-key"];
  if (!API_KEY || key !== API_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
});

// Health check
app.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

/* ---------------------------------------------------------
   MCP Tool Manifest — lets MCP Clients know what we can do
--------------------------------------------------------- */
app.get("/mcp/tools", (req, res) => {
  res.json({
    tools: [
      {
        name: "getPillarArticle",
        description: "Fetches a specific post by ID from WordPress.",
        parameters: { id: "number" }
      },
      {
        name: "getAllPosts",
        description: "Fetches all posts except the specified pillar article.",
        parameters: { excludeId: "number" }
      },
      {
        name: "updatePost",
        description: "Updates an existing WordPress post with new content.",
        parameters: { id: "number", content: "string" }
      },
      {
        name: "getCategories",
        description: "Fetch all WordPress categories.",
        parameters: {}
      },
      {
        name: "uploadMedia",
        description: "Upload an image to WordPress from a public URL.",
        parameters: { url: "string", filename: "string" }
      }
    ]
  });
});

/* ---------------------------------------------------------
   MCP Tool Execution Endpoint
--------------------------------------------------------- */
app.post("/mcp/call", async (req, res) => {
  const { tool, args } = req.body;

  try {
    switch (tool) {
      case "getPillarArticle": {
        const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/posts/${args.id}`, {
          headers: { Authorization: wpAuthHeader }
        });
        return res.json(await r.json());
      }
      case "getAllPosts": {
        const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/posts?exclude=${args.excludeId}&per_page=100`, {
          headers: { Authorization: wpAuthHeader }
        });
        return res.json(await r.json());
      }
      case "updatePost": {
        const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/posts/${args.id}`, {
          method: "PUT",
          headers: {
            Authorization: wpAuthHeader,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ content: args.content })
        });
        return res.json(await r.json());
      }
      case "getCategories": {
        const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/categories`, {
          headers: { Authorization: wpAuthHeader }
        });
        return res.json(await r.json());
      }
      case "uploadMedia": {
        const fileResponse = await fetch(args.url);
        const fileBuffer = await fileResponse.arrayBuffer();

        const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/media`, {
          method: "POST",
          headers: {
            Authorization: wpAuthHeader,
            "Content-Disposition": `attachment; filename="${args.filename || "upload.jpg"}"`,
            "Content-Type": "image/jpeg"
          },
          body: Buffer.from(fileBuffer)
        });
        return res.json(await r.json());
      }
      default:
        return res.status(400).json({ error: "Unknown tool" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`MCP WordPress Server running on port ${PORT}`);
});

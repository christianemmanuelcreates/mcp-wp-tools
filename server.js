import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const {
  PORT = 8080,
  API_KEY,
  WP_BASEURL,
  WP_USER,
  WP_APP_PASSWORD
} = process.env;

// WordPress auth header
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

/**
 * ------------------------------
 * WORDPRESS API FUNCTIONS
 * ------------------------------
 */

// Get recent posts
app.get("/wp/posts", async (req, res) => {
  try {
    const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/posts?per_page=10`, {
      headers: { Authorization: wpAuthHeader }
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new post
app.post("/wp/posts", async (req, res) => {
  try {
    const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        Authorization: wpAuthHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update post
app.put("/wp/posts/:id", async (req, res) => {
  try {
    const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/posts/${req.params.id}`, {
      method: "PUT",
      headers: {
        Authorization: wpAuthHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete post
app.delete("/wp/posts/:id", async (req, res) => {
  try {
    const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/posts/${req.params.id}?force=true`, {
      method: "DELETE",
      headers: { Authorization: wpAuthHeader }
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manage categories
app.get("/wp/categories", async (req, res) => {
  try {
    const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/categories`, {
      headers: { Authorization: wpAuthHeader }
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/wp/categories", async (req, res) => {
  try {
    const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/categories`, {
      method: "POST",
      headers: {
        Authorization: wpAuthHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload media
app.post("/wp/media", async (req, res) => {
  try {
    const fileUrl = req.body.url; // public file URL to upload
    const filename = req.body.filename || "upload.jpg";
    const fileResponse = await fetch(fileUrl);
    const fileBuffer = await fileResponse.arrayBuffer();

    const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        Authorization: wpAuthHeader,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "image/jpeg"
      },
      body: Buffer.from(fileBuffer)
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
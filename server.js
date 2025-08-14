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
 * MCP ROUTE
 * ------------------------------
 */
app.post("/mcp", async (req, res) => {
  try {
    const { action, params } = req.body;

    switch (action) {
      case "getRecentPosts":
        return getRecentPosts(req, res);
      case "createPost":
        return createPost(req, res, params);
      case "updatePost":
        return updatePost(req, res, params);
      case "deletePost":
        return deletePost(req, res, params);
      case "getCategories":
        return getCategories(req, res);
      case "createCategory":
        return createCategory(req, res, params);
      case "uploadMedia":
        return uploadMedia(req, res, params);
      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ------------------------------
 * WORDPRESS API FUNCTIONS
 * ------------------------------
 */
const getRecentPosts = async (req, res) => {
  try {
    const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/posts?per_page=10`, {
      headers: { Authorization: wpAuthHeader }
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createPost = async (req, res, body) => {
  try {
    const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        Authorization: wpAuthHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body || req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePost = async (req, res, { id, ...body }) => {
  try {
    const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/posts/${id}`, {
      method: "PUT",
      headers: {
        Authorization: wpAuthHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body || req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePost = async (req, res, { id }) => {
  try {
    const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/posts/${id}?force=true`, {
      method: "DELETE",
      headers: { Authorization: wpAuthHeader }
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/categories`, {
      headers: { Authorization: wpAuthHeader }
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createCategory = async (req, res, body) => {
  try {
    const r = await fetch(`${WP_BASEURL}/wp-json/wp/v2/categories`, {
      method: "POST",
      headers: {
        Authorization: wpAuthHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body || req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const uploadMedia = async (req, res, { url: fileUrl, filename }) => {
  try {
    filename = filename || "upload.jpg";
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
};

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

interface SearchIssuesResponse<TItem> {
  items?: TItem[];
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const githubToken =
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;

  const getGithubHeaders = () => ({
    Authorization: `Bearer ${githubToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  });

  const fetchAllSearchIssues = async <TItem,>(query: string) => {
    const items: TItem[] = [];
    const perPage = 100;

    for (let page = 1; page <= 10; page += 1) {
      const response = await axios.get<SearchIssuesResponse<TItem>>(
        "https://api.github.com/search/issues",
        {
          headers: getGithubHeaders(),
          params: {
            q: query,
            sort: "created",
            order: "desc",
            per_page: perPage,
            page,
          },
        }
      );

      const pageItems = Array.isArray(response.data?.items) ? response.data.items : [];
      items.push(...pageItems);

      if (pageItems.length < perPage) {
        break;
      }
    }

    return items;
  };

  app.use(express.json());

  app.get("/api/config", (_req, res) => {
    res.json({ githubConfigured: Boolean(githubToken) });
  });

  app.get("/api/user", async (_req, res) => {
    if (!githubToken) {
      return res.status(503).json({
        error: "GitHub token not configured",
        missingEnv: "GITHUB_PERSONAL_ACCESS_TOKEN",
      });
    }

    try {
      const response = await axios.get("https://api.github.com/user", {
        headers: getGithubHeaders(),
      });
      res.json(response.data);
    } catch (error) {
      console.error("User Fetch Error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/prs", async (_req, res) => {
    if (!githubToken) {
      return res.status(503).json({
        error: "GitHub token not configured",
        missingEnv: "GITHUB_PERSONAL_ACCESS_TOKEN",
      });
    }

    try {
      const items = await fetchAllSearchIssues("is:open is:pr author:@me");
      res.json(items);
    } catch (error) {
      console.error("PR Fetch Error:", error);
      res.status(500).json({ error: "Failed to fetch PRs" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("index.html", { root: "dist" });
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Set a different PORT and try again.`);
      process.exit(1);
    }

    throw error;
  });
}

startServer();

import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

interface SearchIssuesResponse<TItem> {
  items?: TItem[];
}

interface CommitData {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
  author?: {
    login: string;
    avatar_url: string;
  };
}

interface PaginationInfo {
  page: number;
  per_page: number;
  total?: number;
  has_next: boolean;
  has_prev: boolean;
}

interface CommitsResponse {
  commits: CommitData[];
  pagination: PaginationInfo;
}

export async function createApp() {
  const app = express();
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

  const parseLinkHeader = (linkHeader: string | undefined) => {
    if (!linkHeader) return {};
    
    const links: Record<string, string> = {};
    const matches = linkHeader.matchAll(/<([^>]+)>;\s*rel="([^"]+)"/g);
    
    for (const match of matches) {
      const [, url, rel] = match;
      const urlObj = new URL(url);
      const page = urlObj.searchParams.get("page");
      if (page) {
        links[rel] = page;
      }
    }
    
    return links;
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

  app.get("/api/commits", async (req, res) => {
    if (!githubToken) {
      return res.status(503).json({
        error: "GitHub token not configured",
        missingEnv: "GITHUB_PERSONAL_ACCESS_TOKEN",
      });
    }

    const { repo, page = "1", per_page = "20" } = req.query;

    if (!repo || typeof repo !== "string") {
      return res.status(400).json({
        error: "Repository parameter is required. Format: owner/repo",
      });
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const perPageNum = Math.min(100, Math.max(1, parseInt(per_page as string, 10) || 20));

    try {
      const response = await axios.get<CommitData[]>(
        `https://api.github.com/repos/${repo}/commits`,
        {
          headers: getGithubHeaders(),
          params: {
            per_page: perPageNum,
            page: pageNum,
          },
        }
      );

      const linkHeader = response.headers["link"] as string | undefined;
      const links = parseLinkHeader(linkHeader);
      
      const hasNext = Boolean(links.next);
      const hasPrev = Boolean(links.prev);

      const commitsResponse: CommitsResponse = {
        commits: response.data,
        pagination: {
          page: pageNum,
          per_page: perPageNum,
          has_next: hasNext,
          has_prev: hasPrev,
        },
      };

      res.json(commitsResponse);
    } catch (error) {
      console.error("Commits Fetch Error:", error);
      res.status(500).json({ error: "Failed to fetch commits" });
    }
  });

  return app;
}

async function startServer() {
  const app = await createApp();
  const PORT = Number(process.env.PORT || 3000);

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

  return { app, server };
}

// Only auto-start server when not in test environment
if (process.env.NODE_ENV !== "test") {
  startServer();
}

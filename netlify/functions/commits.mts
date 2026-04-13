import type { Context } from "@netlify/functions";
import {
  getConfiguredGithubToken,
  githubRequest,
  parseLinkHeader,
} from "./lib/github.mts";

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
  repo?: string;
}

interface RepoData {
  full_name: string;
  name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  updated_at: string;
}

export default async (req: Request, _context: Context) => {
  try {
    const token = getConfiguredGithubToken();
    const url = new URL(req.url);
    const repo = url.searchParams.get("repo");
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number.parseInt(url.searchParams.get("per_page") ?? "20", 10) || 20)
    );

    if (repo) {
      const response = await githubRequest<CommitData[]>(
        `/repos/${repo}/commits`,
        token,
        {
          per_page: perPage,
          page,
        }
      );

      const links = parseLinkHeader(response.headers.link as string | undefined);

      return Response.json({
        commits: response.data,
        pagination: {
          page,
          per_page: perPage,
          has_next: Boolean(links.next),
          has_prev: Boolean(links.prev),
        },
      });
    }

    const reposResponse = await githubRequest<RepoData[]>(
      "/user/repos",
      token,
      {
        sort: "updated",
        direction: "desc",
        per_page: 50,
      }
    );

    const repos = reposResponse.data;
    const allCommits: CommitData[] = [];

    for (const repoData of repos.slice(0, 10)) {
      try {
        const commitsResponse = await githubRequest<CommitData[]>(
          `/repos/${repoData.full_name}/commits`,
          token,
          {
            per_page: perPage,
            page,
          }
        );

        allCommits.push(
          ...commitsResponse.data.map((commit) => ({
            ...commit,
            repo: repoData.full_name,
          }))
        );
      } catch (error) {
        console.warn(`Failed to fetch commits from ${repoData.full_name}`, error);
      }
    }

    allCommits.sort(
      (a, b) =>
        new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()
    );

    return Response.json({
      commits: allCommits.slice(0, perPage),
      pagination: {
        page,
        per_page: perPage,
        has_next: allCommits.length > perPage,
        has_prev: page > 1,
      },
      repos,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "GitHub token not configured") {
      return Response.json(
        {
          error: "GitHub token not configured",
          missingEnv: "GITHUB_PERSONAL_ACCESS_TOKEN",
        },
        { status: 503 }
      );
    }

    console.error("Netlify commits function error:", error);
    return Response.json({ error: "Failed to fetch commits" }, { status: 500 });
  }
};

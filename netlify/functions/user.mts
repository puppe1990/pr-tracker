import type { Context } from "@netlify/functions";
import { getConfiguredGithubToken, githubRequest } from "./lib/github.mts";

export default async (_req: Request, _context: Context) => {
  try {
    const token = getConfiguredGithubToken();
    const response = await githubRequest("/user", token);
    return Response.json(response.data);
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

    console.error("Netlify user function error:", error);
    return Response.json({ error: "Failed to fetch user" }, { status: 500 });
  }
};

import axios from "axios";

const getGithubToken = () =>
  Netlify.env.get("GITHUB_PERSONAL_ACCESS_TOKEN") ||
  Netlify.env.get("GITHUB_TOKEN");

const getGithubHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

export const getConfiguredGithubToken = () => {
  const token = getGithubToken();

  if (!token) {
    throw new Error("GitHub token not configured");
  }

  return token;
};

export const githubApi = axios.create({
  baseURL: "https://api.github.com",
});

export const githubRequest = <T,>(url: string, token: string) =>
  githubApi.get<T>(url, {
    headers: getGithubHeaders(token),
  });

interface SearchIssuesResponse<TItem> {
  items?: TItem[];
}

export const fetchAllSearchIssues = async <TItem,>(
  query: string,
  token: string
) => {
  const items: TItem[] = [];
  const perPage = 100;

  for (let page = 1; page <= 10; page += 1) {
    const response = await githubRequest<SearchIssuesResponse<TItem>>(
      `/search/issues?q=${encodeURIComponent(query)}&sort=created&order=desc&per_page=${perPage}&page=${page}`,
      token
    );

    const pageItems = Array.isArray(response.data?.items) ? response.data.items : [];
    items.push(...pageItems);

    if (pageItems.length < perPage) {
      break;
    }
  }

  return items;
};

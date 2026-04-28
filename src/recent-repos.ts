export interface RecentRepo {
  full_name: string;
  name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  updated_at: string;
  html_url: string;
}

interface VisibleRecentRepos {
  items: RecentRepo[];
  page: number;
  total: number;
  totalPages: number;
}

export function getVisibleRecentRepos(
  repos: RecentRepo[],
  searchTerm: string,
  currentPage: number,
  itemsPerPage: number
): VisibleRecentRepos {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredRepos = repos
    .filter((repo) => Boolean(repo.updated_at))
    .sort(
      (firstRepo, secondRepo) =>
        new Date(secondRepo.updated_at).getTime() - new Date(firstRepo.updated_at).getTime()
    )
    .filter((repo) => {
      if (normalizedSearch.length === 0) {
        return true;
      }

      return (
        repo.name.toLowerCase().includes(normalizedSearch) ||
        repo.full_name.toLowerCase().includes(normalizedSearch) ||
        (repo.description || "").toLowerCase().includes(normalizedSearch)
      );
    });

  const total = filteredRepos.length;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const page = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (page - 1) * itemsPerPage;

  return {
    items: filteredRepos.slice(startIndex, startIndex + itemsPerPage),
    page,
    total,
    totalPages,
  };
}

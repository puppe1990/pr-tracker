import { getRepoOrganization } from './repo-organization';

export interface Commit {
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

interface VisibleCommits {
  items: Commit[];
  page: number;
  total: number;
  totalPages: number;
}

function normalizeSearchTerm(searchTerm: string): string {
  return searchTerm.trim().toLowerCase();
}

function matchesCommitSearch(commit: Commit, searchTerm: string): boolean {
  if (searchTerm.length === 0) {
    return true;
  }

  const searchableFields = [
    commit.sha,
    commit.commit.message,
    commit.commit.author.name,
    commit.author?.login || '',
    commit.repo || '',
  ];

  return searchableFields.some((field) => field.toLowerCase().includes(searchTerm));
}

export function getVisibleCommits(
  commits: Commit[],
  searchTerm: string,
  selectedOrganization: string,
  selectedRepo: string,
  currentPage: number,
  itemsPerPage: number
): VisibleCommits {
  const normalizedSearchTerm = normalizeSearchTerm(searchTerm);
  const filteredCommits = commits.filter((commit) => {
    const commitOrganization = getRepoOrganization(commit.repo);
    const matchesOrganization =
      selectedOrganization === 'all' || commitOrganization === selectedOrganization;
    const matchesRepo = selectedRepo === 'all' || commit.repo === selectedRepo;
    return matchesOrganization && matchesRepo && matchesCommitSearch(commit, normalizedSearchTerm);
  });

  const total = filteredCommits.length;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const page = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (page - 1) * itemsPerPage;

  return {
    items: filteredCommits.slice(startIndex, startIndex + itemsPerPage),
    page,
    total,
    totalPages,
  };
}

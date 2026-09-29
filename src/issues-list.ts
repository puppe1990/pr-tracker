export interface TrackerIssue {
  id: number;
  title: string;
  html_url: string;
  created_at: string;
  repository_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: { name: string; color: string }[];
  state: string;
}

interface VisibleIssues {
  items: TrackerIssue[];
  page: number;
  total: number;
  totalPages: number;
}

export function getIssueRepoName(repositoryUrl: string): string {
  return repositoryUrl.split('/').slice(-1)[0];
}

export function getIssueRepoOwner(repositoryUrl: string): string {
  return repositoryUrl.split('/').slice(-2, -1)[0];
}

function matchesIssueSearch(issue: TrackerIssue, searchTerm: string): boolean {
  if (searchTerm.length === 0) {
    return true;
  }

  const repoName = getIssueRepoName(issue.repository_url);
  return (
    issue.title.toLowerCase().includes(searchTerm) || repoName.toLowerCase().includes(searchTerm)
  );
}

export function getVisibleIssues(
  issues: TrackerIssue[],
  searchTerm: string,
  selectedRepo: string,
  selectedLabel: string,
  currentPage: number,
  itemsPerPage: number
): VisibleIssues {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredIssues = issues.filter((issue) => {
    const repoName = getIssueRepoName(issue.repository_url);
    const matchesRepo = selectedRepo === 'all' || repoName === selectedRepo;
    const matchesLabel =
      selectedLabel === 'all' || issue.labels.some((label) => label.name === selectedLabel);
    return matchesRepo && matchesLabel && matchesIssueSearch(issue, normalizedSearchTerm);
  });

  const total = filteredIssues.length;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const page = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (page - 1) * itemsPerPage;

  return {
    items: filteredIssues.slice(startIndex, startIndex + itemsPerPage),
    page,
    total,
    totalPages,
  };
}

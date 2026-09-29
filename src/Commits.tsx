import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GitCommit, Clock, ChevronRight, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Select, { StylesConfig } from 'react-select';
import { getVisibleCommits, type Commit } from './commits-list';

interface Repo {
  full_name: string;
  name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  updated_at: string;
}

interface Pagination {
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

interface CommitsResponse {
  commits: Commit[];
  pagination: Pagination;
  repos?: Repo[];
}

export default function Commits() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all');
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    per_page: 20,
    has_next: false,
    has_prev: false,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchCommits = async (pageNum: number = pagination.page, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        per_page: pagination.per_page.toString(),
      });

      if (selectedRepo !== 'all') {
        params.append('repo', selectedRepo);
      }

      const response = await fetch(`/api/commits?${params.toString()}`);

      if (response.ok) {
        const data: CommitsResponse = await response.json();
        setCommits(
          selectedRepo === 'all'
            ? data.commits
            : data.commits.map((commit) => ({
                ...commit,
                repo: selectedRepo,
              }))
        );
        setPagination(data.pagination);

        // Store repos if returned from API
        if (data.repos) {
          setRepos(data.repos);
        }
      } else {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || 'Failed to fetch commits');
      }
    } catch (err) {
      setError('Connection error while fetching commits');
      console.error('Commits Fetch Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRepos = async () => {
    try {
      const response = await fetch('/api/repos');
      if (response.ok) {
        const data: Repo[] = await response.json();
        setRepos(data);
      }
    } catch (err) {
      console.error('Repos Fetch Error:', err);
    }
  };

  useEffect(() => {
    fetchCommits(1);
  }, [selectedRepo]);

  useEffect(() => {
    fetchRepos();
  }, []);

  useEffect(() => {
    setSelectedRepo('all');
  }, [selectedOrganization]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handlePrevPage = () => {
    if (pagination.has_prev) {
      fetchCommits(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.has_next) {
      fetchCommits(pagination.page + 1);
    }
  };

  const handleRefresh = async () => {
    await fetchCommits(1, true);
  };

  const selectStyles: StylesConfig = {
    control: (base) => ({
      ...base,
      backgroundColor: 'var(--pr-canvas)',
      borderColor: 'var(--pr-border)',
      borderRadius: '0.75rem',
      minHeight: '48px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#3b82f6',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--pr-surface)',
      border: '1px solid var(--pr-border)',
      borderRadius: '0.75rem',
      overflow: 'hidden',
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'var(--pr-muted)'
        : state.isFocused
          ? 'var(--pr-focus)'
          : 'var(--pr-surface)',
      color: 'var(--pr-fg)',
      borderRadius: '0.5rem',
      padding: '8px 12px',
      '&:active': {
        backgroundColor: 'var(--pr-muted)',
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--pr-fg)',
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--pr-fg-muted)',
    }),
    input: (base) => ({
      ...base,
      color: 'var(--pr-fg)',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: 'var(--pr-fg-muted)',
      '&:hover': {
        color: 'var(--pr-fg)',
      },
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: 'var(--pr-border)',
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: 'var(--pr-fg-muted)',
    }),
  };

  const organizationOptions = useMemo(
    () => [
      { value: 'all', label: 'Todas' },
      ...Array.from(new Set(repos.map((repo) => repo.owner.login)))
        .sort((firstOrg, secondOrg) => firstOrg.localeCompare(secondOrg))
        .map((organization) => ({ value: organization, label: organization })),
    ],
    [repos]
  );

  const repoOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos' },
      ...repos
        .filter(
          (repo) => selectedOrganization === 'all' || repo.owner.login === selectedOrganization
        )
        .map((repo) => ({ value: repo.full_name, label: repo.full_name })),
    ],
    [repos, selectedOrganization]
  );

  const visibleCommits = useMemo(
    () =>
      getVisibleCommits(
        commits,
        searchTerm,
        selectedOrganization,
        selectedRepo,
        pagination.page,
        pagination.per_page
      ),
    [commits, pagination.page, pagination.per_page, searchTerm, selectedOrganization, selectedRepo]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-fg-muted hover:text-fg-strong hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to PRs</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-fg-strong tracking-tight">Commits</h2>
          <p className="text-fg-muted mt-1">Browse commits from all your repositories.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-fg-muted hover:text-fg-strong hover:bg-muted transition-colors self-end disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <div className="flex items-center gap-2 text-sm font-medium px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            {visibleCommits.total} de {commits.length} commits
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-3">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
            Buscar
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Mensagem, SHA ou autor"
            className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-fg-strong outline-none transition focus:border-blue-500"
          />
        </label>

        <label className="space-y-2 block">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
            Org
          </span>
          <Select
            value={organizationOptions.find((option) => option.value === selectedOrganization)}
            onChange={(option: { value: string; label: string } | null) =>
              setSelectedOrganization(option?.value || 'all')
            }
            options={organizationOptions}
            styles={selectStyles}
            isSearchable
            placeholder="Todas"
            noOptionsMessage={() => 'Nenhuma org'}
          />
        </label>

        <label className="space-y-2 block">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
            Repositório
          </span>
          <Select
            value={repoOptions.find((opt) => opt.value === selectedRepo)}
            onChange={(option: { value: string; label: string } | null) =>
              setSelectedRepo(option?.value || 'all')
            }
            options={repoOptions}
            styles={selectStyles}
            isSearchable
            placeholder="Todos"
            noOptionsMessage={() => 'Nenhum repositório'}
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-line bg-surface p-10"
            >
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="relative">
                  <div className="h-14 w-14 animate-spin rounded-full border-2 border-line border-t-blue-500"></div>
                  <GitCommit className="absolute inset-0 m-auto h-5 w-5 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-fg-strong">Loading commits</p>
                  <p className="text-sm text-fg-muted">Fetching commits from GitHub API...</p>
                </div>
              </div>
            </motion.div>
          ) : visibleCommits.total > 0 ? (
            visibleCommits.items.map((commit, index) => (
              <motion.div
                key={commit.sha}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-surface border border-line rounded-xl overflow-hidden hover:border-fg-muted/50 transition-all hover:shadow-2xl hover:shadow-black/40"
              >
                <a
                  href={commit.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-5 gap-6"
                >
                  <div className="hidden sm:flex flex-col items-center justify-center w-12 h-12 bg-muted rounded-xl border border-line group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                    <GitCommit className="w-6 h-6 text-fg-muted group-hover:text-blue-400" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-fg-muted">
                      {commit.repo && (
                        <>
                          <span className="text-blue-400 hover:text-blue-300 transition-colors">
                            {commit.repo}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <code className="px-2 py-0.5 bg-canvas rounded">
                        {commit.sha.substring(0, 7)}
                      </code>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(commit.commit.author.date)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-fg-strong group-hover:text-blue-400 transition-colors">
                      {commit.commit.message.split('\n')[0]}
                    </h3>
                    <p className="text-sm text-fg-muted">
                      by {commit.author?.login || commit.commit.author.name}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-line group-hover:text-fg-strong transition-colors" />
                </a>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-surface border border-dashed border-line rounded-2xl">
              <GitCommit className="w-12 h-12 text-line mx-auto mb-4" />
              <p className="text-fg-muted">
                {commits.length > 0 ? 'No commits match the current filters.' : 'No commits found.'}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {commits.length > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-fg-muted">
            Page {pagination.page} • {pagination.per_page} commits per page
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={!pagination.has_prev}
              className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-fg-strong transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-blue-500 hover:text-blue-400"
            >
              Previous
            </button>

            <span className="min-w-24 text-center text-sm text-fg-muted">
              Page {pagination.page}
            </span>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={!pagination.has_next}
              className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-fg-strong transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-blue-500 hover:text-blue-400"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

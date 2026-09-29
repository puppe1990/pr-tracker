import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ChevronRight, CircleDot, Clock, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Select, { StylesConfig } from 'react-select';
import {
  getIssueRepoName,
  getIssueRepoOwner,
  getVisibleIssues,
  type TrackerIssue,
} from './issues-list';
import { ListPageButtons } from './ListPageButtons';

export default function Issues() {
  const itemsPerPage = 10;
  const [issues, setIssues] = useState<TrackerIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('all');
  const [selectedLabel, setSelectedLabel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIssues = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/issues');
      if (response.ok) {
        const data: TrackerIssue[] = await response.json();
        setIssues(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || 'Failed to fetch issues');
      }
    } catch (err) {
      setError('Erro de conexão ao buscar issues.');
      console.error('Issues Fetch Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

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

  const repositories = Array.from(
    new Set(issues.map((issue) => getIssueRepoName(issue.repository_url)))
  ).sort((a, b) => a.localeCompare(b));

  const labels = Array.from(
    new Set(issues.flatMap((issue) => issue.labels.map((label) => label.name)))
  ).sort((a, b) => a.localeCompare(b));

  const visibleIssues = useMemo(
    () =>
      getVisibleIssues(issues, searchTerm, selectedRepo, selectedLabel, currentPage, itemsPerPage),
    [issues, searchTerm, selectedRepo, selectedLabel, currentPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRepo, selectedLabel]);

  useEffect(() => {
    if (currentPage > visibleIssues.totalPages) {
      setCurrentPage(visibleIssues.totalPages);
    }
  }, [currentPage, visibleIssues.totalPages]);

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
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'var(--pr-muted)'
        : state.isFocused
          ? 'var(--pr-focus)'
          : 'var(--pr-surface)',
      color: 'var(--pr-fg)',
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
  };

  const repoOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos' },
      ...repositories.map((repo) => ({ value: repo, label: repo })),
    ],
    [repositories]
  );

  const labelOptions = useMemo(
    () => [{ value: 'all', label: 'Todas' }, ...labels.map((label) => ({ value: label, label }))],
    [labels]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-fg-muted hover:text-fg-strong hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos PRs</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-fg-strong tracking-tight">Issues</h2>
          <p className="text-fg-muted mt-1">
            Listando issues abertas por você, da mais recente à mais antiga.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchIssues(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-fg-muted hover:text-fg-strong hover:bg-muted transition-colors self-end disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
          <div className="flex items-center gap-2 text-sm font-medium px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            {visibleIssues.total} de {issues.length} issues
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
            placeholder="Título ou repositório"
            className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-fg-strong outline-none transition focus:border-blue-500"
          />
        </label>

        <label className="space-y-2 block">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
            Repositório
          </span>
          <Select
            value={repoOptions.find((option) => option.value === selectedRepo)}
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

        <label className="space-y-2 block">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
            Label
          </span>
          <Select
            value={labelOptions.find((option) => option.value === selectedLabel)}
            onChange={(option: { value: string; label: string } | null) =>
              setSelectedLabel(option?.value || 'all')
            }
            options={labelOptions}
            styles={selectStyles}
            isSearchable
            placeholder="Todas"
            noOptionsMessage={() => 'Nenhuma label'}
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
                  <CircleDot className="absolute inset-0 m-auto h-5 w-5 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-fg-strong">Carregando issues</p>
                  <p className="text-sm text-fg-muted">Buscando issues abertas no GitHub...</p>
                </div>
              </div>
            </motion.div>
          ) : visibleIssues.total > 0 ? (
            visibleIssues.items.map((issue, index) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-surface border border-line rounded-xl overflow-hidden hover:border-fg-muted/50 transition-all hover:shadow-2xl hover:shadow-black/40"
              >
                <a
                  href={issue.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-5 gap-6"
                >
                  <div className="hidden sm:flex flex-col items-center justify-center w-12 h-12 bg-muted rounded-xl border border-line group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                    <CircleDot className="w-6 h-6 text-fg-muted group-hover:text-blue-400" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-fg-muted">
                      <span className="hover:text-blue-400 transition-colors">
                        {getIssueRepoOwner(issue.repository_url)}/
                        {getIssueRepoName(issue.repository_url)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(issue.created_at)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-fg-strong truncate group-hover:text-blue-400 transition-colors">
                      {issue.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {issue.labels.map((label) => (
                        <span
                          key={label.name}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                          style={{
                            backgroundColor: `#${label.color}20`,
                            borderColor: `#${label.color}40`,
                            color: `#${label.color}`,
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 text-fg-muted">
                      <img
                        src={issue.user.avatar_url}
                        className="w-6 h-6 rounded-full border border-line"
                        alt={issue.user.login}
                      />
                      <span className="text-sm">{issue.user.login}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-line group-hover:text-fg-strong transition-colors" />
                  </div>
                </a>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-surface border border-dashed border-line rounded-2xl">
              <CircleDot className="w-12 h-12 text-line mx-auto mb-4" />
              <p className="text-fg-muted">
                {issues.length > 0
                  ? 'Nenhuma issue corresponde aos filtros atuais.'
                  : 'Nenhuma issue aberta encontrada.'}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {visibleIssues.total > itemsPerPage ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-fg-muted">
            Mostrando {(visibleIssues.page - 1) * itemsPerPage + 1}-
            {Math.min(visibleIssues.page * itemsPerPage, visibleIssues.total)} de{' '}
            {visibleIssues.total} issues
          </p>
          <ListPageButtons
            currentPage={visibleIssues.page}
            totalPages={visibleIssues.totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : null}
    </div>
  );
}

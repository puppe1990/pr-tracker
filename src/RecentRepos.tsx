import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, ChevronRight, Clock, FolderGit2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Select, { StylesConfig } from 'react-select';
import { getVisibleRecentRepos, type RecentRepo } from './recent-repos';
import { ListPageButtons } from './ListPageButtons';

export default function RecentRepos() {
  const itemsPerPage = 10;
  const [repos, setRepos] = useState<RecentRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all');
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRepos = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await fetch('/api/repos');

      if (response.ok) {
        const data: RecentRepo[] = await response.json();
        setRepos(data);
      } else {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || 'Não foi possível carregar os repositórios.');
      }
    } catch (err) {
      console.error('Recent Repos Fetch Error:', err);
      setError('Erro de conexão ao buscar repositórios.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedOrganization, selectedRepo]);

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

  const {
    items: paginatedRepos,
    page: safeCurrentPage,
    total,
    totalPages,
  } = getVisibleRecentRepos(
    repos,
    searchTerm,
    selectedOrganization,
    selectedRepo,
    currentPage,
    itemsPerPage
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
          <h2 className="text-3xl font-bold text-fg-strong tracking-tight">Repos recentes</h2>
          <p className="text-fg-muted mt-1">Repositórios com commit mais recente no topo.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchRepos(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-fg-muted hover:text-fg-strong hover:bg-muted transition-colors self-end disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
          <div className="flex items-center gap-2 text-sm font-medium px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            {total} de {repos.length} repos
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
            placeholder="Nome, owner ou descrição"
            className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-fg-strong outline-none transition focus:border-blue-500"
          />
        </label>

        <label className="space-y-2">
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

        <label className="space-y-2">
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
              key="recent-repos-loading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-line bg-surface p-10"
            >
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="h-14 w-14 animate-spin rounded-full border-2 border-line border-t-blue-500"></div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-fg-strong">Buscando repositórios</p>
                  <p className="text-sm text-fg-muted">
                    Carregando do mais recente para o mais antigo.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : paginatedRepos.length > 0 ? (
            paginatedRepos.map((repo, index) => (
              <motion.a
                key={repo.full_name}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="group bg-surface border border-line rounded-xl overflow-hidden hover:border-fg-muted/50 transition-all hover:shadow-2xl hover:shadow-black/40"
              >
                <div className="flex items-center p-5 gap-6">
                  <div className="hidden sm:flex flex-col items-center justify-center w-12 h-12 bg-muted rounded-xl border border-line group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                    <FolderGit2 className="w-6 h-6 text-fg-muted group-hover:text-blue-400" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-fg-muted">
                      <span>{repo.full_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(repo.updated_at)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-fg-strong truncate group-hover:text-blue-400 transition-colors">
                      {repo.name}
                    </h3>
                    <p className="text-sm text-fg-muted line-clamp-2">
                      {repo.description || 'Sem descrição.'}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-line group-hover:text-fg-strong transition-colors" />
                </div>
              </motion.a>
            ))
          ) : (
            <div className="text-center py-20 bg-surface border border-dashed border-line rounded-2xl">
              <FolderGit2 className="w-12 h-12 text-line mx-auto mb-4" />
              <p className="text-fg-muted">
                {repos.length > 0
                  ? 'Nenhum repositório corresponde aos filtros atuais.'
                  : 'Nenhum repositório recente encontrado.'}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {total > itemsPerPage ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-fg-muted">
            Mostrando {Math.min((safeCurrentPage - 1) * itemsPerPage + 1, total)}-
            {Math.min(safeCurrentPage * itemsPerPage, total)} de {total} repositórios
          </p>

          <ListPageButtons
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : null}
    </div>
  );
}

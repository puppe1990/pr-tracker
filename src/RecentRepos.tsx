import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertCircle, ChevronRight, Clock, FolderGit2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getVisibleRecentRepos, type RecentRepo } from "./recent-repos";

export default function RecentRepos() {
  const itemsPerPage = 10;
  const [repos, setRepos] = useState<RecentRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRepos = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await fetch("/api/repos");

      if (response.ok) {
        const data: RecentRepo[] = await response.json();
        setRepos(data);
      } else {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || "Não foi possível carregar os repositórios.");
      }
    } catch (err) {
      console.error("Recent Repos Fetch Error:", err);
      setError("Erro de conexão ao buscar repositórios.");
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
  }, [searchTerm]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const { items: paginatedRepos, page: safeCurrentPage, total, totalPages } = getVisibleRecentRepos(
    repos,
    searchTerm,
    currentPage,
    itemsPerPage
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to PRs</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Repos recentes</h2>
          <p className="text-[#8b949e] mt-1">Repositórios com commit mais recente no topo.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchRepos(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors self-end disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
          <div className="flex items-center gap-2 text-sm font-medium px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            {total} de {repos.length} repos
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-[#30363d] bg-[#161b22] p-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b949e]">Buscar</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Nome, owner ou descrição"
            className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
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
              className="rounded-2xl border border-[#30363d] bg-[#161b22] p-10"
            >
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="h-14 w-14 animate-spin rounded-full border-2 border-[#30363d] border-t-blue-500"></div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-white">Buscando repositórios</p>
                  <p className="text-sm text-[#8b949e]">Carregando do mais recente para o mais antigo.</p>
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
                className="group bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden hover:border-[#8b949e]/50 transition-all hover:shadow-2xl hover:shadow-black/40"
              >
                <div className="flex items-center p-5 gap-6">
                  <div className="hidden sm:flex flex-col items-center justify-center w-12 h-12 bg-[#21262d] rounded-xl border border-[#30363d] group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                    <FolderGit2 className="w-6 h-6 text-[#8b949e] group-hover:text-blue-400" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e]">
                      <span>{repo.full_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(repo.updated_at)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                      {repo.name}
                    </h3>
                    <p className="text-sm text-[#8b949e] line-clamp-2">
                      {repo.description || "Sem descrição."}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-[#30363d] group-hover:text-white transition-colors" />
                </div>
              </motion.a>
            ))
          ) : (
            <div className="text-center py-20 bg-[#161b22] border border-dashed border-[#30363d] rounded-2xl">
              <FolderGit2 className="w-12 h-12 text-[#30363d] mx-auto mb-4" />
              <p className="text-[#8b949e]">Nenhum repositório recente encontrado.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {total > itemsPerPage ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-[#30363d] bg-[#161b22] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#8b949e]">
            Mostrando {Math.min((safeCurrentPage - 1) * itemsPerPage + 1, total)}-
            {Math.min(safeCurrentPage * itemsPerPage, total)} de {total} repositórios
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-xl border border-[#30363d] px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-blue-500 hover:text-blue-400"
            >
              Anterior
            </button>

            <span className="min-w-24 text-center text-sm text-[#8b949e]">
              Página {safeCurrentPage} de {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className="rounded-xl border border-[#30363d] px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-blue-500 hover:text-blue-400"
            >
              Próxima
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

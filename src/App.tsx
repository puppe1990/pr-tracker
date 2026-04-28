import { useState, useEffect, useCallback, useMemo } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { Github, GitPullRequest, Clock, ChevronRight, AlertCircle, KeyRound, Home, GitCommit, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Select, { StylesConfig } from "react-select";
import Commits from "./Commits";
import RecentRepos from "./RecentRepos";

interface PR {
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

interface UserData {
  login: string;
  avatar_url: string;
  name: string;
}

export default function App() {
  const itemsPerPage = 10;
  const [user, setUser] = useState<UserData | null>(null);
  const [prs, setPrs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [githubConfigured, setGithubConfigured] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("all");
  const [selectedLabel, setSelectedLabel] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/user");
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setGithubConfigured(true);
        await fetchPRs();
      } else {
        const data = await response.json().catch(() => null);
        setUser(null);
        setGithubConfigured(response.status !== 503);
        if (response.status === 503) {
          setError("Defina GITHUB_PERSONAL_ACCESS_TOKEN no ambiente do servidor para consultar a API do GitHub.");
        } else {
          setError(data?.error || "Não foi possível carregar os dados do GitHub.");
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      setError("Erro de conexão ao buscar dados do GitHub.");
      setLoading(false);
    }
  }, []);

  const fetchPRs = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await fetch("/api/prs");
      if (response.ok) {
        const data = await response.json();
        setPrs(data);
      } else {
        const data = await response.json().catch(() => null);
        setError(data?.error || "Não foi possível carregar seus Pull Requests.");
      }
    } catch (err) {
      setError("Erro de conexão ao buscar PRs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchPRs(true);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const getRepoName = (url: string) => {
    return url.split("/").slice(-1)[0];
  };

  const getRepoOwner = (url: string) => {
    return url.split("/").slice(-2, -1)[0];
  };

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

  const repositories = Array.from<string>(
    new Set(prs.map((pr) => getRepoName(pr.repository_url))) as Set<string>
  ).sort((a, b) => a.localeCompare(b));

  const labels = Array.from<string>(
    new Set(prs.flatMap((pr) => pr.labels.map((label) => label.name))) as Set<string>
  ).sort((a, b) => a.localeCompare(b));

  const filteredPrs = prs.filter((pr) => {
    const repoName = getRepoName(pr.repository_url);
    const matchesSearch =
      searchTerm.trim().length === 0 ||
      pr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repoName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRepo = selectedRepo === "all" || repoName === selectedRepo;
    const matchesLabel =
      selectedLabel === "all" || pr.labels.some((label) => label.name === selectedLabel);

    return matchesSearch && matchesRepo && matchesLabel;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPrs.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPrs = filteredPrs.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRepo, selectedLabel]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const selectStyles: StylesConfig = {
    control: (base) => ({
      ...base,
      backgroundColor: "#0d1117",
      borderColor: "#30363d",
      borderRadius: "0.75rem",
      minHeight: "48px",
      boxShadow: "none",
      "&:hover": {
        borderColor: "#3b82f6",
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#161b22",
      border: "1px solid #30363d",
      borderRadius: "0.75rem",
      overflow: "hidden",
    }),
    menuList: (base) => ({
      ...base,
      padding: "4px",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#21262d" : state.isFocused ? "#1c2128" : "#161b22",
      color: "#c9d1d9",
      borderRadius: "0.5rem",
      padding: "8px 12px",
      "&:active": {
        backgroundColor: "#21262d",
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: "#c9d1d9",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#8b949e",
    }),
    input: (base) => ({
      ...base,
      color: "#c9d1d9",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "#8b949e",
      "&:hover": {
        color: "#c9d1d9",
      },
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: "#30363d",
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: "#8b949e",
    }),
  };

  const repoOptions = useMemo(() => [
    { value: "all", label: "Todos" },
    ...repositories.map((repo) => ({ value: repo, label: repo }))
  ], [repositories]);

  const labelOptions = useMemo(() => [
    { value: "all", label: "Todas" },
    ...labels.map((label) => ({ value: label, label: label }))
  ], [labels]);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-[#30363d] bg-[#161b22]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="bg-[#21262d] p-2 rounded-lg border border-[#30363d]">
                <Home className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-white tracking-tight">PR Tracker</h1>
            </a>
          </div>

          <nav className="flex items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white bg-[#21262d]"
                    : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                }`
              }
            >
              <GitPullRequest className="w-4 h-4" />
              <span className="hidden sm:inline">PRs</span>
            </NavLink>
            <NavLink
              to="/commits"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white bg-[#21262d]"
                    : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                }`
              }
            >
              <GitCommit className="w-4 h-4" />
              <span className="hidden sm:inline">Commits</span>
            </NavLink>
            <NavLink
              to="/repos-recentes"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white bg-[#21262d]"
                    : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                }`
              }
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Repos recentes</span>
            </NavLink>
          </nav>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#21262d] rounded-full border border-[#30363d]">
                <img src={user.avatar_url} alt={user.login} className="w-5 h-5 rounded-full" />
                <span className="text-sm font-medium text-[#8b949e]">{user.login}</span>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <Routes>
          <Route path="/" element={!user ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center space-y-8 py-20"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full"></div>
              <KeyRound className="w-20 h-20 text-blue-500 relative" />
            </div>
            <div className="space-y-4 max-w-md">
              <h2 className="text-4xl font-bold text-white tracking-tight">Configure seu token</h2>
              <p className="text-[#8b949e] text-lg">
                Este app agora usa um Personal Access Token do GitHub no backend para listar seus Pull Requests abertos.
              </p>
            </div>
            <div className="max-w-xl w-full rounded-2xl border border-[#30363d] bg-[#161b22] p-6 text-left">
              <p className="text-sm text-[#8b949e]">
                Defina <code className="text-white">GITHUB_PERSONAL_ACCESS_TOKEN</code> no arquivo <code className="text-white">.env</code> do servidor e reinicie a aplicação.
              </p>
              <p className="text-sm text-[#8b949e] mt-3">
                Status atual:{" "}
                <span className={githubConfigured ? "text-emerald-400" : "text-amber-400"}>
                  {githubConfigured ? "token detectado" : "token ausente"}
                </span>
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Seus Pull Requests</h2>
                <p className="text-[#8b949e] mt-1">Listando PRs abertos por você, do mais recente ao mais antigo.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>
                <div className="flex items-center gap-2 text-sm font-medium px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  {filteredPrs.length} de {prs.length} PRs
                </div>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-[#30363d] bg-[#161b22] p-4 sm:grid-cols-3">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b949e]">Buscar</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Título ou repositório"
                  className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b949e]">Repositório</span>
                <Select
                  value={repoOptions.find(opt => opt.value === selectedRepo)}
                  onChange={(option: { value: string; label: string } | null) => setSelectedRepo(option?.value || "all")}
                  options={repoOptions}
                  styles={selectStyles}
                  isSearchable
                  placeholder="Todos"
                  noOptionsMessage={() => "Nenhum repositório"}
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b949e]">Label</span>
                <Select
                  value={labelOptions.find(opt => opt.value === selectedLabel)}
                  onChange={(option: { value: string; label: string } | null) => setSelectedLabel(option?.value || "all")}
                  options={labelOptions}
                  styles={selectStyles}
                  isSearchable
                  placeholder="Todas"
                  noOptionsMessage={() => "Nenhuma label"}
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
                    className="rounded-2xl border border-[#30363d] bg-[#161b22] p-10"
                  >
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <div className="relative">
                        <div className="h-14 w-14 animate-spin rounded-full border-2 border-[#30363d] border-t-blue-500"></div>
                        <Github className="absolute inset-0 m-auto h-5 w-5 text-blue-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-white">Buscando dados no GitHub</p>
                        <p className="text-sm text-[#8b949e]">
                          Carregando seus Pull Requests e metadados mais recentes.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : filteredPrs.length > 0 ? (
                  paginatedPrs.map((pr, index) => (
                    <motion.div
                      key={pr.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden hover:border-[#8b949e]/50 transition-all hover:shadow-2xl hover:shadow-black/40"
                    >
                      {(() => {
                        const repoName = getRepoName(pr.repository_url);
                        const repoOwner = getRepoOwner(pr.repository_url);

                        return (
                      <a 
                        href={pr.html_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center p-5 gap-6"
                      >
                        <div className="hidden sm:flex flex-col items-center justify-center w-12 h-12 bg-[#21262d] rounded-xl border border-[#30363d] group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                          <GitPullRequest className="w-6 h-6 text-[#8b949e] group-hover:text-blue-400" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e]">
                            <span className="hover:text-blue-400 transition-colors">
                              {repoOwner}/{repoName}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(pr.created_at)}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                            {pr.title}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {pr.labels.map(label => (
                              <span 
                                key={label.name}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                                style={{ 
                                  backgroundColor: `#${label.color}20`, 
                                  borderColor: `#${label.color}40`,
                                  color: `#${label.color}`
                                }}
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="hidden md:flex items-center gap-2 text-[#8b949e]">
                            <img src={pr.user.avatar_url} className="w-6 h-6 rounded-full border border-[#30363d]" alt={pr.user.login} />
                            <span className="text-sm">{pr.user.login}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#30363d] group-hover:text-white transition-colors" />
                        </div>
                      </a>
                        );
                      })()}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-[#161b22] border border-dashed border-[#30363d] rounded-2xl">
                    <GitPullRequest className="w-12 h-12 text-[#30363d] mx-auto mb-4" />
                    <p className="text-[#8b949e]">
                      {prs.length > 0
                        ? "Nenhum Pull Request corresponde aos filtros atuais."
                        : "Nenhum Pull Request aberto encontrado."}
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {filteredPrs.length > itemsPerPage ? (
              <div className="flex flex-col gap-4 rounded-2xl border border-[#30363d] bg-[#161b22] p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#8b949e]">
                  Mostrando {Math.min((safeCurrentPage - 1) * itemsPerPage + 1, filteredPrs.length)}-
                  {Math.min(safeCurrentPage * itemsPerPage, filteredPrs.length)} de {filteredPrs.length} PRs
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
        )} />
          <Route path="/commits" element={<Commits />} />
          <Route path="/repos-recentes" element={<RecentRepos />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-[#30363d] mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[#8b949e] text-sm">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4" />
            <span>GitHub PR Tracker</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub API</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

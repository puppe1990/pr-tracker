import { useState, useEffect } from "react";
import { Github, LogOut, ExternalLink, GitPullRequest, Clock, User, ChevronRight, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const [user, setUser] = useState<UserData | null>(null);
  const [prs, setPrs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        fetchPRs();
      } else {
        setUser(null);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      setLoading(false);
    }
  };

  const fetchPRs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/prs");
      if (response.ok) {
        const data = await response.json();
        setPrs(data);
      } else {
        setError("Não foi possível carregar seus Pull Requests.");
      }
    } catch (err) {
      setError("Erro de conexão ao buscar PRs.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/auth/github/url");
      const { url } = await response.json();
      
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        url,
        "github_oauth",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        alert("Por favor, permita popups para este site para conectar sua conta do GitHub.");
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
    setPrs([]);
  };

  useEffect(() => {
    fetchUserData();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        fetchUserData();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const getRepoName = (url: string) => {
    return url.split("/").slice(-1)[0];
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
            <div className="bg-[#21262d] p-2 rounded-lg border border-[#30363d]">
              <Github className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-white tracking-tight">PR Tracker</h1>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#21262d] rounded-full border border-[#30363d]">
                <img src={user.avatar_url} alt={user.login} className="w-5 h-5 rounded-full" />
                <span className="text-sm font-medium text-[#8b949e]">{user.login}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-[#21262d] rounded-lg transition-colors text-[#8b949e] hover:text-red-400"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {!user ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center space-y-8 py-20"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full"></div>
              <GitPullRequest className="w-20 h-20 text-blue-500 relative" />
            </div>
            <div className="space-y-4 max-w-md">
              <h2 className="text-4xl font-bold text-white tracking-tight">Acompanhe seus PRs</h2>
              <p className="text-[#8b949e] text-lg">
                Conecte sua conta do GitHub para visualizar todos os seus Pull Requests abertos em um só lugar.
              </p>
            </div>
            <button
              onClick={handleLogin}
              className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-[#f0f6fc] transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
            >
              <Github className="w-6 h-6" />
              Conectar com GitHub
            </button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Seus Pull Requests</h2>
                <p className="text-[#8b949e] mt-1">Listando PRs abertos por você, do mais recente ao mais antigo.</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                {prs.length} PRs Abertos
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {prs.length > 0 ? (
                  prs.map((pr, index) => (
                    <motion.div
                      key={pr.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden hover:border-[#8b949e]/50 transition-all hover:shadow-2xl hover:shadow-black/40"
                    >
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
                            <span className="hover:text-blue-400 transition-colors">{getRepoName(pr.repository_url)}</span>
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
                    </motion.div>
                  ))
                ) : !loading && (
                  <div className="text-center py-20 bg-[#161b22] border border-dashed border-[#30363d] rounded-2xl">
                    <GitPullRequest className="w-12 h-12 text-[#30363d] mx-auto mb-4" />
                    <p className="text-[#8b949e]">Nenhum Pull Request aberto encontrado.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
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

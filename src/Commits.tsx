import { useState, useEffect } from "react";
import { GitCommit, Clock, ChevronRight, AlertCircle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Commit {
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
}

export default function Commits() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repo, setRepo] = useState("matheuspuppe/pr-tracker");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    per_page: 20,
    has_next: false,
    has_prev: false,
  });

  const fetchCommits = async (pageNum: number = pagination.page) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/commits?repo=${encodeURIComponent(repo)}&page=${pageNum}&per_page=${pagination.per_page}`
      );

      if (response.ok) {
        const data: CommitsResponse = await response.json();
        setCommits(data.commits);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || "Failed to fetch commits");
      }
    } catch (err) {
      setError("Connection error while fetching commits");
      console.error("Commits Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommits(1);
  }, [repo]);

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

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <a
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to PRs</span>
        </a>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Commits</h2>
          <p className="text-[#8b949e] mt-1">Browse repository commits with pagination.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4">
        <label className="space-y-2 block">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b949e]">
            Repository
          </span>
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="owner/repo"
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
              key="loading-state"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-[#30363d] bg-[#161b22] p-10"
            >
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="relative">
                  <div className="h-14 w-14 animate-spin rounded-full border-2 border-[#30363d] border-t-blue-500"></div>
                  <GitCommit className="absolute inset-0 m-auto h-5 w-5 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-white">Loading commits</p>
                  <p className="text-sm text-[#8b949e]">
                    Fetching commits from GitHub API...
                  </p>
                </div>
              </div>
            </motion.div>
          ) : commits.length > 0 ? (
            commits.map((commit, index) => (
              <motion.div
                key={commit.sha}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden hover:border-[#8b949e]/50 transition-all hover:shadow-2xl hover:shadow-black/40"
              >
                <a
                  href={commit.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-5 gap-6"
                >
                  <div className="hidden sm:flex flex-col items-center justify-center w-12 h-12 bg-[#21262d] rounded-xl border border-[#30363d] group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                    <GitCommit className="w-6 h-6 text-[#8b949e] group-hover:text-blue-400" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e]">
                      <code className="px-2 py-0.5 bg-[#0d1117] rounded">
                        {commit.sha.substring(0, 7)}
                      </code>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(commit.commit.author.date)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {commit.commit.message.split("\n")[0]}
                    </h3>
                    <p className="text-sm text-[#8b949e]">
                      by {commit.author?.login || commit.commit.author.name}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-[#30363d] group-hover:text-white transition-colors" />
                </a>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-[#161b22] border border-dashed border-[#30363d] rounded-2xl">
              <GitCommit className="w-12 h-12 text-[#30363d] mx-auto mb-4" />
              <p className="text-[#8b949e]">No commits found.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {commits.length > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-[#30363d] bg-[#161b22] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#8b949e]">
            Page {pagination.page} • {pagination.per_page} commits per page
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={!pagination.has_prev}
              className="rounded-xl border border-[#30363d] px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-blue-500 hover:text-blue-400"
            >
              Previous
            </button>

            <span className="min-w-24 text-center text-sm text-[#8b949e]">
              Page {pagination.page}
            </span>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={!pagination.has_next}
              className="rounded-xl border border-[#30363d] px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-blue-500 hover:text-blue-400"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

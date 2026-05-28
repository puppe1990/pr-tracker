import { describe, expect, it } from "vitest";
import { getVisibleCommits, type Commit } from "./commits-list";

const commits: Commit[] = [
  {
    sha: "abc123",
    commit: {
      message: "Fix login bug",
      author: {
        name: "Alice Example",
        email: "alice@example.com",
        date: "2024-01-01T10:00:00Z",
      },
    },
    html_url: "https://github.com/org/alpha/commit/abc123",
    repo: "org/alpha",
    author: {
      login: "alice",
      avatar_url: "",
    },
  },
  {
    sha: "def456",
    commit: {
      message: "Add search filters",
      author: {
        name: "Bob Example",
        email: "bob@example.com",
        date: "2024-01-02T10:00:00Z",
      },
    },
    html_url: "https://github.com/org/bravo/commit/def456",
    repo: "org/bravo",
    author: {
      login: "bob",
      avatar_url: "",
    },
  },
  {
    sha: "ghi789",
    commit: {
      message: "Update docs",
      author: {
        name: "Carol Example",
        email: "carol@example.com",
        date: "2024-01-03T10:00:00Z",
      },
    },
    html_url: "https://github.com/org/bravo/commit/ghi789",
    repo: "org/bravo",
  },
];

describe("getVisibleCommits", () => {
  it("filters commits by search term across message, author, sha and repo", () => {
    const result = getVisibleCommits(commits, "alice", "all", 1, 10);

    expect(result.total).toBe(1);
    expect(result.items.map((commit) => commit.sha)).toEqual(["abc123"]);
  });

  it("filters commits by selected repository", () => {
    const result = getVisibleCommits(commits, "", "org/bravo", 1, 10);

    expect(result.total).toBe(2);
    expect(result.items.map((commit) => commit.sha)).toEqual(["def456", "ghi789"]);
  });

  it("returns the requested page after filtering", () => {
    const result = getVisibleCommits(commits, "", "all", 2, 1);

    expect(result.page).toBe(2);
    expect(result.items.map((commit) => commit.sha)).toEqual(["def456"]);
  });
});

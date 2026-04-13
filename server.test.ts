import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "./server";
import axios from "axios";

// Mock axios
vi.mock("axios");

// Set test environment
process.env.NODE_ENV = "test";

describe("GET /api/commits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default token for most tests
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN = "test-token";
  });

  it("should return 503 if GitHub token is not configured", async () => {
    const originalToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    delete process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

    const app = await createApp();
    const response = await request(app).get("/api/commits");

    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("GitHub token not configured");
    expect(response.body).toHaveProperty("missingEnv", "GITHUB_PERSONAL_ACCESS_TOKEN");

    process.env.GITHUB_PERSONAL_ACCESS_TOKEN = originalToken;
  });

  it("should return 400 when repo parameter is missing", async () => {
    const app = await createApp();
    const response = await request(app).get("/api/commits");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("Repository parameter is required");
  });

  it("should return commits with pagination metadata", async () => {
    const mockCommits = [
      {
        sha: "abc123",
        commit: {
          message: "Fix bug",
          author: {
            name: "Test User",
            email: "test@example.com",
            date: "2024-01-01T00:00:00Z",
          },
        },
        html_url: "https://github.com/test/repo/commit/abc123",
      },
      {
        sha: "def456",
        commit: {
          message: "Add feature",
          author: {
            name: "Test User",
            email: "test@example.com",
            date: "2024-01-02T00:00:00Z",
          },
        },
        html_url: "https://github.com/test/repo/commit/def456",
      },
    ];

    (axios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockCommits,
      headers: {
        link: '<https://api.github.com/repositories/123/commits?page=2>; rel="next"',
      },
    });

    const app = await createApp();
    const response = await request(app)
      .get("/api/commits")
      .query({ repo: "test/repo", page: 1, per_page: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("commits");
    expect(response.body).toHaveProperty("pagination");
    expect(response.body.pagination).toHaveProperty("page", 1);
    expect(response.body.pagination).toHaveProperty("per_page", 10);
    expect(response.body.pagination).toHaveProperty("has_next", true);
    expect(response.body.pagination).toHaveProperty("has_prev", false);
    expect(Array.isArray(response.body.commits)).toBe(true);
    expect(response.body.commits).toHaveLength(2);
  });

  it("should return paginated commits when page 2 is requested", async () => {
    const mockCommits = [
      {
        sha: "ghi789",
        commit: {
          message: "Update docs",
          author: {
            name: "Test User",
            email: "test@example.com",
            date: "2024-01-03T00:00:00Z",
          },
        },
        html_url: "https://github.com/test/repo/commit/ghi789",
      },
    ];

    (axios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockCommits,
      headers: {
        link: '<https://api.github.com/repositories/123/commits?page=1>; rel="prev", <https://api.github.com/repositories/123/commits?page=3>; rel="next"',
      },
    });

    const app = await createApp();
    const response = await request(app)
      .get("/api/commits")
      .query({ repo: "test/repo", page: 2, per_page: 5 });

    expect(response.status).toBe(200);
    expect(response.body.pagination).toHaveProperty("page", 2);
    expect(response.body.pagination).toHaveProperty("per_page", 5);
    expect(response.body.pagination).toHaveProperty("has_next", true);
    expect(response.body.pagination).toHaveProperty("has_prev", true);
    expect(response.body.commits).toHaveLength(1);
    expect(response.body.commits[0].sha).toBe("ghi789");
  });

  it("should use default pagination values when not provided", async () => {
    const mockCommits = Array(10).fill({
      sha: "abc123",
      commit: {
        message: "Commit message",
        author: {
          name: "Test User",
          email: "test@example.com",
          date: "2024-01-01T00:00:00Z",
        },
      },
      html_url: "https://github.com/test/repo/commit/abc123",
    });

    (axios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockCommits,
      headers: {},
    });

    const app = await createApp();
    const response = await request(app)
      .get("/api/commits")
      .query({ repo: "test/repo" });

    expect(response.status).toBe(200);
    expect(response.body.pagination).toHaveProperty("page", 1);
    expect(response.body.pagination).toHaveProperty("per_page", 20); // default value
  });

  it("should return 500 when GitHub API request fails", async () => {
    (axios.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

    const app = await createApp();
    const response = await request(app)
      .get("/api/commits")
      .query({ repo: "test/repo" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("Failed to fetch commits");
  });

  it("should clamp per_page to max 100", async () => {
    const mockCommits = Array(50).fill({
      sha: "abc123",
      commit: {
        message: "Commit message",
        author: {
          name: "Test User",
          email: "test@example.com",
          date: "2024-01-01T00:00:00Z",
        },
      },
      html_url: "https://github.com/test/repo/commit/abc123",
    });

    (axios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockCommits,
      headers: {},
    });

    const app = await createApp();
    const response = await request(app)
      .get("/api/commits")
      .query({ repo: "test/repo", per_page: 200 });

    expect(response.status).toBe(200);
    // Should use 100 instead of 200
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/commits"),
      expect.objectContaining({
        params: expect.objectContaining({
          per_page: 100,
        }),
      })
    );
  });

  it("should ensure per_page is at least 1", async () => {
    const mockCommits = [];

    (axios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockCommits,
      headers: {},
    });

    const app = await createApp();
    const response = await request(app)
      .get("/api/commits")
      .query({ repo: "test/repo", per_page: -5 });

    expect(response.status).toBe(200);
    // Should use 1 instead of -5
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/commits"),
      expect.objectContaining({
        params: expect.objectContaining({
          per_page: 1,
        }),
      })
    );
  });
});

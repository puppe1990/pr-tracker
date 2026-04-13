import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(__dirname);

describe("Netlify production API wiring", () => {
  it("exposes commits and repos endpoints via functions and redirects", () => {
    const netlifyToml = fs.readFileSync(path.join(projectRoot, "netlify.toml"), "utf8");

    expect(netlifyToml).toContain('from = "/api/repos"');
    expect(netlifyToml).toContain('to = "/.netlify/functions/repos"');
    expect(netlifyToml).toContain('from = "/api/commits"');
    expect(netlifyToml).toContain('to = "/.netlify/functions/commits"');

    expect(fs.existsSync(path.join(projectRoot, "netlify/functions/repos.mts"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "netlify/functions/commits.mts"))).toBe(true);
  });
});

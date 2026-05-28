import { describe, expect, it } from "vitest";
import { getRepoOrganization } from "./repo-organization";

describe("getRepoOrganization", () => {
  it("returns the owner segment from a full repository name", () => {
    expect(getRepoOrganization("org-name/repo-name")).toBe("org-name");
  });

  it("returns an empty string for missing values", () => {
    expect(getRepoOrganization(undefined)).toBe("");
  });
});

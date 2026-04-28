import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import RecentRepos from "./RecentRepos";

describe("App recent repos tab", () => {
  it("renders the recent repos screen and nav entry", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/repos-recentes"]}>
        <RecentRepos />
      </MemoryRouter>
    );

    expect(html).toContain("Repos recentes");
    expect(html).toContain("Repositórios com commit mais recente");
  });
});

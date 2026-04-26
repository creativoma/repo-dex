import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scrapeGithub } from "./github";

const mockApiResponse = {
  name: "my-repo",
  description: "A great repo",
  stargazers_count: 1234,
  forks_count: 56,
  language: "TypeScript",
  topics: ["web", "tool"],
  owner: { login: "acme" },
  homepage: "https://acme.dev",
};

describe("scrapeGithub", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed metadata for a valid repo URL", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockApiResponse), { status: 200 })
    );

    const meta = await scrapeGithub("https://github.com/acme/my-repo");

    expect(meta).toEqual({
      name: "my-repo",
      description: "A great repo",
      stars: 1234,
      forks: 56,
      language: "TypeScript",
      topics: ["web", "tool"],
      author: "acme",
      homepage: "https://acme.dev",
    });
  });

  it("defaults topics to [] when the API omits the field", async () => {
    const noTopics = { ...mockApiResponse, topics: undefined };
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(noTopics), { status: 200 }));

    const meta = await scrapeGithub("https://github.com/acme/my-repo");
    expect(meta.topics).toEqual([]);
  });

  it("throws when the API returns a non-OK status", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 404 }));

    await expect(scrapeGithub("https://github.com/acme/my-repo")).rejects.toThrow(
      "GitHub API error 404"
    );
  });

  it("throws for a URL with no owner/repo path", async () => {
    await expect(scrapeGithub("https://github.com/")).rejects.toThrow("Invalid GitHub URL");
  });
});

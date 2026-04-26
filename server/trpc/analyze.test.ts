import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/detect-url-type");
vi.mock("../services/gemini");
vi.mock("../services/github");
vi.mock("../services/npm");
vi.mock("../services/web-scraper");

import { detectUrlType } from "../services/detect-url-type";
import { analyzeWithGemini } from "../services/gemini";
import { scrapeGithub } from "../services/github";
import { scrapeNpm } from "../services/npm";
import { scrapeWeb } from "../services/web-scraper";
import { analyzeRouter } from "./analyze";

const adminCtx = { isAdmin: true, req: new Request("http://localhost/") };
const publicCtx = { isAdmin: false, req: new Request("http://localhost/") };

const geminiResult = {
  title: "Test Resource",
  description: "A test resource",
  tags: ["react", "typescript"],
  author: "testuser",
  difficulty: "intermediate" as const,
  language: "TypeScript",
};

describe("analyzeRouter.byUrl", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("throws UNAUTHORIZED when caller is not admin", async () => {
    const caller = analyzeRouter.createCaller(publicCtx);
    await expect(caller.byUrl({ url: "https://github.com/foo/bar" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("scrapes GitHub repo and returns analyzed result", async () => {
    vi.mocked(detectUrlType).mockReturnValue("github");
    vi.mocked(scrapeGithub).mockResolvedValue({
      name: "bar",
      description: "desc",
      stars: 1234,
      forks: 10,
      language: "TypeScript",
      topics: ["react"],
      author: "foo",
      homepage: null,
    });
    vi.mocked(analyzeWithGemini).mockResolvedValue(geminiResult);

    const caller = analyzeRouter.createCaller(adminCtx);
    const result = await caller.byUrl({ url: "https://github.com/foo/bar" });

    expect(result.type).toBe("github");
    expect(result.stars).toBe(1234);
    expect(result.title).toBe("Test Resource");
    expect(result.weeklyDownloads).toBeNull();
  });

  it("scrapes npm package and returns analyzed result", async () => {
    vi.mocked(detectUrlType).mockReturnValue("npm");
    vi.mocked(scrapeNpm).mockResolvedValue({
      name: "my-pkg",
      description: "a package",
      version: "1.0.0",
      weeklyDownloads: 50_000,
      keywords: ["util"],
      author: "someone",
    });
    vi.mocked(analyzeWithGemini).mockResolvedValue({ ...geminiResult, title: "my-pkg" });

    const caller = analyzeRouter.createCaller(adminCtx);
    const result = await caller.byUrl({ url: "https://www.npmjs.com/package/my-pkg" });

    expect(result.type).toBe("npm");
    expect(result.weeklyDownloads).toBe(50_000);
    expect(result.stars).toBeNull();
  });

  it("scrapes web page and returns analyzed result", async () => {
    vi.mocked(detectUrlType).mockReturnValue("web");
    vi.mocked(scrapeWeb).mockResolvedValue({
      title: "My Site",
      description: "cool site",
      author: null,
      keywords: [],
      url: "https://example.com",
    });
    vi.mocked(analyzeWithGemini).mockResolvedValue({ ...geminiResult, title: "My Site" });

    const caller = analyzeRouter.createCaller(adminCtx);
    const result = await caller.byUrl({ url: "https://example.com" });

    expect(result.type).toBe("web");
    expect(result.title).toBe("My Site");
  });

  it("proceeds with partial metadata when scraping throws", async () => {
    vi.mocked(detectUrlType).mockReturnValue("github");
    vi.mocked(scrapeGithub).mockRejectedValue(new Error("network error"));
    vi.mocked(analyzeWithGemini).mockResolvedValue({ ...geminiResult, title: undefined });

    const caller = analyzeRouter.createCaller(adminCtx);
    const result = await caller.byUrl({ url: "https://github.com/foo/bar" });

    expect(result.type).toBe("github");
    // falls back to URL when title is missing from AI result and rawMeta
    expect(result.title).toBe("https://github.com/foo/bar");
  });

  it("falls back to rawMeta fields when AI returns empty result", async () => {
    vi.mocked(detectUrlType).mockReturnValue("npm");
    vi.mocked(scrapeNpm).mockResolvedValue({
      name: "fallback-pkg",
      description: "fallback desc",
      version: "2.0.0",
      weeklyDownloads: 0,
      keywords: ["a", "b"],
      author: null,
    });
    vi.mocked(analyzeWithGemini).mockResolvedValue({});

    const caller = analyzeRouter.createCaller(adminCtx);
    const result = await caller.byUrl({ url: "https://www.npmjs.com/package/fallback-pkg" });

    expect(result.title).toBe("fallback-pkg");
    expect(result.tags).toEqual(["a", "b"]);
  });
});

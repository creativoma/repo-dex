import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scrapeNpm } from "./npm";

const mockRegistry = {
  name: "lodash",
  description: "A modern JavaScript utility library",
  "dist-tags": { latest: "4.17.21" },
  keywords: ["utility", "functional"],
  author: { name: "John-David Dalton" },
};

const mockDownloads = { downloads: 50_000_000 };

function makeResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("scrapeNpm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed metadata for a standard npmjs.com URL", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeResponse(mockRegistry))
      .mockResolvedValueOnce(makeResponse(mockDownloads));

    const meta = await scrapeNpm("https://www.npmjs.com/package/lodash");

    expect(meta).toEqual({
      name: "lodash",
      description: "A modern JavaScript utility library",
      version: "4.17.21",
      weeklyDownloads: 50_000_000,
      keywords: ["utility", "functional"],
      author: "John-David Dalton",
    });
  });

  it("handles a scoped package URL", async () => {
    const scopedRegistry = { ...mockRegistry, name: "@scope/pkg" };
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeResponse(scopedRegistry))
      .mockResolvedValueOnce(makeResponse(mockDownloads));

    const meta = await scrapeNpm("https://www.npmjs.com/package/@scope/pkg");
    expect(meta.name).toBe("@scope/pkg");
  });

  it("defaults weeklyDownloads to 0 when downloads API fails", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeResponse(mockRegistry))
      .mockRejectedValueOnce(new Error("network error"));

    const meta = await scrapeNpm("https://www.npmjs.com/package/lodash");
    expect(meta.weeklyDownloads).toBe(0);
  });

  it("handles author as a plain string", async () => {
    const reg = { ...mockRegistry, author: "jdalton" };
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeResponse(reg))
      .mockResolvedValueOnce(makeResponse(mockDownloads));

    const meta = await scrapeNpm("https://www.npmjs.com/package/lodash");
    expect(meta.author).toBe("jdalton");
  });

  it("sets author to null when author field is absent", async () => {
    const reg = { ...mockRegistry, author: undefined };
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeResponse(reg))
      .mockResolvedValueOnce(makeResponse(mockDownloads));

    const meta = await scrapeNpm("https://www.npmjs.com/package/lodash");
    expect(meta.author).toBeNull();
  });

  it("throws when the registry returns a non-OK status", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeResponse(null, 404))
      .mockResolvedValueOnce(makeResponse(mockDownloads));

    await expect(scrapeNpm("https://www.npmjs.com/package/lodash")).rejects.toThrow(
      "npm registry error 404"
    );
  });
});

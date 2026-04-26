import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scrapeWeb } from "./web-scraper";

function htmlResponse(html: string, status = 200) {
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html" },
  });
}

describe("scrapeWeb", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("extracts og:title, og:description, og:author, and keywords", async () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="My Page" />
          <meta property="og:description" content="A cool site" />
          <meta property="og:author" content="Alice" />
          <meta name="keywords" content="web, tool, dev" />
        </head>
      </html>
    `;
    vi.mocked(fetch).mockResolvedValueOnce(htmlResponse(html));

    const meta = await scrapeWeb("https://example.com");
    expect(meta).toEqual({
      title: "My Page",
      description: "A cool site",
      author: "Alice",
      keywords: ["web", "tool", "dev"],
      url: "https://example.com",
    });
  });

  it("falls back to <title> tag when og:title is absent", async () => {
    const html = `<html><head><title>  Fallback Title  </title></head></html>`;
    vi.mocked(fetch).mockResolvedValueOnce(htmlResponse(html));

    const meta = await scrapeWeb("https://example.com");
    expect(meta.title).toBe("Fallback Title");
  });

  it("falls back to twitter:title when og:title is absent", async () => {
    const html = `
      <html><head>
        <meta name="twitter:title" content="Twitter Title" />
      </head></html>
    `;
    vi.mocked(fetch).mockResolvedValueOnce(htmlResponse(html));

    const meta = await scrapeWeb("https://example.com");
    expect(meta.title).toBe("Twitter Title");
  });

  it("returns all nulls/empty when the page has no meta tags", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(htmlResponse("<html><body>hi</body></html>"));

    const meta = await scrapeWeb("https://example.com");
    expect(meta.title).toBeNull();
    expect(meta.description).toBeNull();
    expect(meta.author).toBeNull();
    expect(meta.keywords).toEqual([]);
  });

  it("returns nulls when fetch responds with a non-OK status", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(htmlResponse("", 503));

    const meta = await scrapeWeb("https://example.com");
    expect(meta).toEqual({
      title: null,
      description: null,
      author: null,
      keywords: [],
      url: "https://example.com",
    });
  });

  it("trims whitespace from comma-separated keywords", async () => {
    const html = `<meta name="keywords" content="  a ,b,  c  " />`;
    vi.mocked(fetch).mockResolvedValueOnce(htmlResponse(html));

    const meta = await scrapeWeb("https://example.com");
    expect(meta.keywords).toEqual(["a", "b", "c"]);
  });
});

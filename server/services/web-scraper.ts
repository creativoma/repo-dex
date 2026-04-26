import { lookup } from "node:dns/promises";
import net from "node:net";

interface WebMeta {
  title: string | null;
  description: string | null;
  author: string | null;
  keywords: string[];
  url: string;
}

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 127 ||
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0 ||
      a >= 224
    );
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    return (
      lower === "::1" ||
      lower === "::" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb")
    );
  }
  return true; // unknown format → reject
}

async function safeFetch(rawUrl: string): Promise<Response> {
  const u = new URL(rawUrl);
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    throw new Error("Only http/https URLs are allowed");
  }

  const hostname = u.hostname;
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("Private IP addresses are not allowed");
  } else {
    const { address } = await lookup(hostname);
    if (isPrivateIp(address)) throw new Error("URL resolves to a private IP address");
  }

  return fetch(u.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; RepoDex-bot/1.0; +https://github.com)",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(10_000),
  });
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function scrapeWeb(url: string): Promise<WebMeta> {
  const res = await safeFetch(url);

  if (!res.ok) {
    return { title: null, description: null, author: null, keywords: [], url };
  }

  const contentLength = parseInt(res.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_RESPONSE_BYTES) {
    return { title: null, description: null, author: null, keywords: [], url };
  }

  const html = await res.text();
  if (html.length > MAX_RESPONSE_BYTES) {
    return { title: null, description: null, author: null, keywords: [], url };
  }

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title =
    extractMeta(html, "og:title") ??
    extractMeta(html, "twitter:title") ??
    (titleMatch ? titleMatch[1].trim() : null);

  const description =
    extractMeta(html, "og:description") ??
    extractMeta(html, "twitter:description") ??
    extractMeta(html, "description");

  const author =
    extractMeta(html, "og:author") ??
    extractMeta(html, "author") ??
    extractMeta(html, "article:author");

  const keywordsRaw = extractMeta(html, "keywords");
  const keywords = keywordsRaw
    ? keywordsRaw
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  return { title, description, author, keywords, url };
}

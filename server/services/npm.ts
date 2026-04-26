interface NpmMeta {
  name: string;
  description: string | null;
  version: string;
  weeklyDownloads: number;
  keywords: string[];
  author: string | null;
}

function extractPackageName(url: string): string {
  const parsed = new URL(url);
  // handles /package/name and /package/@scope/name
  const match = parsed.pathname.match(/\/package\/(@?[^/]+(?:\/[^/]+)?)/);
  if (match) return match[1];
  // fallback: use last path segment
  return parsed.pathname.split("/").filter(Boolean).pop() ?? "";
}

export async function scrapeNpm(url: string): Promise<NpmMeta> {
  const pkgName = extractPackageName(url);
  if (!pkgName) throw new Error(`Could not extract package name from: ${url}`);

  const [registryRes, downloadsRes] = await Promise.all([
    fetch(`https://registry.npmjs.org/${pkgName}`, {
      headers: { Accept: "application/json" },
    }),
    fetch(`https://api.npmjs.org/downloads/point/last-week/${pkgName}`).catch(() => null),
  ]);

  if (!registryRes.ok) {
    throw new Error(`npm registry error ${registryRes.status} for ${pkgName}`);
  }

  const reg = (await registryRes.json()) as {
    name: string;
    description?: string;
    "dist-tags": { latest: string };
    keywords?: string[];
    author?: { name: string } | string;
  };

  const weeklyDownloads = downloadsRes?.ok
    ? ((await downloadsRes.json()) as { downloads: number }).downloads
    : 0;

  const authorRaw = reg.author;
  const author = typeof authorRaw === "string" ? authorRaw : (authorRaw?.name ?? null);

  return {
    name: reg.name,
    description: reg.description ?? null,
    version: reg["dist-tags"].latest,
    weeklyDownloads,
    keywords: reg.keywords ?? [],
    author,
  };
}

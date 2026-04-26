interface GithubMeta {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  author: string;
  homepage: string | null;
}

export async function scrapeGithub(url: string): Promise<GithubMeta> {
  const parsed = new URL(url);
  const [, owner, repo] = parsed.pathname.split("/");

  if (!owner || !repo) throw new Error(`Invalid GitHub URL: ${url}`);

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "RepoDex/1.0",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status} for ${owner}/${repo}`);
  }

  const data = (await res.json()) as {
    name: string;
    description: string | null;
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    topics: string[];
    owner: { login: string };
    homepage: string | null;
  };

  return {
    name: data.name,
    description: data.description,
    stars: data.stargazers_count,
    forks: data.forks_count,
    language: data.language,
    topics: data.topics ?? [],
    author: data.owner.login,
    homepage: data.homepage,
  };
}

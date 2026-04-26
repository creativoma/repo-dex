import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../server/db/schema";

const url = process.env.TURSO_URL ?? "file:./local.db";
const isLocal = url.startsWith("file:");
const client = createClient({ url, authToken: isLocal ? undefined : process.env.TURSO_AUTH_TOKEN });
const db = drizzle(client, { schema });

const TOTAL = 200_000;
const BATCH_SIZE = 1_000;

// ── Pools ────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Rust",
  "Go",
  "Python",
  "C++",
  "Zig",
  "CSS",
  "HTML",
  "Java",
  "Kotlin",
  "Swift",
  "Elixir",
  "Ruby",
  "PHP",
  "C#",
  "Dart",
];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const TYPES = ["github", "npm", "web"] as const;

const GITHUB_AUTHORS = [
  "vercel",
  "microsoft",
  "facebook",
  "google",
  "tailwindlabs",
  "trpc",
  "colinhacks",
  "pmndrs",
  "biomejs",
  "oven-sh",
  "astro-build",
  "denoland",
  "drizzle-team",
  "shadcn",
  "radix-ui",
  "tanstack",
  "remix-run",
  "sveltejs",
  "vuejs",
  "angular",
  "nestjs",
  "expressjs",
  "fastify",
  "prisma",
  "planetscale",
  "supabase",
  "clerk-dev",
  "auth0",
  "stripe",
  "twilio",
];

const NPM_AUTHORS = [
  "facebook",
  "vercel",
  "sindresorhus",
  "isaacs",
  "tj",
  "ljharb",
  "nicolo-ribaudo",
  "babel",
  "jest",
  "vitest",
  "eslint",
  "prettier",
  "postcss",
  "webpack",
  "rollup",
  "esbuild",
  "turbopack",
  "swc-project",
];

const WEB_AUTHORS = [
  "Mozilla",
  "Google",
  "Microsoft",
  "Meta",
  "CSS-Tricks",
  "roadmap.sh",
  "Smashing Magazine",
  "web.dev",
  "Kent C. Dodds",
  "Josh Comeau",
  "Wes Bos",
  "Fireship",
  "Theo",
  "Matt Pocock",
];

const GITHUB_REPOS = [
  "awesome-list",
  "boilerplate",
  "starter-kit",
  "cli-tool",
  "ui-library",
  "api-client",
  "state-manager",
  "router",
  "bundler",
  "compiler",
  "linter",
  "formatter",
  "test-runner",
  "orm",
  "database-driver",
  "auth-library",
  "form-handler",
  "animation-lib",
  "chart-library",
  "table-component",
  "modal-dialog",
  "toast-notification",
  "date-picker",
  "color-picker",
  "file-uploader",
  "markdown-parser",
  "code-editor",
  "terminal-ui",
  "http-client",
  "websocket-lib",
  "caching-layer",
  "queue-system",
  "event-bus",
  "validation-lib",
  "crypto-utils",
  "image-processor",
  "video-player",
  "pdf-generator",
  "csv-parser",
  "zip-utility",
];

const NPM_PACKAGES = [
  "lodash",
  "ramda",
  "immer",
  "rxjs",
  "mobx",
  "recoil",
  "jotai",
  "valtio",
  "swr",
  "react-query",
  "apollo-client",
  "graphql",
  "prisma",
  "typeorm",
  "class-validator",
  "class-transformer",
  "reflect-metadata",
  "inversify",
  "commander",
  "yargs",
  "inquirer",
  "ora",
  "chalk",
  "kleur",
  "picocolors",
  "dotenv",
  "cross-env",
  "rimraf",
  "glob",
  "fast-glob",
  "micromatch",
  "uuid",
  "cuid",
  "ulid",
  "hashids",
  "base64-js",
  "buffer",
  "dayjs",
  "moment",
  "luxon",
  "ms",
  "pretty-ms",
  "humanize-duration",
];

const WEB_RESOURCES = [
  "Complete Guide to",
  "Introduction to",
  "Advanced",
  "Modern",
  "Practical",
  "Deep Dive into",
  "Understanding",
  "Mastering",
  "Building with",
  "Getting Started with",
];

const WEB_TOPICS = [
  "React Hooks",
  "CSS Grid",
  "Web Workers",
  "Service Workers",
  "WebAssembly",
  "GraphQL",
  "REST APIs",
  "WebSockets",
  "Server-Sent Events",
  "IndexedDB",
  "Web Performance",
  "Core Web Vitals",
  "Accessibility",
  "Security Headers",
  "PWA",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "Microservices",
  "Event Sourcing",
  "CQRS",
  "Domain-Driven Design",
  "Test-Driven Development",
  "Clean Architecture",
  "Design Patterns",
  "Data Structures",
  "Algorithms",
  "System Design",
];

const WEB_DOMAINS = [
  "developer.mozilla.org",
  "web.dev",
  "css-tricks.com",
  "smashingmagazine.com",
  "kentcdodds.com",
  "joshwcomeau.com",
  "wesbos.com",
  "fireship.io",
  "refactoring.guru",
  "patterns.dev",
  "12factor.net",
  "roadmap.sh",
  "theodinproject.com",
  "freecodecamp.org",
  "javascript.info",
  "learnxinyminutes.com",
];

const TAG_POOL = [
  "react",
  "typescript",
  "javascript",
  "css",
  "html",
  "nodejs",
  "python",
  "rust",
  "go",
  "api",
  "rest",
  "graphql",
  "database",
  "sql",
  "nosql",
  "orm",
  "auth",
  "security",
  "performance",
  "testing",
  "devops",
  "docker",
  "kubernetes",
  "ci-cd",
  "frontend",
  "backend",
  "fullstack",
  "ssr",
  "ssg",
  "spa",
  "pwa",
  "animation",
  "ui",
  "ux",
  "design",
  "accessibility",
  "seo",
  "framework",
  "library",
  "tool",
  "cli",
  "bundler",
  "compiler",
  "state-management",
  "routing",
  "forms",
  "validation",
  "schema",
  "utility",
  "hooks",
  "components",
  "patterns",
  "architecture",
  "serverless",
  "edge",
  "cloud",
  "microservices",
  "monorepo",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type ResourceWithTags = {
  resource: typeof schema.resources.$inferInsert;
  tags: string[];
};

function generateGithubResource(now: number): ResourceWithTags {
  const author = pick(GITHUB_AUTHORS);
  const repo = pick(GITHUB_REPOS);
  const lang = pick(LANGUAGES);
  const difficulty = pick(DIFFICULTIES);
  const resourceTags = pickN(TAG_POOL, randInt(2, 5));
  const stars = randInt(100, 150_000);

  return {
    resource: {
      id: nanoid(),
      url: `https://github.com/${author}/${repo}-${nanoid(6)}`,
      type: "github",
      title: `${author}/${repo}`,
      description: `A ${difficulty} ${lang} ${repo.replace(/-/g, " ")} maintained by ${author}. ${stars.toLocaleString()} stars on GitHub.`,
      author,
      stars,
      weeklyDownloads: null,
      rawMeta: JSON.stringify({}),
      createdAt: now - randInt(0, 365 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    },
    tags: resourceTags,
  };
}

function generateNpmResource(now: number): ResourceWithTags {
  const pkg = pick(NPM_PACKAGES);
  const author = pick(NPM_AUTHORS);
  const lang = pick(["TypeScript", "JavaScript"]);
  const resourceTags = pickN(TAG_POOL, randInt(2, 4));
  const downloads = randInt(10_000, 80_000_000);
  const suffix = nanoid(8);

  return {
    resource: {
      id: nanoid(),
      url: `https://www.npmjs.com/package/${pkg}-${suffix}`,
      type: "npm",
      title: `${pkg}-${suffix}`,
      description: `${lang} package for ${pkg.replace(/-/g, " ")}. ${downloads.toLocaleString()} weekly downloads.`,
      author,
      stars: null,
      weeklyDownloads: downloads,
      rawMeta: JSON.stringify({}),
      createdAt: now - randInt(0, 365 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    },
    tags: resourceTags,
  };
}

function generateWebResource(now: number): ResourceWithTags {
  const prefix = pick(WEB_RESOURCES);
  const topic = pick(WEB_TOPICS);
  const domain = pick(WEB_DOMAINS);
  const author = pick(WEB_AUTHORS);
  const difficulty = pick(DIFFICULTIES);
  const resourceTags = pickN(TAG_POOL, randInt(2, 5));
  const slug = topic.toLowerCase().replace(/\s+/g, "-");

  return {
    resource: {
      id: nanoid(),
      url: `https://${domain}/${slug}-${nanoid(6)}`,
      type: "web",
      title: `${prefix} ${topic}`,
      description: `${prefix} ${topic} — a ${difficulty}-level resource covering everything you need to know. Published by ${author}.`,
      author,
      stars: null,
      weeklyDownloads: null,
      rawMeta: JSON.stringify({}),
      createdAt: now - randInt(0, 365 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    },
    tags: resourceTags,
  };
}

function generateResource(now: number): ResourceWithTags {
  const type = pick(TYPES);
  if (type === "github") return generateGithubResource(now);
  if (type === "npm") return generateNpmResource(now);
  return generateWebResource(now);
}

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  await client.execute("PRAGMA busy_timeout = 30000");

  const now = Date.now();
  console.log(`Generating ${TOTAL.toLocaleString()} resources…\n`);

  const generated = Array.from({ length: TOTAL }, () => generateResource(now));

  // Collect unique tag names across all resources
  const allTagNames = [...new Set(generated.flatMap((g) => g.tags))];
  console.log(`  Upserting ${allTagNames.length} unique tags…`);

  const tagRows = allTagNames.map((name) => ({ id: nanoid(), name }));
  await db.insert(schema.tags).values(tagRows).onConflictDoNothing();

  const existingTags = await db
    .select()
    .from(schema.tags)
    .where(inArray(schema.tags.name, allTagNames));
  const tagIdByName = new Map(existingTags.map((t) => [t.name, t.id]));

  console.log(`  Inserting resources and pivot rows in batches of ${BATCH_SIZE}…`);
  let inserted = 0;

  for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
    const batch = generated.slice(i, i + BATCH_SIZE);

    await db
      .insert(schema.resources)
      .values(batch.map((g) => g.resource))
      .onConflictDoNothing();

    const pivotRows = batch.flatMap((g) =>
      g.tags
        .map((name) => tagIdByName.get(name))
        .filter((tagId): tagId is string => tagId !== undefined)
        .map((tagId) => ({ resourceId: g.resource.id, tagId }))
    );
    for (let p = 0; p < pivotRows.length; p += 500) {
      const chunk = pivotRows.slice(p, p + 500);
      if (chunk.length) await db.insert(schema.resourceTags).values(chunk).onConflictDoNothing();
    }

    inserted += batch.length;
    const pct = Math.round((inserted / TOTAL) * 100);
    process.stdout.write(`\r  ${inserted.toLocaleString()} / ${TOTAL.toLocaleString()} (${pct}%)`);
  }

  console.log(`\n\nDone. ${inserted.toLocaleString()} resources inserted.`);
  await client.close();
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

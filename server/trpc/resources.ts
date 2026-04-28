import { nanoid } from "nanoid";
import { z } from "zod";
import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { resources, tags, resourceTags } from "../db/schema";
import type { Resource } from "../../shared/types";
import { adminProcedure, publicProcedure, router } from "./trpc";

const TAG_CATEGORIES = [
  {
    id: "ai",
    label: "AI/ML",
    keywords: ["ai", "ml", "llm", "agent", "gpt", "prompt", "model"],
  },
  {
    id: "devtools",
    label: "DevTools",
    keywords: ["tool", "cli", "dev", "lint", "format", "test", "debug"],
  },
  {
    id: "data",
    label: "Data/DB",
    keywords: ["db", "database", "postgres", "sqlite", "mysql", "orm", "prisma"],
  },
  {
    id: "infra",
    label: "Infra/Cloud",
    keywords: ["cloud", "docker", "kubernetes", "ci", "cd", "infra", "server"],
  },
  {
    id: "design",
    label: "Design/UX",
    keywords: ["design", "ux", "ui", "figma", "typography", "color"],
  },
  {
    id: "frontend",
    label: "Frontend",
    keywords: ["react", "next", "vue", "svelte", "css", "tailwind", "frontend"],
  },
  {
    id: "learning",
    label: "Learning",
    keywords: ["learn", "course", "tutorial", "docs", "guide"],
  },
] as const;

function categoryWhere(category: (typeof TAG_CATEGORIES)[number]) {
  return or(...category.keywords.map((keyword) => like(tags.name, `%${keyword}%`)));
}

export function rowToResource(row: typeof resources.$inferSelect, tagNames: string[]): Resource {
  return {
    id: row.id,
    url: row.url,
    type: row.type as Resource["type"],
    title: row.title,
    description: row.description,
    author: row.author,
    stars: row.stars,
    weeklyDownloads: row.weeklyDownloads,
    tags: tagNames,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function upsertTags(db: ReturnType<typeof getDb>, tagNames: string[]): Promise<string[]> {
  if (!tagNames.length) return [];
  const rows = tagNames.map((name) => ({ id: nanoid(), name }));
  await db.insert(tags).values(rows).onConflictDoNothing();
  const existing = await db.select().from(tags).where(inArray(tags.name, tagNames));
  return existing.map((r) => r.id);
}

async function fetchTagsForResources(
  db: ReturnType<typeof getDb>,
  resourceIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!resourceIds.length) return map;
  const rows = await db
    .select({ resourceId: resourceTags.resourceId, tagName: tags.name })
    .from(resourceTags)
    .innerJoin(tags, eq(tags.id, resourceTags.tagId))
    .where(inArray(resourceTags.resourceId, resourceIds));
  for (const { resourceId, tagName } of rows) {
    const arr = map.get(resourceId) ?? [];
    arr.push(tagName);
    map.set(resourceId, arr);
  }
  return map;
}

const resourceCreateSchema = z.object({
  url: z.string().url(),
  type: z.enum(["github", "npm", "web"]),
  title: z.string().min(1),
  description: z.string().optional(),
  author: z.string().optional(),
  stars: z.number().int().optional(),
  weeklyDownloads: z.number().int().optional(),
  tags: z.array(z.string()).default([]),
  rawMeta: z.record(z.unknown()).default({}),
});

const SORT_COLUMNS = {
  createdAt: resources.createdAt,
  updatedAt: resources.updatedAt,
  stars: resources.stars,
  weeklyDownloads: resources.weeklyDownloads,
  title: resources.title,
} as const;

export const resourcesRouter = router({
  facets: publicProcedure.query(async () => {
    const db = getDb();
    const countExpr = sql<number>`count(${resourceTags.tagId})`;
    const tagRows = await db
      .select({ name: tags.name, count: countExpr })
      .from(tags)
      .leftJoin(resourceTags, eq(tags.id, resourceTags.tagId))
      .groupBy(tags.id)
      .orderBy(desc(countExpr), asc(tags.name));

    const categories = await Promise.all(
      TAG_CATEGORIES.map(async (category) => {
        const categoryCondition = categoryWhere(category);
        if (!categoryCondition) {
          return { id: category.id, label: category.label, count: 0 };
        }
        const countRow = await db
          .select({ count: sql<number>`count(distinct ${resources.id})` })
          .from(resources)
          .innerJoin(resourceTags, eq(resources.id, resourceTags.resourceId))
          .innerJoin(tags, eq(tags.id, resourceTags.tagId))
          .where(categoryCondition);
        return {
          id: category.id,
          label: category.label,
          count: countRow[0]?.count ?? 0,
        };
      })
    );
    return {
      tags: tagRows,
      categories,
    };
  }),

  list: publicProcedure
    .input(
      z.object({
        cursor: z.number().int().min(1).optional(),
        direction: z.enum(["forward", "backward"]).optional(),
        limit: z.number().int().min(1).max(500).default(50),
        search: z.string().optional(),
        types: z.array(z.enum(["github", "npm", "web"])).optional(),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
        sortBy: z
          .enum(["createdAt", "updatedAt", "stars", "weeklyDownloads", "title"])
          .default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const pageNum = input.cursor ?? 1;
      const offset = (pageNum - 1) * input.limit;

      const conditions = [];

      if (input.search) {
        conditions.push(
          or(
            like(resources.title, `%${input.search}%`),
            like(resources.description, `%${input.search}%`),
            like(resources.author, `%${input.search}%`)
          )
        );
      }
      if (input.types?.length) {
        conditions.push(inArray(resources.type, input.types));
      }
      if (input.tags?.length) {
        for (const tag of input.tags) {
          conditions.push(
            sql`EXISTS (
              SELECT 1 FROM resource_tags rt2
              JOIN tags t2 ON t2.id = rt2.tag_id
              WHERE rt2.resource_id = ${resources.id} AND t2.name = ${tag}
            )`
          );
        }
      }
      if (input.category) {
        const category = TAG_CATEGORIES.find((entry) => entry.id === input.category);
        if (category) {
          const categoryCondition = categoryWhere(category);
          conditions.push(
            sql`EXISTS (
              SELECT 1 FROM resource_tags rt2
              JOIN tags ON tags.id = rt2.tag_id
              WHERE rt2.resource_id = ${resources.id} AND (${categoryCondition})
            )`
          );
        }
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const sortCol = SORT_COLUMNS[input.sortBy];
      const orderBy = input.sortOrder === "asc" ? asc(sortCol) : desc(sortCol);

      const [rows, countResult] = await Promise.all([
        db.select().from(resources).where(where).orderBy(orderBy).limit(input.limit).offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(resources)
          .where(where),
      ]);

      const tagsByResourceId = await fetchTagsForResources(
        db,
        rows.map((r) => r.id)
      );

      const total = countResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / input.limit);

      return {
        items: rows.map((row) => rowToResource(row, tagsByResourceId.get(row.id) ?? [])),
        total,
        page: pageNum,
        totalPages,
        limit: input.limit,
        nextCursor: pageNum < totalPages ? pageNum + 1 : undefined,
      };
    }),

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const db = getDb();
    const row = await db
      .select()
      .from(resources)
      .where(sql`${resources.id} = ${input.id}`)
      .get();
    if (!row) return null;
    const tagJoins = await db
      .select({ tagName: tags.name })
      .from(resourceTags)
      .innerJoin(tags, eq(tags.id, resourceTags.tagId))
      .where(eq(resourceTags.resourceId, row.id));
    return rowToResource(
      row,
      tagJoins.map((t) => t.tagName)
    );
  }),

  create: adminProcedure.input(resourceCreateSchema).mutation(async ({ input }) => {
    const db = getDb();
    const now = Date.now();
    const id = nanoid();

    await db.insert(resources).values({
      id,
      url: input.url,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      author: input.author ?? null,
      stars: input.stars ?? null,
      weeklyDownloads: input.weeklyDownloads ?? null,
      rawMeta: JSON.stringify(input.rawMeta),
      createdAt: now,
      updatedAt: now,
    });

    if (input.tags.length) {
      const tagIds = await upsertTags(db, input.tags);
      await db.insert(resourceTags).values(tagIds.map((tagId) => ({ resourceId: id, tagId })));
    }

    return { id };
  }),

  update: adminProcedure
    .input(resourceCreateSchema.extend({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const now = Date.now();

      await db
        .update(resources)
        .set({
          url: input.url,
          type: input.type,
          title: input.title,
          description: input.description ?? null,
          author: input.author ?? null,
          stars: input.stars ?? null,
          weeklyDownloads: input.weeklyDownloads ?? null,
          rawMeta: JSON.stringify(input.rawMeta),
          updatedAt: now,
        })
        .where(eq(resources.id, input.id));

      await db.delete(resourceTags).where(eq(resourceTags.resourceId, input.id));
      if (input.tags.length) {
        const tagIds = await upsertTags(db, input.tags);
        await db
          .insert(resourceTags)
          .values(tagIds.map((tagId) => ({ resourceId: input.id, tagId })));
      }
      // Remove orphaned tags after reassigning
      await db
        .delete(tags)
        .where(sql`${tags.id} NOT IN (SELECT DISTINCT tag_id FROM resource_tags)`);

      return { id: input.id };
    }),

  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const db = getDb();
    // resourceTags cascade deletes via FK
    await db.delete(resources).where(eq(resources.id, input.id));
    // Remove orphaned tags (no longer referenced by any resource)
    await db.delete(tags).where(sql`${tags.id} NOT IN (SELECT DISTINCT tag_id FROM resource_tags)`);
    return { id: input.id };
  }),
});

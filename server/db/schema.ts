import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const resources = sqliteTable("resources", {
  id: text("id").primaryKey(),
  url: text("url").notNull().unique(),
  type: text("type", { enum: ["github", "npm", "web"] }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  author: text("author"),
  language: text("language"),
  difficulty: text("difficulty", {
    enum: ["beginner", "intermediate", "advanced"],
  }),
  stars: integer("stars"),
  weeklyDownloads: integer("weekly_downloads"),
  rawMeta: text("raw_meta").notNull().default("{}"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const resourceTags = sqliteTable(
  "resource_tags",
  {
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.resourceId, table.tagId] }),
  })
);

export type ResourceRow = typeof resources.$inferSelect;
export type NewResourceRow = typeof resources.$inferInsert;
export type TagRow = typeof tags.$inferSelect;
export type ResourceTagRow = typeof resourceTags.$inferSelect;

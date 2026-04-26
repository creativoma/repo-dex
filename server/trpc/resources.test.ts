import { describe, expect, it } from "vitest";
import { rowToResource } from "./resources";

const baseRow = {
  id: "abc123",
  url: "https://github.com/foo/bar",
  type: "github",
  title: "Bar",
  description: "A description",
  author: "foo",
  stars: 100,
  weeklyDownloads: null,
  rawMeta: "{}",
  createdAt: 1_000_000,
  updatedAt: 2_000_000,
} as const;

describe("rowToResource", () => {
  it("maps all fields correctly", () => {
    const result = rowToResource(baseRow as never, ["react", "typescript"]);
    expect(result).toEqual({
      id: "abc123",
      url: "https://github.com/foo/bar",
      type: "github",
      title: "Bar",
      description: "A description",
      author: "foo",
      stars: 100,
      weeklyDownloads: null,
      tags: ["react", "typescript"],
      createdAt: 1_000_000,
      updatedAt: 2_000_000,
    });
  });

  it("handles an empty tags array", () => {
    const result = rowToResource(baseRow as never, []);
    expect(result.tags).toEqual([]);
  });

  it("preserves null optional fields", () => {
    const row = {
      ...baseRow,
      description: null,
      author: null,
      stars: null,
      weeklyDownloads: null,
    };
    const result = rowToResource(row as never, []);
    expect(result.description).toBeNull();
    expect(result.author).toBeNull();
    expect(result.stars).toBeNull();
    expect(result.weeklyDownloads).toBeNull();
  });

  it("passes through weeklyDownloads when set", () => {
    const row = { ...baseRow, weeklyDownloads: 75_000 };
    const result = rowToResource(row as never, []);
    expect(result.weeklyDownloads).toBe(75_000);
  });

  it("passes through createdAt and updatedAt timestamps", () => {
    const result = rowToResource(baseRow as never, []);
    expect(result.createdAt).toBe(1_000_000);
    expect(result.updatedAt).toBe(2_000_000);
  });
});

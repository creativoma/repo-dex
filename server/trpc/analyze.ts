import { z } from "zod";
import { detectUrlType } from "../services/detect-url-type";
import { analyzeWithGemini } from "../services/gemini";
import { scrapeGithub } from "../services/github";
import { scrapeNpm } from "../services/npm";
import { scrapeWeb } from "../services/web-scraper";
import type { AnalyzedResource } from "../../shared/types";
import { adminProcedure, router } from "./trpc";

export const analyzeRouter = router({
  byUrl: adminProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }): Promise<AnalyzedResource> => {
      const type = detectUrlType(input.url);

      let rawMeta: Record<string, unknown> = { url: input.url };
      let stars: number | null = null;
      let weeklyDownloads: number | null = null;

      try {
        if (type === "github") {
          const gh = await scrapeGithub(input.url);
          rawMeta = { ...gh };
          stars = gh.stars;
        } else if (type === "npm") {
          const npm = await scrapeNpm(input.url);
          rawMeta = { ...npm };
          weeklyDownloads = npm.weeklyDownloads;
        } else {
          const web = await scrapeWeb(input.url);
          rawMeta = { ...web };
        }
      } catch {
        // proceed with partial metadata
      }

      const aiResult = await analyzeWithGemini(rawMeta);

      return {
        title: aiResult.title ?? (rawMeta.name as string) ?? input.url,
        description: aiResult.description ?? (rawMeta.description as string) ?? "",
        tags: aiResult.tags ?? (rawMeta.topics as string[]) ?? (rawMeta.keywords as string[]) ?? [],
        author: aiResult.author ?? (rawMeta.author as string) ?? null,
        type,
        stars,
        weeklyDownloads,
        rawMeta,
      };
    }),
});

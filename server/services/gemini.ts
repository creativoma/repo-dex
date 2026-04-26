import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalyzedResource } from "../../shared/types";

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY env var is required");
  return new GoogleGenerativeAI(key);
}

const PROMPT_TEMPLATE = `You are a developer resource cataloger. Given the following raw metadata from a URL, extract and return a JSON object with these fields:
- title: clean, concise title (string)
- description: 2-3 sentence summary of what this resource is and who it's for (string)
- tags: array of up to 8 lowercase tags (programming languages, frameworks, topics, e.g. ["typescript","react","tutorial"])
- author: author or organization name (string or null)

Return ONLY valid JSON with no markdown code fences, no explanation.

Raw metadata:
`;

export async function analyzeWithGemini(
  rawMeta: Record<string, unknown>
): Promise<Partial<AnalyzedResource>> {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(PROMPT_TEMPLATE + JSON.stringify(rawMeta, null, 2));

    const text = result.response.text().trim();
    const parsed = JSON.parse(text) as Partial<AnalyzedResource>;

    return {
      title: parsed.title,
      description: parsed.description,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      author: parsed.author,
    };
  } catch {
    return {};
  }
}

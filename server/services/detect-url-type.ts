import type { ResourceType } from "../../shared/types";

export function detectUrlType(url: string): ResourceType {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host === "github.com" || host === "www.github.com") return "github";
    if (
      host === "npmjs.com" ||
      host === "www.npmjs.com" ||
      host === "npm.im" ||
      host === "unpkg.com"
    )
      return "npm";
    return "web";
  } catch {
    return "web";
  }
}

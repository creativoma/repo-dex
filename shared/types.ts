export type ResourceType = "github" | "npm" | "web";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface Resource {
  id: string;
  url: string;
  type: ResourceType;
  title: string;
  description: string | null;
  author: string | null;
  language: string | null;
  difficulty: DifficultyLevel | null;
  stars: number | null;
  weeklyDownloads: number | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AnalyzedResource {
  title: string;
  description: string;
  tags: string[];
  author: string | null;
  difficulty: DifficultyLevel | null;
  language: string | null;
  type: ResourceType;
  stars: number | null;
  weeklyDownloads: number | null;
  rawMeta: Record<string, unknown>;
}

export interface ListResourcesInput {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
}

export interface ListResourcesOutput {
  items: Resource[];
  total: number;
  page: number;
  totalPages: number;
}

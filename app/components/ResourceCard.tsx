import type { Resource } from "../../shared/types";
import { TagBadge } from "./TagBadge";

const difficultyConfig: Record<
  string,
  { bg: string; color: string; border: string; label: string }
> = {
  beginner: {
    bg: "rgba(21,190,83,0.12)",
    color: "#108c3d",
    border: "1px solid rgba(21,190,83,0.35)",
    label: "Beginner",
  },
  intermediate: {
    bg: "rgba(155,104,41,0.12)",
    color: "#9b6829",
    border: "1px solid rgba(155,104,41,0.35)",
    label: "Intermediate",
  },
  advanced: {
    bg: "rgba(234,34,97,0.12)",
    color: "#ea2261",
    border: "1px solid rgba(234,34,97,0.35)",
    label: "Advanced",
  },
};

interface ResourceCardProps {
  resource: Resource;
  activeTags?: string[];
  onTagClick?: (tag: string) => void;
}

export function ResourceCard({ resource, activeTags = [], onTagClick }: ResourceCardProps) {
  const diff = resource.difficulty ? difficultyConfig[resource.difficulty] : null;

  return (
    <article className="group border-line rounded-lg border bg-white p-5 shadow-[rgba(23,23,23,0.06)_0px_3px_6px] transition-shadow duration-150 hover:shadow-[rgba(50,50,93,0.12)_0px_8px_24px_-8px,rgba(0,0,0,0.06)_0px_4px_8px_-4px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink hover:text-primary line-clamp-1 text-[14px] font-medium transition-colors"
          >
            {resource.title}
          </a>
          {resource.author && <p className="text-muted mt-0.5 text-[11px]">by {resource.author}</p>}
        </div>
        {diff && (
          <span
            className="shrink-0 rounded px-1.5 py-px text-[10px] font-medium"
            style={{
              backgroundColor: diff.bg,
              color: diff.color,
              border: diff.border,
            }}
          >
            {diff.label}
          </span>
        )}
      </div>

      {resource.description && (
        <p className="text-muted mt-3 line-clamp-2 text-[12px] leading-relaxed">
          {resource.description}
        </p>
      )}

      {resource.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {resource.tags.map((tag) => (
            <TagBadge
              key={tag}
              tag={tag}
              active={activeTags.includes(tag)}
              onClick={onTagClick ? () => onTagClick(tag) : undefined}
            />
          ))}
        </div>
      )}

      <div className="text-muted mt-3 flex items-center gap-3 text-[11px]">
        <span className="text-ink-mid text-[10px] font-medium tracking-wide uppercase">
          {resource.type}
        </span>
        {resource.stars != null && (
          <span className="flex items-center gap-1 font-mono">
            <svg className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {resource.stars >= 1000
              ? `${(resource.stars / 1000).toFixed(0)}k`
              : resource.stars.toLocaleString()}
          </span>
        )}
        {resource.weeklyDownloads != null && (
          <span className="font-mono">
            {resource.weeklyDownloads >= 1_000_000
              ? `${(resource.weeklyDownloads / 1_000_000).toFixed(1)}M/wk`
              : resource.weeklyDownloads >= 1000
                ? `${(resource.weeklyDownloads / 1000).toFixed(0)}k/wk`
                : `${resource.weeklyDownloads}/wk`}
          </span>
        )}
        {resource.language && (
          <span className="border-line text-ink-mid rounded border bg-white px-1.5 text-[10px]">
            {resource.language}
          </span>
        )}
      </div>
    </article>
  );
}

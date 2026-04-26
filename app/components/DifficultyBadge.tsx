import type { Resource } from "../../shared/types";

const DIFFICULTY_CONFIG: Record<
  NonNullable<Resource["difficulty"]>,
  { className: string; label: string }
> = {
  beginner: {
    className: "bg-[rgba(21,190,83,0.12)] text-[#108c3d] border-[rgba(21,190,83,0.35)]",
    label: "Beginner",
  },
  intermediate: {
    className: "bg-[rgba(155,104,41,0.12)] text-[#9b6829] border-[rgba(155,104,41,0.35)]",
    label: "Inter.",
  },
  advanced: {
    className: "bg-[rgba(234,34,97,0.12)] text-[#ea2261] border-[rgba(234,34,97,0.35)]",
    label: "Advanced",
  },
};

export function DifficultyBadge({ level }: { level: Resource["difficulty"] }) {
  if (!level) return <span className="text-line">—</span>;
  const { className, label } = DIFFICULTY_CONFIG[level];
  return (
    <span
      className={`inline-flex items-center rounded-[4px] border px-1.5 py-px text-[11px] font-medium ${className}`}
    >
      {label}
    </span>
  );
}

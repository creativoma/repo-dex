interface TagBadgeProps {
  tag: string;
  onClick?: () => void;
  active?: boolean;
  count?: number;
}

// Vibrant mid-tones from DESIGN.md — saturated, not near-black, white text
const TAG_PALETTE = [
  { bg: "#533afd", text: "#ffffff" }, // stripe purple
  { bg: "#ea2261", text: "#ffffff" }, // ruby
  { bg: "#108c3d", text: "#ffffff" }, // success green
  { bg: "#9b6829", text: "#ffffff" }, // lemon / amber
  { bg: "#4434d4", text: "#ffffff" }, // purple dark
  { bg: "#2874ad", text: "#ffffff" }, // info blue
  { bg: "#665efd", text: "#ffffff" }, // purple mid
  { bg: "#1c1e54", text: "#ffffff" }, // brand indigo
];

function tagPalette(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
}

export function TagBadge({ tag, onClick, active, count }: TagBadgeProps) {
  const { bg, text } = tagPalette(tag);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={onClick ? Boolean(active) : undefined}
      className={`inline-flex items-center rounded px-1.5 py-px text-[11px] font-medium transition-opacity ${
        active
          ? "ring-primary opacity-100 ring-2 ring-offset-1 ring-offset-white"
          : "opacity-85 hover:opacity-100"
      } ${onClick ? "cursor-pointer" : "cursor-default"}`}
      style={{
        backgroundColor: bg,
        color: text,
      }}
    >
      {tag}
      {typeof count === "number" && (
        <span className="ml-1 rounded bg-white/25 px-1 text-[9px] font-semibold text-white/90">
          {count}
        </span>
      )}
    </button>
  );
}

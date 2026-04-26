export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`mr-1 mb-1 inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium transition-all duration-150 ${
        active
          ? "bg-primary text-white"
          : "bg-surface-alt text-muted hover:text-ink hover:bg-[#e2e8f0]"
      }`}
    >
      {label}
    </button>
  );
}

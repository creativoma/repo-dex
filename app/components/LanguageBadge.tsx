export function LanguageBadge({ lang }: { lang: string }) {
  return (
    <span className="border-line text-ink-mid inline-flex items-center rounded-[4px] border bg-white px-[6px] py-[1px] font-mono text-[11px] font-medium">
      {lang}
    </span>
  );
}

export function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-line border-t px-4 py-3">
      <p className="text-muted mb-2 text-[10px] font-semibold tracking-[0.12em] uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

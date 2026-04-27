import { useRef, useMemo, useState, useEffect } from "react";
import { version } from "../../package.json";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { trpc } from "~/lib/trpc";
import { useDebounce } from "~/hooks/useDebounce";
import { formatRelativeTime } from "~/lib/formatDate";
import { TypeIcon } from "~/components/TypeIcon";
import { SortIcon } from "~/components/SortIcon";
import { FilterSection } from "~/components/FilterSection";
import { FilterChip } from "~/components/FilterChip";
import { TagBadge } from "~/components/TagBadge";
import { AdminControls } from "~/components/AdminControls";
import { ResourceCard } from "~/components/ResourceCard";
import type { Resource } from "../../shared/types";

function DeleteConfirmModal({
  resource,
  onConfirm,
  onCancel,
  isPending,
}: {
  resource: Resource;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-3 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="border-line w-full max-w-sm overflow-hidden rounded-md border bg-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]"
      >
        <div className="border-line flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-ink text-[15px] font-medium">Delete resource</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-muted hover:text-ink rounded-sm px-2 py-1 text-[12px] transition-colors hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <div className="px-4 py-4">
          <p className="text-ink-mid text-[13px]">
            Delete <span className="text-ink font-medium">&ldquo;{resource.title}&rdquo;</span>?
            This action cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
            >
              {isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function meta() {
  return [
    { title: "RepoDex — Developer Resources" },
    { name: "description", content: "Curated developer resources, tools, and references." },
  ];
}

// ── Column helper ─────────────────────────────────────────────────────────────

const col = createColumnHelper<Resource>();

const SERVER_SORT_COLS = new Set(["stars", "weeklyDownloads", "title", "createdAt", "updatedAt"]);

// ── Main component ────────────────────────────────────────────────────────────

export default function Index() {
  const parentRef = useRef<HTMLDivElement>(null);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const [showAllTags, setShowAllTags] = useState(false);

  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, { refetchOnWindowFocus: false });
  const isAdmin = meQuery.data?.isAdmin ?? false;

  const deleteMutation = trpc.resources.delete.useMutation({
    onSuccess: async () => {
      setDeletingResource(null);
      await Promise.all([utils.resources.list.invalidate(), utils.resources.facets.invalidate()]);
    },
  });

  const [tagSearch, setTagSearch] = useState("");

  const { data: facetsData } = trpc.resources.facets.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const allTags = facetsData?.tags ?? [];
  const TAG_PREVIEW = 15;
  const filteredTags = tagSearch
    ? allTags.filter((t) => t.toLowerCase().includes(tagSearch.toLowerCase()))
    : allTags;
  const visibleTags = showAllTags ? filteredTags : filteredTags.slice(0, TAG_PREVIEW);

  const sortCol = sorting[0];
  const sortBy =
    sortCol && SERVER_SORT_COLS.has(sortCol.id)
      ? (sortCol.id as "createdAt" | "updatedAt" | "stars" | "weeklyDownloads" | "title")
      : "createdAt";
  const sortOrder = sortCol ? (sortCol.desc ? "desc" : "asc") : "desc";

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    trpc.resources.list.useInfiniteQuery(
      {
        limit: 500,
        search: debouncedSearch || undefined,
        types: typeFilters.length ? (typeFilters as ("github" | "npm" | "web")[]) : undefined,
        tags: tagFilters.length ? tagFilters : undefined,
        sortBy,
        sortOrder,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialCursor: 1,
        staleTime: 2 * 60 * 1000,
      }
    );

  const allItems = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const totalCount = data?.pages[0]?.total ?? 0;

  function toggle(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  const columns = useMemo(
    () => [
      col.accessor("type", {
        id: "type",
        header: "Type",
        enableSorting: false,
        cell: ({ getValue }) => <TypeIcon type={getValue()} />,
      }),
      col.accessor("title", {
        id: "title",
        header: "Resource",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="min-w-0">
                <div className="flex min-w-0 items-baseline gap-1.5">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink hover:text-primary truncate text-[13px] font-medium transition-colors"
                  >
                    {r.title}
                  </a>
                  {r.author && (
                    <span className="text-muted shrink-0 text-[11px]">by {r.author}</span>
                  )}
                </div>
                {r.description && (
                  <p className="text-muted mt-0.5 line-clamp-1 max-w-sm text-[11px] leading-tight">
                    {r.description}
                  </p>
                )}
              </div>
            </div>
          );
        },
      }),
      col.accessor("tags", {
        id: "tags",
        header: "Tags",
        enableSorting: false,
        cell: ({ getValue }) => {
          const tags = getValue();
          return (
            <div className="flex flex-wrap items-center gap-1">
              {tags.slice(0, 4).map((tag) => (
                <TagBadge key={tag} tag={tag} active={tagFilters.includes(tag)} />
              ))}
              {tags.length > 4 && (
                <span className="text-muted text-[11px]">+{tags.length - 4}</span>
              )}
              {tags.length === 0 && <span className="text-line">—</span>}
            </div>
          );
        },
      }),
      col.accessor("stars", {
        id: "stars",
        header: "Stars",
        cell: ({ getValue }) => {
          const v = getValue();
          if (v == null) return <span className="text-line">—</span>;
          return (
            <span className="text-ink-mid flex items-center gap-1 font-mono text-[12px]">
              <svg
                className="h-3 w-3 shrink-0 text-amber-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            </span>
          );
        },
        sortingFn: (a, b) => (a.original.stars ?? -1) - (b.original.stars ?? -1),
      }),
      col.accessor("weeklyDownloads", {
        id: "weeklyDownloads",
        header: "DL / wk",
        cell: ({ getValue }) => {
          const v = getValue();
          if (v == null) return <span className="text-line">—</span>;
          return (
            <span className="text-ink-mid font-mono text-[12px]">
              {v >= 1_000_000
                ? `${(v / 1_000_000).toFixed(1)}M`
                : v >= 1000
                  ? `${(v / 1000).toFixed(0)}k`
                  : v}
            </span>
          );
        },
        sortingFn: (a, b) =>
          (a.original.weeklyDownloads ?? -1) - (b.original.weeklyDownloads ?? -1),
      }),
      col.accessor("updatedAt", {
        id: "updatedAt",
        header: "Updated",
        cell: ({ getValue }) => {
          const timestamp = getValue();
          return <span className="text-muted text-[12px]">{formatRelativeTime(timestamp)}</span>;
        },
        sortingFn: (a, b) => a.original.updatedAt - b.original.updatedAt,
      }),
      ...(isAdmin
        ? [
            col.display({
              id: "actions",
              header: "",
              enableSorting: false,
              cell: ({ row }) => {
                const r = row.original;
                return (
                  <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity duration-100 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setEditingResource(r)}
                      title="Edit"
                      className="text-muted hover:bg-surface-alt hover:text-ink rounded p-1 transition-colors"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingResource(r)}
                      title="Delete"
                      className="text-muted rounded p-1 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                );
              },
            }),
          ]
        : []),
    ],
    [tagFilters, isAdmin]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: allItems,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 12,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const last = virtualRows[virtualRows.length - 1];
    if (last && last.index >= rows.length - 1) {
      fetchNextPage();
    }
  }, [virtualRows, hasNextPage, isFetchingNextPage, fetchNextPage, rows.length]);

  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? (virtualRows[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0) : 0;

  const activeFiltersCount = typeFilters.length + tagFilters.length;

  function clearAll() {
    setSearch("");
    setTypeFilters([]);
    setTagFilters([]);
  }

  const VISIBLE_COL_COUNT = columns.length;

  return (
    <>
      {/* ── Mobile layout ───────────────────────────────────────────────── */}
      <div className="flex h-screen flex-col bg-white md:hidden">
        {/* Brand header */}
        <div className="border-line shrink-0 border-b px-4 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect width="28" height="28" rx="6" fill="#533afd" />
              <rect x="6" y="7" width="10" height="2" rx="1" fill="white" />
              <rect x="6" y="11" width="16" height="2" rx="1" fill="white" fillOpacity="0.7" />
              <rect x="6" y="15" width="13" height="2" rx="1" fill="white" fillOpacity="0.5" />
              <rect x="6" y="19" width="8" height="2" rx="1" fill="white" fillOpacity="0.3" />
            </svg>
            <span className="font-mono text-[18px] leading-none tracking-tight">
              <span className="text-muted font-normal">Repo</span>
              <span className="text-primary font-bold">Dex</span>
            </span>
            <span className="bg-surface-alt text-muted rounded px-1.5 py-0.5 font-mono text-[10px] font-medium">
              v{version}
            </span>
            <span className="bg-surface-alt text-muted rounded px-1.5 py-0.5 font-mono text-[10px] font-medium">
              MIT
            </span>
          </div>
          {/* Search */}
          <div className="relative mt-3">
            <svg
              className="text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources…"
              className="border-line bg-surface text-ink focus:border-primary w-full rounded border py-2.5 pr-3 pl-10 text-[14px] focus:outline-none"
            />
          </div>
        </div>

        {/* Card list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border-line rounded-lg border p-4">
                  <div className="bg-line mb-2 h-3.5 w-40 animate-pulse rounded" />
                  <div className="bg-line mb-3 h-2.5 w-full animate-pulse rounded" />
                  <div className="flex gap-1.5">
                    <div className="bg-line h-5 w-14 animate-pulse rounded-full" />
                    <div className="bg-line h-5 w-10 animate-pulse rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && allItems.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-muted text-[14px]">No resources found.</p>
              {search && (
                <button onClick={() => setSearch("")} className="text-primary mt-2 text-[13px]">
                  Clear search
                </button>
              )}
            </div>
          )}
          {!isLoading && (
            <div className="space-y-3">
              {allItems.map((item) => (
                <ResourceCard
                  key={item.id}
                  resource={item}
                  activeTags={tagFilters}
                  onTagClick={(tag: string) => toggle(tagFilters, setTagFilters, tag)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile footer */}
        <div className="border-line shrink-0 space-y-1.5 border-t px-4 py-2.5">
          {/* Row 1 — stats */}
          <div className="flex justify-end">
            {!isLoading && allItems.length > 0 && (
              <span className="text-primary font-mono text-[12px] font-medium">
                {allItems.length.toLocaleString()} resources
              </span>
            )}
          </div>
          {/* Row 2 — credits */}
          <div className="border-line flex items-center justify-between border-t pt-1.5">
            <span className="text-muted text-[11px]">by creativoma</span>
            <a
              href="https://github.com/creativoma/repo-dex"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-ink transition-colors"
              title="View on GitHub"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* ── Desktop layout ──────────────────────────────────────────────── */}
      <div className="text-ink hidden h-screen bg-white md:flex">
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="border-line flex h-screen w-52 shrink-0 flex-col border-r bg-white">
          {/* Brand */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2.5">
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect width="28" height="28" rx="6" fill="#533afd" />
                <rect x="6" y="7" width="10" height="2" rx="1" fill="white" />
                <rect x="6" y="11" width="16" height="2" rx="1" fill="white" fillOpacity="0.7" />
                <rect x="6" y="15" width="13" height="2" rx="1" fill="white" fillOpacity="0.5" />
                <rect x="6" y="19" width="8" height="2" rx="1" fill="white" fillOpacity="0.3" />
              </svg>
              <span className="font-mono text-[16px] leading-none tracking-tight">
                <span className="text-muted font-normal">Repo</span>
                <span className="text-primary font-bold">Dex</span>
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="bg-surface-alt text-muted rounded px-1.5 py-0.5 font-mono text-[10px] font-medium">
                v{version}
              </span>
              <span className="bg-surface-alt text-muted rounded px-1.5 py-0.5 font-mono text-[10px] font-medium">
                MIT
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="border-line flex-1 overflow-y-auto border-t">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-muted text-[10px] font-semibold tracking-[0.12em] uppercase">
                Filters
              </span>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAll}
                  className="text-muted hover:text-ink text-[10px] transition-colors"
                >
                  Clear {activeFiltersCount}
                </button>
              )}
            </div>

            <FilterSection title="Type">
              {(["github", "npm", "web"] as const).map((t) => (
                <FilterChip
                  key={t}
                  label={t}
                  active={typeFilters.includes(t)}
                  onClick={() => toggle(typeFilters, setTypeFilters, t)}
                />
              ))}
            </FilterSection>

            {allTags.length > 0 && (
              <FilterSection title="Tags">
                <div className="relative mb-2">
                  <svg
                    className="text-muted absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="Filter tags…"
                    className="border-line bg-surface text-ink focus:border-primary w-full rounded border py-1 pr-2 pl-6 text-[11px] focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap">
                  {visibleTags.map((tag) => (
                    <span key={tag} className="mr-1 mb-1">
                      <TagBadge
                        tag={tag}
                        active={tagFilters.includes(tag)}
                        onClick={() => toggle(tagFilters, setTagFilters, tag)}
                      />
                    </span>
                  ))}
                  {filteredTags.length === 0 && (
                    <span className="text-muted text-[11px]">No tags found</span>
                  )}
                </div>
                {!tagSearch && filteredTags.length > TAG_PREVIEW && (
                  <button
                    onClick={() => setShowAllTags((v) => !v)}
                    className="text-muted hover:text-ink mt-1 text-[10px] transition-colors"
                  >
                    {showAllTags ? "Show less" : `+${filteredTags.length - TAG_PREVIEW} more`}
                  </button>
                )}
              </FilterSection>
            )}
          </div>

          {/* Sidebar footer */}
          <div className="border-line flex h-10 shrink-0 items-center border-t px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-muted text-[11px]">by creativoma</span>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/creativoma/repo-dex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-ink transition-colors"
                  title="View on GitHub"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Right panel ─────────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Title bar */}
          <div className="border-line flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
            <div className="flex items-center gap-3">
              <h1 className="text-ink text-[14px] font-medium tracking-tight">Catalog</h1>
              <div className="relative">
                <svg
                  className="text-muted absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search resources…"
                  className="border-line bg-surface text-ink focus:border-primary w-56 rounded border py-1.5 pr-3 pl-8 text-[12px] focus:outline-none"
                />
              </div>
            </div>
            <AdminControls
              editingResource={editingResource}
              onEditClose={() => setEditingResource(null)}
            />
          </div>

          {/* Table scroll area */}
          <div ref={parentRef} className="flex-1 overflow-y-auto">
            <table className="w-full min-w-195 border-separate border-spacing-0">
              <thead>
                <tr>
                  {table.getFlatHeaders().map((header) => (
                    <th
                      key={header.id}
                      className={`border-line text-muted sticky top-0 z-10 border-b bg-white/88 px-3 py-2 text-left text-[10px] font-semibold tracking-widest uppercase backdrop-blur-[10px] select-none [-webkit-backdrop-filter:blur(10px)] first:pl-5 last:pr-5 ${
                        header.column.getCanSort()
                          ? "hover:text-ink cursor-pointer"
                          : "cursor-default"
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="inline-flex items-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <SortIcon sorted={header.column.getIsSorted()} />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Loading skeletons */}
                {isLoading &&
                  Array.from({ length: 14 }).map((_, i) => (
                    <tr key={i} className="border-surface border-b">
                      <td className="py-2.5 pr-3 pl-5">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-line h-3.75 w-3.75 shrink-0 animate-pulse rounded" />
                          <div className="space-y-1.5">
                            <div className="bg-line h-2.5 w-32 animate-pulse rounded" />
                            <div className="bg-line h-2 w-48 animate-pulse rounded" />
                          </div>
                        </div>
                      </td>
                      {Array.from({ length: VISIBLE_COL_COUNT - 1 }).map((_, j) => (
                        <td key={j} className="px-3 py-2.5">
                          <div className="bg-line h-4 w-12 animate-pulse rounded" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {/* Virtual padding — top */}
                {!isLoading && paddingTop > 0 && (
                  <tr>
                    <td colSpan={VISIBLE_COL_COUNT} style={{ height: paddingTop }} />
                  </tr>
                )}

                {/* Virtual rows */}
                {!isLoading &&
                  virtualRows.map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    return (
                      <tr
                        key={row.id}
                        className="group border-surface hover:bg-surface border-b transition-colors duration-100"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-3 py-2 align-middle first:pl-5 last:pr-5">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    );
                  })}

                {/* Virtual padding — bottom */}
                {!isLoading && paddingBottom > 0 && (
                  <tr>
                    <td colSpan={VISIBLE_COL_COUNT} style={{ height: paddingBottom }} />
                  </tr>
                )}

                {/* Empty state */}
                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={VISIBLE_COL_COUNT} className="px-5 py-14 text-center">
                      <p className="text-muted text-[13px] font-medium">
                        No resources match these filters.
                      </p>
                      <button
                        onClick={clearAll}
                        className="text-primary hover:text-primary-hover mt-1.5 text-[12px] transition-colors"
                      >
                        Clear all filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Status footer ────────────────────────────────────────────── */}
          {!isLoading && (
            <div className="border-line flex h-10 shrink-0 items-center justify-end gap-3 border-t bg-white/88 px-5 backdrop-blur-[10px] [-webkit-backdrop-filter:blur(10px)]">
              <span className="text-muted font-mono text-[11px]">
                {allItems.length.toLocaleString()}
                {totalCount > allItems.length ? (
                  <> of {totalCount.toLocaleString()}</>
                ) : (
                  totalCount > 0 && " · all loaded"
                )}
              </span>
              {isFetchingNextPage && (
                <svg className="text-muted h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>

      {deletingResource && (
        <DeleteConfirmModal
          resource={deletingResource}
          onConfirm={() => deleteMutation.mutate({ id: deletingResource.id })}
          onCancel={() => setDeletingResource(null)}
          isPending={deleteMutation.isPending}
        />
      )}
    </>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useFetcher } from "react-router";
import { trpc } from "~/lib/trpc";
import type { Resource } from "../../shared/types";

type LoginActionData = { error?: string };

const resourceTypeOptions: Resource["type"][] = ["github", "npm", "web"];

const defaultForm = {
  type: "web" as Resource["type"],
  title: "",
  description: "",
  author: "",
  starsInput: "",
  weeklyDownloadsInput: "",
  rawMetaText: "{}",
  tags: [] as string[],
  newTag: "",
};

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-3 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="border-line w-full max-w-sm overflow-hidden rounded-md border bg-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]"
      >
        <div className="border-line flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-ink text-[15px] font-medium">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:bg-surface-alt hover:text-ink rounded-sm px-2 py-1 text-[12px] transition-colors"
            aria-label="Close modal"
          >
            Close
          </button>
        </div>
        <div className="max-h-[82dvh] overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

function SidePanelShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="border-line ml-auto flex h-dvh w-full max-w-xl flex-col border-l bg-white shadow-[rgba(50,50,93,0.25)_-20px_0px_35px_-24px,rgba(0,0,0,0.1)_-10px_0px_24px_-16px]"
        initial={{ x: 36, opacity: 0.95 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 28, opacity: 0.94 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="border-line flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-ink text-[15px] font-medium">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:bg-surface-alt hover:text-ink rounded-sm px-2 py-1 text-[12px] transition-colors"
            aria-label="Close panel"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
      </motion.div>
    </motion.div>
  );
}

interface AdminControlsProps {
  editingResource?: Resource | null;
  onEditClose?: () => void;
}

export function AdminControls({ editingResource = null, onEditClose }: AdminControlsProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [rawMetaError, setRawMetaError] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const isEditMode = editingResource != null;
  const isPanelOpen = isAddOpen || isEditMode;

  const [prevEditingResource, setPrevEditingResource] = useState(editingResource);
  if (prevEditingResource !== editingResource) {
    setPrevEditingResource(editingResource);
    if (editingResource) {
      setUrl(editingResource.url);
      setRawMetaError(null);
      setForm({
        type: editingResource.type,
        title: editingResource.title,
        description: editingResource.description ?? "",
        author: editingResource.author ?? "",
        starsInput: editingResource.stars != null ? String(editingResource.stars) : "",
        weeklyDownloadsInput:
          editingResource.weeklyDownloads != null ? String(editingResource.weeklyDownloads) : "",
        rawMetaText: "{}",
        tags: [...editingResource.tags],
        newTag: "",
      });
    }
  }

  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, { refetchOnWindowFocus: false });
  const isAdmin = meQuery.data?.isAdmin ?? false;

  const loginFetcher = useFetcher<LoginActionData>();
  const logoutFetcher = useFetcher();
  const hasPendingLoginSubmission = useRef(false);
  const hasPendingLogoutSubmission = useRef(false);

  const analyzeMutation = trpc.analyze.byUrl.useMutation({
    onSuccess: (data) => {
      setRawMetaError(null);
      setForm((prev) => ({
        ...prev,
        type: data.type,
        title: data.title,
        description: data.description,
        author: data.author ?? "",
        starsInput: data.stars == null ? "" : String(data.stars),
        weeklyDownloadsInput: data.weeklyDownloads == null ? "" : String(data.weeklyDownloads),
        rawMetaText: JSON.stringify(data.rawMeta ?? {}, null, 2),
        tags: data.tags,
      }));
    },
  });

  const createMutation = trpc.resources.create.useMutation({
    onSuccess: async () => {
      setIsAddOpen(false);
      setUrl("");
      setRawMetaError(null);
      setForm(defaultForm);
      await Promise.all([utils.resources.list.invalidate(), utils.resources.facets.invalidate()]);
    },
  });

  const updateMutation = trpc.resources.update.useMutation({
    onSuccess: async () => {
      onEditClose?.();
      await Promise.all([utils.resources.list.invalidate(), utils.resources.facets.invalidate()]);
    },
  });

  useEffect(() => {
    if (loginFetcher.state === "submitting") {
      hasPendingLoginSubmission.current = true;
      return;
    }

    if (!hasPendingLoginSubmission.current || loginFetcher.state !== "idle") return;
    hasPendingLoginSubmission.current = false;

    if (loginFetcher.data?.error) return;

    window.location.reload();
  }, [loginFetcher.state, loginFetcher.data]);

  useEffect(() => {
    if (logoutFetcher.state === "submitting") {
      hasPendingLogoutSubmission.current = true;
      return;
    }

    if (!hasPendingLogoutSubmission.current || logoutFetcher.state !== "idle") return;
    hasPendingLogoutSubmission.current = false;

    setIsAddOpen(false);
    setIsLoginOpen(false);
    window.location.reload();
  }, [logoutFetcher.state]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (isAddOpen) setIsAddOpen(false);
      if (isLoginOpen) setIsLoginOpen(false);
      if (isEditMode) onEditClose?.();
    }

    if (isPanelOpen || isLoginOpen) {
      document.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isAddOpen, isLoginOpen, isEditMode, isPanelOpen, onEditClose]);

  function openAdminFlow() {
    if (isAdmin) {
      setIsAddOpen(true);
      return;
    }
    setIsLoginOpen(true);
  }

  function handlePanelClose() {
    if (isEditMode) {
      onEditClose?.();
    } else {
      setIsAddOpen(false);
      setUrl("");
      setRawMetaError(null);
      setForm(defaultForm);
    }
  }

  function handleAnalyze() {
    if (!url) return;
    analyzeMutation.mutate({ url });
  }

  function handleTagRemove(tag: string) {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((entry) => entry !== tag) }));
  }

  function handleTagAdd() {
    const tag = form.newTag.trim().toLowerCase();
    if (!tag || form.tags.includes(tag)) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, tag], newTag: "" }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setRawMetaError(null);

    let parsedRawMeta: Record<string, unknown>;
    try {
      const parsed = JSON.parse(form.rawMetaText || "{}");
      parsedRawMeta = parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      setRawMetaError("Raw meta must be valid JSON");
      return;
    }

    const stars = form.starsInput.trim();
    const weeklyDownloads = form.weeklyDownloadsInput.trim();

    const payload = {
      url,
      type: form.type,
      title: form.title,
      description: form.description || undefined,
      author: form.author || undefined,
      stars: stars ? Number.parseInt(stars, 10) : undefined,
      weeklyDownloads: weeklyDownloads ? Number.parseInt(weeklyDownloads, 10) : undefined,
      tags: form.tags,
      rawMeta: parsedRawMeta,
    };

    if (isEditMode && editingResource) {
      updateMutation.mutate({ id: editingResource.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const loginError = useMemo(() => loginFetcher.data?.error, [loginFetcher.data]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={openAdminFlow}
          className="bg-primary hover:bg-primary-hover rounded-sm px-3 py-1.5 text-[12px] leading-none font-normal text-white shadow-[rgba(50,50,93,0.25)_0px_12px_18px_-12px,rgba(0,0,0,0.1)_0px_8px_16px_-8px] transition-colors"
        >
          {isAdmin ? "Add repo" : "Admin"}
        </button>

        {isAdmin && (
          <logoutFetcher.Form method="post" action="/logout">
            <button
              type="submit"
              className="border-primary/40 text-primary hover:bg-primary/5 rounded-sm border bg-transparent px-3 py-1.5 text-[12px] leading-none font-normal transition-colors"
            >
              Logout
            </button>
          </logoutFetcher.Form>
        )}
      </div>

      {isLoginOpen && (
        <ModalShell title="Admin login" onClose={() => setIsLoginOpen(false)}>
          <loginFetcher.Form method="post" action="/login" className="space-y-3">
            <input type="hidden" name="redirectTo" value="/" />

            <div>
              <label htmlFor="admin-username" className="mb-1.5 block text-sm text-slate-700">
                Username
              </label>
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="focus:border-primary w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-sm text-slate-700">
                Password
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="focus:border-primary w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none"
              />
            </div>

            {loginError && <p className="text-xs text-rose-600">{loginError}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsLoginOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loginFetcher.state === "submitting"}
                className="bg-primary hover:bg-primary-hover rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {loginFetcher.state === "submitting" ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </loginFetcher.Form>
        </ModalShell>
      )}

      <AnimatePresence>
        {isPanelOpen && (
          <SidePanelShell
            title={isEditMode ? "Edit resource" : "Add resource"}
            onClose={handlePanelClose}
          >
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="new-resource-url" className="mb-1.5 block text-sm text-slate-700">
                  URL
                </label>
                <div className="flex gap-2">
                  <input
                    id="new-resource-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    placeholder="https://github.com/owner/repo"
                    className="focus:border-primary flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={!url || analyzeMutation.isPending}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {analyzeMutation.isPending ? "Analyzing..." : "Analyze with Gemini"}
                  </button>
                </div>
              </div>

              {analyzeMutation.isError && (
                <p className="text-xs text-rose-600">{analyzeMutation.error.message}</p>
              )}

              <div>
                <label htmlFor="new-resource-title" className="mb-1.5 block text-sm text-slate-700">
                  Title
                </label>
                <input
                  id="new-resource-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  className="focus:border-primary w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="new-resource-description"
                  className="mb-1.5 block text-sm text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="new-resource-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="focus:border-primary w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="new-resource-type"
                    className="mb-1.5 block text-sm text-slate-700"
                  >
                    Type
                  </label>
                  <select
                    id="new-resource-type"
                    value={form.type}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, type: e.target.value as Resource["type"] }))
                    }
                    className="focus:border-primary w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none"
                  >
                    {resourceTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="new-resource-author"
                    className="mb-1.5 block text-sm text-slate-700"
                  >
                    Author
                  </label>
                  <input
                    id="new-resource-author"
                    type="text"
                    value={form.author}
                    onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                    className="focus:border-primary w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <details className="border-line bg-surface rounded-md border" open={false}>
                <summary className="text-ink-mid cursor-pointer px-3 py-2 text-[12px] font-medium">
                  Advanced fields
                </summary>
                <div className="border-line border-t px-3 py-2">
                  <p className="text-muted mb-2 text-[11px]">
                    Optional metadata used for enrichment and audits.
                  </p>

                  <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="new-resource-stars"
                        className="mb-1.5 block text-sm text-slate-700"
                      >
                        Stars
                      </label>
                      <input
                        id="new-resource-stars"
                        type="number"
                        min={0}
                        step={1}
                        value={form.starsInput}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, starsInput: e.target.value }))
                        }
                        className="focus:border-primary w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="new-resource-weekly-downloads"
                        className="mb-1.5 block text-sm text-slate-700"
                      >
                        Weekly downloads
                      </label>
                      <input
                        id="new-resource-weekly-downloads"
                        type="number"
                        min={0}
                        step={1}
                        value={form.weeklyDownloadsInput}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, weeklyDownloadsInput: e.target.value }))
                        }
                        className="focus:border-primary w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <label
                    htmlFor="new-resource-raw-meta"
                    className="mb-1.5 block text-sm text-slate-700"
                  >
                    Raw meta (JSON)
                  </label>
                  <textarea
                    id="new-resource-raw-meta"
                    rows={4}
                    value={form.rawMetaText}
                    onChange={(e) => setForm((prev) => ({ ...prev, rawMetaText: e.target.value }))}
                    className="focus:border-primary w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none"
                  />
                  {rawMetaError && <p className="mt-1 text-xs text-rose-600">{rawMetaError}</p>}
                </div>
              </details>

              <div>
                <label htmlFor="new-resource-tag" className="mb-1.5 block text-sm text-slate-700">
                  Tags
                </label>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {form.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 hover:bg-slate-200"
                    >
                      {tag} x
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    id="new-resource-tag"
                    type="text"
                    value={form.newTag}
                    onChange={(e) => setForm((prev) => ({ ...prev, newTag: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleTagAdd();
                      }
                    }}
                    className="focus:border-primary flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleTagAdd}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePanelClose}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary-hover rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : isEditMode ? "Save changes" : "Save resource"}
                </button>
              </div>
            </form>
          </SidePanelShell>
        )}
      </AnimatePresence>
    </>
  );
}

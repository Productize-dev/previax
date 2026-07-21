"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Film,
  GripVertical,
  LayoutList,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import {
  getHomepageSectionDescription,
  getHomepageSectionLabel,
  HOMEPAGE_SECTION_CATALOG,
  isCustomVideoSection,
  resolveHomepageSectionTitle,
} from "@/lib/homepage-layout";
import {
  collectCityOptions,
  collectCommunityTagOptions,
  collectHomeTagOptions,
  collectListingCategoryOptions,
  collectMainHighlightOptions,
  isFilterableHomepageSectionKey,
  type SectionFilterOption,
} from "@/lib/homepage-sections";
import { toastError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { isValidYouTubeUrl } from "@/lib/youtube";
import type {
  DashboardTab,
  HomepageSection,
  HomepageSectionConfig,
  HomepageSectionKey,
  HomepageSectionVideo,
} from "@/lib/types";

type HomepageLayoutManagerProps = {
  onNavigate: (tab: DashboardTab) => void;
};

export function HomepageLayoutManager({ onNavigate }: HomepageLayoutManagerProps) {
  const {
    communities,
    customCommunityTagLabels,
    homepageSections,
    setHomepageSectionEnabled,
    updateHomepageSectionTitle,
    updateHomepageSectionConfig,
    reorderHomepageSections,
    resetHomepageSections,
    addCustomVideoSection,
    deleteHomepageSection,
    addHomepageSectionVideo,
    updateHomepageSectionVideo,
    deleteHomepageSectionVideo,
  } = useDashboardData();
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (!addMenuOpen) return;
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-homepage-add-menu]")) return;
      setAddMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [addMenuOpen]);

  const rows = useMemo(
    () => [...homepageSections].sort((a, b) => a.order - b.order),
    [homepageSections],
  );

  const visibleRows = useMemo(() => rows.filter((row) => row.enabled), [rows]);
  const hiddenRows = useMemo(() => rows.filter((row) => !row.enabled), [rows]);

  const hiddenBuiltins = useMemo(
    () =>
      HOMEPAGE_SECTION_CATALOG.filter(
        (entry) =>
          entry.builtin !== false &&
          hiddenRows.some((row) => row.sectionKey === entry.key),
      ),
    [hiddenRows],
  );

  const filterOptionsByKey = useMemo(() => {
    return {
      "listing-categories": collectListingCategoryOptions(communities),
      "main-highlights": collectMainHighlightOptions(communities),
      "community-tags": collectCommunityTagOptions(
        communities,
        customCommunityTagLabels,
      ),
      "home-tags": collectHomeTagOptions(communities),
      cities: collectCityOptions(communities),
    } satisfies Record<string, SectionFilterOption[]>;
  }, [communities, customCommunityTagLabels]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visibleRows.findIndex((row) => row.id === active.id);
    const newIndex = visibleRows.findIndex((row) => row.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const nextVisible = arrayMove(visibleRows, oldIndex, newIndex);
    const nextIds = [
      ...nextVisible.map((row) => row.id),
      ...hiddenRows.map((row) => row.id),
    ];

    setBusy(true);
    try {
      await reorderHomepageSections(nextIds);
    } finally {
      setBusy(false);
    }
  }

  async function toggleEnabled(row: HomepageSection, enabled: boolean) {
    setBusy(true);
    try {
      await setHomepageSectionEnabled(row.id, enabled);
      toastSuccess(enabled ? "Section shown on homepage" : "Section hidden");
    } finally {
      setBusy(false);
    }
  }

  async function saveTitle(row: HomepageSection, title: string) {
    const next = title.trim();
    const current = row.title?.trim() ?? "";
    if (next === current) return;
    setBusy(true);
    try {
      await updateHomepageSectionTitle(row.id, next || null);
    } finally {
      setBusy(false);
    }
  }

  async function saveConfig(row: HomepageSection, config: HomepageSectionConfig) {
    setBusy(true);
    try {
      await updateHomepageSectionConfig(row.id, config);
      toastSuccess("Section filters saved");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setBusy(true);
    try {
      await resetHomepageSections();
      setExpandedId(null);
      toastSuccess("Built-in layout reset (custom video rows kept)");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddVideoRow() {
    setBusy(true);
    try {
      const updated = await addCustomVideoSection("By Previax");
      const created = [...updated]
        .filter(isCustomVideoSection)
        .sort((a, b) => b.order - a.order)[0];
      if (created) setExpandedId(created.id);
      toastSuccess("Video row added");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to add row");
    } finally {
      setBusy(false);
    }
  }

  async function handleRestoreBuiltin(key: HomepageSectionKey) {
    const row = hiddenRows.find((item) => item.sectionKey === key);
    if (!row) return;
    await toggleEnabled(row, true);
    setAddMenuOpen(false);
  }

  async function handleDeleteSection(row: HomepageSection) {
    if (!isCustomVideoSection(row)) return;
    if (!window.confirm(`Delete “${resolveHomepageSectionTitle(row)}”?`)) return;
    setBusy(true);
    try {
      await deleteHomepageSection(row.id);
      if (expandedId === row.id) setExpandedId(null);
      toastSuccess("Video row deleted");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl">Homepage Layout</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Drag to reorder. Expand a section to rename it, pick which tags /
            cities / categories appear, or manage custom videos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={handleReset}
          >
            <RotateCcw className="mr-1.5 size-4" />
            Reset defaults
          </Button>
          <div className="relative" data-homepage-add-menu>
            <Button
              type="button"
              size="lg"
              disabled={busy}
              className="gap-1.5"
              onClick={() => setAddMenuOpen((o) => !o)}
            >
              <Plus className="size-4" />
              Add
            </Button>
            {addMenuOpen && (
              <div className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                <ul className="p-1.5">
                  <li>
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                      onClick={() => {
                        setAddMenuOpen(false);
                        void handleAddVideoRow();
                      }}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Film className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium">
                          Video row
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Custom YouTube row — e.g. By Previax
                        </span>
                      </span>
                    </button>
                  </li>
                  {hiddenBuiltins.length > 0 && (
                    <>
                      <li className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Restore built-in
                      </li>
                      {hiddenBuiltins.map((entry) => (
                        <li key={entry.key}>
                          <button
                            type="button"
                            className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                            onClick={() =>
                              void handleRestoreBuiltin(entry.key)
                            }
                          >
                            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                              <LayoutList className="size-4" />
                            </span>
                            <span>
                              <span className="block text-sm font-medium">
                                {entry.defaultTitle}
                              </span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {entry.description}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">
          Visible ({visibleRows.length})
        </h3>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => void handleDragEnd(event)}
        >
          <SortableContext
            items={visibleRows.map((row) => row.id)}
            strategy={verticalListSortingStrategy}
          >
            {visibleRows.map((row, index) => (
              <SortableSectionRow
                key={row.id}
                row={row}
                index={index}
                busy={busy}
                expanded={expandedId === row.id}
                filterOptions={
                  isFilterableHomepageSectionKey(row.sectionKey)
                    ? filterOptionsByKey[row.sectionKey]
                    : undefined
                }
                onToggleExpand={() =>
                  setExpandedId((id) => (id === row.id ? null : row.id))
                }
                onHide={() => void toggleEnabled(row, false)}
                onSaveTitle={(title) => void saveTitle(row, title)}
                onSaveConfig={(config) => void saveConfig(row, config)}
                onDelete={() => void handleDeleteSection(row)}
                onNavigate={onNavigate}
                onAddVideo={(data) => addHomepageSectionVideo(row.id, data)}
                onUpdateVideo={updateHomepageSectionVideo}
                onDeleteVideo={deleteHomepageSectionVideo}
                setBusy={setBusy}
              />
            ))}
          </SortableContext>
        </DndContext>

        {visibleRows.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No visible sections. Use Add to restore a built-in row or create a
            video row.
          </p>
        )}
      </div>

      {hiddenRows.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setShowHidden((v) => !v)}
          >
            {showHidden ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            Hidden ({hiddenRows.length})
          </button>
          {showHidden &&
            hiddenRows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {resolveHomepageSectionTitle(row)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {getHomepageSectionDescription(row.sectionKey)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isCustomVideoSection(row) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={busy}
                      onClick={() => void handleDeleteSection(row)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => void toggleEnabled(row, true)}
                  >
                    Show
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function SortableSectionRow({
  row,
  index,
  busy,
  expanded,
  filterOptions,
  onToggleExpand,
  onHide,
  onSaveTitle,
  onSaveConfig,
  onDelete,
  onNavigate,
  onAddVideo,
  onUpdateVideo,
  onDeleteVideo,
  setBusy,
}: {
  row: HomepageSection;
  index: number;
  busy: boolean;
  expanded: boolean;
  filterOptions?: SectionFilterOption[];
  onToggleExpand: () => void;
  onHide: () => void;
  onSaveTitle: (title: string) => void;
  onSaveConfig: (config: HomepageSectionConfig) => void;
  onDelete: () => void;
  onNavigate: (tab: DashboardTab) => void;
  onAddVideo: (data: {
    title: string;
    youtubeUrl: string;
    thumbnailUrl?: string;
  }) => Promise<HomepageSection[]>;
  onUpdateVideo: (
    id: string,
    data: Partial<{
      title: string;
      youtubeUrl: string;
      thumbnailUrl?: string;
    }>,
  ) => Promise<HomepageSection[]>;
  onDeleteVideo: (id: string) => Promise<HomepageSection[]>;
  setBusy: (busy: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const catalog = HOMEPAGE_SECTION_CATALOG.find(
    (entry) => entry.key === row.sectionKey,
  );
  const isCustom = isCustomVideoSection(row);
  const title = resolveHomepageSectionTitle(row);
  const videoCount = row.videos?.length ?? 0;
  const selectedCount =
    row.config?.includeKeys == null
      ? null
      : row.config.includeKeys.length;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "rounded-xl border border-border bg-card/40 transition-colors",
        expanded && "border-primary/30 bg-card",
        isDragging && "z-20 opacity-90 shadow-lg ring-1 ring-primary/30",
      )}
    >
      <div className="flex items-stretch gap-1 p-2 sm:gap-2 sm:p-3">
        <button
          type="button"
          className="flex cursor-grab touch-none items-center px-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
          disabled={busy}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <button
          type="button"
          onClick={onToggleExpand}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-muted/50"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {title}
              </span>
              {isCustom && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Video
                </span>
              )}
              {filterOptions && selectedCount !== null && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {selectedCount}/{filterOptions.length} shown
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {isCustom
                ? `${videoCount} video${videoCount === 1 ? "" : "s"}`
                : catalog?.description ??
                  getHomepageSectionDescription(row.sectionKey)}
            </span>
          </span>
          {expanded ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {catalog?.manageTab && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onNavigate(catalog.manageTab!)}
              aria-label="Manage content"
            >
              <ExternalLink className="size-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={onHide}
          >
            Hide
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-border px-3 py-4 sm:px-4">
          <div className="max-w-md space-y-1.5">
            <Label htmlFor={`section-title-${row.id}`}>Row title</Label>
            <Input
              id={`section-title-${row.id}`}
              defaultValue={row.title ?? (isCustom ? "By Previax" : "")}
              placeholder={getHomepageSectionLabel(row.sectionKey)}
              disabled={busy}
              onBlur={(e) => onSaveTitle(e.target.value)}
            />
          </div>

          {catalog?.manageTab && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onNavigate(catalog.manageTab!)}
            >
              <ExternalLink className="mr-1.5 size-3.5" />
              Manage {getHomepageSectionLabel(row.sectionKey)} content
            </Button>
          )}

          {filterOptions && filterOptions.length > 0 && (
            <IncludeKeysEditor
              options={filterOptions}
              config={row.config}
              busy={busy}
              onSave={onSaveConfig}
            />
          )}

          {isFilterableHomepageSectionKey(row.sectionKey) &&
            (!filterOptions || filterOptions.length === 0) && (
              <p className="text-sm text-muted-foreground">
                No options available yet for this section. Add tagged homes or
                communities first.
              </p>
            )}

          {isCustom && (
            <CustomVideosEditor
              videos={row.videos ?? []}
              busy={busy}
              setBusy={setBusy}
              onAdd={onAddVideo}
              onUpdate={onUpdateVideo}
              onDelete={onDeleteVideo}
            />
          )}

          {isCustom && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={onDelete}
            >
              <Trash2 className="mr-1.5 size-3.5" />
              Delete video row
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function IncludeKeysEditor({
  options,
  config,
  busy,
  onSave,
}: {
  options: SectionFilterOption[];
  config?: HomepageSectionConfig;
  busy: boolean;
  onSave: (config: HomepageSectionConfig) => void;
}) {
  const showingAll = config?.includeKeys == null;
  const selected = useMemo(() => {
    if (showingAll) return new Set(options.map((o) => o.key));
    return new Set(config?.includeKeys ?? []);
  }, [showingAll, config?.includeKeys, options]);

  const [draft, setDraft] = useState<Set<string>>(selected);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(selected);
    setDirty(false);
  }, [selected]);

  function toggle(key: string) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setDirty(true);
  }

  function selectAll() {
    setDraft(new Set(options.map((o) => o.key)));
    setDirty(true);
  }

  function selectNone() {
    setDraft(new Set());
    setDirty(true);
  }

  function handleSave() {
    // All selected → store null (meaning show all, including future tags)
    const allSelected =
      draft.size === options.length &&
      options.every((option) => draft.has(option.key));
    onSave({
      includeKeys: allSelected
        ? null
        : options
            .filter((option) => draft.has(option.key))
            .map((option) => option.key),
    });
    setDirty(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium">What to show</p>
          <p className="text-xs text-muted-foreground">
            Choose which rows appear under this section. Unchecked items stay
            hidden.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={selectAll}
          >
            All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={selectNone}
          >
            None
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={busy || !dirty}
            onClick={handleSave}
          >
            Save filters
          </Button>
        </div>
      </div>

      <ul className="grid max-h-64 gap-1.5 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = draft.has(option.key);
          return (
            <li key={option.key}>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60",
                  checked ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <input
                  type="checkbox"
                  className="size-4 rounded border-border"
                  checked={checked}
                  disabled={busy}
                  onChange={() => toggle(option.key)}
                />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {option.count}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CustomVideosEditor({
  videos,
  busy,
  setBusy,
  onAdd,
  onUpdate,
  onDelete,
}: {
  videos: HomepageSectionVideo[];
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onAdd: (data: {
    title: string;
    youtubeUrl: string;
    thumbnailUrl?: string;
  }) => Promise<HomepageSection[]>;
  onUpdate: (
    id: string,
    data: Partial<{
      title: string;
      youtubeUrl: string;
      thumbnailUrl?: string;
    }>,
  ) => Promise<HomepageSection[]>;
  onDelete: (id: string) => Promise<HomepageSection[]>;
}) {
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!isValidYouTubeUrl(youtubeUrl)) {
      setError("Enter a valid YouTube URL");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await onAdd({
        title: title.trim(),
        youtubeUrl: youtubeUrl.trim(),
      });
      setTitle("");
      setYoutubeUrl("");
      toastSuccess("Video added");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to add video");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      await onDelete(id);
      toastSuccess("Video removed");
    } finally {
      setBusy(false);
    }
  }

  const sorted = [...videos].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Videos in this row</p>
        <p className="text-xs text-muted-foreground">
          These appear as a Netflix-style row on the homepage.
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No videos yet.</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((video) => (
            <li
              key={video.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Input
                  defaultValue={video.title}
                  disabled={busy}
                  className="h-8"
                  onBlur={(e) => {
                    const next = e.target.value.trim();
                    if (next && next !== video.title) {
                      void onUpdate(video.id, { title: next });
                    }
                  }}
                />
                <Input
                  defaultValue={video.youtubeUrl}
                  disabled={busy}
                  className="h-8 font-mono text-xs"
                  onBlur={(e) => {
                    const next = e.target.value.trim();
                    if (next && next !== video.youtubeUrl) {
                      if (!isValidYouTubeUrl(next)) {
                        toastError("Invalid YouTube URL");
                        e.target.value = video.youtubeUrl;
                        return;
                      }
                      void onUpdate(video.id, { youtubeUrl: next });
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={busy}
                onClick={() => void handleDelete(video.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => void handleAdd(e)}
        className="space-y-3 rounded-lg border border-dashed border-border p-3"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Add video
        </p>
        <Input
          placeholder="Title"
          value={title}
          disabled={busy}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          placeholder="YouTube URL"
          value={youtubeUrl}
          disabled={busy}
          onChange={(e) => setYoutubeUrl(e.target.value)}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={busy}>
          <Plus className="mr-1.5 size-3.5" />
          Add video
        </Button>
      </form>
    </div>
  );
}

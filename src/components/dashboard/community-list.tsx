"use client";

import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  filterBySearch,
  ListToolbar,
  sortByLabel,
} from "@/components/dashboard/list-toolbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { getPriceRange } from "@/lib/community-utils";
import { getHomeModelName } from "@/lib/home-model";
import {
  communityHasBuilder,
  getCommunityBuilderDisplay,
} from "@/lib/community-builders";
import {
  getCommunityHeroPosterUrl,
  getHomePosterUrl,
} from "@/lib/community-media";
import { getCommunityTagLabel } from "@/lib/tag-labels";
import { toastError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Community, Home } from "@/lib/types";

type CommunityListProps = {
  filterBuilderId?: string;
  showBuilder?: boolean;
  /** Hide the section title when the parent page already provides one. */
  hideTitle?: boolean;
  onEditCommunity: (community: Community) => void;
  onEditHome?: (communityId: string, home: Home) => void;
  onAddHome?: (communityId: string) => void;
};

type ViewMode = "grid" | "list";

export function CommunityList({
  filterBuilderId,
  showBuilder = false,
  hideTitle = false,
  onEditCommunity,
  onEditHome,
  onAddHome,
}: CommunityListProps) {
  const {
    communities,
    builders,
    customCommunityTagLabels,
    deleteCommunity,
    deleteHome,
    updateCommunity,
  } = useDashboardData();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "community" | "home";
    communityId: string;
    homeId?: string;
    name: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [builderFilter, setBuilderFilter] = useState<string>("all");
  const [onlyWithModels, setOnlyWithModels] = useState(false);
  const [onlyWithVideo, setOnlyWithVideo] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<
    "all" | "visible" | "hidden"
  >("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const baseItems = filterBuilderId
    ? communities.filter((community) =>
        communityHasBuilder(community, filterBuilderId),
      )
    : communities;

  const cities = useMemo(() => {
    const set = new Set(baseItems.map((c) => c.city).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [baseItems]);

  const sortedBuilders = useMemo(
    () => [...builders].sort((a, b) => a.name.localeCompare(b.name)),
    [builders],
  );

  const hiddenCount = useMemo(
    () => baseItems.filter((c) => c.isHidden).length,
    [baseItems],
  );

  const items = useMemo(() => {
    let filtered = filterBySearch(
      baseItems,
      search,
      (c) =>
        `${c.name} ${c.city} ${c.builderName} ${(c.tags ?? []).join(" ")} ${c.homes.map((h) => h.modelName ?? "").join(" ")}`,
    );

    if (cityFilter !== "all") {
      filtered = filtered.filter((c) => c.city === cityFilter);
    }
    if (!filterBuilderId && builderFilter !== "all") {
      filtered = filtered.filter((c) =>
        communityHasBuilder(c, builderFilter),
      );
    }
    if (onlyWithModels) {
      filtered = filtered.filter((c) => c.homes.length > 0);
    }
    if (onlyWithVideo) {
      filtered = filtered.filter(
        (c) =>
          Boolean(c.youtubeUrl?.trim()) ||
          c.homes.some((h) => Boolean(h.youtubeUrl?.trim())),
      );
    }
    if (visibilityFilter === "visible") {
      filtered = filtered.filter((c) => !c.isHidden);
    } else if (visibilityFilter === "hidden") {
      filtered = filtered.filter((c) => c.isHidden);
    }

    return sortByLabel(filtered, (c) => c.name, sortDir);
  }, [
    baseItems,
    search,
    sortDir,
    cityFilter,
    builderFilter,
    filterBuilderId,
    onlyWithModels,
    onlyWithVideo,
    visibilityFilter,
  ]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function toggleHidden(community: Community) {
    setTogglingId(community.id);
    try {
      await updateCommunity(community.id, {
        isHidden: !community.isHidden,
      });
      toastSuccess(
        community.isHidden ? "Community unhidden" : "Community hidden",
      );
    } catch {
      toastError("Failed to update visibility");
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "community") {
      await deleteCommunity(deleteTarget.communityId);
      toastSuccess("Community deleted");
    } else if (deleteTarget.homeId) {
      await deleteHome(deleteTarget.communityId, deleteTarget.homeId);
      toastSuccess("Model home deleted");
    }
    setDeleteTarget(null);
  }

  if (baseItems.length === 0) {
    return (
      <p className="text-muted-foreground">
        {filterBuilderId
          ? "No communities for this builder yet. Use Add to create one."
          : "No communities yet. Use Add to create one."}
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {!hideTitle && (
              <h2 className="font-heading text-xl">
                {filterBuilderId ? "Communities" : "All Communities"}
              </h2>
            )}
            <p
              className={cn(
                "text-sm text-muted-foreground",
                !hideTitle && "mt-0",
              )}
            >
              {baseItems.length} total · {hiddenCount} hidden
            </p>
          </div>
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid className="size-3.5" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={viewMode === "list"}
            >
              <List className="size-3.5" />
              List
            </button>
          </div>
        </div>

        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search name, city, builder, tags, models…"
          sortDir={sortDir}
          onSortToggle={() =>
            setSortDir((d) => (d === "asc" ? "desc" : "asc"))
          }
          count={items.length}
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filter by city"
          >
            <option value="all">All cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {!filterBuilderId && (
            <select
              value={builderFilter}
              onChange={(e) => setBuilderFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Filter by builder"
            >
              <option value="all">All builders</option>
              {sortedBuilders.map((builder) => (
                <option key={builder.id} value={builder.id}>
                  {builder.name}
                </option>
              ))}
            </select>
          )}
          <FilterChip
            active={onlyWithModels}
            onClick={() => setOnlyWithModels((v) => !v)}
            label="Has models"
          />
          <FilterChip
            active={onlyWithVideo}
            onClick={() => setOnlyWithVideo((v) => !v)}
            label="Has video"
          />
          <FilterChip
            active={visibilityFilter === "visible"}
            onClick={() =>
              setVisibilityFilter((v) => (v === "visible" ? "all" : "visible"))
            }
            label="Visible only"
          />
          <FilterChip
            active={visibilityFilter === "hidden"}
            onClick={() =>
              setVisibilityFilter((v) => (v === "hidden" ? "all" : "hidden"))
            }
            label={`Hidden (${hiddenCount})`}
          />
        </div>

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No matches for your search or filters.
          </p>
        )}

        {viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((community) => (
              <CommunityPreviewCard
                key={community.id}
                community={community}
                showBuilder={showBuilder}
                builderName={getCommunityBuilderDisplay(community, builders)}
                tagLabels={customCommunityTagLabels}
                expanded={expanded.has(community.id)}
                onToggle={() => toggleExpanded(community.id)}
                onEdit={() => onEditCommunity(community)}
                onAddHome={
                  onAddHome ? () => onAddHome(community.id) : undefined
                }
                onEditHome={onEditHome}
                onToggleHidden={() => toggleHidden(community)}
                togglingHidden={togglingId === community.id}
                onDeleteCommunity={() =>
                  setDeleteTarget({
                    type: "community",
                    communityId: community.id,
                    name: community.name,
                  })
                }
                onDeleteHome={(home) =>
                  setDeleteTarget({
                    type: "home",
                    communityId: community.id,
                    homeId: home.id,
                    name: getHomeModelName(home),
                  })
                }
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((community) => (
              <CommunityListRow
                key={community.id}
                community={community}
                showBuilder={showBuilder}
                builderName={getCommunityBuilderDisplay(community, builders)}
                tagLabels={customCommunityTagLabels}
                expanded={expanded.has(community.id)}
                onToggle={() => toggleExpanded(community.id)}
                onEdit={() => onEditCommunity(community)}
                onAddHome={
                  onAddHome ? () => onAddHome(community.id) : undefined
                }
                onEditHome={onEditHome}
                onToggleHidden={() => toggleHidden(community)}
                togglingHidden={togglingId === community.id}
                onDeleteCommunity={() =>
                  setDeleteTarget({
                    type: "community",
                    communityId: community.id,
                    name: community.name,
                  })
                }
                onDeleteHome={(home) =>
                  setDeleteTarget({
                    type: "home",
                    communityId: community.id,
                    homeId: home.id,
                    name: getHomeModelName(home),
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

type CardSharedProps = {
  community: Community;
  showBuilder: boolean;
  builderName: string;
  tagLabels: Record<string, string>;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onAddHome?: () => void;
  onEditHome?: (communityId: string, home: Home) => void;
  onToggleHidden: () => void;
  togglingHidden: boolean;
  onDeleteCommunity: () => void;
  onDeleteHome: (home: Home) => void;
};

function CommunityPreviewCard({
  community,
  showBuilder,
  builderName,
  tagLabels,
  expanded,
  onToggle,
  onEdit,
  onAddHome,
  onEditHome,
  onToggleHidden,
  togglingHidden,
  onDeleteCommunity,
  onDeleteHome,
}: CardSharedProps) {
  const poster = getCommunityHeroPosterUrl(community);
  const priceRange = getPriceRange(community);
  const isHidden = Boolean(community.isHidden);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm",
        isHidden
          ? "border-amber-500/40 opacity-80"
          : "border-border",
      )}
    >
      <button type="button" onClick={onToggle} className="relative block w-full text-left">
        <div className="relative aspect-[16/10] bg-muted">
          {poster ? (
            <img
              src={poster}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              No preview
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10">
            <h3 className="truncate font-heading text-base text-white">
              {community.name}
            </h3>
            <p className="truncate text-xs text-white/80">
              {community.city}
              {showBuilder ? ` · ${builderName}` : ""}
            </p>
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {isHidden && (
              <span className="rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Hidden
              </span>
            )}
            {community.youtubeUrl && (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                <Video className="size-3" />
                Video
              </span>
            )}
          </div>
        </div>
      </button>

      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {community.homes.length} model
            {community.homes.length === 1 ? "" : "s"}
            {priceRange ? ` · ${priceRange.label}` : ""}
          </p>
          <div className="flex gap-0.5">
            {onAddHome && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onAddHome}
                aria-label="Add model"
              >
                <Plus className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleHidden}
              disabled={togglingHidden}
              aria-label={isHidden ? "Unhide community" : "Hide community"}
            >
              {isHidden ? (
                <Eye className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onEdit}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDeleteCommunity}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>

        {community.tags && community.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {community.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {getCommunityTagLabel(tag, tagLabels)}
              </span>
            ))}
          </div>
        )}

        {expanded && (
          <ModelPreviewList
            community={community}
            onEditHome={onEditHome}
            onDeleteHome={onDeleteHome}
            onAddHome={onAddHome}
          />
        )}

        <button
          type="button"
          onClick={onToggle}
          className="text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Hide models" : "Show models"}
        </button>
      </div>
    </article>
  );
}

function CommunityListRow(props: CardSharedProps) {
  const {
    community,
    showBuilder,
    builderName,
    tagLabels,
    expanded,
    onToggle,
    onEdit,
    onAddHome,
    onEditHome,
    onToggleHidden,
    togglingHidden,
    onDeleteCommunity,
    onDeleteHome,
  } = props;
  const poster = getCommunityHeroPosterUrl(community);
  const priceRange = getPriceRange(community);
  const isHidden = Boolean(community.isHidden);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card",
        isHidden
          ? "border-amber-500/40 opacity-80"
          : "border-border",
      )}
    >
      <div className="flex items-stretch gap-3 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {expanded ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}
          <img
            src={poster}
            alt=""
            className="size-14 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate font-medium">{community.name}</p>
              {isHidden && (
                <span className="shrink-0 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                  Hidden
                </span>
              )}
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {community.city}
              {showBuilder ? ` · ${builderName}` : ""}
              {priceRange ? ` · ${priceRange.label}` : ""}
              {" · "}
              {community.homes.length} model
              {community.homes.length === 1 ? "" : "s"}
            </p>
            {community.tags && community.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {community.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {getCommunityTagLabel(tag, tagLabels)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </button>
        <div className="flex shrink-0 items-start gap-0.5">
          {onAddHome && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onAddHome}
              aria-label="Add model"
            >
              <Plus className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleHidden}
            disabled={togglingHidden}
            aria-label={isHidden ? "Unhide community" : "Hide community"}
          >
            {isHidden ? (
              <Eye className="size-4" />
            ) : (
              <EyeOff className="size-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDeleteCommunity}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-3 py-3">
          <ModelPreviewList
            community={community}
            onEditHome={onEditHome}
            onDeleteHome={onDeleteHome}
            onAddHome={onAddHome}
          />
        </div>
      )}
    </div>
  );
}

function ModelPreviewList({
  community,
  onEditHome,
  onDeleteHome,
  onAddHome,
}: {
  community: Community;
  onEditHome?: (communityId: string, home: Home) => void;
  onDeleteHome: (home: Home) => void;
  onAddHome?: () => void;
}) {
  if (community.homes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No models yet.
        {onAddHome && " Use + to add a home model."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {community.homes.map((home) => {
        const poster = getHomePosterUrl(home, community);
        return (
          <div
            key={home.id}
            className="flex items-center gap-3 rounded-lg bg-muted/50 px-2 py-2"
          >
            <img
              src={poster}
              alt=""
              className="size-12 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {getHomeModelName(home)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {home.price > 0
                  ? `$${home.price.toLocaleString()}`
                  : "Price TBD"}
                {home.bedrooms > 0 ? ` · ${home.bedrooms} bd` : ""}
                {home.bathrooms > 0 ? ` · ${home.bathrooms} ba` : ""}
                {home.youtubeUrl ? " · Video" : ""}
              </p>
            </div>
            {onEditHome && (
              <div className="flex shrink-0 gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEditHome(community.id, home)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDeleteHome(home)}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

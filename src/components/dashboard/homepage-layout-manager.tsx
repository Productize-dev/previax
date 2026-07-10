"use client";

import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import {
  getHomepageSectionDescription,
  getHomepageSectionLabel,
  HOMEPAGE_SECTION_CATALOG,
  resolveHomepageSectionTitle,
} from "@/lib/homepage-layout";
import { toastSuccess } from "@/lib/toast";
import type { DashboardTab, HomepageSection } from "@/lib/types";

type HomepageLayoutManagerProps = {
  onNavigate: (tab: DashboardTab) => void;
};

export function HomepageLayoutManager({ onNavigate }: HomepageLayoutManagerProps) {
  const {
    homepageSections,
    setHomepageSectionEnabled,
    updateHomepageSectionTitle,
    reorderHomepageSections,
    resetHomepageSections,
  } = useDashboardData();
  const [busy, setBusy] = useState(false);

  const rows = useMemo(
    () => [...homepageSections].sort((a, b) => a.order - b.order),
    [homepageSections],
  );

  const disabledKeys = useMemo(
    () =>
      new Set(
        rows.filter((row) => !row.enabled).map((row) => row.sectionKey),
      ),
    [rows],
  );

  async function moveRow(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= rows.length) return;
    const ids = rows.map((row) => row.id);
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    setBusy(true);
    try {
      await reorderHomepageSections(ids);
    } finally {
      setBusy(false);
    }
  }

  async function toggleEnabled(row: HomepageSection, enabled: boolean) {
    setBusy(true);
    try {
      await setHomepageSectionEnabled(row.id, enabled);
      toastSuccess(enabled ? "Section added to homepage" : "Section hidden");
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

  async function handleReset() {
    setBusy(true);
    try {
      await resetHomepageSections();
      toastSuccess("Homepage layout reset to defaults");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl">Homepage Layout</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Choose which sections appear on the homepage, rename row titles, and
            control their order. Curated content (carousel, featured communities,
            Top 10, lenders) is still managed in their own tabs.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={handleReset}
        >
          <RotateCcw className="mr-1.5 size-4" />
          Reset to defaults
        </Button>
      </div>

      {disabledKeys.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hidden sections</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {HOMEPAGE_SECTION_CATALOG.filter((entry) =>
              disabledKeys.has(entry.key),
            ).map((entry) => {
              const row = rows.find((item) => item.sectionKey === entry.key);
              if (!row) return null;
              return (
                <Button
                  key={entry.key}
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => void toggleEnabled(row, true)}
                >
                  <Plus className="mr-1.5 size-3.5" />
                  {entry.defaultTitle}
                </Button>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h3 className="font-heading text-lg">
          Section order ({rows.filter((row) => row.enabled).length} visible)
        </h3>

        {rows.map((row, index) => {
          const catalog = HOMEPAGE_SECTION_CATALOG.find(
            (entry) => entry.key === row.sectionKey,
          );
          const label = getHomepageSectionLabel(row.sectionKey);
          const description =
            catalog?.description ?? getHomepageSectionDescription(row.sectionKey);

          return (
            <Card
              key={row.id}
              className={row.enabled ? undefined : "opacity-60"}
            >
              <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={busy || index === 0}
                      onClick={() => void moveRow(index, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={busy || index === rows.length - 1}
                      onClick={() => void moveRow(index, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <CardTitle className="text-base">
                        {index + 1}. {label}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Homepage title:{" "}
                        <span className="font-medium text-foreground">
                          {resolveHomepageSectionTitle(row)}
                        </span>
                      </p>
                    </div>

                    <div className="max-w-md space-y-1">
                      <label
                        htmlFor={`section-title-${row.id}`}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Custom title (optional)
                      </label>
                      <Input
                        id={`section-title-${row.id}`}
                        defaultValue={row.title ?? ""}
                        placeholder={label}
                        disabled={busy}
                        onBlur={(e) => void saveTitle(row, e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {catalog?.manageTab && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate(catalog.manageTab!)}
                    >
                      <ExternalLink className="mr-1.5 size-3.5" />
                      Manage content
                    </Button>
                  )}
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border"
                      checked={row.enabled}
                      disabled={busy}
                      onChange={(e) =>
                        void toggleEnabled(row, e.target.checked)
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {row.enabled ? "Visible" : "Hidden"}
                    </span>
                  </label>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

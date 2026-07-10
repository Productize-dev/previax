"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from "@/context/data-context";
import { previewCsvImport } from "@/lib/csv-catalog-import";
import { buildDefaultHomepageSections } from "@/lib/homepage-layout";
import {
  COMMUNITY_CSV_FIELDS,
  getCsvHeaders,
  guessColumnMapping,
  HOME_CSV_FIELDS,
  type CommunityColumnMapping,
  type CsvImportMode,
  type CsvImportPreview,
  type HomeColumnMapping,
} from "@/lib/csv-import-schema";
import type { CsvImportOptions } from "@/lib/csv-catalog-import";
import { cn } from "@/lib/utils";

type Step = "upload" | "mapping" | "preview" | "done";

function statusColor(status: string): string {
  switch (status) {
    case "create":
      return "text-emerald-600";
    case "update":
      return "text-blue-600";
    case "skip":
      return "text-muted-foreground";
    case "error":
      return "text-destructive";
    default:
      return "";
  }
}

function PreviewTable({
  title,
  rows,
}: {
  title: string;
  rows: CsvImportPreview["communities"];
}) {
  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{title}</h4>
      <div className="max-h-56 overflow-auto rounded-lg border border-border">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <th className="px-3 py-2">Row</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Issues</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rowNumber} className="border-t border-border">
                <td className="px-3 py-2">{row.rowNumber}</td>
                <td className="px-3 py-2">{row.label}</td>
                <td className={cn("px-3 py-2 capitalize", statusColor(row.status))}>
                  {row.status}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {[...row.errors, ...row.warnings].join(" · ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ColumnMappingRow({
  field,
  headers,
  value,
  onChange,
}: {
  field: string;
  headers: string[];
  value?: string;
  onChange: (header: string | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-32 shrink-0 text-muted-foreground">{field}</span>
      <Select
        value={value ?? "__skip__"}
        onValueChange={(v) =>
          onChange(v === "__skip__" ? undefined : v ?? undefined)
        }
      >
        <SelectTrigger className="h-8">
          <SelectValue placeholder="— skip —" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__skip__">— skip —</SelectItem>
          {headers.map((header) => (
            <SelectItem key={header} value={header}>
              {header}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CsvImportManager() {
  const { communities, builders, series, importCsvCatalog, refresh } = useData();
  const communitiesInputRef = useRef<HTMLInputElement>(null);
  const homesInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [mode, setMode] = useState<CsvImportMode>("create");
  const [communitiesCsv, setCommunitiesCsv] = useState("");
  const [homesCsv, setHomesCsv] = useState("");
  const [communityHeaders, setCommunityHeaders] = useState<string[]>([]);
  const [homeHeaders, setHomeHeaders] = useState<string[]>([]);
  const [communityMapping, setCommunityMapping] = useState<CommunityColumnMapping>(
    {},
  );
  const [homeMapping, setHomeMapping] = useState<HomeColumnMapping>({});
  const [preview, setPreview] = useState<CsvImportPreview | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const appData = useMemo(
    () => ({
      communities,
      builders,
      series,
      featured: [],
      lenders: [],
      lenderOffers: [],
      featuredCommunities: [],
      top10Communities: [],
      customCommunityTagLabels: {},
      homepageSeries: [],
      homepageHomes: [],
      homepageSections: buildDefaultHomepageSections(),
    }),
    [builders, communities, series],
  );

  async function loadFiles() {
    const communitiesFile = communitiesInputRef.current?.files?.[0];
    if (!communitiesFile) {
      setStatus("Select a communities.csv file first.");
      return;
    }

    const commText = await communitiesFile.text();
    const homesFile = homesInputRef.current?.files?.[0];
    const homesText = homesFile ? await homesFile.text() : "";

    setCommunitiesCsv(commText);
    setHomesCsv(homesText);

    const commHeaders = getCsvHeaders(commText);
    const homeHdrs = homesText ? getCsvHeaders(homesText) : [];

    setCommunityHeaders(commHeaders);
    setHomeHeaders(homeHdrs);
    setCommunityMapping(
      guessColumnMapping(commHeaders, COMMUNITY_CSV_FIELDS) as CommunityColumnMapping,
    );
    setHomeMapping(
      guessColumnMapping(homeHdrs, HOME_CSV_FIELDS) as HomeColumnMapping,
    );
    setStep("mapping");
    setStatus(null);
  }

  useEffect(() => {
    if (step !== "mapping" && step !== "preview") return;
    if (!communitiesCsv) return;

    const options: CsvImportOptions = {
      mode,
      communityMapping,
      homeMapping,
    };
    setPreview(previewCsvImport(appData, communitiesCsv, homesCsv, options));
  }, [step, communitiesCsv, homesCsv, mode, communityMapping, homeMapping, appData]);

  async function handleConfirmImport() {
    if (!communitiesCsv) return;
    setImporting(true);
    setStatus(null);

    try {
      const result = await importCsvCatalog(communitiesCsv, homesCsv, {
        mode,
        communityMapping,
        homeMapping,
        skipErrorRows: true,
      });

      await refresh();

      const parts = [
        result.communitiesAdded > 0 &&
          `${result.communitiesAdded} communit${result.communitiesAdded === 1 ? "y" : "ies"} created`,
        result.communitiesUpdated > 0 &&
          `${result.communitiesUpdated} updated`,
        result.homesAdded > 0 && `${result.homesAdded} models added`,
        result.homesUpdated > 0 && `${result.homesUpdated} models updated`,
      ].filter(Boolean);

      setStatus(
        parts.length > 0
          ? `Import complete: ${parts.join(", ")}.`
          : "Nothing imported — check preview for skipped rows.",
      );
      setStep("done");
      if (communitiesInputRef.current) communitiesInputRef.current.value = "";
      if (homesInputRef.current) homesInputRef.current.value = "";
    } catch (err) {
      setStatus(
        err instanceof Error ? err.message : "Import failed. Check your CSV files.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Import from CSV</CardTitle>
        <CardDescription>
          Validate, map columns, preview row-by-row, then import or upsert in bulk.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {step === "upload" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="communities-csv">
                communities.csv
              </label>
              <input
                ref={communitiesInputRef}
                id="communities-csv"
                type="file"
                accept=".csv,text/csv"
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="model-homes-csv">
                model_homes.csv (optional)
              </label>
              <input
                ref={homesInputRef}
                id="model-homes-csv"
                type="file"
                accept=".csv,text/csv"
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium"
              />
            </div>
            <Button type="button" onClick={() => void loadFiles()}>
              Next: map columns
            </Button>
          </>
        )}

        {(step === "mapping" || step === "preview") && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Import mode</Label>
                <Select
                  value={mode}
                  onValueChange={(v) => setMode((v as CsvImportMode) ?? "create")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create">Create only (skip duplicates)</SelectItem>
                    <SelectItem value="upsert">Upsert (update existing)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Community column mapping
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {COMMUNITY_CSV_FIELDS.map((field) => (
                  <ColumnMappingRow
                    key={field}
                    field={field}
                    headers={communityHeaders}
                    value={communityMapping[field]}
                    onChange={(header) =>
                      setCommunityMapping((prev) => {
                        const next = { ...prev };
                        if (header) next[field] = header;
                        else delete next[field];
                        return next;
                      })
                    }
                  />
                ))}
              </div>
            </div>

            {homeHeaders.length > 0 && (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Model home column mapping
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {HOME_CSV_FIELDS.map((field) => (
                    <ColumnMappingRow
                      key={field}
                      field={field}
                      headers={homeHeaders}
                      value={homeMapping[field]}
                      onChange={(header) =>
                        setHomeMapping((prev) => {
                          const next = { ...prev };
                          if (header) next[field] = header;
                          else delete next[field];
                          return next;
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {preview && (
              <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>
                    <strong>{preview.summary.communitiesCreate}</strong> create
                  </span>
                  <span>
                    <strong>{preview.summary.communitiesUpdate}</strong> update
                  </span>
                  <span>
                    <strong>{preview.summary.communitiesSkip}</strong> skip
                  </span>
                  <span className="text-destructive">
                    <strong>{preview.summary.communitiesError}</strong> errors
                  </span>
                </div>
                <PreviewTable title="Communities" rows={preview.communities} />
                {preview.homes.length > 0 && (
                  <PreviewTable title="Model homes" rows={preview.homes} />
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void handleConfirmImport()}
                disabled={importing || !preview}
              >
                {importing ? "Importing…" : "Confirm import"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setPreview(null);
                }}
              >
                Start over
              </Button>
            </div>
          </>
        )}

        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </CardContent>
    </Card>
  );
}

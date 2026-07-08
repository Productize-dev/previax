"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useData } from "@/context/data-context";

export function CsvImportManager() {
  const { importCsvCatalog } = useData();
  const communitiesInputRef = useRef<HTMLInputElement>(null);
  const homesInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleImport() {
    const communitiesFile = communitiesInputRef.current?.files?.[0];
    if (!communitiesFile) {
      setStatus("Select a communities.csv file first.");
      return;
    }

    setImporting(true);
    setStatus(null);

    try {
      const communitiesCsv = await communitiesFile.text();
      const homesFile = homesInputRef.current?.files?.[0];
      const modelHomesCsv = homesFile ? await homesFile.text() : "";

      const result = await importCsvCatalog(communitiesCsv, modelHomesCsv);

      if (result.communitiesAdded === 0) {
        setStatus(
          "No new communities imported. Existing names were skipped (duplicates).",
        );
      } else {
        const tagNote =
          result.tagsAdded.length > 0
            ? ` New tags: ${result.tagsAdded.join(", ")}.`
            : "";
        setStatus(
          `Imported ${result.communitiesAdded} communit${result.communitiesAdded === 1 ? "y" : "ies"}, ${result.homesAdded} model home${result.homesAdded === 1 ? "" : "s"}, ${result.buildersAdded} new builder${result.buildersAdded === 1 ? "" : "s"}.${tagNote}`,
        );
      }

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
          Upload completed spreadsheets. New community tags are added
          automatically. Duplicate community names are skipped.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <Button type="button" onClick={handleImport} disabled={importing}>
          {importing ? "Importing…" : "Import CSV"}
        </Button>

        {status && <p className="text-sm text-muted-foreground">{status}</p>}

        <p className="text-xs text-muted-foreground">
          Bundled files in <code>/public/import/</code> are also merged
          automatically on load when new communities are found.
        </p>
      </CardContent>
    </Card>
  );
}

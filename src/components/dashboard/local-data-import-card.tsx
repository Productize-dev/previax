"use client";

import { CloudUpload } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useData } from "@/context/data-context";
import {
  importLocalDataToCloud,
  readLocalAppData,
} from "@/lib/data/local-import";

type ImportState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; summary: string }
  | { status: "error"; message: string };

// Snapshot cacheado para useSyncExternalStore (estable entre renders y
// null durante SSR, así no hay hydration mismatch).
let localDataSnapshot: ReturnType<typeof readLocalAppData> | undefined;

function getLocalDataSnapshot() {
  localDataSnapshot ??= readLocalAppData();
  return localDataSnapshot;
}

const noopSubscribe = () => () => {};

/**
 * TEMPORAL (Fase 1): migración one-shot de la data que vivía en
 * localStorage ("previax-data") hacia Supabase. Quitar cuando todos los
 * navegadores con data local hayan migrado.
 */
export function LocalDataImportCard() {
  const { refresh } = useData();
  const [state, setState] = useState<ImportState>({ status: "idle" });
  const localData = useSyncExternalStore(
    noopSubscribe,
    getLocalDataSnapshot,
    () => null,
  );

  if (!localData || localData.communities.length === 0) {
    return null;
  }

  async function handleImport() {
    if (!localData) return;
    setState({ status: "running" });
    try {
      const result = await importLocalDataToCloud(localData);
      await refresh();
      setState({
        status: "done",
        summary:
          `${result.communities} comunidades, ${result.homes} modelos, ` +
          `${result.builders} builders, ${result.lenders} lenders subidos.`,
      });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Import failed",
      });
    }
  }

  return (
    <Card className="border-primary/40">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="font-heading text-lg">
          Importar datos locales a la nube
        </CardTitle>
        <CloudUpload className="size-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Este navegador tiene datos guardados de la versión anterior (
          {localData.communities.length} comunidades en localStorage). Súbelos
          una sola vez a Supabase; los registros existentes con el mismo ID se
          actualizan.
        </p>

        {state.status === "done" ? (
          <p className="text-sm text-primary">✓ {state.summary}</p>
        ) : (
          <Button
            type="button"
            onClick={handleImport}
            disabled={state.status === "running"}
          >
            {state.status === "running"
              ? "Subiendo..."
              : "Importar a Supabase"}
          </Button>
        )}

        {state.status === "error" && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}
      </CardContent>
    </Card>
  );
}

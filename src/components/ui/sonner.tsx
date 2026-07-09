"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "bg-card text-foreground border-border",
          success: "border-emerald-500/40",
          error: "border-destructive/40",
        },
      }}
    />
  );
}

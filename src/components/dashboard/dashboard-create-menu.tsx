"use client";

import { Building2, FileSpreadsheet, Home, Plus, Sparkles } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CreateMenuAction =
  | "community"
  | "model"
  | "paste"
  | "import-csv";

type CreateMenuItem = {
  id: CreateMenuAction;
  label: string;
  description: string;
  icon: typeof Plus;
};

type DashboardCreateMenuProps = {
  onSelect: (action: CreateMenuAction) => void;
  /** Extra actions beyond community + model. Defaults include paste. */
  actions?: CreateMenuAction[];
  className?: string;
  label?: string;
};

const ACTION_ITEMS: Record<CreateMenuAction, CreateMenuItem> = {
  community: {
    id: "community",
    label: "Community",
    description: "Add a new community listing",
    icon: Building2,
  },
  model: {
    id: "model",
    label: "Model home",
    description: "Add a model to an existing community",
    icon: Home,
  },
  paste: {
    id: "paste",
    label: "Paste & autofill",
    description: "Extract a draft from pasted text",
    icon: Sparkles,
  },
  "import-csv": {
    id: "import-csv",
    label: "Import CSV",
    description: "Bulk import communities or models",
    icon: FileSpreadsheet,
  },
};

export function DashboardCreateMenu({
  onSelect,
  actions = ["community", "model", "paste"],
  className,
  label = "Add",
}: DashboardCreateMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const items = actions.map((id) => ACTION_ITEMS[id]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        size="lg"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
        className="gap-1.5"
      >
        <Plus className="size-4" />
        {label}
      </Button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          <ul className="p-1.5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                    onClick={() => {
                      setOpen(false);
                      onSelect(item.id);
                    }}
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <Icon className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

import { LenderForm } from "@/components/dashboard/lender-form";
import { LenderList } from "@/components/dashboard/lender-list";
import type { Lender } from "@/lib/types";

export function LendersWorkspace() {
  const [editingLender, setEditingLender] = useState<Lender | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl">Lenders</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage lender profiles shown in the homepage Preferred Lenders row.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <LenderForm
          key={editingLender?.id ?? "new-lender"}
          editingItem={editingLender}
          onEditComplete={() => setEditingLender(null)}
        />
        <LenderList onEdit={setEditingLender} />
      </div>
    </div>
  );
}

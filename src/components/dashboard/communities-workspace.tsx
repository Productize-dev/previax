"use client";

import { useState } from "react";

import { CommunityForm } from "@/components/dashboard/community-form";
import { CommunityList } from "@/components/dashboard/community-list";
import { CsvImportManager } from "@/components/dashboard/csv-import-manager";
import { HomeForm } from "@/components/dashboard/home-form";
import type { Community, Home } from "@/lib/types";

export function CommunitiesWorkspace() {
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(
    null,
  );
  const [editingHome, setEditingHome] = useState<Home | null>(null);
  const [editingHomeCommunityId, setEditingHomeCommunityId] = useState<
    string | null
  >(null);
  const [addingHomeForCommunityId, setAddingHomeForCommunityId] = useState<
    string | null
  >(null);

  function handleEditHome(communityId: string, home: Home) {
    setEditingHome(home);
    setEditingHomeCommunityId(communityId);
    setAddingHomeForCommunityId(null);
  }

  function handleAddHome(communityId: string) {
    setEditingHome(null);
    setEditingHomeCommunityId(communityId);
    setAddingHomeForCommunityId(communityId);
  }

  function handleHomeEditComplete() {
    setEditingHome(null);
    setEditingHomeCommunityId(null);
    setAddingHomeForCommunityId(null);
  }

  const showHomeForm =
    (editingHome !== null && editingHomeCommunityId !== null) ||
    addingHomeForCommunityId !== null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl">All Communities</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View and edit every community and home model. Tags organize rows on
          the homepage.
        </p>
      </div>

      <CsvImportManager />

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-8">
          <CommunityForm
            key={editingCommunity?.id ?? "new-community"}
            editingCommunity={editingCommunity}
            onEditComplete={() => setEditingCommunity(null)}
          />

          {showHomeForm && (
            <HomeForm
              key={
                editingHome?.id ??
                `new-home-${addingHomeForCommunityId ?? editingHomeCommunityId}`
              }
              editingHome={editingHome}
              editingCommunityId={
                editingHomeCommunityId ?? addingHomeForCommunityId
              }
              onEditComplete={handleHomeEditComplete}
            />
          )}
        </div>

        <CommunityList
          showBuilder
          onEditCommunity={setEditingCommunity}
          onEditHome={handleEditHome}
          onAddHome={handleAddHome}
        />
      </div>
    </div>
  );
}

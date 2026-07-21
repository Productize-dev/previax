"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { AiPasteModal } from "@/components/dashboard/ai-paste-modal";
import { CommunityForm } from "@/components/dashboard/community-form";
import { CommunityList } from "@/components/dashboard/community-list";
import { CsvImportManager } from "@/components/dashboard/csv-import-manager";
import { HomeForm } from "@/components/dashboard/home-form";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { ExtractedListingDraft } from "@/lib/ai/listing-extract";
import {
  draftToCommunityForm,
  draftToHomeForm,
} from "@/lib/listing-draft";
import type {
  CommunityDashboardForm,
  HomeModelForm,
} from "@/lib/dashboard-defaults";
import type { Community, Home } from "@/lib/types";

type CommunitiesWorkspaceProps = {
  communityPrefillKey?: string;
  communityInitialForm?: CommunityDashboardForm;
  homePrefillKey?: string;
  homeInitialForm?: HomeModelForm;
  onPrefillConsumed?: () => void;
};

export function CommunitiesWorkspace({
  communityPrefillKey,
  communityInitialForm,
  homePrefillKey,
  homeInitialForm,
  onPrefillConsumed,
}: CommunitiesWorkspaceProps) {
  const { builders } = useDashboardData();
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
  const [pasteOpen, setPasteOpen] = useState(false);
  const [localCommunityPrefillKey, setLocalCommunityPrefillKey] = useState<
    string | undefined
  >();
  const [localCommunityInitialForm, setLocalCommunityInitialForm] = useState<
    CommunityDashboardForm | undefined
  >();
  const [localHomePrefillKey, setLocalHomePrefillKey] = useState<
    string | undefined
  >();
  const [localHomeInitialForm, setLocalHomeInitialForm] = useState<
    HomeModelForm | undefined
  >();
  const [pasteStatus, setPasteStatus] = useState<string | null>(null);

  const activeCommunityPrefillKey =
    communityPrefillKey ?? localCommunityPrefillKey;
  const activeCommunityInitialForm =
    communityInitialForm ?? localCommunityInitialForm;
  const activeHomePrefillKey = homePrefillKey ?? localHomePrefillKey;
  const activeHomeInitialForm = homeInitialForm ?? localHomeInitialForm;

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
    setLocalHomeInitialForm(undefined);
    setLocalHomePrefillKey(undefined);
    onPrefillConsumed?.();
  }

  function handleDraftExtracted(draft: ExtractedListingDraft) {
    const builderId = builders[0]?.id ?? "";
    const communityForm = draftToCommunityForm(draft, builderId);
    setLocalCommunityInitialForm(communityForm);
    setLocalCommunityPrefillKey(`paste-${Date.now()}`);
    setEditingCommunity(null);

    const homeForm = draftToHomeForm(draft, 0);
    if (homeForm) {
      setLocalHomeInitialForm(homeForm);
      setLocalHomePrefillKey(`paste-home-${Date.now()}`);
      setEditingHome(null);
      setEditingHomeCommunityId(null);
      setAddingHomeForCommunityId(null);
    }

    const homeCount = draft.homes?.length ?? 0;
    setPasteStatus(
      homeCount > 1
        ? `Draft loaded: community + first of ${homeCount} models. Review and save each.`
        : "Draft loaded — review the form and save when ready.",
    );
  }

  const showHomeForm =
    (editingHome !== null && editingHomeCommunityId !== null) ||
    addingHomeForCommunityId !== null ||
    Boolean(activeHomeInitialForm);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl">All Communities</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Visual catalog with previews. Tags organize rows on the homepage.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setPasteOpen(true)}>
          <Sparkles className="mr-1.5 size-4" />
          Paste & autofill
        </Button>
      </div>

      {pasteStatus && (
        <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
          {pasteStatus}
        </p>
      )}

      <CsvImportManager />

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-8">
          <CommunityForm
            key={
              activeCommunityPrefillKey ?? editingCommunity?.id ?? "new-community"
            }
            editingCommunity={editingCommunity}
            onEditComplete={() => {
              setEditingCommunity(null);
              setLocalCommunityInitialForm(undefined);
              setLocalCommunityPrefillKey(undefined);
              onPrefillConsumed?.();
            }}
            prefillKey={activeCommunityPrefillKey}
            initialForm={activeCommunityInitialForm}
          />

          {showHomeForm && (
            <HomeForm
              key={
                activeHomePrefillKey ??
                editingHome?.id ??
                `new-home-${addingHomeForCommunityId ?? editingHomeCommunityId}`
              }
              editingHome={editingHome}
              editingCommunityId={
                editingHomeCommunityId ?? addingHomeForCommunityId
              }
              onEditComplete={handleHomeEditComplete}
              prefillKey={activeHomePrefillKey}
              initialForm={activeHomeInitialForm}
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

      <AiPasteModal
        open={pasteOpen}
        onOpenChange={setPasteOpen}
        onExtracted={handleDraftExtracted}
      />
    </div>
  );
}

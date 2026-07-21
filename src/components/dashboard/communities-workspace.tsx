"use client";

import { useEffect, useRef, useState } from "react";

import { AiPasteModal } from "@/components/dashboard/ai-paste-modal";
import { CommunityForm } from "@/components/dashboard/community-form";
import { CommunityList } from "@/components/dashboard/community-list";
import { CsvImportManager } from "@/components/dashboard/csv-import-manager";
import {
  DashboardCreateMenu,
  type CreateMenuAction,
} from "@/components/dashboard/dashboard-create-menu";
import { HomeForm } from "@/components/dashboard/home-form";
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
  const [creatingCommunity, setCreatingCommunity] = useState(false);
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
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [communityPrefill, setCommunityPrefill] = useState<{
    key: string;
    form: CommunityDashboardForm;
  } | null>(null);
  const [homePrefill, setHomePrefill] = useState<{
    key: string;
    form: HomeModelForm;
  } | null>(null);
  const [pasteStatus, setPasteStatus] = useState<string | null>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);

  const showCommunityForm =
    creatingCommunity || editingCommunity !== null || communityPrefill !== null;

  const showHomeForm =
    (editingHome !== null && editingHomeCommunityId !== null) ||
    addingHomeForCommunityId !== null ||
    homePrefill !== null;

  // Adopt assistant / parent prefills into local state, then release parent.
  useEffect(() => {
    let adopted = false;
    if (communityPrefillKey && communityInitialForm) {
      setCommunityPrefill({
        key: communityPrefillKey,
        form: communityInitialForm,
      });
      setCreatingCommunity(true);
      setEditingCommunity(null);
      adopted = true;
    }
    if (homePrefillKey && homeInitialForm) {
      setHomePrefill({ key: homePrefillKey, form: homeInitialForm });
      setEditingHome(null);
      setEditingHomeCommunityId(null);
      setAddingHomeForCommunityId("__new__");
      adopted = true;
    }
    if (adopted) onPrefillConsumed?.();
    // Intentionally keyed only on prefill tokens from the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityPrefillKey, homePrefillKey]);

  useEffect(() => {
    if (!(showCommunityForm || showHomeForm)) return;
    formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showCommunityForm, showHomeForm, editingCommunity?.id, editingHome?.id]);

  function clearCommunityPanel() {
    setCreatingCommunity(false);
    setEditingCommunity(null);
    setCommunityPrefill(null);
  }

  function clearHomePanel() {
    setEditingHome(null);
    setEditingHomeCommunityId(null);
    setAddingHomeForCommunityId(null);
    setHomePrefill(null);
  }

  function handleEditCommunity(community: Community) {
    clearHomePanel();
    setCommunityPrefill(null);
    setCreatingCommunity(false);
    setEditingCommunity(community);
  }

  function handleEditHome(communityId: string, home: Home) {
    clearCommunityPanel();
    setHomePrefill(null);
    setEditingHome(home);
    setEditingHomeCommunityId(communityId);
    setAddingHomeForCommunityId(null);
  }

  function handleAddHome(communityId: string) {
    clearCommunityPanel();
    setHomePrefill(null);
    setEditingHome(null);
    setEditingHomeCommunityId(communityId);
    setAddingHomeForCommunityId(communityId);
  }

  function openCreateCommunity() {
    clearHomePanel();
    setEditingCommunity(null);
    setCommunityPrefill(null);
    setCreatingCommunity(true);
  }

  function openCreateModel() {
    clearCommunityPanel();
    setEditingHome(null);
    setEditingHomeCommunityId(null);
    setHomePrefill(null);
    setAddingHomeForCommunityId("__new__");
  }

  function handleCreateSelect(action: CreateMenuAction) {
    if (action === "community") openCreateCommunity();
    if (action === "model") openCreateModel();
    if (action === "paste") setPasteOpen(true);
    if (action === "import-csv") setShowCsvImport(true);
  }

  function handleDraftExtracted(draft: ExtractedListingDraft) {
    const builderId = builders[0]?.id ?? "";
    const communityForm = draftToCommunityForm(draft, builderId);
    setCommunityPrefill({
      key: `paste-${Date.now()}`,
      form: communityForm,
    });
    setEditingCommunity(null);
    setCreatingCommunity(true);

    const homeForm = draftToHomeForm(draft, 0);
    if (homeForm) {
      setHomePrefill({
        key: `paste-home-${Date.now()}`,
        form: homeForm,
      });
      setEditingHome(null);
      setEditingHomeCommunityId(null);
      setAddingHomeForCommunityId("__new__");
    }

    const homeCount = draft.homes?.length ?? 0;
    setPasteStatus(
      homeCount > 1
        ? `Draft loaded: community + first of ${homeCount} models. Review and save each.`
        : "Draft loaded — review the form and save when ready.",
    );
  }

  const homeCommunityId =
    editingHomeCommunityId ??
    (addingHomeForCommunityId === "__new__" ? null : addingHomeForCommunityId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl">All Communities</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse and manage the catalog. Use Add to create communities or
            models.
          </p>
        </div>
        <DashboardCreateMenu
          onSelect={handleCreateSelect}
          actions={["community", "model", "paste", "import-csv"]}
        />
      </div>

      {pasteStatus && (
        <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
          {pasteStatus}
        </p>
      )}

      {showCsvImport && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">CSV import</p>
            <button
              type="button"
              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => setShowCsvImport(false)}
            >
              Hide import
            </button>
          </div>
          <CsvImportManager />
        </div>
      )}

      {(showCommunityForm || showHomeForm) && (
        <div
          ref={formPanelRef}
          className="grid gap-8 rounded-xl border border-border bg-card/40 p-4 sm:p-6 xl:grid-cols-2"
        >
          {showCommunityForm && (
            <CommunityForm
              key={communityPrefill?.key ?? editingCommunity?.id ?? "new-community"}
              editingCommunity={editingCommunity}
              onEditComplete={clearCommunityPanel}
              prefillKey={communityPrefill?.key}
              initialForm={communityPrefill?.form}
            />
          )}

          {showHomeForm && (
            <HomeForm
              key={
                homePrefill?.key ??
                editingHome?.id ??
                `new-home-${addingHomeForCommunityId ?? editingHomeCommunityId}`
              }
              editingHome={editingHome}
              editingCommunityId={homeCommunityId}
              onEditComplete={clearHomePanel}
              prefillKey={homePrefill?.key}
              initialForm={homePrefill?.form}
            />
          )}
        </div>
      )}

      <CommunityList
        showBuilder
        hideTitle
        onEditCommunity={handleEditCommunity}
        onEditHome={handleEditHome}
        onAddHome={handleAddHome}
      />

      <AiPasteModal
        open={pasteOpen}
        onOpenChange={setPasteOpen}
        onExtracted={handleDraftExtracted}
      />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AiPasteModal } from "@/components/dashboard/ai-paste-modal";
import { BuilderForm } from "@/components/dashboard/builder-form";
import { BuilderList } from "@/components/dashboard/builder-list";
import { CommunityForm } from "@/components/dashboard/community-form";
import { CommunityList } from "@/components/dashboard/community-list";
import {
  DashboardCreateMenu,
  type CreateMenuAction,
} from "@/components/dashboard/dashboard-create-menu";
import { HomeForm } from "@/components/dashboard/home-form";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { communityHasBuilder } from "@/lib/community-builders";
import {
  draftToCommunityForm,
  draftToHomeForm,
} from "@/lib/listing-draft";
import type { ExtractedListingDraft } from "@/lib/ai/listing-extract";
import type { CommunityDashboardForm, HomeModelForm } from "@/lib/dashboard-defaults";
import type { Builder, Community, Home } from "@/lib/types";

export function BuildersWorkspace() {
  const { builders, communities } = useDashboardData();
  const [selectedBuilderId, setSelectedBuilderId] = useState<string | null>(null);
  const [editingBuilder, setEditingBuilder] = useState<Builder | null>(null);
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
  const [communityPrefillKey, setCommunityPrefillKey] = useState<string>();
  const [communityInitialForm, setCommunityInitialForm] =
    useState<CommunityDashboardForm>();
  const [homePrefillKey, setHomePrefillKey] = useState<string>();
  const [homeInitialForm, setHomeInitialForm] = useState<HomeModelForm>();
  const [pasteStatus, setPasteStatus] = useState<string | null>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);

  const selectedBuilder = useMemo(
    () => builders.find((builder) => builder.id === selectedBuilderId) ?? null,
    [builders, selectedBuilderId],
  );

  const builderCommunityIds = useMemo(
    () =>
      communities
        .filter(
          (community) =>
            selectedBuilderId !== null &&
            communityHasBuilder(community, selectedBuilderId),
        )
        .map((community) => community.id),
    [communities, selectedBuilderId],
  );

  const showCommunityForm =
    creatingCommunity ||
    editingCommunity !== null ||
    Boolean(communityInitialForm) ||
    Boolean(communityPrefillKey);

  const showHomeForm =
    (editingHome !== null && editingHomeCommunityId !== null) ||
    addingHomeForCommunityId !== null ||
    Boolean(homeInitialForm);

  useEffect(() => {
    if (builders.length > 0 && !selectedBuilderId) {
      setSelectedBuilderId(builders[0].id);
    }
  }, [builders, selectedBuilderId]);

  useEffect(() => {
    if (!(showCommunityForm || showHomeForm)) return;
    formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showCommunityForm, showHomeForm, editingCommunity?.id, editingHome?.id]);

  function clearCommunityPanel() {
    setCreatingCommunity(false);
    setEditingCommunity(null);
    setCommunityInitialForm(undefined);
    setCommunityPrefillKey(undefined);
  }

  function clearHomePanel() {
    setEditingHome(null);
    setEditingHomeCommunityId(null);
    setAddingHomeForCommunityId(null);
    setHomeInitialForm(undefined);
    setHomePrefillKey(undefined);
  }

  function handleSelectBuilder(builderId: string) {
    setSelectedBuilderId(builderId || null);
    clearCommunityPanel();
    clearHomePanel();
  }

  function handleEditCommunity(community: Community) {
    setCreatingCommunity(false);
    setEditingCommunity(community);
    setCommunityInitialForm(undefined);
    setCommunityPrefillKey(undefined);
    clearHomePanel();
  }

  function handleEditHome(communityId: string, home: Home) {
    setEditingHome(home);
    setEditingHomeCommunityId(communityId);
    setAddingHomeForCommunityId(null);
    clearCommunityPanel();
  }

  function handleAddHome(communityId: string) {
    setEditingHome(null);
    setEditingHomeCommunityId(communityId);
    setAddingHomeForCommunityId(communityId);
    clearCommunityPanel();
  }

  function openCreateCommunity() {
    clearHomePanel();
    setEditingCommunity(null);
    setCommunityInitialForm(undefined);
    setCommunityPrefillKey(undefined);
    setCreatingCommunity(true);
  }

  function openCreateModel() {
    clearCommunityPanel();
    setEditingHome(null);
    setEditingHomeCommunityId(null);
    setAddingHomeForCommunityId("__new__");
    setHomeInitialForm(undefined);
    setHomePrefillKey(undefined);
  }

  function handleCreateSelect(action: CreateMenuAction) {
    if (action === "community") openCreateCommunity();
    if (action === "model") openCreateModel();
    if (action === "paste") setPasteOpen(true);
  }

  function handleDraftExtracted(draft: ExtractedListingDraft) {
    if (!selectedBuilder) return;

    const communityForm = draftToCommunityForm(draft, selectedBuilder.id);
    setCommunityInitialForm(communityForm);
    setCommunityPrefillKey(`paste-${Date.now()}`);
    setEditingCommunity(null);
    setCreatingCommunity(true);

    const homeForm = draftToHomeForm(draft, 0);
    if (homeForm) {
      setHomeInitialForm(homeForm);
      setHomePrefillKey(`paste-home-${Date.now()}`);
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
    <div className="space-y-10">
      <div>
        <h2 className="font-heading text-2xl">Builders</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize the catalog by builder. Select a builder to manage their
          communities and home models.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <BuilderForm
          key={editingBuilder?.id ?? "new-builder"}
          editingBuilder={editingBuilder}
          onEditComplete={() => setEditingBuilder(null)}
        />
        <BuilderList
          selectedBuilderId={selectedBuilderId}
          onSelect={handleSelectBuilder}
          onEdit={setEditingBuilder}
        />
      </div>

      {selectedBuilder && (
        <div className="space-y-6 border-t border-border pt-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-heading text-xl">{selectedBuilder.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse and manage communities for this builder. Use Add to
                create.
              </p>
            </div>
            <DashboardCreateMenu onSelect={handleCreateSelect} />
          </div>

          {pasteStatus && (
            <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
              {pasteStatus}
            </p>
          )}

          {(showCommunityForm || showHomeForm) && (
            <div
              ref={formPanelRef}
              className="grid gap-8 rounded-xl border border-border bg-card/40 p-4 sm:p-6 xl:grid-cols-2"
            >
              {showCommunityForm && (
                <CommunityForm
                  key={`${selectedBuilder.id}-${editingCommunity?.id ?? communityPrefillKey ?? "new-community"}`}
                  editingCommunity={editingCommunity}
                  defaultBuilderId={selectedBuilder.id}
                  lockBuilder
                  onEditComplete={clearCommunityPanel}
                  prefillKey={communityPrefillKey}
                  initialForm={communityInitialForm}
                />
              )}

              {showHomeForm && (
                <HomeForm
                  key={
                    editingHome?.id ??
                    homePrefillKey ??
                    `new-home-${addingHomeForCommunityId ?? editingHomeCommunityId}`
                  }
                  editingHome={editingHome}
                  editingCommunityId={homeCommunityId}
                  communityIds={builderCommunityIds}
                  onEditComplete={clearHomePanel}
                  prefillKey={homePrefillKey}
                  initialForm={homeInitialForm}
                />
              )}
            </div>
          )}

          <CommunityList
            filterBuilderId={selectedBuilder.id}
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
      )}
    </div>
  );
}

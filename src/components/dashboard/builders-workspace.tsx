"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AiPasteModal } from "@/components/dashboard/ai-paste-modal";
import { BuilderForm } from "@/components/dashboard/builder-form";
import { BuilderList } from "@/components/dashboard/builder-list";
import { CommunityForm } from "@/components/dashboard/community-form";
import { CommunityList } from "@/components/dashboard/community-list";
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
import { Button } from "@/components/ui/button";

export function BuildersWorkspace() {
  const { builders, communities } = useDashboardData();
  const [selectedBuilderId, setSelectedBuilderId] = useState<string | null>(null);
  const [editingBuilder, setEditingBuilder] = useState<Builder | null>(null);
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

  useEffect(() => {
    if (builders.length > 0 && !selectedBuilderId) {
      setSelectedBuilderId(builders[0].id);
    }
  }, [builders, selectedBuilderId]);

  function handleSelectBuilder(builderId: string) {
    setSelectedBuilderId(builderId || null);
    setEditingCommunity(null);
    setEditingHome(null);
    setEditingHomeCommunityId(null);
    setAddingHomeForCommunityId(null);
  }

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
    setHomeInitialForm(undefined);
    setHomePrefillKey(undefined);
  }

  function handleDraftExtracted(draft: ExtractedListingDraft) {
    if (!selectedBuilder) return;

    const communityForm = draftToCommunityForm(draft, selectedBuilder.id);
    setCommunityInitialForm(communityForm);
    setCommunityPrefillKey(`paste-${Date.now()}`);
    setEditingCommunity(null);

    const homeForm = draftToHomeForm(draft, 0);
    if (homeForm) {
      setHomeInitialForm(homeForm);
      setHomePrefillKey(`paste-home-${Date.now()}`);
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
    addingHomeForCommunityId !== null;

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
                Communities and models for this builder.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setPasteOpen(true)}
            >
              <Sparkles className="size-4" />
              Paste & autofill
            </Button>
          </div>

          {pasteStatus && (
            <p className="text-sm text-muted-foreground">{pasteStatus}</p>
          )}

          <AiPasteModal
            open={pasteOpen}
            onOpenChange={setPasteOpen}
            onExtracted={handleDraftExtracted}
          />

          <div className="grid gap-8 xl:grid-cols-2">
            <div className="space-y-8">
              <CommunityForm
                key={`${selectedBuilder.id}-${editingCommunity?.id ?? communityPrefillKey ?? "new-community"}`}
                editingCommunity={editingCommunity}
                defaultBuilderId={selectedBuilder.id}
                lockBuilder
                onEditComplete={() => {
                  setEditingCommunity(null);
                  setCommunityInitialForm(undefined);
                  setCommunityPrefillKey(undefined);
                }}
                prefillKey={communityPrefillKey}
                initialForm={communityInitialForm}
              />

              {(showHomeForm || homeInitialForm) && (
                <HomeForm
                  key={
                    editingHome?.id ??
                    homePrefillKey ??
                    `new-home-${addingHomeForCommunityId ?? editingHomeCommunityId}`
                  }
                  editingHome={editingHome}
                  editingCommunityId={
                    editingHomeCommunityId ?? addingHomeForCommunityId
                  }
                  communityIds={builderCommunityIds}
                  onEditComplete={handleHomeEditComplete}
                  prefillKey={homePrefillKey}
                  initialForm={homeInitialForm}
                />
              )}
            </div>

            <CommunityList
              filterBuilderId={selectedBuilder.id}
              onEditCommunity={setEditingCommunity}
              onEditHome={handleEditHome}
              onAddHome={handleAddHome}
            />
          </div>
        </div>
      )}
    </div>
  );
}

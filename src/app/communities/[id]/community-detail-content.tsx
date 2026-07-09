"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BuilderOffers } from "@/components/communities/builder-offers";
import { FinancingOffers } from "@/components/communities/financing-offers";
import { CommunityCard } from "@/components/communities/community-card";
import { CommunityDiningSection } from "@/components/communities/community-dining-section";
import { CommunityGallerySection } from "@/components/communities/community-gallery-section";
import { NetflixCommunityDetailHero } from "@/components/communities/netflix-community-detail-hero";
import { NetflixModelsBrowser } from "@/components/communities/netflix-models-browser";
import { NetflixVideoOverlay } from "@/components/communities/netflix-video-overlay";
import { CommunityReviewsSection } from "@/components/communities/community-reviews-section";
import { CommunitySchoolsSection } from "@/components/communities/community-schools-section";
import {
  CommunityStats,
  MobileStickyBar,
} from "@/components/communities/community-stats";
import { RealtorCard } from "@/components/communities/realtor-card";
import { CalendlyEmbed } from "@/components/buyer/calendly-embed";
import { SaveButton } from "@/components/buyer/save-button";
import { NetflixNavbar } from "@/components/home/netflix-navbar";
import { HomeDetailModal } from "@/components/homes/home-detail-modal";
import { SiteFooter } from "@/components/layout/site-footer";
import { FadeInSection } from "@/components/ui/fade-in-section";
import { useData } from "@/context/data-context";
import { trackViewedCity } from "@/lib/buyer-storage";
import { trackCommunityView } from "@/lib/analytics";
import { getAvailableModels } from "@/lib/community-media";
import { getRelatedCommunities } from "@/lib/community-utils";
import type { Home } from "@/lib/types";

export default function CommunityDetailContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { communities, isLoaded } = useData();
  const [manualHome, setManualHome] = useState<Home | null>(null);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [activeModelIndex, setActiveModelIndex] = useState(0);

  const community = communities.find((c) => c.id === params.id);
  const homeIdParam = searchParams.get("home");

  const models = useMemo(
    () => (community ? getAvailableModels(community) : []),
    [community],
  );

  const activeModel = models[activeModelIndex] ?? null;

  const selectedHome = useMemo(() => {
    if (manualHome) return manualHome;
    if (!community || !homeIdParam) return null;
    return community.homes.find((h) => h.id === homeIdParam) ?? null;
  }, [manualHome, community, homeIdParam]);

  const related = useMemo(
    () => (community ? getRelatedCommunities(community, communities) : []),
    [community, communities],
  );

  const openModelAt = useCallback(
    (index: number, options?: { closeModels?: boolean }) => {
      if (!models[index]) return;
      setActiveModelIndex(index);
      setPlayerOpen(true);
      if (options?.closeModels !== false) {
        setModelsOpen(false);
      }
    },
    [models],
  );

  const handlePlayBuilders = useCallback(() => {
    if (models.length > 0) {
      openModelAt(0);
      return;
    }
    setActiveModelIndex(0);
    setPlayerOpen(true);
  }, [models.length, openModelAt]);

  const handleSelectModel = useCallback(
    (_home: Home, index: number) => {
      openModelAt(index);
    },
    [openModelAt],
  );

  const handleOpenModels = useCallback(() => {
    setModelsOpen(true);
  }, []);

  useEffect(() => {
    if (community?.city) trackViewedCity(community.city);
  }, [community?.city]);

  useEffect(() => {
    if (community?.id) void trackCommunityView(community.id);
  }, [community?.id]);

  useEffect(() => {
    if (!homeIdParam || !community) return;
    const index = models.findIndex((model) => model.id === homeIdParam);
    if (index >= 0) {
      setActiveModelIndex(index);
      setPlayerOpen(true);
    }
  }, [community, homeIdParam, models]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#141414]">
        <NetflixNavbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-[#b3b3b3]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-[#141414] text-white">
        <NetflixNavbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <h1 className="font-heading text-2xl">Community Not Found</h1>
          <Link href="/" className="text-[#46d369] hover:underline">
            ← Back to communities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="fixed inset-x-0 top-0 z-50">
        <NetflixNavbar />
      </div>

      <NetflixCommunityDetailHero
        community={community}
        hasModels={models.length > 0}
        onPlayBuilders={handlePlayBuilders}
        onOpenModels={handleOpenModels}
      />

      <NetflixModelsBrowser
        open={modelsOpen}
        community={community}
        models={models}
        selectedHomeId={activeModel?.id}
        onClose={() => setModelsOpen(false)}
        onSelectModel={handleSelectModel}
      />

      <NetflixVideoOverlay
        open={playerOpen}
        community={community}
        home={activeModel}
        homeIndex={activeModelIndex}
        models={models}
        onClose={() => setPlayerOpen(false)}
        onChangeHome={(index) => setActiveModelIndex(index)}
      />

      <main className="mx-auto max-w-6xl px-[4%] py-12 pb-24 md:pb-12">
        <div className="flex items-start justify-end gap-4">
          <SaveButton communityId={community.id} />
        </div>

        <FadeInSection>
          <CommunityStats community={community} />
        </FadeInSection>

        {community.lifestyleNotes && (
          <FadeInSection className="mt-8">
            <p className="max-w-3xl leading-relaxed text-[#b3b3b3]">
              {community.lifestyleNotes}
            </p>
          </FadeInSection>
        )}

        <div className="mt-16 space-y-20">
          <CommunityGallerySection community={community} />

          <CommunitySchoolsSection community={community} />

          <CommunityDiningSection community={community} />

          <FadeInSection>
            <BuilderOffers
              builderName={community.builderName}
              builderOffers={community.builderOffers}
              offerExpires={community.offerExpires}
            />
          </FadeInSection>

          <FadeInSection>
            <FinancingOffers communityId={community.id} />
          </FadeInSection>

          <CommunityReviewsSection community={community} />

          <FadeInSection>
            <section>
              <h2 className="font-heading mb-4 text-2xl text-white">
                Your Realtor
              </h2>
              <RealtorCard
                name={community.realtorName}
                photoUrl={community.realtorPhotoUrl}
                communityName={community.name}
              />
            </section>
          </FadeInSection>

          <FadeInSection>
            <CalendlyEmbed />
          </FadeInSection>

          {related.length > 0 && (
            <FadeInSection>
              <section>
                <h2 className="font-heading mb-6 text-2xl text-white">
                  More in {community.city}
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((c) => (
                    <CommunityCard key={c.id} community={c} />
                  ))}
                </div>
              </section>
            </FadeInSection>
          )}
        </div>
      </main>

      <MobileStickyBar community={community} />
      <SiteFooter />

      <HomeDetailModal
        home={selectedHome}
        communityId={community.id}
        communityName={community.name}
        open={selectedHome !== null}
        onOpenChange={(open) => !open && setManualHome(null)}
      />
    </div>
  );
}

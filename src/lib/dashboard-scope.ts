import { communityHasBuilder } from "@/lib/community-builders";
import type {
  Builder,
  Community,
  FeaturedCommunityRow,
  FeaturedItem,
  HomepageSeriesRow,
  Lender,
  LenderOffer,
  Profile,
  Series,
  Top10CommunitySlot,
  UserRole,
} from "@/lib/types";

export type ScopedCatalog = {
  role: UserRole;
  builders: Builder[];
  communities: Community[];
  series: Series[];
  lenders: Lender[];
  lenderOffers: LenderOffer[];
  featured: FeaturedItem[];
  featuredCommunities: FeaturedCommunityRow[];
  top10Communities: Top10CommunitySlot[];
  homepageSeries: HomepageSeriesRow[];
  /** Catálogo completo de comunidades (p. ej. selector de ofertas lender). */
  catalogCommunities: Community[];
};

type ScopeInput = {
  builders: Builder[];
  communities: Community[];
  series: Series[];
  lenders: Lender[];
  lenderOffers: LenderOffer[];
  featured: FeaturedItem[];
  featuredCommunities: FeaturedCommunityRow[];
  top10Communities: Top10CommunitySlot[];
  homepageSeries: HomepageSeriesRow[];
};

export function scopeDashboardData(
  data: ScopeInput,
  profile: Profile | null,
): ScopedCatalog {
  const role = profile?.role ?? "buyer";
  const catalogCommunities = data.communities;

  if (role === "admin") {
    return { role, catalogCommunities, ...data };
  }

  if (role === "builder" && profile) {
    const builders = data.builders.filter((b) => b.ownerId === profile.id);
    const builderIds = new Set(builders.map((b) => b.id));
    const communities = data.communities.filter(
      (c) =>
        c.ownerId === profile.id ||
        (c.builderId && builderIds.has(c.builderId)) ||
        c.builderIds?.some((id) => builderIds.has(id)),
    );
    const communityIds = new Set(communities.map((c) => c.id));
    const series = data.series.filter((s) => builderIds.has(s.builderId));

    return {
      role,
      catalogCommunities,
      builders,
      communities,
      series,
      lenders: [],
      lenderOffers: [],
      featured: [],
      featuredCommunities: data.featuredCommunities.filter((row) =>
        communityIds.has(row.communityId),
      ),
      top10Communities: data.top10Communities.filter((slot) =>
        communityIds.has(slot.communityId),
      ),
      homepageSeries: [],
    };
  }

  if (role === "lender" && profile) {
    const lenders = data.lenders.filter((l) => l.ownerId === profile.id);
    const lenderIds = new Set(lenders.map((l) => l.id));
    const lenderOffers = data.lenderOffers.filter((o) =>
      lenderIds.has(o.lenderId),
    );

    return {
      role,
      catalogCommunities,
      builders: [],
      communities: catalogCommunities,
      series: [],
      lenders,
      lenderOffers,
      featured: [],
      featuredCommunities: [],
      top10Communities: [],
      homepageSeries: [],
    };
  }

  return {
    role,
    catalogCommunities,
    builders: [],
    communities: [],
    series: [],
    lenders: [],
    lenderOffers: [],
    featured: [],
    featuredCommunities: [],
    top10Communities: [],
    homepageSeries: [],
  };
}

/** Comunidades vinculadas a un builder (para stats). */
export function communitiesForBuilder(
  communities: Community[],
  builderId: string,
): Community[] {
  return communities.filter((c) => communityHasBuilder(c, builderId));
}

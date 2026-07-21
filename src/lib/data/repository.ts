import type {
  AppData,
  Builder,
  BuilderInput,
  Community,
  CommunityInput,
  FeaturedItem,
  FeaturedItemInput,
  Home,
  HomeInput,
  HomepageHomesRow,
  HomepageSection,
  HomepageSectionKey,
  HomepageSectionConfig,
  HomepageSectionVideo,
  HomepageSectionVideoInput,
  HomepageSeriesRow,
  FeaturedCommunityRow,
  Lender,
  LenderInput,
  LenderOffer,
  LenderOfferInput,
  Series,
  SeriesInput,
  Top10CommunitySlot,
  Top10Period,
  ActivityEvent,
} from "../types";

export interface SiteRepository {
  getAppData(): Promise<AppData>;
  getAll(): Promise<Community[]>;
  getById(id: string): Promise<Community | null>;
  create(data: CommunityInput): Promise<Community>;
  update(id: string, data: Partial<CommunityInput>): Promise<Community>;
  delete(id: string): Promise<void>;
  addHome(communityId: string, home: HomeInput): Promise<Home>;
  updateHome(
    communityId: string,
    homeId: string,
    data: Partial<HomeInput>,
  ): Promise<Home>;
  deleteHome(communityId: string, homeId: string): Promise<void>;
  getFeatured(): Promise<FeaturedItem[]>;
  addFeatured(data: FeaturedItemInput): Promise<FeaturedItem>;
  updateFeatured(
    id: string,
    data: Partial<FeaturedItemInput>,
  ): Promise<FeaturedItem>;
  deleteFeatured(id: string): Promise<void>;
  reorderFeatured(orderedIds: string[]): Promise<FeaturedItem[]>;
  getLenders(): Promise<Lender[]>;
  addLender(data: LenderInput): Promise<Lender>;
  updateLender(id: string, data: Partial<LenderInput>): Promise<Lender>;
  deleteLender(id: string): Promise<void>;
  reorderLenders(orderedIds: string[]): Promise<Lender[]>;
  getLenderOffers(): Promise<LenderOffer[]>;
  addLenderOffer(data: LenderOfferInput): Promise<LenderOffer>;
  updateLenderOffer(
    id: string,
    data: Partial<LenderOfferInput>,
  ): Promise<LenderOffer>;
  deleteLenderOffer(id: string): Promise<void>;
  getFeaturedCommunities(): Promise<FeaturedCommunityRow[]>;
  addFeaturedCommunity(communityId: string): Promise<FeaturedCommunityRow>;
  removeFeaturedCommunity(id: string): Promise<void>;
  reorderFeaturedCommunities(
    orderedIds: string[],
  ): Promise<FeaturedCommunityRow[]>;
  getTop10Communities(period?: Top10Period): Promise<Top10CommunitySlot[]>;
  setTop10Slot(
    rank: number,
    communityId: string | null,
    period?: Top10Period,
  ): Promise<Top10CommunitySlot[]>;
  computeTop10(period: Top10Period): Promise<number>;
  getActivityEvents(limit?: number): Promise<ActivityEvent[]>;
  importCsvCatalog(
    communitiesCsv: string,
    modelHomesCsv: string,
    options?: import("../csv-catalog-import").CsvImportOptions,
  ): Promise<import("../csv-catalog-import").CsvImportResult>;
  getBuilders(): Promise<Builder[]>;
  addBuilder(data: BuilderInput): Promise<Builder>;
  updateBuilder(id: string, data: Partial<BuilderInput>): Promise<Builder>;
  deleteBuilder(id: string): Promise<void>;
  getSeries(): Promise<Series[]>;
  addSeries(data: SeriesInput): Promise<Series>;
  updateSeries(id: string, data: Partial<SeriesInput>): Promise<Series>;
  deleteSeries(id: string): Promise<void>;
  addHomepageSeries(seriesId: string): Promise<HomepageSeriesRow>;
  removeHomepageSeries(id: string): Promise<void>;
  reorderHomepageSeries(orderedIds: string[]): Promise<HomepageSeriesRow[]>;
  /** @deprecated Use addHomepageSeries */
  addHomepageHomes(communityId: string): Promise<HomepageHomesRow>;
  /** @deprecated Use removeHomepageSeries */
  removeHomepageHomes(id: string): Promise<void>;
  /** @deprecated Use reorderHomepageSeries */
  reorderHomepageHomes(orderedIds: string[]): Promise<HomepageHomesRow[]>;
  getHomepageSections(): Promise<HomepageSection[]>;
  setHomepageSectionEnabled(
    id: string,
    enabled: boolean,
  ): Promise<HomepageSection[]>;
  updateHomepageSectionTitle(
    id: string,
    title: string | null,
  ): Promise<HomepageSection[]>;
  updateHomepageSectionConfig(
    id: string,
    config: HomepageSectionConfig,
  ): Promise<HomepageSection[]>;
  reorderHomepageSections(orderedIds: string[]): Promise<HomepageSection[]>;
  resetHomepageSections(): Promise<HomepageSection[]>;
  addCustomVideoSection(title?: string): Promise<HomepageSection[]>;
  deleteHomepageSection(id: string): Promise<HomepageSection[]>;
  addHomepageSectionVideo(
    sectionId: string,
    data: HomepageSectionVideoInput,
  ): Promise<HomepageSection[]>;
  updateHomepageSectionVideo(
    id: string,
    data: Partial<HomepageSectionVideoInput>,
  ): Promise<HomepageSection[]>;
  deleteHomepageSectionVideo(id: string): Promise<HomepageSection[]>;
}

/** @deprecated Use SiteRepository */
export type CommunityRepository = SiteRepository;

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { repository } from "@/lib/data";
import type { CsvImportResult } from "@/lib/csv-catalog-import";
import { communityHasBuilder, syncCommunityBuilderFields } from "@/lib/community-builders";
import type {
  Builder,
  BuilderInput,
  Community,
  CommunityInput,
  FeaturedItem,
  FeaturedItemInput,
  Home,
  HomeInput,
  HomepageHomesRow,
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
} from "@/lib/types";

type DataContextValue = {
  communities: Community[];
  featured: FeaturedItem[];
  lenders: Lender[];
  lenderOffers: LenderOffer[];
  featuredCommunities: FeaturedCommunityRow[];
  top10Communities: Top10CommunitySlot[];
  customCommunityTagLabels: Record<string, string>;
  builders: Builder[];
  series: Series[];
  homepageSeries: HomepageSeriesRow[];
  homepageHomes: HomepageHomesRow[];
  isLoaded: boolean;
  error: string | null;
  addCommunity: (data: CommunityInput) => Promise<Community>;
  updateCommunity: (
    id: string,
    data: Partial<CommunityInput>,
  ) => Promise<Community>;
  deleteCommunity: (id: string) => Promise<void>;
  addHome: (communityId: string, home: HomeInput) => Promise<Home>;
  updateHome: (
    communityId: string,
    homeId: string,
    data: Partial<HomeInput>,
  ) => Promise<Home>;
  deleteHome: (communityId: string, homeId: string) => Promise<void>;
  addFeatured: (data: FeaturedItemInput) => Promise<FeaturedItem>;
  updateFeatured: (
    id: string,
    data: Partial<FeaturedItemInput>,
  ) => Promise<FeaturedItem>;
  deleteFeatured: (id: string) => Promise<void>;
  reorderFeatured: (orderedIds: string[]) => Promise<void>;
  addLender: (data: LenderInput) => Promise<Lender>;
  updateLender: (id: string, data: Partial<LenderInput>) => Promise<Lender>;
  deleteLender: (id: string) => Promise<void>;
  reorderLenders: (orderedIds: string[]) => Promise<void>;
  addLenderOffer: (data: LenderOfferInput) => Promise<LenderOffer>;
  updateLenderOffer: (
    id: string,
    data: Partial<LenderOfferInput>,
  ) => Promise<LenderOffer>;
  deleteLenderOffer: (id: string) => Promise<void>;
  addFeaturedCommunity: (communityId: string) => Promise<FeaturedCommunityRow>;
  removeFeaturedCommunity: (id: string) => Promise<void>;
  reorderFeaturedCommunities: (orderedIds: string[]) => Promise<void>;
  setTop10Slot: (
    rank: number,
    communityId: string | null,
    period?: Top10Period,
  ) => Promise<Top10CommunitySlot[]>;
  fetchTop10Communities: (
    period?: Top10Period,
  ) => Promise<Top10CommunitySlot[]>;
  addBuilder: (data: BuilderInput) => Promise<Builder>;
  updateBuilder: (id: string, data: Partial<BuilderInput>) => Promise<Builder>;
  deleteBuilder: (id: string) => Promise<void>;
  addSeries: (data: SeriesInput) => Promise<Series>;
  updateSeries: (id: string, data: Partial<SeriesInput>) => Promise<Series>;
  deleteSeries: (id: string) => Promise<void>;
  addHomepageSeries: (seriesId: string) => Promise<HomepageSeriesRow>;
  removeHomepageSeries: (id: string) => Promise<void>;
  reorderHomepageSeries: (orderedIds: string[]) => Promise<void>;
  addHomepageHomes: (communityId: string) => Promise<HomepageHomesRow>;
  removeHomepageHomes: (id: string) => Promise<void>;
  reorderHomepageHomes: (orderedIds: string[]) => Promise<void>;
  importCsvCatalog: (
    communitiesCsv: string,
    modelHomesCsv: string,
    options?: import("@/lib/csv-catalog-import").CsvImportOptions,
  ) => Promise<CsvImportResult>;
  refresh: () => Promise<void>;
};

const DataContext = createContext<DataContextValue | null>(null);

function applyAppData(
  data: Awaited<ReturnType<typeof repository.getAppData>>,
  setters: {
    setCommunities: (value: Community[]) => void;
    setFeatured: (value: FeaturedItem[]) => void;
    setLenders: (value: Lender[]) => void;
    setLenderOffers: (value: LenderOffer[]) => void;
    setFeaturedCommunities: (value: FeaturedCommunityRow[]) => void;
    setTop10Communities: (value: Top10CommunitySlot[]) => void;
    setCustomCommunityTagLabels: (value: Record<string, string>) => void;
    setBuilders: (value: Builder[]) => void;
    setSeries: (value: Series[]) => void;
    setHomepageSeries: (value: HomepageSeriesRow[]) => void;
    setHomepageHomes: (value: HomepageHomesRow[]) => void;
  },
) {
  setters.setCommunities(data.communities);
  setters.setFeatured(data.featured);
  setters.setLenders(data.lenders);
  setters.setLenderOffers(data.lenderOffers ?? []);
  setters.setFeaturedCommunities(data.featuredCommunities);
  setters.setTop10Communities(data.top10Communities);
  setters.setCustomCommunityTagLabels(data.customCommunityTagLabels ?? {});
  setters.setBuilders(data.builders);
  setters.setSeries(data.series);
  setters.setHomepageSeries(data.homepageSeries);
  setters.setHomepageHomes(data.homepageHomes);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [featured, setFeatured] = useState<FeaturedItem[]>([]);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [lenderOffers, setLenderOffers] = useState<LenderOffer[]>([]);
  const [featuredCommunities, setFeaturedCommunities] = useState<
    FeaturedCommunityRow[]
  >([]);
  const [top10Communities, setTop10Communities] = useState<
    Top10CommunitySlot[]
  >([]);
  const [customCommunityTagLabels, setCustomCommunityTagLabels] = useState<
    Record<string, string>
  >({});
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [homepageSeries, setHomepageSeries] = useState<HomepageSeriesRow[]>([]);
  const [homepageHomes, setHomepageHomes] = useState<HomepageHomesRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAll = useCallback(
    (data: Awaited<ReturnType<typeof repository.getAppData>>) => {
      applyAppData(data, {
        setCommunities,
        setFeatured,
        setLenders,
        setLenderOffers,
        setFeaturedCommunities,
        setTop10Communities,
        setCustomCommunityTagLabels,
        setBuilders,
        setSeries,
        setHomepageSeries,
        setHomepageHomes,
      });
    },
    [],
  );

  const refresh = useCallback(async () => {
    try {
      const data = await repository.getAppData();
      setAll(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoaded(true);
    }
  }, [setAll]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        let data = await repository.getAppData();

        try {
          const [communitiesRes, homesRes] = await Promise.all([
            fetch("/import/communities.csv"),
            fetch("/import/model_homes.csv"),
          ]);

          if (communitiesRes.ok) {
            const result = await repository.importCsvCatalog(
              await communitiesRes.text(),
              homesRes.ok ? await homesRes.text() : "",
            );
            if (result.communitiesAdded > 0) {
              data = result.data;
            }
          }
        } catch {
          // Optional bundled import — ignore fetch failures.
        }

        if (!cancelled) {
          setAll(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setAll]);

  const addCommunity = useCallback(async (data: CommunityInput) => {
    const community = await repository.create(data);
    setCommunities((prev) => [...prev, community]);
    return community;
  }, []);

  const updateCommunity = useCallback(
    async (id: string, data: Partial<CommunityInput>) => {
      const updated = await repository.update(id, data);
      setCommunities((prev) =>
        prev.map((c) => (c.id === id ? updated : c)),
      );
      return updated;
    },
    [],
  );

  const deleteCommunity = useCallback(async (id: string) => {
    await repository.delete(id);
    setCommunities((prev) => prev.filter((c) => c.id !== id));
    setFeatured((prev) => prev.filter((f) => f.communityId !== id));
    setHomepageHomes((prev) =>
      prev.filter((row) => row.communityId !== id),
    );
    setFeaturedCommunities((prev) =>
      prev.filter((row) => row.communityId !== id),
    );
    setTop10Communities((prev) =>
      prev.filter((row) => row.communityId !== id),
    );
  }, []);

  const addHome = useCallback(
    async (communityId: string, home: HomeInput) => {
      const created = await repository.addHome(communityId, home);
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? { ...c, homes: [...c.homes, created] }
            : c,
        ),
      );
      return created;
    },
    [],
  );

  const updateHome = useCallback(
    async (
      communityId: string,
      homeId: string,
      data: Partial<HomeInput>,
    ) => {
      const updated = await repository.updateHome(communityId, homeId, data);
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? {
                ...c,
                homes: c.homes.map((h) => (h.id === homeId ? updated : h)),
              }
            : c,
        ),
      );
      return updated;
    },
    [],
  );

  const deleteHome = useCallback(
    async (communityId: string, homeId: string) => {
      await repository.deleteHome(communityId, homeId);
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? { ...c, homes: c.homes.filter((h) => h.id !== homeId) }
            : c,
        ),
      );
    },
    [],
  );

  const addFeatured = useCallback(async (data: FeaturedItemInput) => {
    const item = await repository.addFeatured(data);
    setFeatured((prev) => [...prev, item].sort((a, b) => a.order - b.order));
    return item;
  }, []);

  const updateFeatured = useCallback(
    async (id: string, data: Partial<FeaturedItemInput>) => {
      const updated = await repository.updateFeatured(id, data);
      setFeatured((prev) =>
        prev.map((f) => (f.id === id ? updated : f)),
      );
      return updated;
    },
    [],
  );

  const deleteFeatured = useCallback(async (id: string) => {
    await repository.deleteFeatured(id);
    setFeatured((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const reorderFeatured = useCallback(async (orderedIds: string[]) => {
    const reordered = await repository.reorderFeatured(orderedIds);
    setFeatured(reordered);
  }, []);

  const addLender = useCallback(async (data: LenderInput) => {
    const item = await repository.addLender(data);
    setLenders((prev) => [...prev, item].sort((a, b) => a.order - b.order));
    return item;
  }, []);

  const updateLender = useCallback(
    async (id: string, data: Partial<LenderInput>) => {
      const updated = await repository.updateLender(id, data);
      setLenders((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
    [],
  );

  const deleteLender = useCallback(async (id: string) => {
    await repository.deleteLender(id);
    setLenders((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const reorderLenders = useCallback(async (orderedIds: string[]) => {
    const reordered = await repository.reorderLenders(orderedIds);
    setLenders(reordered);
  }, []);

  const addLenderOffer = useCallback(async (data: LenderOfferInput) => {
    const item = await repository.addLenderOffer(data);
    setLenderOffers((prev) => [item, ...prev]);
    return item;
  }, []);

  const updateLenderOffer = useCallback(
    async (id: string, data: Partial<LenderOfferInput>) => {
      const updated = await repository.updateLenderOffer(id, data);
      setLenderOffers((prev) =>
        prev.map((item) => (item.id === id ? updated : item)),
      );
      return updated;
    },
    [],
  );

  const deleteLenderOffer = useCallback(async (id: string) => {
    await repository.deleteLenderOffer(id);
    setLenderOffers((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addFeaturedCommunity = useCallback(async (communityId: string) => {
    const item = await repository.addFeaturedCommunity(communityId);
    setFeaturedCommunities((prev) =>
      [...prev, item].sort((a, b) => a.order - b.order),
    );
    return item;
  }, []);

  const removeFeaturedCommunity = useCallback(async (id: string) => {
    await repository.removeFeaturedCommunity(id);
    setFeaturedCommunities((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const reorderFeaturedCommunities = useCallback(async (orderedIds: string[]) => {
    const reordered = await repository.reorderFeaturedCommunities(orderedIds);
    setFeaturedCommunities(reordered);
  }, []);

  const setTop10Slot = useCallback(
    async (
      rank: number,
      communityId: string | null,
      period: Top10Period = "all-time",
    ) => {
      const updated = await repository.setTop10Slot(rank, communityId, period);
      if (period === "all-time") {
        setTop10Communities(updated);
      }
      return updated;
    },
    [],
  );

  const fetchTop10Communities = useCallback(
    async (period: Top10Period = "all-time") =>
      repository.getTop10Communities(period),
    [],
  );

  const addBuilder = useCallback(async (data: BuilderInput) => {
    const item = await repository.addBuilder(data);
    setBuilders((prev) => [...prev, item]);
    return item;
  }, []);

  const updateBuilder = useCallback(
    async (id: string, data: Partial<BuilderInput>) => {
      const updated = await repository.updateBuilder(id, data);
      setBuilders((prev) => {
        const next = prev.map((item) => (item.id === id ? updated : item));
        if (data.name) {
          setCommunities((communities) =>
            communities.map((community) =>
              communityHasBuilder(community, id)
                ? syncCommunityBuilderFields(community, next)
                : community,
            ),
          );
        }
        return next;
      });
      return updated;
    },
    [],
  );

  const deleteBuilder = useCallback(async (id: string) => {
    await repository.deleteBuilder(id);
    await refresh();
  }, [refresh]);

  const addSeries = useCallback(async (data: SeriesInput) => {
    const item = await repository.addSeries(data);
    setSeries((prev) => [...prev, item]);
    return item;
  }, []);

  const updateSeries = useCallback(
    async (id: string, data: Partial<SeriesInput>) => {
      const updated = await repository.updateSeries(id, data);
      setSeries((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
    [],
  );

  const deleteSeries = useCallback(async (id: string) => {
    await repository.deleteSeries(id);
    await refresh();
  }, [refresh]);

  const addHomepageSeries = useCallback(async (seriesId: string) => {
    const item = await repository.addHomepageSeries(seriesId);
    setHomepageSeries((prev) =>
      [...prev, item].sort((a, b) => a.order - b.order),
    );
    return item;
  }, []);

  const removeHomepageSeries = useCallback(async (id: string) => {
    await repository.removeHomepageSeries(id);
    setHomepageSeries((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const reorderHomepageSeries = useCallback(async (orderedIds: string[]) => {
    const reordered = await repository.reorderHomepageSeries(orderedIds);
    setHomepageSeries(reordered);
  }, []);

  const addHomepageHomes = useCallback(async (communityId: string) => {
    const item = await repository.addHomepageHomes(communityId);
    setHomepageHomes((prev) =>
      [...prev, item].sort((a, b) => a.order - b.order),
    );
    return item;
  }, []);

  const removeHomepageHomes = useCallback(async (id: string) => {
    await repository.removeHomepageHomes(id);
    setHomepageHomes((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const reorderHomepageHomes = useCallback(async (orderedIds: string[]) => {
    const reordered = await repository.reorderHomepageHomes(orderedIds);
    setHomepageHomes(reordered);
  }, []);

  const importCsvCatalog = useCallback(
    async (
      communitiesCsv: string,
      modelHomesCsv: string,
      options?: import("@/lib/csv-catalog-import").CsvImportOptions,
    ) => {
      const result = await repository.importCsvCatalog(
        communitiesCsv,
        modelHomesCsv,
        options,
      );
      setAll(result.data);
      return result;
    },
    [setAll],
  );

  return (
    <DataContext.Provider
      value={{
        communities,
        featured,
        lenders,
        lenderOffers,
        featuredCommunities,
        top10Communities,
        customCommunityTagLabels,
        builders,
        series,
        homepageSeries,
        homepageHomes,
        isLoaded,
        error,
        addCommunity,
        updateCommunity,
        deleteCommunity,
        addHome,
        updateHome,
        deleteHome,
        addFeatured,
        updateFeatured,
        deleteFeatured,
        reorderFeatured,
        addLender,
        updateLender,
        deleteLender,
        reorderLenders,
        addLenderOffer,
        updateLenderOffer,
        deleteLenderOffer,
        addFeaturedCommunity,
        removeFeaturedCommunity,
        reorderFeaturedCommunities,
        setTop10Slot,
        fetchTop10Communities,
        addBuilder,
        updateBuilder,
        deleteBuilder,
        addSeries,
        updateSeries,
        deleteSeries,
        addHomepageSeries,
        removeHomepageSeries,
        reorderHomepageSeries,
        addHomepageHomes,
        removeHomepageHomes,
        reorderHomepageHomes,
        importCsvCatalog,
        refresh,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used within a DataProvider");
  }
  return ctx;
}

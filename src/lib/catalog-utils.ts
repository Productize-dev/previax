import type {
  AppData,
  Builder,
  Community,
  Home,
  Series,
} from "./types";

export function getBuilderById(
  builders: Builder[],
  id: string | undefined,
): Builder | undefined {
  if (!id) return undefined;
  return builders.find((b) => b.id === id);
}

export function getSeriesById(
  series: Series[],
  id: string | undefined,
): Series | undefined {
  if (!id) return undefined;
  return series.find((s) => s.id === id);
}

export function getSeriesByBuilder(
  series: Series[],
  builderId: string,
): Series[] {
  return series.filter((s) => s.builderId === builderId);
}

export function getBuilderForCommunity(
  community: Community,
  builders: Builder[],
): Builder | undefined {
  if (community.builderId) {
    return getBuilderById(builders, community.builderId);
  }
  return builders.find(
    (b) => b.name.toLowerCase() === community.builderName.toLowerCase(),
  );
}

export function getHomesBySeries(
  communities: Community[],
  seriesId: string,
): Array<{ home: Home; communityId: string; communityName: string; city: string }> {
  const results: Array<{
    home: Home;
    communityId: string;
    communityName: string;
    city: string;
  }> = [];

  for (const community of communities) {
    for (const home of community.homes) {
      if (home.seriesId === seriesId) {
        results.push({
          home,
          communityId: community.id,
          communityName: community.name,
          city: community.city,
        });
      }
    }
  }

  return results;
}

export function getSeriesRowTitle(
  series: Series,
  builder: Builder | undefined,
): string {
  if (builder) return `${builder.name} — ${series.name}`;
  return series.name;
}

export function getDefaultSeriesForCommunity(
  community: Community,
  series: Series[],
): Series | undefined {
  if (community.builderId) {
    return (
      series.find((item) => item.id === `import-series-${community.id}`) ??
      series.find((item) => item.builderId === community.builderId)
    );
  }
  return (
    series.find((item) => item.id === `import-series-${community.id}`) ??
    series.find((item) => item.id === `migrated-series-${community.id}`)
  );
}

export function pickAppDataCatalog(data: AppData) {
  return {
    builders: data.builders,
    series: data.series,
    homepageSeries: data.homepageSeries,
  };
}

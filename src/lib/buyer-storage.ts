import type { BuyerProfile } from "./types";
import { homeRef } from "./buyer-home-ref";

export type BuyerGuidancePrefs = {
  budget?: string;
  city?: string;
  beds?: string;
};

const SAVED_KEY = "previax-saved";
const SAVED_HOMES_KEY = "previax-saved-homes";
const SAVED_APARTMENTS_KEY = "previax-saved-apartments";
const LIKED_COMMUNITIES_KEY = "previax-liked-communities";
const LIKED_HOMES_KEY = "previax-liked-homes";
const BUYER_KEY = "previax-buyer";
const GUIDANCE_KEY = "previax-guidance";
const VIEWED_CITIES_KEY = "previax-viewed-cities";
const RECENT_SEARCHES_KEY = "previax-recent-searches";

const EMPTY_IDS: string[] = [];

const listeners = new Set<() => void>();

let savedSnapshot: string[] = EMPTY_IDS;
let savedHomesSnapshot: string[] = EMPTY_IDS;
let savedApartmentsSnapshot: string[] = EMPTY_IDS;
let likedCommunitiesSnapshot: string[] = EMPTY_IDS;
let likedHomesSnapshot: string[] = EMPTY_IDS;
let buyerSnapshot: BuyerProfile | null = null;
let guidanceSnapshot: BuyerGuidancePrefs | null = null;
let viewedCitiesSnapshot: string[] = EMPTY_IDS;
let recentSearchesSnapshot: string[] = EMPTY_IDS;
let hydrated = false;

function notifyStorageChange(): void {
  listeners.forEach((listener) => listener());
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeIds(ids: string[]): string[] {
  return ids.length === 0 ? EMPTY_IDS : ids;
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

function persistIds(key: string, ids: string[]): void {
  writeJson(key, ids === EMPTY_IDS ? [] : ids);
}

function hydrateFromStorage(): void {
  if (typeof window === "undefined") return;
  savedSnapshot = normalizeIds(readJson<string[]>(SAVED_KEY, EMPTY_IDS));
  savedHomesSnapshot = normalizeIds(readJson<string[]>(SAVED_HOMES_KEY, EMPTY_IDS));
  savedApartmentsSnapshot = normalizeIds(
    readJson<string[]>(SAVED_APARTMENTS_KEY, EMPTY_IDS),
  );
  likedCommunitiesSnapshot = normalizeIds(
    readJson<string[]>(LIKED_COMMUNITIES_KEY, EMPTY_IDS),
  );
  likedHomesSnapshot = normalizeIds(readJson<string[]>(LIKED_HOMES_KEY, EMPTY_IDS));
  buyerSnapshot = readJson<BuyerProfile | null>(BUYER_KEY, null);
  guidanceSnapshot = readJson<BuyerGuidancePrefs | null>(GUIDANCE_KEY, null);
  viewedCitiesSnapshot = normalizeIds(
    readJson<string[]>(VIEWED_CITIES_KEY, EMPTY_IDS),
  );
  recentSearchesSnapshot = normalizeIds(
    readJson<string[]>(RECENT_SEARCHES_KEY, EMPTY_IDS),
  );
  hydrated = true;
}

function ensureHydrated(): void {
  if (!hydrated) hydrateFromStorage();
}

const STORAGE_KEYS = [
  SAVED_KEY,
  SAVED_HOMES_KEY,
  SAVED_APARTMENTS_KEY,
  LIKED_COMMUNITIES_KEY,
  LIKED_HOMES_KEY,
  BUYER_KEY,
  GUIDANCE_KEY,
  VIEWED_CITIES_KEY,
  RECENT_SEARCHES_KEY,
] as const;

export function subscribeBuyerStorage(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  if (typeof window !== "undefined") {
    const onStorage = (event: StorageEvent) => {
      if (event.key && STORAGE_KEYS.includes(event.key as (typeof STORAGE_KEYS)[number])) {
        hydrateFromStorage();
        notifyStorageChange();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(onStoreChange);
      window.removeEventListener("storage", onStorage);
    };
  }

  return () => listeners.delete(onStoreChange);
}

export function getSavedCommunityIds(): string[] {
  ensureHydrated();
  return savedSnapshot;
}

export function toggleSavedCommunity(id: string): string[] {
  ensureHydrated();
  savedSnapshot = normalizeIds(toggleId(savedSnapshot, id));
  persistIds(SAVED_KEY, savedSnapshot);
  notifyStorageChange();
  return savedSnapshot;
}

export function isCommunitySaved(id: string): boolean {
  return getSavedCommunityIds().includes(id);
}

export function getSavedHomeRefs(): string[] {
  ensureHydrated();
  return savedHomesSnapshot;
}

export function toggleSavedHome(communityId: string, homeId: string): string[] {
  ensureHydrated();
  const ref = homeRef(communityId, homeId);
  savedHomesSnapshot = normalizeIds(toggleId(savedHomesSnapshot, ref));
  persistIds(SAVED_HOMES_KEY, savedHomesSnapshot);
  notifyStorageChange();
  return savedHomesSnapshot;
}

export function isHomeSaved(communityId: string, homeId: string): boolean {
  return getSavedHomeRefs().includes(homeRef(communityId, homeId));
}

export function getSavedApartmentIds(): string[] {
  ensureHydrated();
  return savedApartmentsSnapshot;
}

export function toggleSavedApartment(id: string): string[] {
  ensureHydrated();
  savedApartmentsSnapshot = normalizeIds(toggleId(savedApartmentsSnapshot, id));
  persistIds(SAVED_APARTMENTS_KEY, savedApartmentsSnapshot);
  notifyStorageChange();
  return savedApartmentsSnapshot;
}

export function isApartmentSaved(id: string): boolean {
  return getSavedApartmentIds().includes(id);
}

export function getLikedCommunityIds(): string[] {
  ensureHydrated();
  return likedCommunitiesSnapshot;
}

export function toggleLikedCommunity(id: string): string[] {
  ensureHydrated();
  likedCommunitiesSnapshot = normalizeIds(toggleId(likedCommunitiesSnapshot, id));
  persistIds(LIKED_COMMUNITIES_KEY, likedCommunitiesSnapshot);
  notifyStorageChange();
  return likedCommunitiesSnapshot;
}

export function isCommunityLiked(id: string): boolean {
  return getLikedCommunityIds().includes(id);
}

export function getLikedHomeRefs(): string[] {
  ensureHydrated();
  return likedHomesSnapshot;
}

export function toggleLikedHome(communityId: string, homeId: string): string[] {
  ensureHydrated();
  const ref = homeRef(communityId, homeId);
  likedHomesSnapshot = normalizeIds(toggleId(likedHomesSnapshot, ref));
  persistIds(LIKED_HOMES_KEY, likedHomesSnapshot);
  notifyStorageChange();
  return likedHomesSnapshot;
}

export function isHomeLiked(communityId: string, homeId: string): boolean {
  return getLikedHomeRefs().includes(homeRef(communityId, homeId));
}

export function getBuyerProfile(): BuyerProfile | null {
  ensureHydrated();
  return buyerSnapshot;
}

export function saveBuyerProfile(profile: BuyerProfile): void {
  ensureHydrated();
  buyerSnapshot = profile;
  writeJson(BUYER_KEY, profile);
  notifyStorageChange();
}

export function clearBuyerProfile(): void {
  ensureHydrated();
  buyerSnapshot = null;
  localStorage.removeItem(BUYER_KEY);
  notifyStorageChange();
}

export function getGuidancePrefs(): BuyerGuidancePrefs | null {
  ensureHydrated();
  return guidanceSnapshot;
}

export function saveGuidancePrefs(prefs: BuyerGuidancePrefs): void {
  ensureHydrated();
  guidanceSnapshot = prefs;
  writeJson(GUIDANCE_KEY, prefs);
  notifyStorageChange();
}

export function getViewedCities(): string[] {
  ensureHydrated();
  return viewedCitiesSnapshot;
}

export function trackViewedCity(city: string): void {
  ensureHydrated();
  if (!city.trim()) return;
  if (viewedCitiesSnapshot.includes(city)) return;
  viewedCitiesSnapshot = [...viewedCitiesSnapshot, city].slice(-10);
  persistIds(VIEWED_CITIES_KEY, viewedCitiesSnapshot);
  notifyStorageChange();
}

export function getRecentSearches(): string[] {
  ensureHydrated();
  return recentSearchesSnapshot;
}

export function addRecentSearch(query: string): void {
  ensureHydrated();
  const trimmed = query.trim();
  if (!trimmed) return;
  const next = [
    trimmed,
    ...recentSearchesSnapshot.filter((q) => q !== trimmed),
  ].slice(0, 6);
  recentSearchesSnapshot = normalizeIds(next);
  persistIds(RECENT_SEARCHES_KEY, recentSearchesSnapshot);
  notifyStorageChange();
}

export function clearRecentSearches(): void {
  ensureHydrated();
  recentSearchesSnapshot = EMPTY_IDS;
  persistIds(RECENT_SEARCHES_KEY, recentSearchesSnapshot);
  notifyStorageChange();
}

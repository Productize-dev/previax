import type { BuyerProfile } from "./types";

export type BuyerGuidancePrefs = {
  budget?: string;
  city?: string;
  beds?: string;
};

const SAVED_KEY = "previax-saved";
const BUYER_KEY = "previax-buyer";
const GUIDANCE_KEY = "previax-guidance";
const VIEWED_CITIES_KEY = "previax-viewed-cities";

const EMPTY_IDS: string[] = [];

const listeners = new Set<() => void>();

let savedSnapshot: string[] = EMPTY_IDS;
let buyerSnapshot: BuyerProfile | null = null;
let guidanceSnapshot: BuyerGuidancePrefs | null = null;
let viewedCitiesSnapshot: string[] = EMPTY_IDS;
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

function hydrateFromStorage(): void {
  if (typeof window === "undefined") return;
  savedSnapshot = normalizeIds(readJson<string[]>(SAVED_KEY, EMPTY_IDS));
  buyerSnapshot = readJson<BuyerProfile | null>(BUYER_KEY, null);
  guidanceSnapshot = readJson<BuyerGuidancePrefs | null>(GUIDANCE_KEY, null);
  viewedCitiesSnapshot = normalizeIds(
    readJson<string[]>(VIEWED_CITIES_KEY, EMPTY_IDS),
  );
  hydrated = true;
}

function ensureHydrated(): void {
  if (!hydrated) hydrateFromStorage();
}

export function subscribeBuyerStorage(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  if (typeof window !== "undefined") {
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === SAVED_KEY ||
        event.key === BUYER_KEY ||
        event.key === GUIDANCE_KEY ||
        event.key === VIEWED_CITIES_KEY
      ) {
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
  const next = savedSnapshot.includes(id)
    ? savedSnapshot.filter((x) => x !== id)
    : [...savedSnapshot, id];
  savedSnapshot = normalizeIds(next);
  writeJson(SAVED_KEY, savedSnapshot === EMPTY_IDS ? [] : savedSnapshot);
  notifyStorageChange();
  return savedSnapshot;
}

export function isCommunitySaved(id: string): boolean {
  return getSavedCommunityIds().includes(id);
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
  writeJson(
    VIEWED_CITIES_KEY,
    viewedCitiesSnapshot === EMPTY_IDS ? [] : viewedCitiesSnapshot,
  );
  notifyStorageChange();
}

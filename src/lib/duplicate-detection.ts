import type { Community, Home } from "@/lib/types";

export type DuplicateMatch = {
  id: string;
  name: string;
  city: string;
  score: number;
  reason: string;
};

function normalize(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, " ");
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;

  const wordsA = new Set(na.split(" ").filter(Boolean));
  const wordsB = new Set(nb.split(" ").filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap += 1;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

export function findSimilarCommunities(
  communities: Community[],
  name: string,
  city: string,
  excludeId?: string,
  threshold = 0.75,
): DuplicateMatch[] {
  return communities
    .filter((c) => c.id !== excludeId)
    .map((c) => {
      const nameScore = similarity(c.name, name);
      const cityScore = similarity(c.city, city);
      const score = nameScore * 0.7 + cityScore * 0.3;
      return {
        id: c.id,
        name: c.name,
        city: c.city,
        score,
        reason:
          nameScore >= 0.9 && cityScore >= 0.8
            ? "Same name and city"
            : nameScore >= 0.85
              ? "Very similar name"
              : "Possibly similar",
      };
    })
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function findSimilarHomes(
  community: Community,
  modelName: string,
  excludeHomeId?: string,
  threshold = 0.8,
): DuplicateMatch[] {
  return community.homes
    .filter((h) => h.id !== excludeHomeId)
    .map((h) => {
      const score = similarity(h.modelName ?? h.description, modelName);
      return {
        id: h.id,
        name: h.modelName || h.description.slice(0, 40),
        city: community.city,
        score,
        reason: score >= 0.95 ? "Same model name" : "Similar model name",
      };
    })
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/** Reordena imágenes poniendo la sugerida como portada (índice 0). */
export function suggestPrimaryImageIndex(urls: string[]): number {
  if (urls.length <= 1) return 0;

  let bestIndex = 0;
  let bestScore = -1;

  urls.forEach((url, index) => {
    const lower = url.toLowerCase();
    let score = 0;
    if (/(exterior|front|hero|cover|main)/.test(lower)) score += 3;
    if (/(kitchen|living|great)/.test(lower)) score += 2;
    if (/youtube\.com|youtu\.be|img\.youtube/.test(lower)) score -= 1;
    if (index === 0) score += 0.5;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}

export function reorderWithPrimary(urls: string[], primaryIndex: number): string[] {
  if (primaryIndex <= 0 || primaryIndex >= urls.length) return urls;
  const next = [...urls];
  const [primary] = next.splice(primaryIndex, 1);
  return [primary, ...next];
}

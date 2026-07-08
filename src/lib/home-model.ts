import type { Home } from "@/lib/types";

export function getHomeModelName(home: Home): string {
  return home.modelName?.trim() || home.description?.trim() || "Model";
}

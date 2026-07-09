import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type CommunityEventType =
  | "community_viewed"
  | "community_saved"
  | "community_unsaved"
  | "offer_clicked";

export type LifecycleEventType =
  | "community_created"
  | "offer_published"
  | "account_approved";

const trackedViews = new Set<string>();

/** Registra una vista de comunidad (una vez por sesión de página). */
export async function trackCommunityView(communityId: string): Promise<void> {
  const key = `view:${communityId}`;
  if (trackedViews.has(key)) return;
  trackedViews.add(key);
  await trackCommunityEvent(communityId, "community_viewed");
}

export async function trackCommunityEvent(
  communityId: string,
  eventType: CommunityEventType,
): Promise<void> {
  try {
    const { error } = await getSupabaseBrowserClient().rpc("track_community_event", {
      p_community_id: communityId,
      p_event_type: eventType,
    });
    if (error) console.warn("[analytics]", error.message);
  } catch {
    // Tracking no debe bloquear la UX.
  }
}

/** Eventos de ciclo de vida del dashboard (insert directo, usuario autenticado). */
export async function logLifecycleEvent(
  type: LifecycleEventType,
  entityId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const { error } = await getSupabaseBrowserClient()
      .from("activity_events")
      .insert({
        type,
        entity_id: entityId,
        metadata: metadata ?? {},
      });
    if (error) console.warn("[activity]", error.message);
  } catch {
    // Best-effort.
  }
}

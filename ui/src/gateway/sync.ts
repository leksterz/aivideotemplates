/**
 * Composition sync layer.
 *
 * Hydrates the frontend from the backend on load, then polls for changes
 * made by the AI agent (tool calls write .avt/composition.json).
 *
 * Flow: Agent tool call → writes .avt/composition.json → sync picks it up → updates store → Remotion re-renders
 * Flow: UI edit → Zustand → Editor save effect → PUT /api/composition → persisted
 */

import type { VideoComposition } from "../types/video";

type SyncCallback = (composition: VideoComposition) => void;

let pollInterval: ReturnType<typeof setInterval> | null = null;
let lastUpdatedAt: string | null = null;

/**
 * Fetch the composition from the backend once (used for initial hydration).
 */
/**
 * Strip stale blob: URLs from a composition loaded from disk.
 * Blob URLs are session-scoped and won't survive a page refresh.
 */
function cleanStaleBlobUrls(comp: VideoComposition): VideoComposition {
  const isStale = (url?: string) => url?.startsWith("blob:");

  return {
    ...comp,
    assets: comp.assets.filter((a) => !isStale(a.url)),
    scenes: comp.scenes
      .map((s) => ({
        ...s,
        elements: s.elements.filter(
          (el) => !("assetId" in el && isStale((el as { assetId: string }).assetId)),
        ),
      }))
      .filter(
        (s) =>
          s.elements.length > 0 ||
          !comp.assets.some((a) => isStale(a.url) && s.elements.length === 0),
      ),
    layerOrder:
      comp.layerOrder?.filter((key) => {
        if (!key.startsWith("scene:")) {
          return true;
        }
        const sceneId = key.split(":").slice(1).join(":");
        const scene = comp.scenes.find((s) => s.id === sceneId);
        if (!scene) {
          return true;
        } // keep if scene exists (will be filtered above if empty)
        return !scene.elements.some(
          (el) => "assetId" in el && isStale((el as { assetId: string }).assetId),
        );
      }) ?? [],
  };
}

export async function loadCompositionFromBackend(
  endpoint: string = "/api/composition",
): Promise<VideoComposition | null> {
  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      return null;
    }
    const comp: VideoComposition = await res.json();
    if (comp.metadata?.updatedAt) {
      lastUpdatedAt = comp.metadata.updatedAt;
    }
    // Clean up any stale blob URLs from previous sessions
    return cleanStaleBlobUrls(comp);
  } catch {
    return null;
  }
}

/**
 * Start polling the composition state from the gateway.
 * Detects changes by comparing metadata.updatedAt timestamps.
 */
export function startCompositionSync(
  callback: SyncCallback,
  intervalMs: number = 1000,
  endpoint: string = "/api/composition",
) {
  stopCompositionSync();

  pollInterval = setInterval(async () => {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        return;
      }
      const comp: VideoComposition = await res.json();

      // Only update if the composition has changed
      if (comp.metadata?.updatedAt && comp.metadata.updatedAt !== lastUpdatedAt) {
        lastUpdatedAt = comp.metadata.updatedAt;
        callback(comp);
      }
    } catch {
      // Gateway not available — skip silently
    }
  }, intervalMs);
}

export function stopCompositionSync() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

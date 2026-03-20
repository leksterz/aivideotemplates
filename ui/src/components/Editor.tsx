import { useEffect, useRef } from "react";
import {
  startCompositionSync,
  stopCompositionSync,
  loadCompositionFromBackend,
} from "../gateway/sync";
import { useVideoStore } from "../store/video-store";
import { AssetPanel } from "./AssetPanel";
import { ChatPanel } from "./ChatPanel";
import { Timeline } from "./Timeline";
import { Toolbar } from "./Toolbar";
import { VideoPreview } from "./VideoPreview";

// Flag to suppress save when the store update came from backend sync (not from the UI).
let suppressSave = false;

export function Editor() {
  const setComposition = useVideoStore((s) => s.setComposition);
  const hydrated = useRef(false);

  // Hydrate from backend on mount, then start polling for agent-driven changes
  useEffect(() => {
    void loadCompositionFromBackend().then((comp) => {
      if (comp) {
        suppressSave = true;
        setComposition(comp);
        // Allow save again after the effect chain settles
        requestAnimationFrame(() => {
          suppressSave = false;
        });
      }
      hydrated.current = true;
    });

    startCompositionSync((comp) => {
      suppressSave = true;
      setComposition(comp);
      requestAnimationFrame(() => {
        suppressSave = false;
      });
    }, 1500);

    return () => stopCompositionSync();
  }, [setComposition]);

  // Save composition to backend whenever it changes (UI-driven only)
  const composition = useVideoStore((s) => s.composition);
  useEffect(() => {
    // Don't save during hydration or when the change came from sync
    if (!hydrated.current || suppressSave) {
      return;
    }

    const timer = setTimeout(() => {
      fetch("/api/composition", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composition),
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [composition]);

  return (
    <div className="flex flex-col h-screen bg-editor-bg text-editor-text font-sans">
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main Editor Area */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel - Assets */}
        <AssetPanel />

        {/* Center - Preview + Timeline */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
          <VideoPreview />
          <Timeline />
        </div>

        {/* Right Panel - Chat */}
        <ChatPanel />
      </div>
    </div>
  );
}

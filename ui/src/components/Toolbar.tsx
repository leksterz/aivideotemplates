import { Film, Download, Undo2, Redo2, Wifi, WifiOff, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/chat-store";
import { useVideoStore } from "../store/video-store";

const DIMENSION_PRESETS = [
  { label: "1920 x 1080", w: 1920, h: 1080, tag: "16:9" },
  { label: "1080 x 1920", w: 1080, h: 1920, tag: "9:16" },
  { label: "1080 x 1080", w: 1080, h: 1080, tag: "1:1" },
  { label: "1280 x 720", w: 1280, h: 720, tag: "16:9" },
  { label: "3840 x 2160", w: 3840, h: 2160, tag: "4K" },
] as const;

const FPS_OPTIONS = [24, 25, 30, 60] as const;

export function Toolbar() {
  const compositionName = useVideoStore((s) => s.composition.name);
  const width = useVideoStore((s) => s.composition.width);
  const height = useVideoStore((s) => s.composition.height);
  const fps = useVideoStore((s) => s.composition.fps);
  const updateName = useVideoStore((s) => s.updateCompositionName);
  const updateSettings = useVideoStore((s) => s.updateCompositionSettings);
  const connectionStatus = useChatStore((s) => s.connectionStatus);

  const [showDimMenu, setShowDimMenu] = useState(false);
  const [showFpsMenu, setShowFpsMenu] = useState(false);
  const dimRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dimRef.current && !dimRef.current.contains(e.target as Node)) {
        setShowDimMenu(false);
      }
      if (fpsRef.current && !fpsRef.current.contains(e.target as Node)) {
        setShowFpsMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentDimLabel = `${width}x${height}`;
  const currentRatio = DIMENSION_PRESETS.find((p) => p.w === width && p.h === height)?.tag;

  return (
    <div className="flex items-center h-14 px-5 bg-editor-surface border-b border-editor-border gap-4 shadow-soft">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-4">
        <div className="w-8 h-8 rounded-xl bg-editor-accent flex items-center justify-center">
          <Film className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-serif italic text-editor-accent">AVT</span>
      </div>

      <div className="w-px h-7 bg-editor-border" />

      {/* Project Name */}
      <input
        type="text"
        value={compositionName}
        onChange={(e) => updateName(e.target.value)}
        className="bg-transparent text-sm font-medium px-2.5 py-1.5 rounded-lg hover:bg-editor-panel focus:bg-editor-panel transition-colors max-w-[200px] text-editor-text"
      />

      <div className="w-px h-7 bg-editor-border" />

      {/* Dimension selector */}
      <div ref={dimRef} className="relative">
        <button
          onClick={() => {
            setShowDimMenu(!showDimMenu);
            setShowFpsMenu(false);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-editor-panel transition-colors text-xs text-editor-muted"
        >
          <span className="text-editor-text font-medium">{currentDimLabel}</span>
          {currentRatio && <span className="text-[10px] text-editor-muted/60">{currentRatio}</span>}
          <ChevronDown className="w-3 h-3" />
        </button>
        {showDimMenu && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-editor-surface border border-editor-border rounded-xl shadow-lg py-1 z-50">
            {DIMENSION_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  updateSettings({ width: preset.w, height: preset.h });
                  setShowDimMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-editor-panel transition-colors ${
                  width === preset.w && height === preset.h
                    ? "text-editor-accent"
                    : "text-editor-text"
                }`}
              >
                <span>{preset.label}</span>
                <span className="text-[10px] text-editor-muted">{preset.tag}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FPS selector */}
      <div ref={fpsRef} className="relative">
        <button
          onClick={() => {
            setShowFpsMenu(!showFpsMenu);
            setShowDimMenu(false);
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-editor-panel transition-colors text-xs text-editor-muted"
        >
          <span className="text-editor-text font-medium">{fps}</span>
          <span className="text-[10px]">fps</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        {showFpsMenu && (
          <div className="absolute top-full left-0 mt-1 w-24 bg-editor-surface border border-editor-border rounded-xl shadow-lg py-1 z-50">
            {FPS_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => {
                  updateSettings({ fps: f });
                  setShowFpsMenu(false);
                }}
                className={`w-full px-3 py-2 text-xs text-left hover:bg-editor-panel transition-colors ${
                  fps === f ? "text-editor-accent" : "text-editor-text"
                }`}
              >
                {f} fps
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center spacer */}
      <div className="flex-1 flex justify-center gap-1">
        <button className="p-2 rounded-lg hover:bg-editor-panel transition-colors text-editor-muted hover:text-editor-text">
          <Undo2 className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-lg hover:bg-editor-panel transition-colors text-editor-muted hover:text-editor-text">
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Right - Status + Export */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-editor-panel">
          {connectionStatus === "connected" ? (
            <Wifi className="w-3.5 h-3.5 text-editor-success" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-editor-muted" />
          )}
          <span className="text-xs text-editor-muted capitalize">{connectionStatus}</span>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-editor-accent hover:bg-editor-accent-hover rounded-xl text-sm font-medium transition-colors text-white shadow-soft">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>
    </div>
  );
}

import {
  Film,
  Image,
  Volume2,
  Type,
  Sparkles,
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useCallback, useRef } from "react";
import { useVideoStore } from "../store/video-store";
import { getTotalDurationInFrames } from "../types/video";
import type { Asset } from "../types/video";

// ── Layer abstraction ────────────────────────────────────────────────────────

type LayerKind = "video" | "image" | "audio" | "motion-graphic" | "text" | "caption";

interface TimelineLayer {
  id: string; // e.g. "scene:abc123"
  name: string;
  kind: LayerKind;
  startFrame: number;
  endFrame: number;
  color: string;
  sourceId: string;
  orderIndex: number; // position in layerOrder
}

const LAYER_COLORS: Record<LayerKind, string> = {
  video: "#3b82f6",
  image: "#22c55e",
  audio: "#a855f7",
  "motion-graphic": "#f43f5e",
  text: "#f59e0b",
  caption: "#06b6d4",
};

const LAYER_ICONS: Record<LayerKind, typeof Film> = {
  video: Film,
  image: Image,
  audio: Volume2,
  "motion-graphic": Sparkles,
  text: Type,
  caption: MessageSquare,
};

/** Build layers from composition data, ordered by layerOrder (top = last rendered = foreground). */
function buildOrderedLayers(
  composition: ReturnType<typeof useVideoStore.getState>["composition"],
): TimelineLayer[] {
  const order = composition.layerOrder || [];

  // Build lookup maps
  const sceneMap = new Map(composition.scenes.map((s) => [`scene:${s.id}`, s]));
  const mgMap = new Map(composition.motionGraphics.map((mg) => [`mg:${mg.id}`, mg]));
  const audioMap = new Map(composition.audioTracks.map((a) => [`audio:${a.id}`, a]));
  const capMap = new Map(composition.captions.map((c) => [`cap:${c.id}`, c]));

  const layers: TimelineLayer[] = [];

  // Build layers from layerOrder
  for (let i = 0; i < order.length; i++) {
    const key = order[i];
    const [type, _id] = [key.split(":")[0], key.split(":").slice(1).join(":")];

    if (type === "scene") {
      const scene = sceneMap.get(key);
      if (!scene) {
        continue;
      }
      const hasVideo = scene.elements.some((el) => "startFrom" in el);
      layers.push({
        id: key,
        name: scene.name,
        kind: hasVideo ? "video" : "image",
        startFrame: scene.startFrame ?? 0,
        endFrame: (scene.startFrame ?? 0) + scene.durationInFrames,
        color: LAYER_COLORS[hasVideo ? "video" : "image"],
        sourceId: scene.id,
        orderIndex: i,
      });
      sceneMap.delete(key);
    } else if (type === "mg") {
      const mg = mgMap.get(key);
      if (!mg) {
        continue;
      }
      layers.push({
        id: key,
        name: mg.name,
        kind: "motion-graphic",
        startFrame: mg.startFrame,
        endFrame: mg.endFrame,
        color: LAYER_COLORS["motion-graphic"],
        sourceId: mg.id,
        orderIndex: i,
      });
      mgMap.delete(key);
    } else if (type === "audio") {
      const track = audioMap.get(key);
      if (!track) {
        continue;
      }
      layers.push({
        id: key,
        name: track.name,
        kind: "audio",
        startFrame: track.startFrame,
        endFrame: track.startFrame + track.durationInFrames,
        color: LAYER_COLORS.audio,
        sourceId: track.id,
        orderIndex: i,
      });
      audioMap.delete(key);
    } else if (type === "cap") {
      const cap = capMap.get(key);
      if (!cap) {
        continue;
      }
      layers.push({
        id: key,
        name: cap.text.slice(0, 40),
        kind: "caption",
        startFrame: cap.startFrame,
        endFrame: cap.endFrame,
        color: LAYER_COLORS.caption,
        sourceId: cap.id,
        orderIndex: i,
      });
      capMap.delete(key);
    }
  }

  // Append any orphaned items (not in layerOrder — backwards compat)
  let idx = layers.length;
  for (const [key, scene] of sceneMap) {
    const hasVideo = scene.elements.some((el) => "startFrom" in el);
    layers.push({
      id: key,
      name: scene.name,
      kind: hasVideo ? "video" : "image",
      startFrame: scene.startFrame ?? 0,
      endFrame: (scene.startFrame ?? 0) + scene.durationInFrames,
      color: LAYER_COLORS[hasVideo ? "video" : "image"],
      sourceId: scene.id,
      orderIndex: idx++,
    });
  }
  for (const [key, mg] of mgMap) {
    layers.push({
      id: key,
      name: mg.name,
      kind: "motion-graphic",
      startFrame: mg.startFrame,
      endFrame: mg.endFrame,
      color: LAYER_COLORS["motion-graphic"],
      sourceId: mg.id,
      orderIndex: idx++,
    });
  }
  for (const [key, track] of audioMap) {
    layers.push({
      id: key,
      name: track.name,
      kind: "audio",
      startFrame: track.startFrame,
      endFrame: track.startFrame + track.durationInFrames,
      color: LAYER_COLORS.audio,
      sourceId: track.id,
      orderIndex: idx++,
    });
  }

  return layers;
}

// ── Timeline Component ───────────────────────────────────────────────────────

export function Timeline() {
  const composition = useVideoStore((s) => s.composition);
  const selectedSceneId = useVideoStore((s) => s.selectedSceneId);
  const currentFrame = useVideoStore((s) => s.currentFrame);
  const selectScene = useVideoStore((s) => s.selectScene);
  const setCurrentFrame = useVideoStore((s) => s.setCurrentFrame);
  const showMotionGraphics = useVideoStore((s) => s.showMotionGraphics);
  const setShowMotionGraphics = useVideoStore((s) => s.setShowMotionGraphics);
  const removeScene = useVideoStore((s) => s.removeScene);
  const removeMotionGraphic = useVideoStore((s) => s.removeMotionGraphic);
  const removeAudioTrack = useVideoStore((s) => s.removeAudioTrack);
  const removeCaption = useVideoStore((s) => s.removeCaption);
  const addScene = useVideoStore((s) => s.addScene);
  const updateScene = useVideoStore((s) => s.updateScene);
  const updateMotionGraphic = useVideoStore((s) => s.updateMotionGraphic);
  const updateAudioTrack = useVideoStore((s) => s.updateAudioTrack);
  const reorderLayers = useVideoStore((s) => s.reorderLayers);

  const totalFrames = getTotalDurationInFrames(composition);
  const totalSeconds = totalFrames / composition.fps;

  const layers = buildOrderedLayers(composition);

  // Time ruler markers
  const markerInterval =
    totalSeconds <= 5 ? 1 : totalSeconds <= 15 ? 2 : totalSeconds <= 60 ? 5 : 10;
  const markers: number[] = [];
  for (let t = 0; t <= totalSeconds; t += markerInterval) {
    markers.push(t);
  }

  const handleRulerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      setCurrentFrame(
        Math.max(0, Math.min(Math.round(ratio * Math.max(totalFrames, 1)), totalFrames - 1)),
      );
    },
    [totalFrames, setCurrentFrame],
  );

  const playheadPct = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;

  const handleLayerClick = (layer: TimelineLayer) => {
    if (layer.kind === "video" || layer.kind === "image") {
      selectScene(layer.sourceId);
    } else {
      setCurrentFrame(layer.startFrame);
    }
  };

  const handleDeleteLayer = (layer: TimelineLayer) => {
    if (layer.kind === "video" || layer.kind === "image") {
      removeScene(layer.sourceId);
    } else if (layer.kind === "motion-graphic") {
      removeMotionGraphic(layer.sourceId);
    } else if (layer.kind === "audio") {
      removeAudioTrack(layer.sourceId);
    } else if (layer.kind === "caption") {
      removeCaption(layer.sourceId);
    }
  };

  // ── Horizontal drag to move layer start time ────────────────────────────
  const dragRef = useRef<{
    layerId: string;
    kind: LayerKind;
    sourceId: string;
    startX: number;
    origStartFrame: number;
    duration: number;
    barWidth: number;
  } | null>(null);

  const handleBarMouseDown = (layer: TimelineLayer, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const barArea = (e.currentTarget as HTMLElement).parentElement;
    if (!barArea) {
      return;
    }

    dragRef.current = {
      layerId: layer.id,
      kind: layer.kind,
      sourceId: layer.sourceId,
      startX: e.clientX,
      origStartFrame: layer.startFrame,
      duration: layer.endFrame - layer.startFrame,
      barWidth: barArea.getBoundingClientRect().width,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) {
        return;
      }
      const dx = ev.clientX - d.startX;
      // Total frames may grow as we move layers, use a stable reference
      const tf = Math.max(
        getTotalDurationInFrames(useVideoStore.getState().composition),
        d.origStartFrame + d.duration,
      );
      const frameDelta = Math.round((dx / d.barWidth) * tf);
      const newStart = Math.max(0, d.origStartFrame + frameDelta);
      applyStartFrame(d.kind, d.sourceId, newStart, d.duration);
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const applyStartFrame = (
    kind: LayerKind,
    sourceId: string,
    newStart: number,
    duration: number,
  ) => {
    if (kind === "video" || kind === "image") {
      updateScene(sourceId, { startFrame: newStart });
    } else if (kind === "motion-graphic") {
      updateMotionGraphic(sourceId, { startFrame: newStart, endFrame: newStart + duration });
    } else if (kind === "audio") {
      updateAudioTrack(sourceId, { startFrame: newStart });
    }
  };

  // ── Move layer up/down (in z-order) ─────────────────────────────────────
  // Display is reversed: top of list = foreground = last in layerOrder.
  // "Move up" in display = move toward foreground = move later in layerOrder.
  // "Move down" in display = move toward background = move earlier in layerOrder.
  const moveLayerUp = (orderIndex: number) => {
    if (orderIndex < layers.length - 1) {
      reorderLayers(orderIndex, orderIndex + 1);
    }
  };
  const moveLayerDown = (orderIndex: number) => {
    if (orderIndex > 0) {
      reorderLayers(orderIndex, orderIndex - 1);
    }
  };

  // ── Asset drop (from asset panel) ───────────────────────────────────────
  const handleAssetDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const assetJson = e.dataTransfer.getData("application/avt-asset");
      if (!assetJson) {
        return;
      }
      try {
        const asset: Asset = JSON.parse(assetJson);
        const fps = composition.fps;
        if (asset.type === "video") {
          const dur = asset.durationInFrames ?? fps * 5;
          addScene({
            name: asset.name,
            type: "content",
            startFrame: 0,
            durationInFrames: dur,
            backgroundColor: "#000000",
            elements: [
              {
                id: crypto.randomUUID(),
                assetId: asset.url,
                x: composition.width / 2,
                y: composition.height / 2,
                width: composition.width,
                height: composition.height,
                startFrom: 0,
                endAt: dur,
                volume: 1,
              },
            ],
          });
        } else if (asset.type === "image") {
          addScene({
            name: asset.name,
            type: "content",
            startFrame: 0,
            durationInFrames: fps * 4,
            backgroundColor: "#000000",
            elements: [
              {
                id: crypto.randomUUID(),
                assetId: asset.url,
                x: composition.width / 2,
                y: composition.height / 2,
                width: composition.width,
                height: composition.height,
                opacity: 1,
              },
            ],
          });
        } else if (asset.type === "audio") {
          useVideoStore.getState().addAudioTrack({
            assetId: asset.url,
            name: asset.name,
            type: "music",
            startFrame: 0,
            durationInFrames: asset.durationInFrames ?? fps * 10,
            volume: 1,
          });
        }
      } catch {
        /* invalid drop data */
      }
    },
    [composition, addScene],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const isEmpty = layers.length === 0;

  // Display layers top-to-bottom = foreground first (top of list = rendered on top)
  const displayLayers = [...layers].toReversed();

  return (
    <div className="bg-editor-surface border-t border-editor-border flex flex-col h-44 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-editor-border flex-shrink-0">
        <span className="text-xs font-medium text-editor-muted">Timeline</span>
        <div className="flex items-center gap-3 text-[10px] text-editor-muted">
          <span>
            {layers.length} layer{layers.length !== 1 ? "s" : ""}
          </span>
          <span>{totalSeconds.toFixed(1)}s</span>
        </div>
      </div>

      {/* Ruler */}
      <div className="flex border-b border-editor-border flex-shrink-0">
        <div className="w-44 flex-shrink-0 border-r border-editor-border" />
        <div
          className="relative flex-1 h-5 bg-editor-panel cursor-pointer"
          onClick={handleRulerClick}
        >
          {markers.map((t) => (
            <div
              key={t}
              className="absolute top-0 h-full flex flex-col items-center"
              style={{ left: `${totalSeconds > 0 ? (t / totalSeconds) * 100 : 0}%` }}
            >
              <div className="w-px h-2 bg-editor-border" />
              <span className="text-[9px] text-editor-muted">{t}s</span>
            </div>
          ))}
          {totalFrames > 0 && (
            <div
              className="absolute top-0 w-0.5 h-full bg-editor-accent z-10"
              style={{ left: `${playheadPct}%` }}
            >
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-editor-accent rotate-45 rounded-sm" />
            </div>
          )}
        </div>
      </div>

      {/* Layers — scrollable, drop target */}
      <div className="flex-1 overflow-y-auto" onDrop={handleAssetDrop} onDragOver={handleDragOver}>
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-editor-muted/40 text-xs">
            Drag assets here or use the chat to add layers
          </div>
        ) : (
          displayLayers.map((layer, displayIdx) => {
            const Icon = LAYER_ICONS[layer.kind];
            const isSelected =
              (layer.kind === "video" || layer.kind === "image") &&
              layer.sourceId === selectedSceneId;
            const isFirst = displayIdx === 0;
            const isLast = displayIdx === displayLayers.length - 1;

            return (
              <div
                key={layer.id}
                className={`flex items-center h-8 border-b border-editor-border/30 group transition-colors ${
                  isSelected ? "bg-editor-accent/5" : "hover:bg-editor-panel/50"
                }`}
              >
                {/* Layer label panel */}
                <div className="w-44 flex-shrink-0 flex items-center gap-1 px-1.5 border-r border-editor-border/50 h-full overflow-hidden">
                  {/* Icon */}
                  <Icon className="w-3 h-3 flex-shrink-0" style={{ color: layer.color }} />
                  {/* Name */}
                  <span className="text-[10px] text-editor-text truncate flex-1">{layer.name}</span>
                  {/* Controls — show on hover */}
                  <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Move up (toward foreground) */}
                    <button
                      onClick={() => moveLayerUp(layer.orderIndex)}
                      disabled={isFirst}
                      className="p-0.5 rounded hover:bg-editor-border/50 disabled:opacity-20"
                      title="Move to foreground"
                    >
                      <ChevronUp className="w-2.5 h-2.5 text-editor-muted" />
                    </button>
                    {/* Move down (toward background) */}
                    <button
                      onClick={() => moveLayerDown(layer.orderIndex)}
                      disabled={isLast}
                      className="p-0.5 rounded hover:bg-editor-border/50 disabled:opacity-20"
                      title="Move to background"
                    >
                      <ChevronDown className="w-2.5 h-2.5 text-editor-muted" />
                    </button>
                    {layer.kind === "motion-graphic" && (
                      <button
                        onClick={() => setShowMotionGraphics(!showMotionGraphics)}
                        className="p-0.5 rounded hover:bg-editor-border/50"
                      >
                        {showMotionGraphics ? (
                          <Eye className="w-2.5 h-2.5 text-editor-muted" />
                        ) : (
                          <EyeOff className="w-2.5 h-2.5 text-editor-muted/40" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteLayer(layer)}
                      className="p-0.5 rounded hover:bg-red-100"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-editor-muted hover:text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Layer bar area */}
                <div className="flex-1 h-full relative cursor-pointer" onClick={handleRulerClick}>
                  {totalFrames > 0 && (
                    <div
                      className="absolute top-0 w-0.5 h-full bg-editor-accent z-10 pointer-events-none"
                      style={{ left: `${playheadPct}%` }}
                    />
                  )}
                  <div
                    className={`absolute top-1 bottom-1 rounded cursor-grab active:cursor-grabbing select-none ${isSelected ? "ring-1 ring-editor-accent/40" : "hover:brightness-110"}`}
                    style={{
                      left: `${totalFrames > 0 ? (layer.startFrame / totalFrames) * 100 : 0}%`,
                      width: `${totalFrames > 0 ? ((layer.endFrame - layer.startFrame) / totalFrames) * 100 : 100}%`,
                      minWidth: 4,
                      backgroundColor: `${layer.color}20`,
                      borderLeft: `3px solid ${layer.color}`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLayerClick(layer);
                    }}
                    onMouseDown={(e) => handleBarMouseDown(layer, e)}
                    title={`${layer.name} (${((layer.endFrame - layer.startFrame) / composition.fps).toFixed(1)}s)`}
                  >
                    <span
                      className="text-[9px] font-medium px-1.5 truncate block leading-[22px] pointer-events-none"
                      style={{ color: layer.color }}
                    >
                      {layer.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

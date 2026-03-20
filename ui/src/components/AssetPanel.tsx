import {
  Image,
  Type,
  Upload,
  FolderOpen,
  Layers,
  Plus,
  Trash2,
  FileAudio,
  FileVideo,
  FileImage,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useVideoStore } from "../store/video-store";
import type { AssetType } from "../types/video";

type Tab = "assets" | "scenes" | "elements";

function getAssetTypeFromMime(mime: string): AssetType {
  if (mime.startsWith("image/")) {
    return "image";
  }
  if (mime.startsWith("video/")) {
    return "video";
  }
  if (mime.startsWith("audio/")) {
    return "audio";
  }
  return "image";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function AssetPanel() {
  const [tab, setTab] = useState<Tab>("scenes");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const composition = useVideoStore((s) => s.composition);
  const selectedSceneId = useVideoStore((s) => s.selectedSceneId);
  const selectScene = useVideoStore((s) => s.selectScene);
  const addScene = useVideoStore((s) => s.addScene);
  const addAsset = useVideoStore((s) => s.addAsset);
  const removeAsset = useVideoStore((s) => s.removeAsset);
  const selectedElementId = useVideoStore((s) => s.selectedElementId);
  const selectElement = useVideoStore((s) => s.selectElement);
  const removeElement = useVideoStore((s) => s.removeElement);

  const selectedScene = composition.scenes.find((s) => s.id === selectedSceneId);

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fps = composition.fps;

      Array.from(files).forEach(async (file) => {
        const type = getAssetTypeFromMime(file.type);

        // Step 1: Probe duration using blob URL (instantly available)
        const blobUrl = URL.createObjectURL(file);
        let durationInFrames: number | undefined;
        let durationSec: number | undefined;

        if (type === "video" || type === "audio") {
          try {
            const dur = await new Promise<number>((resolve, reject) => {
              const el = document.createElement(type === "video" ? "video" : "audio");
              el.preload = "metadata";
              el.addEventListener("loadedmetadata", () => resolve(el.duration));
              el.addEventListener("error", () => reject(new Error("probe failed")));
              el.src = blobUrl;
            });
            durationSec = dur;
            durationInFrames = Math.round(dur * fps);
          } catch {
            // probe failed, will use defaults
          }
        }

        // Step 2: Upload file to server for a persistent URL
        let persistentUrl: string;
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "X-Filename": file.name },
            body: file,
          });
          const result = await res.json();
          if (!result.ok) {
            throw new Error(result.error);
          }
          persistentUrl = result.url;
        } catch {
          persistentUrl = blobUrl; // fallback
        }

        // Clean up blob URL if we got a persistent one
        if (persistentUrl !== blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }

        const thumbnailUrl = type === "image" ? persistentUrl : undefined;

        // Step 3: Add asset with persistent URL and probed duration
        addAsset({
          name: file.name,
          type,
          url: persistentUrl,
          thumbnailUrl,
          durationInFrames,
          metadata: {
            size: file.size,
            mimeType: file.type,
            ...(durationSec !== undefined && { duration: durationSec }),
          },
        });
      });
    },
    [addAsset, composition.fps],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        e.target.value = ""; // reset so same file can be re-selected
      }
    },
    [processFiles],
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "scenes", label: "Scenes", icon: <Layers className="w-3.5 h-3.5" /> },
    { id: "assets", label: "Assets", icon: <FolderOpen className="w-3.5 h-3.5" /> },
    { id: "elements", label: "Elements", icon: <Type className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className="flex flex-col w-64 bg-editor-surface border-r border-editor-border relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-editor-accent/5 border-2 border-dashed border-editor-accent/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <Upload className="w-8 h-8 text-editor-accent mx-auto mb-2" />
            <p className="text-sm font-medium text-editor-accent">Drop files here</p>
            <p className="text-xs text-editor-muted mt-1">Images, videos, or audio</p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Tabs */}
      <div className="flex border-b border-editor-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
              tab === t.id
                ? "text-editor-accent border-b-2 border-editor-accent"
                : "text-editor-muted hover:text-editor-text"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Scenes Tab */}
        {tab === "scenes" && (
          <div className="space-y-2">
            {composition.scenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => selectScene(scene.id)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  selectedSceneId === scene.id
                    ? "bg-editor-accent/5 border border-editor-accent/20 shadow-soft"
                    : "bg-editor-panel border border-transparent hover:border-editor-border hover:shadow-soft"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{scene.name}</span>
                  <span className="text-[10px] text-editor-muted px-1.5 py-0.5 bg-editor-bg rounded-md">
                    {(scene.durationInFrames / composition.fps).toFixed(1)}s
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm border border-editor-border"
                    style={{ backgroundColor: scene.backgroundColor }}
                  />
                  <span className="text-[10px] text-editor-muted capitalize">{scene.type}</span>
                  <span className="text-[10px] text-editor-muted">
                    · {scene.elements.length} elements
                  </span>
                </div>
                {scene.transition && (
                  <div className="mt-1.5 text-[10px] text-editor-accent/70">
                    → {scene.transition.type} transition
                  </div>
                )}
              </button>
            ))}

            <button
              onClick={() =>
                addScene({
                  name: `Scene ${composition.scenes.length + 1}`,
                  type: "content",
                  durationInFrames: 90,
                  backgroundColor: "#F7F5F3",
                  elements: [],
                })
              }
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-editor-border text-editor-muted hover:text-editor-text hover:border-editor-accent/30 transition-colors text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Scene
            </button>
          </div>
        )}

        {/* Assets Tab */}
        {tab === "assets" && (
          <div className="space-y-3">
            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-dashed border-editor-border text-editor-muted hover:text-editor-text hover:border-editor-accent/30 hover:bg-editor-accent/[0.02] transition-all text-xs"
            >
              <Upload className="w-5 h-5" />
              <span>Click to upload or drag & drop</span>
              <span className="text-[10px] text-editor-muted/60">Images, videos, audio files</span>
            </button>

            {/* Asset list */}
            {composition.assets.length === 0 ? (
              <p className="text-xs text-editor-muted text-center py-4">
                No assets yet. Upload images, videos, or audio files to use in your scenes.
              </p>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-editor-muted font-medium uppercase tracking-wider">
                    {composition.assets.length} asset{composition.assets.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {composition.assets.map((asset) => (
                  <div
                    key={asset.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/avt-asset", JSON.stringify(asset));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className="group flex items-center gap-2 p-2 rounded-xl bg-editor-panel hover:bg-editor-bg transition-colors cursor-grab active:cursor-grabbing"
                  >
                    {/* Thumbnail or icon */}
                    {asset.type === "image" &&
                    asset.thumbnailUrl &&
                    !asset.thumbnailUrl.startsWith("blob:") ? (
                      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-editor-bg">
                        <img
                          src={asset.thumbnailUrl}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-editor-bg">
                        {asset.type === "image" && <FileImage className="w-4 h-4 text-amber-600" />}
                        {asset.type === "video" && (
                          <FileVideo className="w-4 h-4 text-editor-accent" />
                        )}
                        {asset.type === "audio" && (
                          <FileAudio className="w-4 h-4 text-editor-success" />
                        )}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{asset.name}</p>
                      <p className="text-[10px] text-editor-muted">
                        {asset.type}
                        {asset.metadata?.size
                          ? ` · ${formatFileSize(asset.metadata.size as number)}`
                          : ""}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAsset(asset.id);
                      }}
                      className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-editor-muted hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Elements Tab */}
        {tab === "elements" && (
          <div className="space-y-2">
            {selectedScene ? (
              <>
                <p className="text-xs text-editor-muted mb-2">Elements in "{selectedScene.name}"</p>
                {selectedScene.elements.map((el) => (
                  <div
                    key={el.id}
                    onClick={() => selectElement(el.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs cursor-pointer group transition-all ${
                      selectedElementId === el.id
                        ? "bg-editor-accent/5 border border-editor-accent/20 shadow-soft"
                        : "bg-editor-panel border border-transparent hover:border-editor-border"
                    }`}
                  >
                    {"text" in el ? (
                      <>
                        <Type className="w-3.5 h-3.5 text-editor-muted flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{el.text?.substring(0, 30)}</span>
                          <span className="text-[10px] text-editor-muted">
                            {el.fontSize}px · {el.color}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Image className="w-3.5 h-3.5 text-editor-muted flex-shrink-0" />
                        <span className="truncate flex-1">Image element</span>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeElement(selectedScene.id, el.id);
                      }}
                      className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-editor-muted hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {selectedScene.elements.length === 0 && (
                  <p className="text-xs text-editor-muted text-center py-4">
                    No elements in this scene. Use chat to add text or images.
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-editor-muted text-center py-4">
                Select a scene to view its elements.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

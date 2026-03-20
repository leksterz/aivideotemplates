import { create } from "zustand";
import {
  getTotalDurationInFrames,
  type VideoComposition,
  type Scene,
  type SceneElement,
  type AudioTrack,
  type CaptionSegment,
  type MotionGraphicSegment,
  type Asset,
  type Transition,
} from "../types/video";

function uid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

const DEFAULT_COMPOSITION: VideoComposition = {
  id: uid(),
  name: "Untitled Video",
  width: 1920,
  height: 1080,
  fps: 30,
  scenes: [],
  motionGraphics: [],
  audioTracks: [],
  captions: [],
  assets: [],
  layerOrder: [],
  metadata: {
    createdAt: now(),
    updatedAt: now(),
  },
};

export interface VideoStore {
  composition: VideoComposition;
  selectedSceneId: string | null;
  selectedElementId: string | null;
  currentFrame: number;
  isPlaying: boolean;
  showMotionGraphics: boolean;
  setShowMotionGraphics: (show: boolean) => void;

  // Composition actions
  setComposition: (comp: VideoComposition) => void;
  updateCompositionName: (name: string) => void;
  updateCompositionSettings: (settings: { width?: number; height?: number; fps?: number }) => void;

  // Scene actions
  addScene: (scene: Omit<Scene, "id" | "startFrame"> & { startFrame?: number }) => string;
  updateScene: (sceneId: string, updates: Partial<Scene>) => void;
  removeScene: (sceneId: string) => void;
  reorderScenes: (fromIndex: number, toIndex: number) => void;
  selectScene: (sceneId: string | null) => void;

  // Element actions
  addElement: (sceneId: string, element: Omit<SceneElement, "id">) => string;
  updateElement: (sceneId: string, elementId: string, updates: Partial<SceneElement>) => void;
  removeElement: (sceneId: string, elementId: string) => void;
  selectElement: (elementId: string | null) => void;

  // Audio actions
  addAudioTrack: (track: Omit<AudioTrack, "id">) => string;
  updateAudioTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  removeAudioTrack: (trackId: string) => void;

  // Caption actions
  addCaption: (caption: Omit<CaptionSegment, "id">) => string;
  removeCaption: (captionId: string) => void;

  // Asset actions
  addAsset: (asset: Omit<Asset, "id">) => string;
  removeAsset: (assetId: string) => void;

  // Motion Graphics actions
  addMotionGraphic: (mg: Omit<MotionGraphicSegment, "id">) => string;
  updateMotionGraphic: (mgId: string, updates: Partial<MotionGraphicSegment>) => void;
  removeMotionGraphic: (mgId: string) => void;
  selectedMotionGraphicId: string | null;
  selectMotionGraphic: (mgId: string | null) => void;

  // Transition actions
  setTransition: (sceneId: string, transition: Transition | undefined) => void;

  // Layer ordering (z-order for compositing)
  reorderLayers: (fromIndex: number, toIndex: number) => void;

  // Playback
  setCurrentFrame: (frame: number) => void;
  setPlaying: (playing: boolean) => void;

  // Bulk: apply tool result
  applyToolAction: (action: ToolAction) => void;
}

export type ToolAction =
  | { type: "add-scene"; scene: Omit<Scene, "id"> }
  | { type: "update-scene"; sceneId: string; updates: Partial<Scene> }
  | { type: "remove-scene"; sceneId: string }
  | { type: "add-element"; sceneId: string; element: Omit<SceneElement, "id"> }
  | { type: "update-element"; sceneId: string; elementId: string; updates: Partial<SceneElement> }
  | { type: "remove-element"; sceneId: string; elementId: string }
  | { type: "add-audio"; track: Omit<AudioTrack, "id"> }
  | { type: "remove-audio"; trackId: string }
  | { type: "set-transition"; sceneId: string; transition: Transition | undefined }
  | { type: "update-text"; sceneId: string; elementId: string; text: string }
  | { type: "set-composition"; composition: VideoComposition }
  | { type: "add-motion-graphic"; mg: Omit<MotionGraphicSegment, "id"> }
  | { type: "update-motion-graphic"; mgId: string; updates: Partial<MotionGraphicSegment> }
  | { type: "remove-motion-graphic"; mgId: string };

export const useVideoStore = create<VideoStore>((set, get) => ({
  composition: DEFAULT_COMPOSITION,
  selectedSceneId: DEFAULT_COMPOSITION.scenes[0]?.id ?? null,
  selectedElementId: null,
  selectedMotionGraphicId: null,
  currentFrame: 0,
  isPlaying: false,
  showMotionGraphics: true,
  setShowMotionGraphics: (show) => set({ showMotionGraphics: show }),

  setComposition: (comp) =>
    set({ composition: { ...comp, metadata: { ...comp.metadata, updatedAt: now() } } }),

  updateCompositionName: (name) =>
    set((s) => ({
      composition: {
        ...s.composition,
        name,
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
    })),

  updateCompositionSettings: (settings) =>
    set((s) => {
      const newW = settings.width ?? s.composition.width;
      const newH = settings.height ?? s.composition.height;
      const dimChanged = newW !== s.composition.width || newH !== s.composition.height;

      // Refit video/image elements to new dimensions when canvas size changes
      const scenes = dimChanged
        ? s.composition.scenes.map((scene) => ({
            ...scene,
            elements: scene.elements.map((el) => {
              if ("assetId" in el && "width" in el) {
                // Video or image element — refit to fill new canvas
                return { ...el, x: newW / 2, y: newH / 2, width: newW, height: newH };
              }
              if ("text" in el && "fontSize" in el) {
                // Text element — recenter
                return { ...el, x: newW / 2, y: (el as { y: number }).y };
              }
              return el;
            }),
          }))
        : s.composition.scenes;

      return {
        composition: {
          ...s.composition,
          width: newW,
          height: newH,
          ...(settings.fps !== undefined && { fps: settings.fps }),
          scenes,
          metadata: { ...s.composition.metadata, updatedAt: now() },
        },
      };
    }),

  addScene: (scene) => {
    const id = uid();
    set((s) => {
      // If no explicit startFrame, place after the last scene/layer end
      const startFrame = scene.startFrame ?? getTotalDurationInFrames(s.composition);
      return {
        composition: {
          ...s.composition,
          scenes: [...s.composition.scenes, { ...scene, id, startFrame }],
          layerOrder: [...(s.composition.layerOrder || []), `scene:${id}`],
          metadata: { ...s.composition.metadata, updatedAt: now() },
        },
      };
    });
    return id;
  },

  updateScene: (sceneId, updates) =>
    set((s) => ({
      composition: {
        ...s.composition,
        scenes: s.composition.scenes.map((sc) => (sc.id === sceneId ? { ...sc, ...updates } : sc)),
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
    })),

  removeScene: (sceneId) =>
    set((s) => ({
      composition: {
        ...s.composition,
        scenes: s.composition.scenes.filter((sc) => sc.id !== sceneId),
        layerOrder: (s.composition.layerOrder || []).filter((l) => l !== `scene:${sceneId}`),
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
      selectedSceneId: s.selectedSceneId === sceneId ? null : s.selectedSceneId,
    })),

  reorderScenes: (fromIndex, toIndex) =>
    set((s) => {
      const scenes = [...s.composition.scenes];
      const [moved] = scenes.splice(fromIndex, 1);
      scenes.splice(toIndex, 0, moved);
      return {
        composition: {
          ...s.composition,
          scenes,
          metadata: { ...s.composition.metadata, updatedAt: now() },
        },
      };
    }),

  selectScene: (sceneId) => set({ selectedSceneId: sceneId, selectedElementId: null }),

  addElement: (sceneId, element) => {
    const id = uid();
    set((s) => ({
      composition: {
        ...s.composition,
        scenes: s.composition.scenes.map((sc) =>
          sc.id === sceneId
            ? { ...sc, elements: [...sc.elements, { ...element, id } as SceneElement] }
            : sc,
        ),
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
    }));
    return id;
  },

  updateElement: (sceneId, elementId, updates) =>
    set((s) => ({
      composition: {
        ...s.composition,
        scenes: s.composition.scenes.map((sc) =>
          sc.id === sceneId
            ? {
                ...sc,
                elements: sc.elements.map((el) =>
                  el.id === elementId ? { ...el, ...updates } : el,
                ),
              }
            : sc,
        ),
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
    })),

  removeElement: (sceneId, elementId) =>
    set((s) => ({
      composition: {
        ...s.composition,
        scenes: s.composition.scenes.map((sc) =>
          sc.id === sceneId
            ? { ...sc, elements: sc.elements.filter((el) => el.id !== elementId) }
            : sc,
        ),
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
      selectedElementId: s.selectedElementId === elementId ? null : s.selectedElementId,
    })),

  selectElement: (elementId) => set({ selectedElementId: elementId }),

  addAudioTrack: (track) => {
    const id = uid();
    set((s) => ({
      composition: {
        ...s.composition,
        audioTracks: [...s.composition.audioTracks, { ...track, id }],
        layerOrder: [...(s.composition.layerOrder || []), `audio:${id}`],
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
    }));
    return id;
  },

  updateAudioTrack: (trackId, updates) =>
    set((s) => ({
      composition: {
        ...s.composition,
        audioTracks: s.composition.audioTracks.map((t) =>
          t.id === trackId ? { ...t, ...updates } : t,
        ),
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
    })),

  removeAudioTrack: (trackId) =>
    set((s) => ({
      composition: {
        ...s.composition,
        audioTracks: s.composition.audioTracks.filter((t) => t.id !== trackId),
        layerOrder: (s.composition.layerOrder || []).filter((l) => l !== `audio:${trackId}`),
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
    })),

  addCaption: (caption) => {
    const id = uid();
    set((s) => ({
      composition: {
        ...s.composition,
        captions: [...s.composition.captions, { ...caption, id }],
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
    }));
    return id;
  },

  removeCaption: (captionId) =>
    set((s) => ({
      composition: {
        ...s.composition,
        captions: s.composition.captions.filter((c) => c.id !== captionId),
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
    })),

  addAsset: (asset) => {
    const id = uid();
    set((s) => ({
      composition: {
        ...s.composition,
        assets: [...s.composition.assets, { ...asset, id }],
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
    }));
    return id;
  },

  removeAsset: (assetId) =>
    set((s) => {
      const asset = s.composition.assets.find((a) => a.id === assetId);
      const assetUrl = asset?.url;

      // Remove scenes whose elements reference this asset
      const scenes = assetUrl
        ? s.composition.scenes.filter(
            (scene) =>
              !scene.elements.some(
                (el) => "assetId" in el && (el as { assetId: string }).assetId === assetUrl,
              ),
          )
        : s.composition.scenes;

      // Remove audio tracks referencing this asset
      const audioTracks = assetUrl
        ? s.composition.audioTracks.filter((t) => t.assetId !== assetUrl)
        : s.composition.audioTracks;

      // Clear selection if the selected scene was removed
      const selectedSceneId = scenes.find((sc) => sc.id === s.selectedSceneId)
        ? s.selectedSceneId
        : null;

      return {
        selectedSceneId,
        selectedElementId: selectedSceneId ? s.selectedElementId : null,
        composition: {
          ...s.composition,
          assets: s.composition.assets.filter((a) => a.id !== assetId),
          scenes,
          audioTracks,
          metadata: { ...s.composition.metadata, updatedAt: now() },
        },
      };
    }),

  addMotionGraphic: (mg) => {
    const id = uid();
    set((s) => ({
      composition: {
        ...s.composition,
        motionGraphics: [...s.composition.motionGraphics, { ...mg, id }],
        layerOrder: [...(s.composition.layerOrder || []), `mg:${id}`],
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
    }));
    return id;
  },

  updateMotionGraphic: (mgId, updates) =>
    set((s) => ({
      composition: {
        ...s.composition,
        motionGraphics: s.composition.motionGraphics.map((mg) =>
          mg.id === mgId ? { ...mg, ...updates } : mg,
        ),
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
    })),

  removeMotionGraphic: (mgId) =>
    set((s) => ({
      composition: {
        ...s.composition,
        motionGraphics: s.composition.motionGraphics.filter((mg) => mg.id !== mgId),
        layerOrder: (s.composition.layerOrder || []).filter((l) => l !== `mg:${mgId}`),
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
      selectedMotionGraphicId:
        s.selectedMotionGraphicId === mgId ? null : s.selectedMotionGraphicId,
    })),

  selectMotionGraphic: (mgId) => set({ selectedMotionGraphicId: mgId }),

  setTransition: (sceneId, transition) =>
    set((s) => ({
      composition: {
        ...s.composition,
        scenes: s.composition.scenes.map((sc) => (sc.id === sceneId ? { ...sc, transition } : sc)),
        metadata: { ...s.composition.metadata, updatedAt: now() },
      },
    })),

  reorderLayers: (fromIndex, toIndex) =>
    set((s) => {
      const order = [...(s.composition.layerOrder || [])];
      const [moved] = order.splice(fromIndex, 1);
      order.splice(toIndex, 0, moved);
      return {
        composition: {
          ...s.composition,
          layerOrder: order,
          metadata: { ...s.composition.metadata, updatedAt: now() },
        },
      };
    }),

  setCurrentFrame: (frame) => set({ currentFrame: frame }),
  setPlaying: (playing) => set({ isPlaying: playing }),

  applyToolAction: (action) => {
    const store = get();
    switch (action.type) {
      case "add-scene":
        store.addScene(action.scene);
        break;
      case "update-scene":
        store.updateScene(action.sceneId, action.updates);
        break;
      case "remove-scene":
        store.removeScene(action.sceneId);
        break;
      case "add-element":
        store.addElement(action.sceneId, action.element);
        break;
      case "update-element":
        store.updateElement(action.sceneId, action.elementId, action.updates);
        break;
      case "remove-element":
        store.removeElement(action.sceneId, action.elementId);
        break;
      case "add-audio":
        store.addAudioTrack(action.track);
        break;
      case "remove-audio":
        store.removeAudioTrack(action.trackId);
        break;
      case "set-transition":
        store.setTransition(action.sceneId, action.transition);
        break;
      case "update-text": {
        const scene = store.composition.scenes.find((s) => s.id === action.sceneId);
        if (scene) {
          store.updateElement(action.sceneId, action.elementId, {
            text: action.text,
          } as Partial<SceneElement>);
        }
        break;
      }
      case "set-composition":
        store.setComposition(action.composition);
        break;
      case "add-motion-graphic":
        store.addMotionGraphic(action.mg);
        break;
      case "update-motion-graphic":
        store.updateMotionGraphic(action.mgId, action.updates);
        break;
      case "remove-motion-graphic":
        store.removeMotionGraphic(action.mgId);
        break;
    }
  },
}));

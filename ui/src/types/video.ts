/** Core video composition data model.
 *  This is the "source of truth" that both the timeline UI and the LLM agent manipulate. */

export type AssetType = "image" | "video" | "audio" | "logo" | "font";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  url: string;
  thumbnailUrl?: string;
  durationInFrames?: number; // for video/audio assets
  metadata?: Record<string, unknown>;
}

export type SceneType =
  | "intro"
  | "content"
  | "feature"
  | "testimonial"
  | "cta"
  | "outro"
  | "custom";

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  opacity: number;
  animation?: AnimationConfig;
}

export interface ImageElement {
  id: string;
  assetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  borderRadius?: number;
  animation?: AnimationConfig;
}

export interface VideoElement {
  id: string;
  assetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  startFrom?: number; // trim start
  endAt?: number; // trim end
  volume?: number;
  animation?: AnimationConfig;
}

export type SceneElement = TextElement | ImageElement | VideoElement;

export interface AnimationConfig {
  type:
    | "fade-in"
    | "fade-out"
    | "slide-left"
    | "slide-right"
    | "slide-up"
    | "slide-down"
    | "scale"
    | "none";
  durationInFrames: number;
  delay?: number;
}

export type TransitionType = "cut" | "fade" | "slide" | "wipe" | "zoom";

export interface Transition {
  type: TransitionType;
  durationInFrames: number;
}

export interface Scene {
  id: string;
  name: string;
  type: SceneType;
  startFrame: number; // absolute position on timeline
  durationInFrames: number;
  backgroundColor: string;
  elements: SceneElement[];
  transition?: Transition; // transition to next scene
}

export interface AudioTrack {
  id: string;
  assetId: string;
  name: string;
  type: "music" | "sfx" | "voiceover";
  startFrame: number;
  durationInFrames: number;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface CaptionSegment {
  id: string;
  text: string;
  startFrame: number;
  endFrame: number;
  style?: {
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    position?: "top" | "center" | "bottom";
  };
}

export type MotionGraphicType =
  | "logo-reveal"
  | "interface-reveal"
  | "chart"
  | "transition"
  | "counter"
  | "screenshot"
  | "logo-mark"
  | "title-card"
  | "custom";

export interface MotionGraphicSegment {
  id: string;
  name: string;
  type: MotionGraphicType;
  startFrame: number;
  endFrame: number;
  description: string;
  elements: SceneElement[];
}

export interface VideoComposition {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  scenes: Scene[];
  motionGraphics: MotionGraphicSegment[];
  audioTracks: AudioTrack[];
  captions: CaptionSegment[];
  assets: Asset[];
  /** Render order (bottom-to-top). Each entry: "scene:{id}" | "mg:{id}". */
  layerOrder: string[];
  metadata: {
    templateId?: string;
    templateName?: string;
    createdAt: string;
    updatedAt: string;
  };
}

/** Total duration = the furthest end frame across all layers. */
export function getTotalDurationInFrames(composition: VideoComposition): number {
  let max = 0;
  for (const s of composition.scenes) {
    const end = (s.startFrame ?? 0) + s.durationInFrames;
    if (end > max) {
      max = end;
    }
  }
  for (const mg of composition.motionGraphics) {
    if (mg.endFrame > max) {
      max = mg.endFrame;
    }
  }
  for (const a of composition.audioTracks) {
    const end = a.startFrame + a.durationInFrames;
    if (end > max) {
      max = end;
    }
  }
  for (const c of composition.captions) {
    if (c.endFrame > max) {
      max = c.endFrame;
    }
  }
  return max;
}

/** @deprecated — use scene.startFrame directly instead. */
export function getSceneStartFrame(composition: VideoComposition, sceneIndex: number): number {
  const scene = composition.scenes[sceneIndex];
  return scene?.startFrame ?? 0;
}

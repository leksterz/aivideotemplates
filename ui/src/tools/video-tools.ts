/**
 * Video editing tool definitions.
 * These are the tools the LLM agent can call to manipulate the video composition.
 * Each tool maps to a ToolAction dispatched to the video store.
 */

import type { ToolAction } from "../store/video-store";
import type {
  Scene,
  SceneElement,
  TextElement,
  Transition,
  AudioTrack,
  SceneType,
  TransitionType,
  AnimationConfig,
  MotionGraphicSegment,
  MotionGraphicType,
} from "../types/video";

export interface VideoToolDefinition {
  name: string;
  description: string;
  parameters: Record<
    string,
    { type: string; description: string; required?: boolean; enum?: string[] }
  >;
}

/** Tool definitions to send to the agent's system prompt / tool registration */
export const VIDEO_TOOL_DEFINITIONS: VideoToolDefinition[] = [
  {
    name: "add_scene",
    description:
      "Add a new scene to the video composition. Scenes are the building blocks of the video.",
    parameters: {
      name: { type: "string", description: "Scene name", required: true },
      type: {
        type: "string",
        description: "Scene type",
        enum: ["intro", "content", "feature", "testimonial", "cta", "outro", "custom"],
        required: true,
      },
      duration_seconds: { type: "number", description: "Duration in seconds", required: true },
      background_color: { type: "string", description: "Background color hex", required: false },
      insert_after: {
        type: "string",
        description: "Scene ID to insert after. If omitted, appends to end.",
        required: false,
      },
    },
  },
  {
    name: "update_scene",
    description: "Update properties of an existing scene.",
    parameters: {
      scene_id: { type: "string", description: "Scene ID to update", required: true },
      name: { type: "string", description: "New scene name", required: false },
      duration_seconds: { type: "number", description: "New duration in seconds", required: false },
      background_color: {
        type: "string",
        description: "New background color hex",
        required: false,
      },
    },
  },
  {
    name: "remove_scene",
    description: "Remove a scene from the composition.",
    parameters: {
      scene_id: { type: "string", description: "Scene ID to remove", required: true },
    },
  },
  {
    name: "add_text",
    description: "Add a text element to a scene.",
    parameters: {
      scene_id: { type: "string", description: "Scene to add text to", required: true },
      text: { type: "string", description: "The text content", required: true },
      x: { type: "number", description: "X position (center of canvas = 960)", required: false },
      y: { type: "number", description: "Y position (center of canvas = 540)", required: false },
      font_size: { type: "number", description: "Font size in pixels", required: false },
      font_weight: { type: "number", description: "Font weight (100-900)", required: false },
      color: { type: "string", description: "Text color hex", required: false },
      animation: {
        type: "string",
        description: "Animation type",
        enum: [
          "fade-in",
          "fade-out",
          "slide-left",
          "slide-right",
          "slide-up",
          "slide-down",
          "scale",
          "none",
        ],
        required: false,
      },
    },
  },
  {
    name: "update_text",
    description: "Update the text content of an existing text element.",
    parameters: {
      scene_id: { type: "string", description: "Scene containing the element", required: true },
      element_id: { type: "string", description: "Element ID to update", required: true },
      text: { type: "string", description: "New text content", required: true },
    },
  },
  {
    name: "update_element",
    description: "Update properties of any scene element (text, image, video).",
    parameters: {
      scene_id: { type: "string", description: "Scene containing the element", required: true },
      element_id: { type: "string", description: "Element ID", required: true },
      x: { type: "number", description: "New X position", required: false },
      y: { type: "number", description: "New Y position", required: false },
      font_size: { type: "number", description: "New font size (text only)", required: false },
      color: { type: "string", description: "New color (text only)", required: false },
      opacity: { type: "number", description: "Opacity 0-1", required: false },
      animation: {
        type: "string",
        description: "Animation type",
        enum: [
          "fade-in",
          "fade-out",
          "slide-left",
          "slide-right",
          "slide-up",
          "slide-down",
          "scale",
          "none",
        ],
        required: false,
      },
    },
  },
  {
    name: "remove_element",
    description: "Remove an element from a scene.",
    parameters: {
      scene_id: { type: "string", description: "Scene containing the element", required: true },
      element_id: { type: "string", description: "Element ID to remove", required: true },
    },
  },
  {
    name: "set_transition",
    description: "Set the transition between this scene and the next.",
    parameters: {
      scene_id: { type: "string", description: "Scene ID", required: true },
      type: {
        type: "string",
        description: "Transition type",
        enum: ["cut", "fade", "slide", "wipe", "zoom"],
        required: true,
      },
      duration_seconds: {
        type: "number",
        description: "Transition duration in seconds",
        required: false,
      },
    },
  },
  {
    name: "add_music",
    description: "Add a background music track.",
    parameters: {
      name: { type: "string", description: "Track name", required: true },
      asset_id: { type: "string", description: "Asset ID of the audio file", required: true },
      volume: { type: "number", description: "Volume 0-1", required: false },
      start_seconds: { type: "number", description: "Start time in seconds", required: false },
    },
  },
  {
    name: "add_motion_graphic",
    description:
      "Add a motion graphic overlay segment to the timeline. These appear on top of the video at specified times.",
    parameters: {
      name: { type: "string", description: "Motion graphic name", required: true },
      type: {
        type: "string",
        description: "MG type",
        enum: [
          "logo-reveal",
          "interface-reveal",
          "chart",
          "transition",
          "counter",
          "screenshot",
          "logo-mark",
          "title-card",
          "custom",
        ],
        required: true,
      },
      start_seconds: { type: "number", description: "Start time in seconds", required: true },
      end_seconds: { type: "number", description: "End time in seconds", required: true },
      description: {
        type: "string",
        description: "What this motion graphic shows",
        required: true,
      },
    },
  },
  {
    name: "update_motion_graphic",
    description: "Update an existing motion graphic segment.",
    parameters: {
      mg_id: { type: "string", description: "Motion graphic ID", required: true },
      name: { type: "string", description: "New name", required: false },
      type: {
        type: "string",
        description: "New MG type",
        enum: [
          "logo-reveal",
          "interface-reveal",
          "chart",
          "transition",
          "counter",
          "screenshot",
          "logo-mark",
          "title-card",
          "custom",
        ],
        required: false,
      },
      start_seconds: { type: "number", description: "New start time in seconds", required: false },
      end_seconds: { type: "number", description: "New end time in seconds", required: false },
      description: { type: "string", description: "New description", required: false },
    },
  },
  {
    name: "remove_motion_graphic",
    description: "Remove a motion graphic segment from the timeline.",
    parameters: {
      mg_id: { type: "string", description: "Motion graphic ID to remove", required: true },
    },
  },
  {
    name: "list_scenes",
    description: "List all scenes in the current composition with their IDs, names, and elements.",
    parameters: {},
  },
  {
    name: "get_composition",
    description: "Get the full current video composition state.",
    parameters: {},
  },
];

/** Parse a tool call from the agent into a ToolAction for the store */
export function parseToolCall(
  toolName: string,
  args: Record<string, unknown>,
  fps: number = 30,
): ToolAction | null {
  switch (toolName) {
    case "add_scene": {
      const durationSec = (args.duration_seconds as number) || 3;
      const scene: Omit<Scene, "id"> = {
        name: (args.name as string) || "New Scene",
        type: (args.type as SceneType) || "content",
        startFrame: (args.start_frame as number) ?? 0,
        durationInFrames: Math.round(durationSec * fps),
        backgroundColor: (args.background_color as string) || "#12121a",
        elements: [],
      };
      return { type: "add-scene", scene };
    }
    case "update_scene": {
      const updates: Partial<Scene> = {};
      if (args.name) {
        updates.name = args.name as string;
      }
      if (args.duration_seconds) {
        updates.durationInFrames = Math.round((args.duration_seconds as number) * fps);
      }
      if (args.background_color) {
        updates.backgroundColor = args.background_color as string;
      }
      return { type: "update-scene", sceneId: args.scene_id as string, updates };
    }
    case "remove_scene":
      return { type: "remove-scene", sceneId: args.scene_id as string };
    case "add_text": {
      const animation: AnimationConfig | undefined = args.animation
        ? { type: args.animation as AnimationConfig["type"], durationInFrames: 20 }
        : { type: "fade-in", durationInFrames: 20 };
      const element: Omit<SceneElement, "id"> = {
        text: args.text as string,
        x: (args.x as number) ?? 960,
        y: (args.y as number) ?? 540,
        fontSize: (args.font_size as number) ?? 36,
        fontFamily: "Inter",
        fontWeight: (args.font_weight as number) ?? 500,
        color: (args.color as string) ?? "#ffffff",
        opacity: 1,
        animation,
      };
      return { type: "add-element", sceneId: args.scene_id as string, element };
    }
    case "update_text":
      return {
        type: "update-text",
        sceneId: args.scene_id as string,
        elementId: args.element_id as string,
        text: args.text as string,
      };
    case "update_element": {
      const updates: Partial<TextElement> = {};
      if (args.x !== undefined) {
        updates.x = args.x as number;
      }
      if (args.y !== undefined) {
        updates.y = args.y as number;
      }
      if (args.font_size !== undefined) {
        updates.fontSize = args.font_size as number;
      }
      if (args.color !== undefined) {
        updates.color = args.color as string;
      }
      if (args.opacity !== undefined) {
        updates.opacity = args.opacity as number;
      }
      if (args.animation) {
        updates.animation = {
          type: args.animation as AnimationConfig["type"],
          durationInFrames: 20,
        };
      }
      return {
        type: "update-element",
        sceneId: args.scene_id as string,
        elementId: args.element_id as string,
        updates,
      };
    }
    case "remove_element":
      return {
        type: "remove-element",
        sceneId: args.scene_id as string,
        elementId: args.element_id as string,
      };
    case "set_transition": {
      const durationSec = (args.duration_seconds as number) || 0.5;
      const transition: Transition = {
        type: (args.type as TransitionType) || "fade",
        durationInFrames: Math.round(durationSec * fps),
      };
      return { type: "set-transition", sceneId: args.scene_id as string, transition };
    }
    case "add_music": {
      const track: Omit<AudioTrack, "id"> = {
        assetId: args.asset_id as string,
        name: (args.name as string) || "Music",
        type: "music",
        startFrame: Math.round(((args.start_seconds as number) || 0) * fps),
        durationInFrames: 0, // will be set from asset
        volume: (args.volume as number) ?? 0.5,
      };
      return { type: "add-audio", track };
    }
    case "add_motion_graphic": {
      const mg: Omit<MotionGraphicSegment, "id"> = {
        name: (args.name as string) || "Motion Graphic",
        type: (args.type as MotionGraphicType) || "custom",
        startFrame: Math.round(((args.start_seconds as number) || 0) * fps),
        endFrame: Math.round(((args.end_seconds as number) || 3) * fps),
        description: (args.description as string) || "",
        elements: [],
      };
      return { type: "add-motion-graphic", mg };
    }
    case "update_motion_graphic": {
      const updates: Partial<MotionGraphicSegment> = {};
      if (args.name) {
        updates.name = args.name as string;
      }
      if (args.type) {
        updates.type = args.type as MotionGraphicType;
      }
      if (args.start_seconds !== undefined) {
        updates.startFrame = Math.round((args.start_seconds as number) * fps);
      }
      if (args.end_seconds !== undefined) {
        updates.endFrame = Math.round((args.end_seconds as number) * fps);
      }
      if (args.description) {
        updates.description = args.description as string;
      }
      return { type: "update-motion-graphic", mgId: args.mg_id as string, updates };
    }
    case "remove_motion_graphic":
      return { type: "remove-motion-graphic", mgId: args.mg_id as string };
    // list_scenes and get_composition are read-only — handled separately
    default:
      return null;
  }
}

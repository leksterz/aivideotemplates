/**
 * AVT Video Tools — OpenClaw Plugin
 *
 * Registers video editing tools that the LLM agent can call to manipulate
 * the Remotion video composition in the AVT editor.
 *
 * The plugin communicates with the frontend via a shared state file or
 * gateway events. Tool calls modify a JSON composition that the Remotion
 * player renders in real-time.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import { definePluginEntry } from "openclaw/plugin-sdk/core";

// ─── Composition State ──────────────────────────────────────────────

type SceneType = "intro" | "content" | "feature" | "testimonial" | "cta" | "outro" | "custom";
type TransitionType = "cut" | "fade" | "slide" | "wipe" | "zoom";
type AnimationType =
  | "fade-in"
  | "fade-out"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "scale"
  | "none";

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  opacity: number;
  animation?: { type: AnimationType; durationInFrames: number; delay?: number };
}

interface Scene {
  id: string;
  name: string;
  type: SceneType;
  durationInFrames: number;
  backgroundColor: string;
  elements: TextElement[];
  transition?: { type: TransitionType; durationInFrames: number };
}

interface VideoComposition {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  scenes: Scene[];
  audioTracks: unknown[];
  captions: unknown[];
  assets: unknown[];
  metadata: { createdAt: string; updatedAt: string };
}

function uid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// ─── State Persistence ──────────────────────────────────────────────

const STATE_DIR = process.env.AVT_STATE_DIR || path.join(process.cwd(), ".avt");
const STATE_FILE = path.join(STATE_DIR, "composition.json");

async function ensureStateDir() {
  await fs.mkdir(STATE_DIR, { recursive: true });
}

async function loadComposition(): Promise<VideoComposition> {
  try {
    const data = await fs.readFile(STATE_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    // Return default composition
    return createDefaultComposition();
  }
}

async function saveComposition(comp: VideoComposition): Promise<void> {
  await ensureStateDir();
  comp.metadata.updatedAt = now();
  await fs.writeFile(STATE_FILE, JSON.stringify(comp, null, 2), "utf-8");
}

function createDefaultComposition(): VideoComposition {
  return {
    id: uid(),
    name: "Untitled Video",
    width: 1920,
    height: 1080,
    fps: 30,
    scenes: [
      {
        id: uid(),
        name: "Intro",
        type: "intro",
        durationInFrames: 90,
        backgroundColor: "#0a0a0f",
        elements: [
          {
            id: uid(),
            text: "Your Brand Here",
            x: 960,
            y: 480,
            fontSize: 72,
            fontFamily: "Inter",
            fontWeight: 700,
            color: "#ffffff",
            opacity: 1,
            animation: { type: "fade-in", durationInFrames: 20 },
          },
          {
            id: uid(),
            text: "Tagline goes here",
            x: 960,
            y: 580,
            fontSize: 28,
            fontFamily: "Inter",
            fontWeight: 400,
            color: "#94a3b8",
            opacity: 1,
            animation: { type: "fade-in", durationInFrames: 20, delay: 10 },
          },
        ],
      },
    ],
    audioTracks: [],
    captions: [],
    assets: [],
    metadata: { createdAt: now(), updatedAt: now() },
  };
}

// ─── JSON Result Helper ─────────────────────────────────────────────

function jsonResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    details: payload,
  };
}

// ─── Plugin Definition ──────────────────────────────────────────────

export default definePluginEntry({
  id: "avt-video-tools",
  name: "AVT Video Tools",
  description: "Video composition editing tools for the AVT video editor",

  register(api) {
    api.logger.info("avt-video-tools: registering video editing tools");

    // ── Tool: get_composition ─────────────────────────────────────
    api.registerTool(
      {
        name: "get_composition",
        label: "Get Composition",
        description:
          "Get the full current video composition state including all scenes, elements, audio tracks, and captions. Call this first to understand what's in the video before making changes.",
        parameters: Type.Object({}),
        async execute() {
          const comp = await loadComposition();
          return jsonResult(comp);
        },
      },
      { name: "get_composition" },
    );

    // ── Tool: list_scenes ─────────────────────────────────────────
    api.registerTool(
      {
        name: "list_scenes",
        label: "List Scenes",
        description:
          "List all scenes in the video with their IDs, names, types, durations, element counts, and transitions.",
        parameters: Type.Object({}),
        async execute() {
          const comp = await loadComposition();
          const scenes = comp.scenes.map((s, i) => ({
            index: i,
            id: s.id,
            name: s.name,
            type: s.type,
            durationSeconds: s.durationInFrames / comp.fps,
            elementCount: s.elements.length,
            elements: s.elements.map((el) => ({
              id: el.id,
              text: el.text?.substring(0, 50),
              fontSize: el.fontSize,
              color: el.color,
            })),
            transition: s.transition
              ? `${s.transition.type} (${(s.transition.durationInFrames / comp.fps).toFixed(1)}s)`
              : "none",
            backgroundColor: s.backgroundColor,
          }));
          return jsonResult({
            totalScenes: scenes.length,
            totalDurationSeconds:
              comp.scenes.reduce((a, s) => a + s.durationInFrames, 0) / comp.fps,
            scenes,
          });
        },
      },
      { name: "list_scenes" },
    );

    // ── Tool: add_scene ───────────────────────────────────────────
    api.registerTool(
      {
        name: "add_scene",
        label: "Add Scene",
        description:
          "Add a new scene to the video composition. Scenes are the building blocks — each is a segment of the video with its own background, text, images, and animations.",
        parameters: Type.Object({
          name: Type.String({ description: "Scene name (e.g. 'Product Demo', 'Pricing')" }),
          type: Type.Unsafe<SceneType>({
            type: "string",
            enum: ["intro", "content", "feature", "testimonial", "cta", "outro", "custom"],
            description: "Scene type",
          }),
          duration_seconds: Type.Number({
            description: "Duration in seconds (e.g. 3, 5, 10)",
            default: 4,
          }),
          background_color: Type.Optional(
            Type.String({ description: "Background hex color (e.g. #1a1a2e)" }),
          ),
          insert_at: Type.Optional(
            Type.Number({ description: "Position index to insert at (0-based). Omit to append." }),
          ),
        }),
        async execute(_id, args) {
          const params = args as Record<string, unknown>;
          const comp = await loadComposition();
          const newScene: Scene = {
            id: uid(),
            name: (params.name as string) || "New Scene",
            type: (params.type as SceneType) || "content",
            durationInFrames: Math.round(((params.duration_seconds as number) || 4) * comp.fps),
            backgroundColor: (params.background_color as string) || "#12121a",
            elements: [],
          };
          const insertAt = params.insert_at as number | undefined;
          if (insertAt !== undefined && insertAt >= 0 && insertAt <= comp.scenes.length) {
            comp.scenes.splice(insertAt, 0, newScene);
          } else {
            comp.scenes.push(newScene);
          }
          await saveComposition(comp);
          return jsonResult({
            ok: true,
            sceneId: newScene.id,
            name: newScene.name,
            index: comp.scenes.indexOf(newScene),
          });
        },
      },
      { name: "add_scene" },
    );

    // ── Tool: update_scene ────────────────────────────────────────
    api.registerTool(
      {
        name: "update_scene",
        label: "Update Scene",
        description: "Update properties of an existing scene (name, duration, background color).",
        parameters: Type.Object({
          scene_id: Type.String({ description: "Scene ID to update" }),
          name: Type.Optional(Type.String({ description: "New scene name" })),
          duration_seconds: Type.Optional(Type.Number({ description: "New duration in seconds" })),
          background_color: Type.Optional(Type.String({ description: "New background hex color" })),
          type: Type.Optional(
            Type.Unsafe<SceneType>({
              type: "string",
              enum: ["intro", "content", "feature", "testimonial", "cta", "outro", "custom"],
              description: "New scene type",
            }),
          ),
        }),
        async execute(_id, args) {
          const params = args as Record<string, unknown>;
          const comp = await loadComposition();
          const scene = comp.scenes.find((s) => s.id === params.scene_id);
          if (!scene) return jsonResult({ error: `Scene ${params.scene_id} not found` });
          if (params.name) scene.name = params.name as string;
          if (params.duration_seconds)
            scene.durationInFrames = Math.round((params.duration_seconds as number) * comp.fps);
          if (params.background_color) scene.backgroundColor = params.background_color as string;
          if (params.type) scene.type = params.type as SceneType;
          await saveComposition(comp);
          return jsonResult({ ok: true, scene: { id: scene.id, name: scene.name } });
        },
      },
      { name: "update_scene" },
    );

    // ── Tool: remove_scene ────────────────────────────────────────
    api.registerTool(
      {
        name: "remove_scene",
        label: "Remove Scene",
        description: "Remove a scene from the composition by its ID.",
        parameters: Type.Object({
          scene_id: Type.String({ description: "Scene ID to remove" }),
        }),
        async execute(_id, args) {
          const params = args as Record<string, unknown>;
          const comp = await loadComposition();
          const idx = comp.scenes.findIndex((s) => s.id === params.scene_id);
          if (idx === -1) return jsonResult({ error: `Scene ${params.scene_id} not found` });
          if (comp.scenes.length <= 1) return jsonResult({ error: "Cannot remove the last scene" });
          const removed = comp.scenes.splice(idx, 1)[0];
          await saveComposition(comp);
          return jsonResult({ ok: true, removedScene: removed.name });
        },
      },
      { name: "remove_scene" },
    );

    // ── Tool: add_text ────────────────────────────────────────────
    api.registerTool(
      {
        name: "add_text",
        label: "Add Text",
        description:
          "Add a text element to a scene. Text is positioned at (x, y) coordinates on a 1920x1080 canvas. Center is (960, 540).",
        parameters: Type.Object({
          scene_id: Type.String({ description: "Scene to add text to" }),
          text: Type.String({ description: "The text content (supports \\n for line breaks)" }),
          x: Type.Optional(Type.Number({ description: "X position (center=960)", default: 960 })),
          y: Type.Optional(Type.Number({ description: "Y position (center=540)", default: 540 })),
          font_size: Type.Optional(
            Type.Number({ description: "Font size in pixels", default: 36 }),
          ),
          font_weight: Type.Optional(
            Type.Number({ description: "Font weight 100-900", default: 500 }),
          ),
          color: Type.Optional(Type.String({ description: "Text color hex", default: "#ffffff" })),
          animation: Type.Optional(
            Type.Unsafe<AnimationType>({
              type: "string",
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
              description: "Entry animation",
              default: "fade-in",
            }),
          ),
        }),
        async execute(_id, args) {
          const params = args as Record<string, unknown>;
          const comp = await loadComposition();
          const scene = comp.scenes.find((s) => s.id === params.scene_id);
          if (!scene) return jsonResult({ error: `Scene ${params.scene_id} not found` });
          const el: TextElement = {
            id: uid(),
            text: (params.text as string) || "",
            x: (params.x as number) ?? 960,
            y: (params.y as number) ?? 540,
            fontSize: (params.font_size as number) ?? 36,
            fontFamily: "Inter",
            fontWeight: (params.font_weight as number) ?? 500,
            color: (params.color as string) ?? "#ffffff",
            opacity: 1,
            animation: {
              type: (params.animation as AnimationType) ?? "fade-in",
              durationInFrames: 20,
            },
          };
          scene.elements.push(el);
          await saveComposition(comp);
          return jsonResult({ ok: true, elementId: el.id, scene: scene.name });
        },
      },
      { name: "add_text" },
    );

    // ── Tool: update_text ─────────────────────────────────────────
    api.registerTool(
      {
        name: "update_text",
        label: "Update Text",
        description: "Update the text content or properties of an existing text element.",
        parameters: Type.Object({
          scene_id: Type.String({ description: "Scene containing the element" }),
          element_id: Type.String({ description: "Element ID to update" }),
          text: Type.Optional(Type.String({ description: "New text content" })),
          x: Type.Optional(Type.Number({ description: "New X position" })),
          y: Type.Optional(Type.Number({ description: "New Y position" })),
          font_size: Type.Optional(Type.Number({ description: "New font size" })),
          font_weight: Type.Optional(Type.Number({ description: "New font weight" })),
          color: Type.Optional(Type.String({ description: "New color hex" })),
          opacity: Type.Optional(Type.Number({ description: "Opacity 0-1" })),
          animation: Type.Optional(
            Type.Unsafe<AnimationType>({
              type: "string",
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
              description: "New animation",
            }),
          ),
        }),
        async execute(_id, args) {
          const params = args as Record<string, unknown>;
          const comp = await loadComposition();
          const scene = comp.scenes.find((s) => s.id === params.scene_id);
          if (!scene) return jsonResult({ error: `Scene ${params.scene_id} not found` });
          const el = scene.elements.find((e) => e.id === params.element_id);
          if (!el) return jsonResult({ error: `Element ${params.element_id} not found` });
          if (params.text !== undefined) el.text = params.text as string;
          if (params.x !== undefined) el.x = params.x as number;
          if (params.y !== undefined) el.y = params.y as number;
          if (params.font_size !== undefined) el.fontSize = params.font_size as number;
          if (params.font_weight !== undefined) el.fontWeight = params.font_weight as number;
          if (params.color !== undefined) el.color = params.color as string;
          if (params.opacity !== undefined) el.opacity = params.opacity as number;
          if (params.animation !== undefined) {
            el.animation = { type: params.animation as AnimationType, durationInFrames: 20 };
          }
          await saveComposition(comp);
          return jsonResult({ ok: true, element: { id: el.id, text: el.text?.substring(0, 50) } });
        },
      },
      { name: "update_text" },
    );

    // ── Tool: remove_element ──────────────────────────────────────
    api.registerTool(
      {
        name: "remove_element",
        label: "Remove Element",
        description: "Remove an element from a scene.",
        parameters: Type.Object({
          scene_id: Type.String({ description: "Scene containing the element" }),
          element_id: Type.String({ description: "Element ID to remove" }),
        }),
        async execute(_id, args) {
          const params = args as Record<string, unknown>;
          const comp = await loadComposition();
          const scene = comp.scenes.find((s) => s.id === params.scene_id);
          if (!scene) return jsonResult({ error: `Scene ${params.scene_id} not found` });
          const idx = scene.elements.findIndex((e) => e.id === params.element_id);
          if (idx === -1) return jsonResult({ error: `Element ${params.element_id} not found` });
          scene.elements.splice(idx, 1);
          await saveComposition(comp);
          return jsonResult({ ok: true });
        },
      },
      { name: "remove_element" },
    );

    // ── Tool: set_transition ──────────────────────────────────────
    api.registerTool(
      {
        name: "set_transition",
        label: "Set Transition",
        description: "Set the transition effect between a scene and the next scene.",
        parameters: Type.Object({
          scene_id: Type.String({ description: "Scene ID" }),
          type: Type.Unsafe<TransitionType>({
            type: "string",
            enum: ["cut", "fade", "slide", "wipe", "zoom"],
            description: "Transition type",
          }),
          duration_seconds: Type.Optional(
            Type.Number({ description: "Transition duration in seconds", default: 0.5 }),
          ),
        }),
        async execute(_id, args) {
          const params = args as Record<string, unknown>;
          const comp = await loadComposition();
          const scene = comp.scenes.find((s) => s.id === params.scene_id);
          if (!scene) return jsonResult({ error: `Scene ${params.scene_id} not found` });
          const tType = (params.type as TransitionType) || "fade";
          if (tType === "cut") {
            scene.transition = undefined;
          } else {
            scene.transition = {
              type: tType,
              durationInFrames: Math.round(((params.duration_seconds as number) || 0.5) * comp.fps),
            };
          }
          await saveComposition(comp);
          return jsonResult({ ok: true, transition: scene.transition ?? "cut" });
        },
      },
      { name: "set_transition" },
    );

    // ── Tool: reorder_scenes ──────────────────────────────────────
    api.registerTool(
      {
        name: "reorder_scenes",
        label: "Reorder Scenes",
        description: "Move a scene to a different position in the timeline.",
        parameters: Type.Object({
          scene_id: Type.String({ description: "Scene ID to move" }),
          new_index: Type.Number({ description: "New position index (0-based)" }),
        }),
        async execute(_id, args) {
          const params = args as Record<string, unknown>;
          const comp = await loadComposition();
          const oldIdx = comp.scenes.findIndex((s) => s.id === params.scene_id);
          if (oldIdx === -1) return jsonResult({ error: `Scene ${params.scene_id} not found` });
          const newIdx = Math.max(
            0,
            Math.min((params.new_index as number) || 0, comp.scenes.length - 1),
          );
          const [scene] = comp.scenes.splice(oldIdx, 1);
          comp.scenes.splice(newIdx, 0, scene);
          await saveComposition(comp);
          return jsonResult({ ok: true, scene: scene.name, newIndex: newIdx });
        },
      },
      { name: "reorder_scenes" },
    );

    // ── Tool: set_composition_settings ────────────────────────────
    api.registerTool(
      {
        name: "set_composition_settings",
        label: "Set Composition Settings",
        description: "Update global video settings like name, resolution, or FPS.",
        parameters: Type.Object({
          name: Type.Optional(Type.String({ description: "Video project name" })),
          width: Type.Optional(Type.Number({ description: "Canvas width (default 1920)" })),
          height: Type.Optional(Type.Number({ description: "Canvas height (default 1080)" })),
          fps: Type.Optional(Type.Number({ description: "Frames per second (default 30)" })),
        }),
        async execute(_id, args) {
          const params = args as Record<string, unknown>;
          const comp = await loadComposition();
          if (params.name) comp.name = params.name as string;
          if (params.width) comp.width = params.width as number;
          if (params.height) comp.height = params.height as number;
          if (params.fps) comp.fps = params.fps as number;
          await saveComposition(comp);
          return jsonResult({
            ok: true,
            name: comp.name,
            resolution: `${comp.width}x${comp.height}`,
            fps: comp.fps,
          });
        },
      },
      { name: "set_composition_settings" },
    );

    api.logger.info("avt-video-tools: 11 video editing tools registered");
  },
});

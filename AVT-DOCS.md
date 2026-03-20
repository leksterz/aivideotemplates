# AVT Video Editor — Technical Documentation

**aivideotemplates.com** — B2B SaaS video editor built on Remotion + OpenClaw agent framework.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (localhost:3001)                  │
│  ┌──────────┐  ┌──────────────────┐  ┌───────────┐             │
│  │ Asset    │  │ VideoPreview     │  │ Chat      │             │
│  │ Panel    │  │ (Remotion Player)│  │ Panel     │             │
│  │          │  ├──────────────────┤  │ (AI Chat) │             │
│  │ Scenes   │  │ Timeline         │  │           │             │
│  │ Assets   │  │ (AE-style layers)│  │ Animated  │             │
│  │ Elements │  │                  │  │ Orb UI    │             │
│  └────┬─────┘  └────────┬─────────┘  └─────┬─────┘             │
│       │                 │                   │                   │
│       └────────┬────────┘                   │                   │
│                ▼                            │                   │
│       ┌────────────────┐                    │                   │
│       │  Zustand Stores │                   │                   │
│       │  - VideoStore   │                   │                   │
│       │  - ChatStore    │                   │                   │
│       └───────┬────────┘                    │                   │
└───────────────┼─────────────────────────────┼───────────────────┘
                │                             │
         PUT /api/composition          WebSocket ws://:19001
         GET /api/composition          (OpenClaw Protocol v3)
         POST /api/upload                     │
                │                             │
    ┌───────────▼───────────┐     ┌───────────▼───────────┐
    │ Composition API       │     │ OpenClaw Gateway      │
    │ (Node HTTP :3002)     │     │ (ws://localhost:19001) │
    │                       │     │                       │
    │ GET/PUT composition   │     │ Claude Sonnet 4.5     │
    │ POST file uploads     │     │ + AVT Video Tools     │
    │                       │     │   (11 tools)          │
    └───────────┬───────────┘     └───────────┬───────────┘
                │                             │
                ▼                             ▼
        .avt/composition.json ◄───────────────┘
        ui/public/uploads/*
```

## Services & Ports

| Service          | Port  | Purpose                                             |
| ---------------- | ----- | --------------------------------------------------- |
| Vite Dev Server  | 3001  | React frontend                                      |
| Composition API  | 3002  | REST bridge to .avt/composition.json + file uploads |
| OpenClaw Gateway | 19001 | WebSocket for AI agent chat                         |

## Quick Start

```bash
# 1. Set your API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# 2. Start all services
./scripts/avt-dev.sh

# Or start individually:
node scripts/avt-composition-server.mjs &   # Port 3002
cd ui && npx vite --port 3001 &             # Port 3001
node openclaw.mjs --dev gateway run --bind loopback --port 19001 --force &
```

Open http://localhost:3001

## Data Model

### VideoComposition (source of truth)

```
VideoComposition
├── id, name, width, height, fps
├── scenes: Scene[]
│   ├── id, name, type, startFrame, durationInFrames
│   ├── backgroundColor
│   ├── elements: (TextElement | ImageElement | VideoElement)[]
│   └── transition?: { type, durationInFrames }
├── motionGraphics: MotionGraphicSegment[]
│   └── id, name, type, startFrame, endFrame, description
├── audioTracks: AudioTrack[]
│   └── assetId, name, type, startFrame, durationInFrames, volume, fadeIn, fadeOut
├── captions: CaptionSegment[]
├── assets: Asset[]
│   └── id, name, type, url, thumbnailUrl, durationInFrames, metadata
├── layerOrder: string[]    ← z-order: "scene:{id}" | "mg:{id}" | "audio:{id}"
└── metadata: { createdAt, updatedAt }
```

### Layer System

The timeline uses an After Effects-style layer model:

- **Every item** (scene, motion graphic, audio track) is an independent layer
- **layerOrder** array controls z-order (index 0 = background, last = foreground)
- **startFrame** is absolute — layers can overlap in time
- **getTotalDurationInFrames()** scans all layers for the furthest end point
- Layers can be reordered (up/down arrows), moved horizontally (drag bar), and deleted

### Element Types

| Type         | Key Fields                                             | Rendered By                                 |
| ------------ | ------------------------------------------------------ | ------------------------------------------- |
| TextElement  | text, x, y, fontSize, fontFamily, color, animation     | TextElementRenderer                         |
| ImageElement | assetId, x, y, width, height, opacity                  | ImageElementRenderer                        |
| VideoElement | assetId, x, y, width, height, startFrom, endAt, volume | VideoElementRenderer (Video/OffthreadVideo) |

### Scene Types

`intro` | `content` | `feature` | `testimonial` | `cta` | `outro` | `custom`

### Dimension Presets

- 1920x1080 (16:9) — landscape
- 1080x1920 (9:16) — portrait/mobile
- 1080x1080 (1:1) — square
- 1280x720 (16:9) — 720p
- 3840x2160 (4K)

## State Management

### Zustand Stores

**VideoStore** (`ui/src/store/video-store.ts`):

- Composition state (scenes, elements, assets, layerOrder)
- Selection state (selectedSceneId, selectedElementId)
- Playback state (currentFrame, isPlaying)
- 38+ action methods for manipulation

**ChatStore** (`ui/src/store/chat-store.ts`):

- messages[], connectionStatus, isAgentThinking, sessionKey

### Bidirectional Sync

```
UI Edit → Zustand → auto-save (PUT /api/composition, 300ms debounce)
Agent Edit → .avt/composition.json → poll (1.5s) → Zustand → Remotion re-render
```

A `suppressSave` flag prevents feedback loops:

- Sync-driven updates: suppressSave=true → skip auto-save
- UI-driven updates: suppressSave=false → save normally

### Playback Sync (Player ↔ Store)

- **During playback**: Remotion Player drives frame clock → store follows via `frameupdate`
- **During seeking** (timeline click): Store drives → `player.seekTo()` syncs Player
- `seekingFromStore` flag prevents feedback loop

## Rendering Pipeline

### VideoComposition.tsx (Layer-Based Compositor)

Iterates `layerOrder` bottom-to-top. Each layer renders as a `<Sequence>`:

```tsx
for (const key of layerOrder) {
  if (key starts with "scene:") → <Sequence from={startFrame}><SceneRenderer /></Sequence>
  if (key starts with "mg:")    → <Sequence from={startFrame}><MotionGraphicRenderer /></Sequence>
  if (key starts with "audio:") → <Sequence from={startFrame}><Audio /></Sequence>
}
```

### Video Source Resolution

- `/uploads/*` or `/videos/*` → served by Vite (persistent)
- `http://...` → direct URL
- `blob:` URLs → uses `<Video>` instead of `<OffthreadVideo>` (worker limitation)

### Audio Rendering

Audio tracks render as `<Audio>` inside `<Sequence>` with:

- Volume control (0-1)
- Optional fade in/out (linear ramp over N frames)
- Positioned by `startFrame` — dragging the bar on timeline updates this

## File Upload Flow

```
User drops file → processFiles():
  1. Probe duration via blob URL (<video>.loadedmetadata)
  2. Upload to POST /api/upload → saved to ui/public/uploads/{uuid}.ext
  3. Add asset with persistent /uploads/... URL + probed durationInFrames
```

On page load, `cleanStaleBlobUrls()` strips any leftover `blob:` URLs from compositions.

## AI Agent Integration

### Gateway Connection

```
ChatPanel → GatewayClient (WebSocket Protocol v3)
  → connect { client: "openclaw-control-ui", role: "operator", scopes: [...] }
  → chat.send { sessionKey, idempotencyKey, message }
  ← events: chat/agent { state: "delta"|"final"|"error", message }
```

### AVT Video Tools Plugin (11 tools)

| Tool                     | Description                   |
| ------------------------ | ----------------------------- |
| get_composition          | Read full composition state   |
| list_scenes              | List all scenes with details  |
| add_scene                | Create new scene              |
| update_scene             | Modify scene properties       |
| remove_scene             | Delete a scene                |
| add_text                 | Add text element to scene     |
| update_text              | Modify text content/style     |
| remove_element           | Delete element from scene     |
| set_transition           | Set scene-to-scene transition |
| reorder_scenes           | Move scene position           |
| set_composition_settings | Update name/resolution/fps    |

Tools read/write `.avt/composition.json` directly. The sync poll picks up changes.

## Chat UI

### Design System

- Animated orb avatar (5-circle morphing blob, CSS animations)
- Message bubbles: user = white card with shadow, assistant = plain text
- Typing indicator: 3 bouncing dots
- Composer: rounded-3xl card with mic/attach/brain buttons
- Stone color palette, 6-layer premium shadows

### Animations

- `user-msg-enter`: bounce-up (0.5s cubic-bezier overshoot)
- `assistant-msg-enter`: fade-in slide-up (0.3s)
- `orb-orbit-1..5`: floating circles in orb (4-7s cycles)
- `orb-intro`: drop-in with blur (2s)
- `composer-intro`: slide-up (2s)
- `typing-dot`: bounce (1.4s staggered)
- `blur-reveal`: per-word streaming text

## Demo Compositions

### Apten YC S24 Demo (`ui/src/remotion/AptenDemo.tsx`)

- Transcript-driven motion graphics over founder video
- 10 MG segments synced to speech timestamps
- Video dims to 15% during full-screen graphics
- Fade transitions between video and graphics

### OpenClawd Demo (`ui/src/remotion/OpenClawdVideo.tsx`)

- 8 hardcoded scenes showcasing the platform
- Terminal install → Chat UI → Provider switch → MCP catalog → etc.

Toggle between demos via the mode button in playback controls.

## Key Files Reference

| File                                        | Purpose                               |
| ------------------------------------------- | ------------------------------------- |
| `ui/src/types/video.ts`                     | Core data model                       |
| `ui/src/store/video-store.ts`               | Video composition state + actions     |
| `ui/src/store/chat-store.ts`                | Chat message state                    |
| `ui/src/components/Editor.tsx`              | Main layout + sync orchestration      |
| `ui/src/components/VideoPreview.tsx`        | Remotion Player + controls            |
| `ui/src/components/Timeline.tsx`            | AE-style layer timeline               |
| `ui/src/components/ChatPanel.tsx`           | AI chat with animated orb UI          |
| `ui/src/components/AssetPanel.tsx`          | Asset/scene/element management        |
| `ui/src/components/Toolbar.tsx`             | Top bar with dimension/fps pickers    |
| `ui/src/remotion/VideoComposition.tsx`      | Layer-based Remotion compositor       |
| `ui/src/remotion/SceneRenderer.tsx`         | Renders individual scene elements     |
| `ui/src/remotion/MotionGraphicRenderer.tsx` | 8 MG types with animations            |
| `ui/src/remotion/AptenDemo.tsx`             | Apten YC demo composition             |
| `ui/src/gateway/client.ts`                  | OpenClaw WebSocket client             |
| `ui/src/gateway/sync.ts`                    | Composition polling + hydration       |
| `ui/src/tools/video-tools.ts`               | Tool definitions + parseToolCall      |
| `ui/src/components/chat/animated-orb.tsx`   | Morphing orb component                |
| `scripts/avt-composition-server.mjs`        | HTTP server for composition + uploads |
| `scripts/avt-dev.sh`                        | Dev environment startup               |
| `openclaw.config.json`                      | Gateway configuration                 |
| `extensions/avt-video-tools/`               | AI agent tool plugin                  |
| `.avt/composition.json`                     | Runtime composition state             |
| `ui/public/uploads/`                        | Persistent uploaded assets            |

## Environment Variables

| Variable                 | Required               | Purpose                     |
| ------------------------ | ---------------------- | --------------------------- |
| `ANTHROPIC_API_KEY`      | Yes (for AI chat)      | Claude API key              |
| `AVT_STATE_DIR`          | No (default: `.avt/`)  | Composition state directory |
| `OPENCLAW_CONFIG_PATH`   | Auto-set by dev script | Gateway config path         |
| `OPENCLAW_SKIP_CHANNELS` | Auto-set               | Skip messaging channels     |

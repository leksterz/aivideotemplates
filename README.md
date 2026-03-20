# AVT — AI Video Templates

**Create marketing videos with AI.** A browser-based video editor powered by Remotion and an AI agent that can edit your timeline through natural language.

## What is AVT?

AVT is a B2B SaaS video editor that lets founders and marketers create professional marketing videos through a template + chat-based editing workflow. Upload assets, arrange them on an After Effects-style timeline, and use the AI chat to make edits — add scenes, change text, set transitions, adjust timing — all in real-time.

### Key Features

- **Remotion-powered preview** — Real-time video composition rendering in the browser
- **AI chat editor** — Natural language video editing via Claude Sonnet 4.5
- **AE-style timeline** — Layer-based compositing with z-ordering, drag-to-move, and unlimited layers
- **Multi-format support** — Video, image, audio layers with proper compositing
- **Dimension presets** — 16:9, 9:16 (mobile), 1:1 (square), 4K
- **Persistent uploads** — Files stored server-side with stable URLs
- **Bidirectional sync** — UI edits and AI edits both update the same composition in real-time

## Quick Start

```bash
# Clone
git clone https://github.com/leksterz/aivideotemplates.git
cd aivideotemplates

# Set your API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# Start all services (gateway, composition API, Vite dev server)
./scripts/avt-dev.sh
```

Open **http://localhost:3001**

## Architecture

```
Browser (:3001)              Composition API (:3002)         Gateway (:19001)
┌─────────────────┐          ┌──────────────────┐           ┌─────────────────┐
│ React + Remotion │ ◄──────► │ .avt/composition │ ◄────────► │ Claude Sonnet   │
│ Zustand stores   │  sync    │ .json            │  tools     │ + Video Tools   │
│ Timeline + Chat  │          │ File uploads     │            │ (11 tools)      │
└─────────────────┘          └──────────────────┘           └─────────────────┘
```

The composition JSON file is the single source of truth. Both the UI and the AI agent read/write to it, with polling-based sync keeping everything in lockstep.

## Tech Stack

| Layer        | Technology                                             |
| ------------ | ------------------------------------------------------ |
| Frontend     | React 18, Remotion 4, Zustand, Tailwind CSS            |
| Video Engine | Remotion Player + layer-based compositor               |
| AI Agent     | OpenClaw gateway + Claude Sonnet 4.5                   |
| Backend      | Node.js HTTP server (composition state + file uploads) |
| Dev Server   | Vite 6 with HMR                                        |

## Project Structure

```
ui/src/
├── components/        # Editor, Timeline, VideoPreview, ChatPanel, AssetPanel, Toolbar
├── remotion/          # VideoComposition, SceneRenderer, MotionGraphicRenderer, demos
├── store/             # video-store.ts (composition state), chat-store.ts
├── gateway/           # WebSocket client, composition sync
├── tools/             # AI tool definitions
├── types/             # TypeScript data model
└── components/chat/   # Animated orb UI

extensions/avt-video-tools/   # OpenClaw plugin with 11 video editing tools
scripts/                      # Dev startup, composition API server
```

## Documentation

See [AVT-DOCS.md](./AVT-DOCS.md) for comprehensive technical documentation covering:

- Data model and layer system
- Bidirectional sync mechanism
- Rendering pipeline
- AI agent integration
- File upload flow
- All component and file references

## License

MIT

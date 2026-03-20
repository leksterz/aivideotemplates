/** OpenClawd video theme — dark + amber accent */

export const colors = {
  bg: "#0c0a09",
  surface: "#1c1917",
  border: "#292524",
  amber: "#fbbf24",
  amberDim: "#92400e",
  white: "#fafaf9",
  muted: "#a8a29e",
  dim: "#78716c",
  green: "#22c55e",
  red: "#ef4444",
  blue: "#3b82f6",
  purple: "#a855f7",
  cyan: "#06b6d4",
  pink: "#ec4899",
} as const;

export const fonts = {
  ui: "'Inter', system-ui, sans-serif",
  code: "'SF Mono', 'Fira Code', 'Consolas', monospace",
  brand: "'Georgia', 'Times New Roman', serif",
} as const;

export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 700;
export const VIDEO_FPS = 30;

// Scene durations in frames
export const SCENE_FRAMES = {
  terminal: 120,
  homeScreen: 150,
  chat: 160,
  providerSwitch: 130,
  mcpCatalog: 140,
  messaging: 120,
  logoComo: 180,
  githubCta: 120,
} as const;

export const TOTAL_FRAMES = Object.values(SCENE_FRAMES).reduce((a, b) => a + b, 0); // 1120 = ~37.3s

// Apten demo constants (re-exported from AptenDemo for convenience)
export const APTEN_FPS = 30;
export const APTEN_TOTAL_FRAMES = 1376;
export const APTEN_WIDTH = 1080;
export const APTEN_HEIGHT = 700;

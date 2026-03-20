import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { AppWindow } from "../components/AppWindow";
import { SceneTransition } from "../components/SceneTransition";
import { colors, fonts } from "../theme";

const COMMAND = "npx openclawd-cli";
const ASCII_LOGO = [
  "  ___  ____  _____ _   _  ____ _        ___        ______  ",
  " / _ \\|  _ \\| ____| \\ | |/ ___| |      / \\ \\      / /  _ \\ ",
  "| | | | |_) |  _| |  \\| | |   | |     / _ \\ \\ /\\ / /| | | |",
  "| |_| |  __/| |___| |\\  | |___| |___ / ___ \\ V  V / | |_| |",
  " \\___/|_|   |_____|_| \\_|\\____|_____/_/   \\_\\_/\\_/  |____/ ",
];
const SERVER_LINES = [
  { text: "openclawd v2.4.0 — AI Desktop Agent", color: colors.amber },
  { text: "├─ Claude Code SDK v1.2.0", color: colors.muted },
  { text: "├─ OpenCode SDK v0.8.0", color: colors.muted },
  { text: "├─ 20+ providers loaded, 80+ models available", color: colors.green },
  { text: "│  Opus 4.6 · Sonnet 4.5 · GPT-5.3 · Gemini 3 · DeepSeek V3", color: colors.dim },
  { text: "│  Llama 4 · MiniMax · Ollama local models", color: colors.dim },
  { text: "├─ 6 MCP servers connected", color: colors.green },
  { text: "└─ Opening desktop app on :3001", color: colors.amber },
];

export const TerminalInstall: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slide-in with 3D perspective
  const slideIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
    durationInFrames: 20,
  });
  const rotateX = interpolate(slideIn, [0, 1], [20, 0]);
  const rotateY = Math.sin(frame * 0.05) * 1.5;
  const translateY = interpolate(slideIn, [0, 1], [80, 0]);

  // Typing animation: 1 char per frame after frame 10
  const typingStart = 10;
  const charsTyped = Math.max(0, Math.min(frame - typingStart, COMMAND.length));
  const commandText = COMMAND.slice(0, charsTyped);
  const showCursor = frame < typingStart + COMMAND.length + 5 && frame % 16 < 10;

  // ASCII logo appears after typing
  const logoStart = typingStart + COMMAND.length + 8;
  const showLogo = frame >= logoStart;
  const logoOpacity = showLogo
    ? interpolate(frame, [logoStart, logoStart + 10], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  // Server lines appear progressively
  const linesStart = logoStart + 15;

  return (
    <SceneTransition durationInFrames={120}>
      <div
        style={{
          width: "92%",
          height: "88%",
          perspective: 1200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${translateY}px)`,
            transformStyle: "preserve-3d",
          }}
        >
          <AppWindow title="Terminal">
            <div
              style={{
                padding: "16px 20px",
                fontFamily: fonts.code,
                fontSize: 13,
                lineHeight: 1.6,
                color: colors.white,
                background: colors.bg,
                height: "100%",
                overflow: "hidden",
              }}
            >
              {/* Prompt + typed command */}
              <div>
                <span style={{ color: colors.green }}>~ </span>
                <span style={{ color: colors.amber }}>$ </span>
                <span>{commandText}</span>
                {showCursor && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 16,
                      background: colors.amber,
                      marginLeft: 1,
                      verticalAlign: "middle",
                    }}
                  />
                )}
              </div>

              {/* ASCII Logo */}
              {showLogo && (
                <div style={{ opacity: logoOpacity, marginTop: 8 }}>
                  {ASCII_LOGO.map((line, i) => (
                    <div
                      key={i}
                      style={{
                        color: colors.amber,
                        fontSize: 8.5,
                        lineHeight: 1.15,
                        whiteSpace: "pre",
                      }}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              )}

              {/* Server output lines */}
              <div style={{ marginTop: 12 }}>
                {SERVER_LINES.map((line, i) => {
                  const lineFrame = linesStart + i * 6;
                  if (frame < lineFrame) {
                    return null;
                  }
                  const lineOpacity = interpolate(frame, [lineFrame, lineFrame + 4], [0, 1], {
                    extrapolateRight: "clamp",
                  });
                  return (
                    <div key={i} style={{ opacity: lineOpacity, color: line.color, fontSize: 12 }}>
                      {line.text}
                    </div>
                  );
                })}
              </div>
            </div>
          </AppWindow>
        </div>
      </div>
    </SceneTransition>
  );
};

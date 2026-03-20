import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { AppWindow } from "../components/AppWindow";
import { SceneTransition } from "../components/SceneTransition";
import { colors, fonts } from "../theme";

const SIDEBAR_ITEMS = [
  { label: "MCP Integration", active: false },
  { label: "Code Review", active: true },
  { label: "Database Migration", active: false },
  { label: "Deploy Pipeline", active: false },
  { label: "API Endpoints", active: false },
];

const STEPS = [
  { label: "Reading codebase", done: true },
  { label: "Security analysis", done: true },
  { label: "Applying fixes", done: true },
  { label: "Creating PR", done: false },
];

const TOOL_CALLS = [
  { name: "filesystem.read", status: "done" },
  { name: "bash.exec", status: "done" },
  { name: "github.create_pr", status: "running" },
];

const RESPONSE_LINES = [
  "I've reviewed your API code and found several",
  "security concerns that should be addressed:",
  "",
  "1. **Rate Limiting** — No rate limiting on",
  "   /api/auth endpoints. Adding express-rate-limit.",
  "",
  "2. **SQL Injection** — Raw query in getUserById().",
  "   Switching to parameterized queries.",
  "",
  "3. **Input Validation** — Missing validation on",
  "   request body fields. Adding zod schemas.",
];

export const ChatInterface: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sidebarSpring = spring({ frame, fps, config: { damping: 16, stiffness: 100 }, delay: 5 });
  const chatSpring = spring({ frame, fps, config: { damping: 16, stiffness: 100 }, delay: 15 });
  const rightSpring = spring({ frame, fps, config: { damping: 16, stiffness: 100 }, delay: 25 });

  // Streaming response effect
  const responseStart = 35;
  const charsRevealed = Math.max(0, (frame - responseStart) * 4);
  const fullResponse = RESPONSE_LINES.join("\n");
  const visibleResponse = fullResponse.slice(0, charsRevealed);

  return (
    <SceneTransition durationInFrames={160}>
      <AppWindow title="OpenClawd — Code Review">
        <div style={{ display: "flex", height: "100%", background: colors.bg }}>
          {/* Left Sidebar */}
          <div
            style={{
              width: 180,
              borderRight: `1px solid ${colors.border}`,
              padding: "12px 8px",
              opacity: sidebarSpring,
              transform: `translateX(${(1 - sidebarSpring) * -20}px)`,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: colors.dim,
                fontFamily: fonts.ui,
                padding: "4px 8px",
                marginBottom: 6,
              }}
            >
              Chat History
            </div>
            {SIDEBAR_ITEMS.map((item, i) => {
              const delay = 10 + i * 4;
              const itemSpring = spring({ frame, fps, config: { damping: 16 }, delay });
              return (
                <div
                  key={item.label}
                  style={{
                    opacity: itemSpring,
                    padding: "8px 10px",
                    borderRadius: 8,
                    marginBottom: 2,
                    fontSize: 12,
                    fontFamily: fonts.ui,
                    color: item.active ? colors.white : colors.muted,
                    background: item.active ? colors.surface : "transparent",
                    border: item.active ? `1px solid ${colors.border}` : "1px solid transparent",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.label}
                </div>
              );
            })}
          </div>

          {/* Center Chat */}
          <div
            style={{
              flex: 1,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              opacity: chatSpring,
              overflow: "hidden",
            }}
          >
            {/* User message */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div
                style={{
                  background: colors.amber,
                  color: colors.bg,
                  padding: "10px 16px",
                  borderRadius: "14px 14px 4px 14px",
                  fontSize: 14,
                  fontFamily: fonts.ui,
                  fontWeight: 500,
                  maxWidth: "70%",
                }}
              >
                Review my API code for security issues
              </div>
            </div>

            {/* Assistant response */}
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: `${colors.amber}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                ✦
              </div>
              <div
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "4px 14px 14px 14px",
                  padding: "12px 16px",
                  fontSize: 13,
                  fontFamily: fonts.ui,
                  color: colors.white,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  maxWidth: "85%",
                  overflow: "hidden",
                }}
              >
                {visibleResponse}
                {charsRevealed < fullResponse.length && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 14,
                      background: colors.amber,
                      marginLeft: 2,
                      verticalAlign: "middle",
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div
            style={{
              width: 185,
              borderLeft: `1px solid ${colors.border}`,
              padding: 12,
              opacity: rightSpring,
              transform: `translateX(${(1 - rightSpring) * 20}px)`,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              flexShrink: 0,
            }}
          >
            {/* Progress Steps */}
            <div>
              <div
                style={{ fontSize: 11, color: colors.dim, fontFamily: fonts.ui, marginBottom: 8 }}
              >
                Progress
              </div>
              {STEPS.map((step, i) => {
                const stepDelay = 30 + i * 12;
                const done = frame > stepDelay + 15;
                return (
                  <div
                    key={step.label}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: done ? colors.green : `${colors.amber}30`,
                        border: done ? "none" : `1.5px solid ${colors.amber}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        color: colors.bg,
                      }}
                    >
                      {done ? "✓" : ""}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: done ? colors.white : colors.dim,
                        fontFamily: fonts.ui,
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Tool Calls */}
            <div>
              <div
                style={{ fontSize: 11, color: colors.dim, fontFamily: fonts.ui, marginBottom: 8 }}
              >
                Tool Calls
              </div>
              {TOOL_CALLS.map((tool, i) => {
                const toolDelay = 40 + i * 18;
                const visible = frame > toolDelay;
                if (!visible) {
                  return null;
                }
                const toolOpacity = interpolate(frame, [toolDelay, toolDelay + 8], [0, 1], {
                  extrapolateRight: "clamp",
                });
                return (
                  <div
                    key={tool.name}
                    style={{
                      opacity: toolOpacity,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 8px",
                      borderRadius: 6,
                      background: colors.bg,
                      marginBottom: 4,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: tool.status === "done" ? colors.green : colors.amber,
                      }}
                    />
                    <span style={{ fontSize: 10, fontFamily: fonts.code, color: colors.muted }}>
                      {tool.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AppWindow>
    </SceneTransition>
  );
};

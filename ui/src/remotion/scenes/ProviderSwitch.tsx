import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { AppWindow } from "../components/AppWindow";
import { SceneTransition } from "../components/SceneTransition";
import { colors, fonts } from "../theme";

const PROVIDERS = [
  { name: "Claude Code", color: "#fbbf24", selected: true },
  { name: "OpenCode", color: "#3b82f6", selected: false },
  { name: "OpenAI", color: "#22c55e", selected: false },
  { name: "Gemini", color: "#06b6d4", selected: false },
  { name: "DeepSeek", color: "#a855f7", selected: false },
  { name: "Llama 4", color: "#ec4899", selected: false },
  { name: "MiniMax", color: "#f97316", selected: false },
  { name: "Ollama", color: "#64748b", selected: false },
];

const MODELS = [
  { name: "Opus 4.6", desc: "Most capable · 1M context", selected: true },
  { name: "Sonnet 4.5", desc: "Fast + intelligent", selected: false },
  { name: "GPT-5.3 Codex", desc: "Code specialist", selected: false },
  { name: "Gemini 3 Flash", desc: "Lightning fast", selected: false },
  { name: "DeepSeek V3", desc: "Open source leader", selected: false },
  { name: "Llama 4 Scout", desc: "Meta's best", selected: false },
  { name: "Qwen 3 235B", desc: "Reasoning powerhouse", selected: false },
];

export const ProviderSwitch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneTransition durationInFrames={130}>
      <AppWindow title="Provider & Model Selection">
        <div
          style={{
            display: "flex",
            height: "100%",
            background: colors.bg,
            padding: 20,
            gap: 16,
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", gap: 16, flex: 1 }}>
            {/* Providers Panel */}
            <div
              style={{
                flex: 1,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: colors.muted,
                  fontFamily: fonts.ui,
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                Providers
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {PROVIDERS.map((p, i) => {
                  const itemSpring = spring({
                    frame,
                    fps,
                    config: { damping: 16 },
                    delay: 8 + i * 4,
                  });
                  return (
                    <div
                      key={p.name}
                      style={{
                        opacity: itemSpring,
                        transform: `translateX(${(1 - itemSpring) * 15}px)`,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: p.selected ? `${p.color}15` : "transparent",
                        border: p.selected ? `1px solid ${p.color}40` : "1px solid transparent",
                      }}
                    >
                      <div
                        style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          fontFamily: fonts.ui,
                          color: p.selected ? colors.white : colors.muted,
                        }}
                      >
                        {p.name}
                      </span>
                      {p.selected && (
                        <span style={{ marginLeft: "auto", fontSize: 11, color: colors.amber }}>
                          ●
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Models Panel */}
            <div
              style={{
                flex: 1,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: colors.muted,
                  fontFamily: fonts.ui,
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                Models
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {MODELS.map((m, i) => {
                  const itemSpring = spring({
                    frame,
                    fps,
                    config: { damping: 16 },
                    delay: 12 + i * 4,
                  });
                  return (
                    <div
                      key={m.name}
                      style={{
                        opacity: itemSpring,
                        transform: `translateX(${(1 - itemSpring) * 15}px)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: m.selected ? `${colors.amber}15` : "transparent",
                        border: m.selected
                          ? `1px solid ${colors.amber}40`
                          : "1px solid transparent",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontFamily: fonts.ui,
                            color: m.selected ? colors.white : colors.muted,
                          }}
                        >
                          {m.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: colors.dim,
                            fontFamily: fonts.ui,
                            marginTop: 1,
                          }}
                        >
                          {m.desc}
                        </div>
                      </div>
                      {m.selected && (
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: colors.amber,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            color: colors.bg,
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom tagline */}
          <div style={{ textAlign: "center" }}>
            {(() => {
              const tagSpring = spring({ frame, fps, config: { damping: 16 }, delay: 50 });
              return (
                <span
                  style={{
                    opacity: tagSpring,
                    fontSize: 13,
                    fontFamily: fonts.ui,
                    color: colors.dim,
                  }}
                >
                  Claude Code + OpenCode SDK — 20+ providers · Open Source models
                </span>
              );
            })()}
          </div>
        </div>
      </AppWindow>
    </SceneTransition>
  );
};

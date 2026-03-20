import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { SceneTransition } from "../components/SceneTransition";
import { colors, fonts } from "../theme";

const PROVIDERS_ROW1 = [
  { name: "Claude", color: "#fbbf24" },
  { name: "OpenAI", color: "#22c55e" },
  { name: "Gemini", color: "#06b6d4" },
  { name: "DeepSeek", color: "#a855f7" },
];
const PROVIDERS_ROW2 = [
  { name: "Llama", color: "#ec4899" },
  { name: "MiniMax", color: "#f97316" },
  { name: "Ollama", color: "#64748b" },
  { name: "Qwen", color: "#3b82f6" },
];

const WORDS = ["Open", "Source", "AI", "Desktop"];
const MODEL_NAMES = "Opus 4.6 · Sonnet 4.5 · GPT-5.3 · Gemini 3 · DeepSeek V3 · Llama 4";

export const LogoCombo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Sub-scene timing
  const isIntro = frame < 55;
  const isWords = frame >= 55 && frame < 110;
  const isProviders = frame >= 110;

  // ── Sub-scene A: Intro burst ──
  const burstProgress = spring({ frame, fps, config: { damping: 10, stiffness: 60 }, delay: 5 });
  const ringScale = spring({ frame, fps, config: { damping: 8, stiffness: 40 }, delay: 12 });

  // ── Sub-scene B: Words ──
  const wordsFrame = Math.max(0, frame - 55);

  // ── Sub-scene C: Providers ──
  const provFrame = Math.max(0, frame - 110);

  return (
    <SceneTransition durationInFrames={180}>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: colors.bg,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Subtle grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${colors.border}40 1px, transparent 1px), linear-gradient(90deg, ${colors.border}40 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            opacity: 0.3,
          }}
        />

        {/* Floating particles */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2 + frame * 0.008;
          const radius = 200 + Math.sin(i * 1.5) * 80;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const size = 3 + (i % 3);
          const opacity = interpolate(Math.sin(frame * 0.03 + i), [-1, 1], [0.1, 0.4]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                width: size,
                height: size,
                borderRadius: "50%",
                background: colors.amber,
                opacity,
              }}
            />
          );
        })}

        {/* ── Sub-scene A: Intro with burst ── */}
        {isIntro && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              zIndex: 1,
            }}
          >
            {/* Converging lines */}
            {[0, 1, 2, 3].map((i) => {
              const lineAngle = (i / 4) * 360;
              const lineProgress = interpolate(burstProgress, [0, 1], [200, 0]);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: 60,
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${colors.amber})`,
                    transform: `rotate(${lineAngle}deg) translateX(${lineProgress}px)`,
                    opacity: burstProgress,
                  }}
                />
              );
            })}

            {/* Center burst ring */}
            <div
              style={{
                width: 120 * ringScale,
                height: 120 * ringScale,
                borderRadius: "50%",
                border: `2px solid ${colors.amber}`,
                opacity: interpolate(ringScale, [0, 0.5, 1], [0, 1, 0.3]),
              }}
            />

            {/* Introducing */}
            <div
              style={{
                position: "absolute",
                fontSize: 20,
                color: colors.amber,
                fontFamily: fonts.ui,
                fontWeight: 500,
                opacity: interpolate(frame, [20, 30], [0, 1], { extrapolateRight: "clamp" }),
              }}
            >
              ✦ Introducing ✦
            </div>
          </div>
        )}

        {/* ── Sub-scene B: Word-by-word reveal ── */}
        {isWords && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              zIndex: 1,
            }}
          >
            <div style={{ display: "flex", gap: 14 }}>
              {WORDS.map((word, i) => {
                const wordSpring = spring({
                  frame: wordsFrame,
                  fps,
                  config: { damping: 14, stiffness: 90 },
                  delay: i * 8,
                });
                return (
                  <span
                    key={word}
                    style={{
                      opacity: wordSpring,
                      transform: `translateY(${(1 - wordSpring) * 20}px)`,
                      display: "inline-block",
                      fontSize: 56,
                      fontWeight: 700,
                      fontFamily: fonts.ui,
                      color: colors.white,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
            <div
              style={{
                opacity: spring({ frame: wordsFrame, fps, config: { damping: 14 }, delay: 35 }),
                fontSize: 13,
                fontFamily: fonts.code,
                color: colors.dim,
                letterSpacing: 1,
              }}
            >
              {MODEL_NAMES}
            </div>
          </div>
        )}

        {/* ── Sub-scene C: Provider icons ── */}
        {isProviders && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
              zIndex: 1,
            }}
          >
            {[PROVIDERS_ROW1, PROVIDERS_ROW2].map((row, rowIdx) => (
              <div key={rowIdx} style={{ display: "flex", gap: 20 }}>
                {row.map((p, i) => {
                  const pSpring = spring({
                    frame: provFrame,
                    fps,
                    config: { damping: 12, stiffness: 80 },
                    delay: rowIdx * 12 + i * 5,
                  });
                  return (
                    <div
                      key={p.name}
                      style={{
                        opacity: pSpring,
                        transform: `scale(${0.8 + pSpring * 0.2})`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          background: `${p.color}20`,
                          border: `1.5px solid ${p.color}50`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: p.color,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: colors.muted, fontFamily: fonts.ui }}>
                        {p.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Tagline */}
            <div
              style={{
                opacity: spring({ frame: provFrame, fps, config: { damping: 14 }, delay: 35 }),
                fontSize: 14,
                color: colors.dim,
                fontFamily: fonts.ui,
                textAlign: "center",
                marginTop: 10,
              }}
            >
              Claude Code + OpenCode SDK · 80+ models | Desktop · Messaging · API
            </div>
          </div>
        )}
      </div>
    </SceneTransition>
  );
};

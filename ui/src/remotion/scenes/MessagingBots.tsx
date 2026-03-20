import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { SceneTransition } from "../components/SceneTransition";
import { colors, fonts } from "../theme";

const PLATFORMS = [
  { name: "WhatsApp", color: "#25D366", icon: "W", tags: ["Memory", "Tools"] },
  { name: "Telegram", color: "#26A5E4", icon: "T", tags: ["Scheduling", "Tools"] },
  { name: "Signal", color: "#3A76F0", icon: "S", tags: ["Memory", "Privacy"] },
  { name: "iMessage", color: "#34C759", icon: "i", tags: ["Tools", "Scheduling"] },
];

export const MessagingBots: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14 }, delay: 5 });
  const subtitleSpring = spring({ frame, fps, config: { damping: 14 }, delay: 12 });

  return (
    <SceneTransition durationInFrames={120}>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: colors.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
          padding: 40,
        }}
      >
        {/* Title */}
        <div
          style={{
            opacity: titleSpring,
            transform: `translateY(${(1 - titleSpring) * 20}px)`,
            fontSize: 36,
            fontWeight: 700,
            fontFamily: fonts.ui,
            color: colors.white,
            textAlign: "center",
          }}
        >
          Your AI, everywhere you chat
        </div>
        <div
          style={{
            opacity: subtitleSpring,
            fontSize: 16,
            color: colors.muted,
            fontFamily: fonts.ui,
            textAlign: "center",
            marginTop: -16,
          }}
        >
          Full tool access · Memory · Scheduling
        </div>

        {/* Platform cards */}
        <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
          {PLATFORMS.map((p, i) => {
            const cardSpring = spring({
              frame,
              fps,
              config: { damping: 12, stiffness: 80 },
              delay: 18 + i * 8,
            });
            return (
              <div
                key={p.name}
                style={{
                  opacity: cardSpring,
                  transform: `scale(${0.85 + cardSpring * 0.15}) translateY(${(1 - cardSpring) * 20}px)`,
                  width: 190,
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 16,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: `${p.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 700,
                    color: p.color,
                    fontFamily: fonts.ui,
                  }}
                >
                  {p.icon}
                </div>

                {/* Name + status */}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: colors.white,
                      fontFamily: fonts.ui,
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      marginTop: 4,
                    }}
                  >
                    <div
                      style={{ width: 6, height: 6, borderRadius: "50%", background: colors.green }}
                    />
                    <span style={{ fontSize: 11, color: colors.green, fontFamily: fonts.ui }}>
                      Connected
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div
                  style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}
                >
                  {p.tags.map((tag) => (
                    <div
                      key={tag}
                      style={{
                        fontSize: 9,
                        padding: "3px 8px",
                        borderRadius: 10,
                        background: colors.bg,
                        border: `1px solid ${colors.border}`,
                        color: colors.muted,
                        fontFamily: fonts.ui,
                      }}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SceneTransition>
  );
};

import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { AppWindow } from "../components/AppWindow";
import { SceneTransition } from "../components/SceneTransition";
import { colors, fonts } from "../theme";

const CHIPS = [
  { label: "Claude Code", color: colors.amber },
  { label: "Opus 4.6", color: colors.muted },
  { label: "Attach", color: colors.dim },
];

export const HomeScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 }, delay: 5 });
  const taglineSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 }, delay: 15 });
  const inputSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 }, delay: 25 });
  const chipsSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 }, delay: 35 });

  return (
    <SceneTransition durationInFrames={150}>
      <AppWindow title="OpenClawd">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            background: colors.bg,
            gap: 20,
            padding: 40,
          }}
        >
          {/* Title */}
          <div
            style={{
              opacity: titleSpring,
              transform: `translateY(${(1 - titleSpring) * 20}px)`,
              fontFamily: fonts.brand,
              fontSize: 52,
              fontWeight: 400,
              color: colors.white,
              letterSpacing: -1,
            }}
          >
            OpenClawd
          </div>

          {/* Tagline */}
          <div
            style={{
              opacity: taglineSpring,
              transform: `translateY(${(1 - taglineSpring) * 15}px)`,
              fontFamily: fonts.ui,
              fontSize: 18,
              color: colors.muted,
              textAlign: "center",
            }}
          >
            Open Source Alternative to Claude Cowork
          </div>

          {/* Chat Input */}
          <div
            style={{
              opacity: inputSpring,
              transform: `translateY(${(1 - inputSpring) * 15}px) scale(${0.95 + inputSpring * 0.05})`,
              width: "70%",
              maxWidth: 520,
              marginTop: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: "12px 16px",
                gap: 12,
              }}
            >
              <div
                style={{
                  flex: 1,
                  fontFamily: fonts.ui,
                  fontSize: 15,
                  color: colors.dim,
                }}
              >
                Ask me anything...
              </div>
              {/* Send button */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: colors.amber,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13"
                    stroke={colors.bg}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke={colors.bg}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Chips */}
          <div
            style={{
              opacity: chipsSpring,
              transform: `translateY(${(1 - chipsSpring) * 10}px)`,
              display: "flex",
              gap: 8,
              marginTop: 4,
            }}
          >
            {CHIPS.map((chip) => (
              <div
                key={chip.label}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: chip.color,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: chip.color }} />
                {chip.label}
              </div>
            ))}
          </div>
        </div>
      </AppWindow>
    </SceneTransition>
  );
};

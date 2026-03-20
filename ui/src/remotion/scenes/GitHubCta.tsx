import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { SceneTransition } from "../components/SceneTransition";
import { colors, fonts } from "../theme";

export const GitHubCta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spinning GitHub logo
  const logoSpring = spring({ frame, fps, config: { damping: 12, stiffness: 60 }, delay: 5 });
  const logoRotation = interpolate(logoSpring, [0, 1], [-180, 0]);

  // Orbiting stars
  const starCount = 6;

  // Pulsing scale on CTA
  const pulseScale = 1 + Math.sin(frame * 0.08) * 0.02;

  const labelSpring = spring({ frame, fps, config: { damping: 14 }, delay: 3 });
  const titleSpring = spring({ frame, fps, config: { damping: 14 }, delay: 15 });
  const _ctaSpring = spring({ frame, fps, config: { damping: 14 }, delay: 30 });
  const urlSpring = spring({ frame, fps, config: { damping: 14 }, delay: 40 });

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
          gap: 24,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${colors.border}30 1px, transparent 1px), linear-gradient(90deg, ${colors.border}30 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
            opacity: 0.2,
          }}
        />

        {/* Floating particles */}
        {Array.from({ length: 8 }).map((_, i) => {
          const px = Math.sin(frame * 0.015 + i * 2) * 300 + 540;
          const py = Math.cos(frame * 0.02 + i * 1.5) * 200 + 350;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: px,
                top: py,
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: colors.amber,
                opacity: 0.2 + Math.sin(frame * 0.04 + i) * 0.15,
              }}
            />
          );
        })}

        {/* "100% OPEN SOURCE" label */}
        <div
          style={{
            opacity: labelSpring,
            transform: `translateY(${(1 - labelSpring) * 15}px)`,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: fonts.ui,
            color: colors.amber,
            letterSpacing: 3,
            padding: "6px 16px",
            borderRadius: 20,
            border: `1px solid ${colors.amber}40`,
            background: `${colors.amber}10`,
            zIndex: 1,
          }}
        >
          100% OPEN SOURCE
        </div>

        {/* GitHub Logo with spinning entrance + orbiting stars */}
        <div
          style={{
            position: "relative",
            width: 100,
            height: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          {/* Orbiting amber stars */}
          {Array.from({ length: starCount }).map((_, i) => {
            const angle = (i / starCount) * Math.PI * 2 + frame * 0.04;
            const orbitRadius = 55;
            const sx = Math.cos(angle) * orbitRadius;
            const sy = Math.sin(angle) * orbitRadius;
            const starOpacity = spring({ frame, fps, config: { damping: 14 }, delay: 20 + i * 3 });
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `calc(50% + ${sx}px - 6px)`,
                  top: `calc(50% + ${sy}px - 6px)`,
                  width: 12,
                  height: 12,
                  opacity: starOpacity * 0.8,
                  color: colors.amber,
                  fontSize: 12,
                  lineHeight: 1,
                }}
              >
                ★
              </div>
            );
          })}

          {/* GitHub logo */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: colors.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `rotate(${logoRotation}deg)`,
              opacity: logoSpring,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill={colors.bg}>
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
        </div>

        {/* "Star us on GitHub" */}
        <div
          style={{
            opacity: titleSpring,
            transform: `translateY(${(1 - titleSpring) * 15}px) scale(${pulseScale})`,
            fontSize: 36,
            fontWeight: 700,
            fontFamily: fonts.ui,
            color: colors.white,
            zIndex: 1,
          }}
        >
          Star us on GitHub
        </div>

        {/* URL card */}
        <div
          style={{
            opacity: urlSpring,
            transform: `translateY(${(1 - urlSpring) * 10}px)`,
            padding: "12px 28px",
            borderRadius: 12,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            zIndex: 1,
          }}
        >
          <span style={{ fontSize: 16, fontFamily: fonts.code, color: colors.muted }}>
            github.com/
          </span>
          <span
            style={{ fontSize: 16, fontFamily: fonts.code, color: colors.amber, fontWeight: 600 }}
          >
            rohitg00/openclawd
          </span>
        </div>
      </div>
    </SceneTransition>
  );
};

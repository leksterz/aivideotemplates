import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import type { MotionGraphicSegment } from "../types/video";

/**
 * Motion graphic placeholder renderers — matched to the 21st.dev promo video.
 * All segments use white backgrounds with clean, minimal Apple-style aesthetics.
 * Fade-in: ~6-8 frames (0.2-0.27s). Fade-out: ~10-12 frames.
 */

const BLUE = "#2563eb";

interface Props {
  segment: MotionGraphicSegment;
}

export function MotionGraphicRenderer({ segment }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = segment.endFrame - segment.startFrame;
  const progress = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fast fade-in (~6 frames), slightly longer fade-out (~10 frames) — matches original
  const fadeIn = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [totalFrames - 10, totalFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  switch (segment.type) {
    case "logo-reveal":
      return <LogoReveal opacity={opacity} frame={frame} fps={fps} name={segment.name} />;
    case "interface-reveal":
      return <InterfaceReveal opacity={opacity} progress={progress} frame={frame} fps={fps} />;
    case "chart":
      return <GrowthChart opacity={opacity} progress={progress} frame={frame} fps={fps} />;
    case "counter":
      return (
        <GitHubCounter
          opacity={opacity}
          progress={progress}
          frame={frame}
          fps={fps}
          totalFrames={totalFrames}
        />
      );
    case "screenshot":
      return <ClaudeCodeUI opacity={opacity} frame={frame} fps={fps} />;
    case "logo-mark":
      return <GeometricLogo opacity={opacity} frame={frame} fps={fps} />;
    case "title-card":
      return <FinalLogoCard opacity={opacity} frame={frame} fps={fps} totalFrames={totalFrames} />;
    default:
      return <GenericPlaceholder opacity={opacity} name={segment.name} type={segment.type} />;
  }
}

/* ─── MG1: Logo Reveal ─────────────────────────────────────────────────────
 * White bg. Blue geometric "21" mark starts as tiny square, scales up via
 * spring into the interlocking logo shape. Minimal, no text initially.
 * From the video: the mark appears very small and unfolds quickly.
 */
function LogoReveal({
  opacity,
  frame,
  fps,
  name,
}: {
  opacity: number;
  frame: number;
  fps: number;
  name: string;
}) {
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 100, mass: 0.8 } });
  // Stagger text appearance after logo settles
  const textOpacity = interpolate(frame, [18, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textSlide = interpolate(frame, [18, 30], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", opacity }}>
      <div style={center}>
        {/* Blue geometric "21" interlocking mark */}
        <div
          style={{
            position: "relative",
            width: 80,
            height: 80,
            transform: `scale(${scale})`,
          }}
        >
          {/* Back shape (blue square) */}
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 20,
              width: 48,
              height: 48,
              backgroundColor: BLUE,
              borderRadius: 4,
            }}
          />
          {/* Front shape (white cutout + blue overlap) */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 8,
              width: 48,
              height: 48,
              backgroundColor: "#fff",
              borderRadius: 4,
              border: `3px solid ${BLUE}`,
            }}
          />
          {/* Overlap accent */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              width: 28,
              height: 28,
              backgroundColor: BLUE,
              borderRadius: 2,
              opacity: 0.5,
            }}
          />
        </div>

        {/* Brand name appears if MG7 "21st Agents" context */}
        {name.includes("Agent") ? (
          <div
            style={{
              marginTop: 28,
              opacity: textOpacity,
              transform: `translateY(${textSlide}px)`,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 800, color: "#111", letterSpacing: -1 }}>
              21st Agents
            </span>
          </div>
        ) : null}
      </div>
      <PlaceholderBadge label={name.includes("Agent") ? "MG7" : "MG1"} />
    </AbsoluteFill>
  );
}

/* ─── MG2: Interface Reveal ────────────────────────────────────────────────
 * White/light bg. Product UI component cards (Aceternity UI style).
 * Multiple cards with shadows, gentle drift to suggest scroll.
 */
function InterfaceReveal({
  opacity,
  progress,
  frame,
  fps,
}: {
  opacity: number;
  progress: number;
  frame: number;
  fps: number;
}) {
  const enterScale = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const drift = interpolate(progress, [0, 1], [20, -20]);

  const cards = [
    { title: "Feature Section", sub: "Built for developers", w: 280, h: 200, x: -160, y: -40 },
    { title: "Pricing Table", sub: "Simple and transparent", w: 240, h: 180, x: 160, y: -20 },
    { title: "Hero Section", sub: "With hover effects", w: 200, h: 160, x: 0, y: 120 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#fafafa", opacity }}>
      <div style={{ ...center, transform: `translateY(${drift}px)` }}>
        {cards.map((card, i) => {
          const cardDelay = i * 4;
          const cardScale = spring({
            frame: Math.max(0, frame - cardDelay),
            fps,
            config: { damping: 14, stiffness: 100 },
          });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `calc(50% + ${card.x}px)`,
                top: `calc(50% + ${card.y}px)`,
                transform: `translate(-50%, -50%) scale(${enterScale * cardScale})`,
                width: card.w,
                height: card.h,
                backgroundColor: "#fff",
                borderRadius: 16,
                border: "1px solid #e5e5e5",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                padding: 20,
                overflow: "hidden",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 4 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 16 }}>{card.sub}</div>
              {/* Skeleton content lines */}
              <div
                style={{
                  width: "80%",
                  height: 6,
                  backgroundColor: "#f0f0f0",
                  borderRadius: 3,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  width: "60%",
                  height: 6,
                  backgroundColor: "#f0f0f0",
                  borderRadius: 3,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  width: "70%",
                  height: 6,
                  backgroundColor: "#f0f0f0",
                  borderRadius: 3,
                  marginBottom: 16,
                }}
              />
              {/* Feature blocks */}
              <div style={{ display: "flex", gap: 8 }}>
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    style={{
                      flex: 1,
                      height: 32,
                      borderRadius: 6,
                      backgroundColor: "#f5f5f5",
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <PlaceholderBadge label="MG2" />
    </AbsoluteFill>
  );
}

/* ─── MG3: Growth Graph ────────────────────────────────────────────────────
 * White bg. "21st.dev Users" heading. Line graph draws progressively
 * left-to-right with a hockey-stick curve. "1.4 million developers" at bottom.
 */
function GrowthChart({
  opacity,
  progress,
  frame,
  fps,
}: {
  opacity: number;
  progress: number;
  frame: number;
  fps: number;
}) {
  const titleOpacity = spring({ frame, fps, config: { damping: 20, stiffness: 100 } });
  // Draw progress for the graph line
  const drawProgress = interpolate(progress, [0.1, 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleOpacity = interpolate(progress, [0.7, 0.9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Hockey stick curve points (x: 0-1, y: 0-1)
  const curvePoints = [
    [0, 0.95],
    [0.15, 0.9],
    [0.3, 0.85],
    [0.45, 0.78],
    [0.55, 0.65],
    [0.65, 0.45],
    [0.75, 0.25],
    [0.85, 0.12],
    [1, 0.02],
  ];

  const graphW = 400;
  const graphH = 160;
  const months = [
    "Oct 24",
    "Dec 24",
    "Feb 25",
    "Apr 25",
    "Jun 25",
    "Aug 25",
    "Oct 25",
    "Dec 25",
    "Mar 26",
  ];

  // Build SVG path up to drawProgress
  const visiblePoints = curvePoints.filter(([x]) => x <= drawProgress);
  if (drawProgress > 0 && visiblePoints.length > 0) {
    const lastVisible = curvePoints.find(([x]) => x > drawProgress);
    if (lastVisible) {
      const prev = visiblePoints[visiblePoints.length - 1];
      const t = (drawProgress - prev[0]) / (lastVisible[0] - prev[0]);
      const interpY = prev[1] + t * (lastVisible[1] - prev[1]);
      visiblePoints.push([drawProgress, interpY]);
    }
  }

  const pathD = visiblePoints
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x * graphW} ${y * graphH}`)
    .join(" ");

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", opacity }}>
      <div style={{ ...center, flexDirection: "column", gap: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#666",
            letterSpacing: 1,
            opacity: titleOpacity,
            marginBottom: 24,
          }}
        >
          21st.dev Users
        </div>

        {/* Graph area */}
        <div style={{ position: "relative", width: graphW, height: graphH }}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((y) => (
            <div
              key={y}
              style={{
                position: "absolute",
                top: `${y * 100}%`,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: "#f0f0f0",
              }}
            />
          ))}
          {/* SVG line */}
          <svg width={graphW} height={graphH} style={{ position: "absolute", top: 0, left: 0 }}>
            <path
              d={pathD}
              fill="none"
              stroke={BLUE}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dot at tip */}
            {visiblePoints.length > 0 && (
              <circle
                cx={visiblePoints[visiblePoints.length - 1][0] * graphW}
                cy={visiblePoints[visiblePoints.length - 1][1] * graphH}
                r={5}
                fill={BLUE}
              />
            )}
          </svg>
        </div>

        {/* X-axis labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: graphW,
            marginTop: 8,
          }}
        >
          {months
            .filter((_, i) => i % 2 === 0)
            .map((m) => (
              <span key={m} style={{ fontSize: 9, color: "#aaa" }}>
                {m}
              </span>
            ))}
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 24,
            fontSize: 22,
            fontWeight: 700,
            color: "#111",
            opacity: subtitleOpacity,
          }}
        >
          1.4 million developers
        </div>
      </div>
      <PlaceholderBadge label="MG3" />
    </AbsoluteFill>
  );
}

/* ─── MG5: GitHub Counter ──────────────────────────────────────────────────
 * White bg. 3 repo rows vertically stacked with icons, star counts ticking up,
 * and repo names. Then "More than 15,000 GitHub Stars" slams in blue.
 */
function GitHubCounter({
  opacity,
  progress,
  frame,
  fps,
  totalFrames,
}: {
  opacity: number;
  progress: number;
  frame: number;
  fps: number;
  totalFrames: number;
}) {
  const repos = [
    { icon: "monitor", name: "21st-dev/magic-ui", maxStars: 4550 },
    { icon: "square", name: "serafimcloud/21st", maxStars: 5430 },
    { icon: "circle", name: "21st-dev/1code", maxStars: 5306 },
  ];

  // Counter ticks up over first 60% of the segment
  const countProgress = interpolate(progress, [0.05, 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Slam text appears at ~60%
  const slamStart = Math.floor(totalFrames * 0.6);
  const slamFrame = Math.max(0, frame - slamStart);
  const slamScale =
    progress > 0.58
      ? spring({ frame: slamFrame, fps, config: { damping: 8, stiffness: 180, mass: 0.6 } })
      : 0;
  const slamOpacity = interpolate(progress, [0.58, 0.62], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Repos fade away as slam comes in
  const reposFade = interpolate(progress, [0.6, 0.75], [1, 0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", opacity }}>
      <div style={{ ...center, flexDirection: "column", gap: 0 }}>
        {/* Repo rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, opacity: reposFade }}>
          {repos.map((repo, i) => {
            const rowDelay = i * 6;
            const rowScale = spring({
              frame: Math.max(0, frame - rowDelay),
              fps,
              config: { damping: 14, stiffness: 120 },
            });
            const stars = Math.floor(repo.maxStars * countProgress);
            return (
              <div
                key={repo.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  opacity: rowScale,
                  transform: `translateX(${(1 - rowScale) * 30}px)`,
                }}
              >
                {/* Icon placeholder */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: "#1a1a1a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: repo.icon === "circle" ? 16 : 14,
                      height: repo.icon === "circle" ? 16 : 14,
                      borderRadius: repo.icon === "circle" ? "50%" : 2,
                      backgroundColor: "#fff",
                    }}
                  />
                </div>
                {/* Star + count */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20, color: "#999" }}>&#9734;</span>
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: "#111",
                      fontVariantNumeric: "tabular-nums",
                      minWidth: 80,
                    }}
                  >
                    {stars.toLocaleString()}
                  </span>
                </div>
                {/* Repo name */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      backgroundColor: "#e5e5e5",
                    }}
                  />
                  <span style={{ fontSize: 14, color: "#888" }}>{repo.name}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* "More than 15,000 GitHub Stars" slam */}
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: slamOpacity,
            transform: `scale(${0.3 + slamScale * 0.7})`,
          }}
        >
          <span style={{ fontSize: 24, fontWeight: 600, color: "#111", marginBottom: 4 }}>
            More than
          </span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: BLUE,
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            15,000
          </span>
          <span style={{ fontSize: 24, fontWeight: 600, color: "#111", marginTop: 4 }}>
            GitHub Stars
          </span>
        </div>
      </div>
      <PlaceholderBadge label="MG5" />
    </AbsoluteFill>
  );
}

/* ─── MG6: Claude Code UI ──────────────────────────────────────────────────
 * Soft pinkish/warm gradient bg. Dark terminal window centered with
 * "CLAUDE CODE" in large retro/pixel-style text (salmon color).
 * Traffic light dots. Spring scale-in entrance.
 */
function ClaudeCodeUI({ opacity, frame, fps }: { opacity: number; frame: number; fps: number }) {
  const windowScale = spring({ frame, fps, config: { damping: 10, stiffness: 120, mass: 0.7 } });

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at 50% 50%, #fff5f5 0%, #fff0eb 40%, #ffeee8 100%)",
        opacity,
      }}
    >
      <div style={center}>
        <div
          style={{
            width: 480,
            borderRadius: 14,
            backgroundColor: "#1e1e1e",
            overflow: "hidden",
            transform: `scale(${windowScale})`,
            boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
          }}
        >
          {/* Title bar */}
          <div
            style={{
              height: 32,
              backgroundColor: "#2d2d2d",
              display: "flex",
              alignItems: "center",
              gap: 7,
              paddingLeft: 14,
            }}
          >
            <div
              style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ff5f57" }}
            />
            <div
              style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#febc2e" }}
            />
            <div
              style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#28c840" }}
            />
          </div>
          {/* Content — large retro "CLAUDE CODE" text */}
          <div
            style={{
              padding: "36px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 160,
            }}
          >
            <span
              style={{
                fontSize: 52,
                fontWeight: 900,
                color: "#e8917a",
                fontFamily: "monospace",
                letterSpacing: 4,
                textShadow: "0 0 30px rgba(232,145,122,0.3)",
              }}
            >
              CLAUDE{"\n"}CODE
            </span>
          </div>
        </div>
      </div>
      <PlaceholderBadge label="MG6" />
    </AbsoluteFill>
  );
}

/* ─── MG8: Geometric Logo ──────────────────────────────────────────────────
 * White bg, fades in from video with white wash.
 * Blue geometric "21" interlocking shapes, centered. Simple, clean.
 */
function GeometricLogo({ opacity, frame, fps }: { opacity: number; frame: number; fps: number }) {
  const scale = spring({ frame, fps, config: { damping: 16, stiffness: 80, mass: 0.9 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", opacity }}>
      <div style={center}>
        {/* Blue geometric "21" mark — larger version */}
        <div
          style={{
            position: "relative",
            width: 120,
            height: 120,
            transform: `scale(${scale})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 30,
              width: 72,
              height: 72,
              backgroundColor: BLUE,
              borderRadius: 6,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 30,
              left: 10,
              width: 72,
              height: 72,
              backgroundColor: "#fff",
              borderRadius: 6,
              border: `4px solid ${BLUE}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 30,
              left: 30,
              width: 42,
              height: 42,
              backgroundColor: BLUE,
              borderRadius: 3,
              opacity: 0.45,
            }}
          />
        </div>
      </div>
      <PlaceholderBadge label="MG8" />
    </AbsoluteFill>
  );
}

/* ─── MG9: Final 21ST Card ─────────────────────────────────────────────────
 * White bg. Geometric logo + "21ST" text to the right.
 * Holds for several seconds. Slow fade out at end.
 */
function FinalLogoCard({
  opacity,
  frame,
  fps,
  totalFrames,
}: {
  opacity: number;
  frame: number;
  fps: number;
  totalFrames: number;
}) {
  const logoScale = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });
  const textOpacity = interpolate(frame, [10, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textSlide = interpolate(frame, [10, 22], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Extra slow fade at very end (last 20 frames)
  const endFade = interpolate(frame, [totalFrames - 20, totalFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", opacity: opacity * endFade }}>
      <div style={{ ...center, gap: 20 }}>
        {/* Logo mark */}
        <div
          style={{
            position: "relative",
            width: 64,
            height: 64,
            transform: `scale(${logoScale})`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 6,
              left: 18,
              width: 38,
              height: 38,
              backgroundColor: BLUE,
              borderRadius: 4,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 18,
              left: 6,
              width: 38,
              height: 38,
              backgroundColor: "#fff",
              borderRadius: 4,
              border: `3px solid ${BLUE}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 18,
              left: 18,
              width: 22,
              height: 22,
              backgroundColor: BLUE,
              borderRadius: 2,
              opacity: 0.45,
            }}
          />
        </div>

        {/* "21ST" text */}
        <span
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: "#111",
            letterSpacing: 2,
            opacity: textOpacity,
            transform: `translateX(${textSlide}px)`,
          }}
        >
          21ST
        </span>
      </div>
      <PlaceholderBadge label="MG9" />
    </AbsoluteFill>
  );
}

/* ─── Generic fallback ─────────────────────────────────────────────────── */
function GenericPlaceholder({
  opacity,
  name,
  type,
}: {
  opacity: number;
  name: string;
  type: string;
}) {
  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", opacity }}>
      <div style={{ ...center, flexDirection: "column", gap: 12 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            border: "2px dashed #d4d4d4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 24, color: "#999" }}>&#10022;</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#333" }}>{name}</span>
        <span style={{ fontSize: 11, color: "#999" }}>{type}</span>
      </div>
      <PlaceholderBadge label={`MG — ${name}`} />
    </AbsoluteFill>
  );
}

/* ─── Shared helpers ───────────────────────────────────────────────────── */

const center: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function PlaceholderBadge({ label }: { label: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        padding: "3px 8px",
        borderRadius: 4,
        backgroundColor: "rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.08)",
        fontSize: 9,
        fontWeight: 600,
        color: "#999",
        letterSpacing: 0.5,
        pointerEvents: "none",
      }}
    >
      {label}
    </div>
  );
}

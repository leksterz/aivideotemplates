/**
 * Animated orb — morphing multi-circle blob used as AI avatar and decorative element.
 * Ported from the reference chat UI. Uses pure CSS animations.
 */

interface AnimatedOrbProps {
  size?: number;
  variant?: "default" | "red";
  className?: string;
}

const DEFAULT_CIRCLES = [
  { color: "#9e9fef", pct: 45, anim: "orb-orbit-1", dur: "6s" },
  { color: "#c471ec", pct: 35, anim: "orb-orbit-2", dur: "5s" },
  { color: "#9bc761", pct: 50, anim: "orb-orbit-3", dur: "7s" },
  { color: "#ccd4f2", pct: 25, anim: "orb-orbit-4", dur: "4s" },
  { color: "#f472b6", pct: 30, anim: "orb-orbit-5", dur: "5.5s" },
];

const RED_CIRCLES = [
  { color: "#ef4444", pct: 45, anim: "orb-orbit-1", dur: "6s" },
  { color: "#f87171", pct: 35, anim: "orb-orbit-2", dur: "5s" },
  { color: "#dc2626", pct: 50, anim: "orb-orbit-3", dur: "7s" },
  { color: "#fca5a5", pct: 25, anim: "orb-orbit-4", dur: "4s" },
  { color: "#fb7185", pct: 30, anim: "orb-orbit-5", dur: "5.5s" },
];

export function AnimatedOrb({ size = 32, variant = "default", className = "" }: AnimatedOrbProps) {
  const circles = variant === "red" ? RED_CIRCLES : DEFAULT_CIRCLES;
  const bg = variant === "red" ? "#fef2f2" : "#cff1f4";

  return (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        boxShadow: "rgba(17, 12, 46, 0.15) 0px 48px 100px 0px",
        animation: "orb-hue-rotate 8s linear infinite",
        position: "relative",
      }}
    >
      {/* Blur container */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: `blur(${size * 0.08}px)`,
          animation: "orb-hue-rotate-blur 6s linear infinite reverse",
        }}
      >
        {circles.map((c, i) => {
          const s = (c.pct / 100) * size;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: s,
                height: s,
                borderRadius: "50%",
                backgroundColor: c.color,
                top: "50%",
                left: "50%",
                marginTop: -s / 2,
                marginLeft: -s / 2,
                animation: `${c.anim} ${c.dur} ease-in-out infinite`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

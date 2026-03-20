import {
  AbsoluteFill,
  Sequence,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
  staticFile,
} from "remotion";

/**
 * Apten — YC S24 Founder Video with transcript-driven motion graphics.
 *
 * Architecture: The founder video plays continuously as the base layer.
 * Motion graphics fade in/out over the video at key transcript moments,
 * dimming the video when graphics are prominent and restoring it after.
 *
 * Source video: 45.86s @ 25fps (640x360) — Remotion handles frame-rate conversion.
 * Composition: 30fps, 1376 frames (~45.87s).
 */

// ── Constants ────────────────────────────────────────────────────────────────

export const APTEN_FPS = 30;
export const APTEN_TOTAL_FRAMES = 1376; // ceil(45.86 * 30)
export const APTEN_WIDTH = 1080;
export const APTEN_HEIGHT = 700;

const BRAND_BLUE = "#2563eb";
const BRAND_DARK = "#0f172a";
const BRAND_GREEN = "#10b981";
const BRAND_ORANGE = "#f59e0b";
const BRAND_RED = "#ef4444";

// ── Transcript-aligned motion graphic segments ───────────────────────────────
// All times in seconds → converted to frames at 30fps.

const MG_SEGMENTS = [
  { id: "founder-daniel", start: 0.5, end: 4.0, type: "founder-title" as const },
  { id: "founder-roshan", start: 4.5, end: 7.5, type: "founder-title" as const },
  { id: "berkeley-badge", start: 8.0, end: 10.8, type: "berkeley" as const },
  { id: "product-reveal", start: 11.2, end: 16.4, type: "product-reveal" as const },
  { id: "problem-manual", start: 17.0, end: 22.0, type: "problem-manual" as const },
  { id: "drip-texting", start: 22.5, end: 26.8, type: "drip-problem" as const },
  { id: "twenty-four-seven", start: 27.2, end: 30.5, type: "always-on" as const },
  { id: "realtors-traction", start: 31.0, end: 35.2, type: "realtors" as const },
  { id: "platform-vision", start: 36.0, end: 40.4, type: "vision" as const },
  { id: "cta-finale", start: 41.0, end: 45.0, type: "cta" as const },
];

function sToF(seconds: number): number {
  return Math.round(seconds * APTEN_FPS);
}

// ── Main Composition ─────────────────────────────────────────────────────────

export const AptenDemo: React.FC = () => {
  const frame = useCurrentFrame();

  // Determine if any motion graphic is active right now to dim the video
  const anyMgActive = MG_SEGMENTS.some((mg) => {
    const sf = sToF(mg.start);
    const ef = sToF(mg.end);
    // Exclude lower-third overlays from dimming (founder titles, berkeley badge)
    const isOverlay =
      mg.type === "founder-title" || mg.type === "berkeley" || mg.type === "always-on";
    return !isOverlay && frame >= sf && frame <= ef;
  });

  // Video opacity: dims to 0.15 when full-screen graphics are active
  const videoDim = anyMgActive ? 0.15 : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Base video layer — plays continuously */}
      <AbsoluteFill style={{ opacity: videoDim }}>
        <OffthreadVideo
          src={staticFile("videos/apten-yc.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Motion graphics layer — fades in/out over video */}
      {MG_SEGMENTS.map((mg) => {
        const sf = sToF(mg.start);
        const ef = sToF(mg.end);
        const dur = ef - sf;
        return (
          <Sequence key={mg.id} from={sf} durationInFrames={dur} name={mg.id}>
            <MgRouter type={mg.type} totalFrames={dur} />
          </Sequence>
        );
      })}

      {/* Subtle vignette on top */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.4) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// ── MG Router ────────────────────────────────────────────────────────────────

function MgRouter({ type, totalFrames }: { type: string; totalFrames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Shared fade envelope: fast in (8 frames), smooth out (12 frames)
  const fadeIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [totalFrames - 12, totalFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  switch (type) {
    case "founder-title":
      return <FounderTitle opacity={opacity} frame={frame} fps={fps} />;
    case "berkeley":
      return <BerkeleyBadge opacity={opacity} frame={frame} fps={fps} />;
    case "product-reveal":
      return <ProductReveal opacity={opacity} frame={frame} fps={fps} totalFrames={totalFrames} />;
    case "problem-manual":
      return <ProblemManual opacity={opacity} frame={frame} fps={fps} totalFrames={totalFrames} />;
    case "drip-problem":
      return <DripProblem opacity={opacity} frame={frame} fps={fps} totalFrames={totalFrames} />;
    case "always-on":
      return <AlwaysOn opacity={opacity} frame={frame} fps={fps} />;
    case "realtors":
      return (
        <RealtorsTraction opacity={opacity} frame={frame} fps={fps} totalFrames={totalFrames} />
      );
    case "vision":
      return <PlatformVision opacity={opacity} frame={frame} fps={fps} totalFrames={totalFrames} />;
    case "cta":
      return <CtaFinale opacity={opacity} frame={frame} fps={fps} totalFrames={totalFrames} />;
    default:
      return null;
  }
}

// ── Shared Styles ────────────────────────────────────────────────────────────

const centerFlex: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const lowerThird: React.CSSProperties = {
  position: "absolute",
  bottom: 60,
  left: 60,
  display: "flex",
  alignItems: "center",
  gap: 16,
};

// ── MG1: Founder Title Lower-Third ───────────────────────────────────────────
// Slides in from left over the video. Shows name + role in a frosted glass bar.

function FounderTitle({ opacity, frame, fps }: { opacity: number; frame: number; fps: number }) {
  const slideX = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const xOffset = interpolate(slideX, [0, 1], [-200, 0]);

  // Detect which founder based on the global frame
  // This component is rendered inside a Sequence, so frame=0 is the start of the segment.
  // Daniel's segment starts at 0.5s, Roshan's at 4.5s.
  // We use the Sequence's from value to distinguish — but since both share the same type,
  // we use a simpler approach: Daniel's segment is first (shorter startFrame).
  // The MG_SEGMENTS order guarantees Daniel is rendered first.
  const isDaniel = frame < sToF(4.0); // Within Daniel's segment, frame is always < 4s worth

  const name = isDaniel ? "Daniel" : "Roshan";
  const role = isDaniel ? "CEO" : "CTO";

  return (
    <div style={{ ...lowerThird, opacity, transform: `translateX(${xOffset}px)` }}>
      {/* Frosted glass bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 24px",
          borderRadius: 12,
          backgroundColor: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Accent dot */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: BRAND_GREEN,
            boxShadow: `0 0 8px ${BRAND_GREEN}`,
          }}
        />
        <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: -0.5 }}>
          {name}
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: 2,
          }}
        >
          {role}
        </span>
      </div>
    </div>
  );
}

// ── MG2: Berkeley Badge ──────────────────────────────────────────────────────
// Small badge in upper-right: "UC Berkeley · 5 Years" with a subtle glow.

function BerkeleyBadge({ opacity, frame, fps }: { opacity: number; frame: number; fps: number }) {
  const scale = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });

  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        right: 48,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 20px",
          borderRadius: 50,
          backgroundColor: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
        }}
      >
        {/* Berkeley gold accent */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FDB515, #C4820E)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 800,
            color: "#1a2a5e",
          }}
        >
          B
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>UC Berkeley</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>5 Years</span>
      </div>
    </div>
  );
}

// ── MG3: Product Reveal ──────────────────────────────────────────────────────
// Full-screen: "Apten" brand + animated SMS conversation showing AI qualifying a lead.
// White background with clean typography.

function ProductReveal({
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
  const progress = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100, mass: 0.8 } });

  // Stagger chat bubbles
  const bubble1 = interpolate(progress, [0.15, 0.25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bubble2 = interpolate(progress, [0.35, 0.45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bubble3 = interpolate(progress, [0.55, 0.65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bubble4 = interpolate(progress, [0.7, 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tagline = interpolate(progress, [0.85, 0.95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", opacity }}>
      <div style={{ ...centerFlex, flexDirection: "column", gap: 32 }}>
        {/* Brand */}
        <div
          style={{
            transform: `scale(${logoScale})`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${BRAND_BLUE}, #7c3aed)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>A</span>
          </div>
          <span style={{ fontSize: 42, fontWeight: 800, color: BRAND_DARK, letterSpacing: -1 }}>
            Apten
          </span>
        </div>

        {/* SMS Conversation Mockup */}
        <div
          style={{
            width: 380,
            padding: 20,
            borderRadius: 20,
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Lead message */}
          <ChatBubble
            text="Hi, I saw your listing on Zillow for 123 Oak St"
            isAI={false}
            opacity={bubble1}
          />
          {/* AI response */}
          <ChatBubble
            text="Great choice! That home has 3 beds, 2 baths. Are you pre-approved for financing?"
            isAI={true}
            opacity={bubble2}
          />
          {/* Lead reply */}
          <ChatBubble text="Yes, up to $650k" isAI={false} opacity={bubble3} />
          {/* AI qualification */}
          <ChatBubble
            text="Perfect! I'll schedule a showing for you. What times work this week?"
            isAI={true}
            opacity={bubble4}
          />
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: tagline,
            fontSize: 16,
            fontWeight: 600,
            color: "#64748b",
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          AI that engages &amp; qualifies leads over text
        </div>
      </div>
    </AbsoluteFill>
  );
}

function ChatBubble({ text, isAI, opacity }: { text: string; isAI: boolean; opacity: number }) {
  const slideY = interpolate(opacity, [0, 1], [12, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${slideY}px)`,
        alignSelf: isAI ? "flex-start" : "flex-end",
        maxWidth: "85%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 14,
          backgroundColor: isAI ? BRAND_BLUE : "#e2e8f0",
          color: isAI ? "#fff" : BRAND_DARK,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.4,
        }}
      >
        {text}
      </div>
      {isAI && <span style={{ fontSize: 9, color: "#94a3b8", marginLeft: 4 }}>Apten AI</span>}
    </div>
  );
}

// ── MG4: Problem — Manual Process ────────────────────────────────────────────
// Shows overwhelmed human assistants: person icons, incoming message flood, clock.

function ProblemManual({
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
  const progress = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headingIn = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  // Stagger the problem cards
  const card1 = interpolate(progress, [0.1, 0.25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const card2 = interpolate(progress, [0.3, 0.45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const card3 = interpolate(progress, [0.5, 0.65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cost callout at the end
  const costIn = interpolate(progress, [0.75, 0.9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", opacity }}>
      <div style={{ ...centerFlex, flexDirection: "column", gap: 36 }}>
        {/* Heading */}
        <div
          style={{
            opacity: headingIn,
            fontSize: 14,
            fontWeight: 600,
            color: BRAND_RED,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          The Problem Today
        </div>

        {/* Problem cards */}
        <div style={{ display: "flex", gap: 24 }}>
          <ProblemCard
            icon="👤"
            title="Human Assistants"
            subtitle="Expensive, slow to scale"
            opacity={card1}
          />
          <ProblemCard
            icon="💬"
            title="Manual Texting"
            subtitle="Leads go cold in minutes"
            opacity={card2}
          />
          <ProblemCard
            icon="⏰"
            title="Limited Hours"
            subtitle="Leads arrive 24/7"
            opacity={card3}
          />
        </div>

        {/* Cost callout */}
        <div
          style={{
            opacity: costIn,
            transform: `translateY(${interpolate(costIn, [0, 1], [10, 0])}px)`,
            fontSize: 20,
            fontWeight: 700,
            color: BRAND_DARK,
          }}
        >
          Businesses lose <span style={{ color: BRAND_RED }}>78%</span> of leads to slow response
        </div>
      </div>
    </AbsoluteFill>
  );
}

function ProblemCard({
  icon,
  title,
  subtitle,
  opacity,
}: {
  icon: string;
  title: string;
  subtitle: string;
  opacity: number;
}) {
  const slideY = interpolate(opacity, [0, 1], [20, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${slideY}px)`,
        width: 200,
        padding: 24,
        borderRadius: 16,
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 32 }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: BRAND_DARK }}>{title}</span>
      <span style={{ fontSize: 12, color: "#64748b" }}>{subtitle}</span>
    </div>
  );
}

// ── MG5: Drip Texting Problem ────────────────────────────────────────────────
// Shows "Drip Texting" being struck through, then reveals the limitations.

function DripProblem({
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
  const progress = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleIn = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  // Strikethrough animation
  const strikeWidth = interpolate(progress, [0.2, 0.4], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Limitation items stagger
  const lim1 = interpolate(progress, [0.4, 0.55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lim2 = interpolate(progress, [0.55, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lim3 = interpolate(progress, [0.7, 0.85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", opacity }}>
      <div style={{ ...centerFlex, flexDirection: "column", gap: 36 }}>
        {/* "Drip Texting" with strikethrough */}
        <div style={{ position: "relative", opacity: titleIn }}>
          <span style={{ fontSize: 40, fontWeight: 800, color: "#94a3b8" }}>Drip Texting</span>
          {/* Animated strikethrough line */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              height: 4,
              width: `${strikeWidth}%`,
              backgroundColor: BRAND_RED,
              borderRadius: 2,
              transform: "translateY(-50%)",
            }}
          />
        </div>

        {/* Limitations */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <LimitationRow text="Not conversational" emoji="🚫" opacity={lim1} />
          <LimitationRow text="Can't qualify leads" emoji="🚫" opacity={lim2} />
          <LimitationRow text="Not equipped for 24/7" emoji="🚫" opacity={lim3} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function LimitationRow({ text, emoji, opacity }: { text: string; emoji: string; opacity: number }) {
  const slideX = interpolate(opacity, [0, 1], [30, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${slideX}px)`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontSize: 20,
        fontWeight: 600,
        color: BRAND_DARK,
      }}
    >
      <span>{emoji}</span>
      <span>{text}</span>
    </div>
  );
}

// ── MG6: 24/7 Always On ──────────────────────────────────────────────────────
// Overlay badge showing "24/7" with a pulsing glow — stays over the video.

function AlwaysOn({ opacity, frame, fps }: { opacity: number; frame: number; fps: number }) {
  const scale = spring({ frame, fps, config: { damping: 10, stiffness: 140, mass: 0.6 } });

  // Pulsing glow
  const pulse = interpolate(Math.sin(frame * 0.15), [-1, 1], [0.4, 0.8]);

  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        right: 48,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 28px",
          borderRadius: 16,
          background: `linear-gradient(135deg, ${BRAND_GREEN}, #059669)`,
          boxShadow: `0 0 ${pulse * 40}px rgba(16, 185, 129, ${pulse})`,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#fff",
            boxShadow: "0 0 6px rgba(255,255,255,0.8)",
          }}
        />
        <span style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>24/7</span>
      </div>
    </div>
  );
}

// ── MG7: Realtors Traction ───────────────────────────────────────────────────
// Real estate focused: house icons, engagement metrics, "Working with Realtors."

function RealtorsTraction({
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
  const progress = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headingScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });

  // Metrics counters
  const countProgress = interpolate(progress, [0.15, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stat1 = interpolate(progress, [0.1, 0.25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stat2 = interpolate(progress, [0.25, 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stat3 = interpolate(progress, [0.4, 0.55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitle = interpolate(progress, [0.7, 0.85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", opacity }}>
      <div style={{ ...centerFlex, flexDirection: "column", gap: 32 }}>
        {/* Heading */}
        <div
          style={{
            transform: `scale(${headingScale})`,
            fontSize: 14,
            fontWeight: 600,
            color: BRAND_BLUE,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Early Traction
        </div>

        {/* Metric cards */}
        <div style={{ display: "flex", gap: 28 }}>
          <MetricCard
            icon="🏠"
            value={`${Math.floor(countProgress * 500)}+`}
            label="Leads Engaged"
            opacity={stat1}
          />
          <MetricCard
            icon="📈"
            value={`${Math.floor(countProgress * 3.2 * 10) / 10}x`}
            label="Response Rate"
            opacity={stat2}
          />
          <MetricCard
            icon="⚡"
            value={`< ${Math.max(1, Math.floor((1 - countProgress) * 60))}s`}
            label="Avg Response Time"
            opacity={stat3}
          />
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: subtitle,
            fontSize: 18,
            fontWeight: 600,
            color: "#64748b",
          }}
        >
          Helping realtors engage{" "}
          <span style={{ color: BRAND_BLUE }}>home buyers &amp; sellers</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function MetricCard({
  icon,
  value,
  label,
  opacity,
}: {
  icon: string;
  value: string;
  label: string;
  opacity: number;
}) {
  const slideY = interpolate(opacity, [0, 1], [16, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${slideY}px)`,
        width: 180,
        padding: 24,
        borderRadius: 16,
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 28 }}>{icon}</span>
      <span
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: BRAND_DARK,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{label}</span>
    </div>
  );
}

// ── MG8: Platform Vision ─────────────────────────────────────────────────────
// "Any business can build an AI SMS agent" — shows the platform concept.

function PlatformVision({
  opacity,
  frame,
  fps: _fps,
  totalFrames,
}: {
  opacity: number;
  frame: number;
  fps: number;
  totalFrames: number;
}) {
  const progress = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Stagger business icons
  const icons = ["🏥", "🏪", "🏗️", "🎓", "🏦"];
  const iconEntries = icons.map((_, i) => {
    const p = interpolate(progress, [0.05 + i * 0.08, 0.15 + i * 0.08], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return p;
  });

  // Arrow + "AI Agent" reveal
  const arrowIn = interpolate(progress, [0.5, 0.65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const agentIn = interpolate(progress, [0.65, 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", opacity }}>
      <div style={{ ...centerFlex, flexDirection: "column", gap: 36 }}>
        {/* Heading */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#64748b",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Long-Term Vision
        </div>

        {/* Business icons → Arrow → AI Agent */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* Business icons */}
          <div style={{ display: "flex", gap: 12 }}>
            {icons.map((icon, i) => (
              <div
                key={i}
                style={{
                  opacity: iconEntries[i],
                  transform: `scale(${iconEntries[i]})`,
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                {icon}
              </div>
            ))}
          </div>

          {/* Arrow */}
          <div
            style={{
              opacity: arrowIn,
              fontSize: 28,
              color: BRAND_BLUE,
              transform: `translateX(${interpolate(arrowIn, [0, 1], [-10, 0])}px)`,
            }}
          >
            →
          </div>

          {/* AI Agent box */}
          <div
            style={{
              opacity: agentIn,
              transform: `scale(${agentIn})`,
              padding: "16px 24px",
              borderRadius: 16,
              background: `linear-gradient(135deg, ${BRAND_BLUE}, #7c3aed)`,
              boxShadow: `0 8px 32px rgba(37, 99, 235, 0.3)`,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 20 }}>🤖</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>AI SMS Agent</span>
          </div>
        </div>

        {/* Platform tagline */}
        <div
          style={{
            opacity: agentIn,
            fontSize: 22,
            fontWeight: 700,
            color: BRAND_DARK,
          }}
        >
          Any business. One platform.
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── MG9: CTA Finale ──────────────────────────────────────────────────────────
// Apten logo + "Build your AI agent" CTA. Clean, bold ending.

function CtaFinale({
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
  const progress = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const logoScale = spring({ frame, fps, config: { damping: 10, stiffness: 120, mass: 0.7 } });

  const ctaIn = interpolate(progress, [0.3, 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ycBadge = interpolate(progress, [0.6, 0.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Hold at the end
  const endFade = interpolate(frame, [totalFrames - 15, totalFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", opacity: opacity * endFade }}>
      <div style={{ ...centerFlex, flexDirection: "column", gap: 28 }}>
        {/* Apten logo */}
        <div
          style={{
            transform: `scale(${logoScale})`,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${BRAND_BLUE}, #7c3aed)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>A</span>
          </div>
          <span style={{ fontSize: 52, fontWeight: 800, color: BRAND_DARK, letterSpacing: -1 }}>
            Apten
          </span>
        </div>

        {/* CTA text */}
        <div
          style={{
            opacity: ctaIn,
            transform: `translateY(${interpolate(ctaIn, [0, 1], [12, 0])}px)`,
            fontSize: 20,
            fontWeight: 600,
            color: "#64748b",
          }}
        >
          AI-powered lead engagement over text
        </div>

        {/* YC badge */}
        <div
          style={{
            opacity: ycBadge,
            transform: `scale(${ycBadge})`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            borderRadius: 50,
            backgroundColor: "#fff7ed",
            border: "1px solid #fed7aa",
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              backgroundColor: BRAND_ORANGE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            Y
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#9a3412" }}>Y Combinator S24</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
  Video,
  OffthreadVideo,
  staticFile,
} from "remotion";
import type {
  Scene,
  TextElement,
  ImageElement,
  VideoElement,
  AnimationConfig,
} from "../types/video";

function applyAnimation(
  frame: number,
  fps: number,
  animation?: AnimationConfig,
): React.CSSProperties {
  if (!animation || animation.type === "none") {
    return {};
  }

  const delay = animation.delay ?? 0;
  const adjustedFrame = Math.max(0, frame - delay);
  const progress = interpolate(adjustedFrame, [0, animation.durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  switch (animation.type) {
    case "fade-in":
      return { opacity: progress };
    case "fade-out":
      return { opacity: 1 - progress };
    case "slide-up":
      return {
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px)`,
      };
    case "slide-down":
      return {
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [-40, 0])}px)`,
      };
    case "slide-left":
      return {
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [60, 0])}px)`,
      };
    case "slide-right":
      return {
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [-60, 0])}px)`,
      };
    case "scale": {
      const scale = spring({ frame: adjustedFrame, fps, config: { damping: 12, stiffness: 100 } });
      return { transform: `scale(${scale})`, opacity: Math.min(progress * 2, 1) };
    }
    default:
      return {};
  }
}

function TextElementRenderer({
  element,
  frame,
  fps,
}: {
  element: TextElement;
  frame: number;
  fps: number;
}) {
  const animStyles = applyAnimation(frame, fps, element.animation);

  return (
    <div
      style={{
        position: "absolute",
        left: element.x,
        top: element.y,
        transform: "translate(-50%, -50%)",
        fontSize: element.fontSize,
        fontFamily: element.fontFamily,
        fontWeight: element.fontWeight,
        color: element.color,
        opacity: element.opacity,
        textAlign: "center",
        whiteSpace: "pre-line",
        lineHeight: 1.4,
        ...animStyles,
      }}
    >
      {element.text}
    </div>
  );
}

function ImageElementRenderer({ element }: { element: ImageElement }) {
  return (
    <div
      style={{
        position: "absolute",
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        opacity: element.opacity,
        borderRadius: element.borderRadius ?? 0,
        overflow: "hidden",
        transform: "translate(-50%, -50%)",
      }}
    >
      <img src={element.assetId} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}

function VideoElementRenderer({
  element,
  frame,
  fps,
}: {
  element: VideoElement;
  frame: number;
  fps: number;
}) {
  const animStyles = applyAnimation(frame, fps, element.animation);

  // Resolve the video source — if it starts with / or http, use directly; otherwise try staticFile
  const src =
    element.assetId.startsWith("/") ||
    element.assetId.startsWith("http") ||
    element.assetId.startsWith("blob:")
      ? element.assetId
      : staticFile(element.assetId);

  // Use <Video> for blob URLs (OffthreadVideo uses workers that can't access blob URLs)
  const useRegularVideo = src.startsWith("blob:");

  return (
    <div
      style={{
        position: "absolute",
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        overflow: "hidden",
        transform: "translate(-50%, -50%)",
        ...animStyles,
      }}
    >
      {useRegularVideo ? (
        <Video
          src={src}
          startFrom={element.startFrom ?? 0}
          endAt={element.endAt}
          volume={element.volume ?? 1}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <OffthreadVideo
          src={src}
          startFrom={element.startFrom ?? 0}
          endAt={element.endAt}
          volume={element.volume ?? 1}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
    </div>
  );
}

export function SceneRenderer({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: scene.backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, ${scene.backgroundColor}00 0%, ${scene.backgroundColor} 70%)`,
        }}
      />
      {scene.elements.map((element) => {
        if ("text" in element && "fontSize" in element) {
          return <TextElementRenderer key={element.id} element={element} frame={frame} fps={fps} />;
        }
        if ("assetId" in element && "startFrom" in element) {
          return (
            <VideoElementRenderer key={element.id} element={element} frame={frame} fps={fps} />
          );
        }
        if ("assetId" in element && "width" in element) {
          return <ImageElementRenderer key={element.id} element={element as ImageElement} />;
        }
        return null;
      })}
    </AbsoluteFill>
  );
}

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface Props {
  children: React.ReactNode;
  durationInFrames: number;
}

/** Wraps a scene with spring fade+scale in/out transitions */
export const SceneTransition: React.FC<Props> = ({ children, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeInFrames = 12;
  const fadeOutFrames = 12;

  // Entry
  const entryProgress = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: fadeInFrames,
  });
  // Exit
  const exitFrame = Math.max(0, frame - (durationInFrames - fadeOutFrames));
  const exitProgress =
    exitFrame > 0
      ? spring({
          frame: exitFrame,
          fps,
          config: { damping: 18, stiffness: 120 },
          durationInFrames: fadeOutFrames,
        })
      : 0;

  const opacity =
    interpolate(entryProgress, [0, 1], [0, 1]) * interpolate(exitProgress, [0, 1], [1, 0]);
  const scale =
    interpolate(entryProgress, [0, 1], [0.95, 1]) * interpolate(exitProgress, [0, 1], [1, 0.95]);

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `scale(${scale})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

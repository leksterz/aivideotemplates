import { AbsoluteFill, Sequence, Audio, interpolate, useCurrentFrame } from "remotion";
import type { VideoComposition as VideoCompType } from "../types/video";
import { MotionGraphicRenderer } from "./MotionGraphicRenderer";
import { SceneRenderer } from "./SceneRenderer";

interface Props {
  composition: VideoCompType;
  showMotionGraphics?: boolean;
}

function TransitionOverlay({ type, progress }: { type: string; progress: number }) {
  switch (type) {
    case "fade":
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "#000",
            opacity: progress < 0.5 ? progress * 2 : (1 - progress) * 2,
          }}
        />
      );
    case "wipe":
      return (
        <AbsoluteFill
          style={{
            background: `linear-gradient(to right, transparent ${progress * 100}%, #000 ${progress * 100}%)`,
          }}
        />
      );
    default:
      return null;
  }
}

/**
 * Layer-based compositor. Renders all visual layers by layerOrder (bottom to top).
 * Each layer is a Sequence positioned at its absolute startFrame.
 * layerOrder[0] = background (rendered first), layerOrder[last] = foreground (rendered last).
 */
export function VideoComposition({ composition, showMotionGraphics = true }: Props) {
  const frame = useCurrentFrame();
  const order = composition.layerOrder || [];

  // Build lookup maps
  const sceneMap = new Map(composition.scenes.map((s) => [`scene:${s.id}`, s]));
  const mgMap = new Map(composition.motionGraphics.map((mg) => [`mg:${mg.id}`, mg]));
  const audioMap = new Map(composition.audioTracks.map((a) => [`audio:${a.id}`, a]));

  // Collect ordered layers (visual + audio)
  const renderLayers: React.ReactNode[] = [];

  for (const key of order) {
    const [type] = key.split(":");

    if (type === "scene") {
      const scene = sceneMap.get(key);
      if (!scene) {
        continue;
      }
      const startFrame = scene.startFrame ?? 0;

      renderLayers.push(
        <Sequence
          key={key}
          from={startFrame}
          durationInFrames={scene.durationInFrames}
          name={scene.name}
        >
          <SceneRenderer scene={scene} />
          {scene.transition && scene.transition.type !== "cut" && (
            <TransitionOverlay
              type={scene.transition.type}
              progress={interpolate(
                frame - startFrame,
                [
                  scene.durationInFrames - scene.transition.durationInFrames,
                  scene.durationInFrames,
                ],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              )}
            />
          )}
        </Sequence>,
      );
      sceneMap.delete(key);
    } else if (type === "mg") {
      if (!showMotionGraphics) {
        continue;
      }
      const mg = mgMap.get(key);
      if (!mg) {
        continue;
      }
      renderLayers.push(
        <Sequence
          key={key}
          from={mg.startFrame}
          durationInFrames={mg.endFrame - mg.startFrame}
          name={`MG: ${mg.name}`}
        >
          <MotionGraphicRenderer segment={mg} />
        </Sequence>,
      );
      mgMap.delete(key);
    } else if (type === "audio") {
      const track = audioMap.get(key);
      if (!track) {
        continue;
      }
      // Compute volume with optional fade in/out
      const fadeInFrames = track.fadeIn ?? 0;
      const fadeOutFrames = track.fadeOut ?? 0;
      renderLayers.push(
        <Sequence
          key={key}
          from={track.startFrame}
          durationInFrames={track.durationInFrames}
          name={`Audio: ${track.name}`}
        >
          <Audio
            src={track.assetId}
            volume={(f) => {
              let vol = track.volume;
              // Fade in
              if (fadeInFrames > 0 && f < fadeInFrames) {
                vol *= f / fadeInFrames;
              }
              // Fade out
              if (fadeOutFrames > 0 && f > track.durationInFrames - fadeOutFrames) {
                vol *= (track.durationInFrames - f) / fadeOutFrames;
              }
              return Math.max(0, Math.min(1, vol));
            }}
          />
        </Sequence>,
      );
      audioMap.delete(key);
    }
  }

  // Render any orphaned items not in layerOrder (backwards compat)
  for (const [, scene] of sceneMap) {
    const startFrame = scene.startFrame ?? 0;
    renderLayers.push(
      <Sequence
        key={`scene:${scene.id}`}
        from={startFrame}
        durationInFrames={scene.durationInFrames}
        name={scene.name}
      >
        <SceneRenderer scene={scene} />
      </Sequence>,
    );
  }
  if (showMotionGraphics) {
    for (const [, mg] of mgMap) {
      renderLayers.push(
        <Sequence
          key={`mg:${mg.id}`}
          from={mg.startFrame}
          durationInFrames={mg.endFrame - mg.startFrame}
          name={`MG: ${mg.name}`}
        >
          <MotionGraphicRenderer segment={mg} />
        </Sequence>,
      );
    }
  }
  for (const [, track] of audioMap) {
    renderLayers.push(
      <Sequence
        key={`audio:${track.id}`}
        from={track.startFrame}
        durationInFrames={track.durationInFrames}
        name={`Audio: ${track.name}`}
      >
        <Audio src={track.assetId} volume={track.volume} />
      </Sequence>,
    );
  }

  return <AbsoluteFill style={{ backgroundColor: "#000" }}>{renderLayers}</AbsoluteFill>;
}

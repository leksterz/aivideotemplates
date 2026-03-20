import { Player, type PlayerRef } from "@remotion/player";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AptenDemo } from "../remotion/AptenDemo";
import { OpenClawdVideo } from "../remotion/OpenClawdVideo";
import {
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
  VIDEO_FPS,
  TOTAL_FRAMES,
  APTEN_FPS,
  APTEN_TOTAL_FRAMES,
  APTEN_WIDTH,
  APTEN_HEIGHT,
} from "../remotion/theme";
import { VideoComposition } from "../remotion/VideoComposition";
import { useVideoStore } from "../store/video-store";
import { getTotalDurationInFrames } from "../types/video";

type PreviewMode = "editor" | "demo-openclawd" | "demo-apten";

export function VideoPreview() {
  const composition = useVideoStore((s) => s.composition);
  const isPlaying = useVideoStore((s) => s.isPlaying);
  const currentFrame = useVideoStore((s) => s.currentFrame);
  const setPlaying = useVideoStore((s) => s.setPlaying);
  const setCurrentFrame = useVideoStore((s) => s.setCurrentFrame);
  const showMotionGraphics = useVideoStore((s) => s.showMotionGraphics);

  // Cycle through: editor → demo-apten → demo-openclawd
  const [mode, setMode] = useState<PreviewMode>("editor");

  const playerRef = useRef<PlayerRef>(null);

  const editFrames = getTotalDurationInFrames(composition);

  const totalFrames =
    mode === "demo-apten"
      ? APTEN_TOTAL_FRAMES
      : mode === "demo-openclawd"
        ? TOTAL_FRAMES
        : editFrames;
  const fps =
    mode === "demo-apten" ? APTEN_FPS : mode === "demo-openclawd" ? VIDEO_FPS : composition.fps;
  const width =
    mode === "demo-apten"
      ? APTEN_WIDTH
      : mode === "demo-openclawd"
        ? VIDEO_WIDTH
        : composition.width;
  const height =
    mode === "demo-apten"
      ? APTEN_HEIGHT
      : mode === "demo-openclawd"
        ? VIDEO_HEIGHT
        : composition.height;
  const totalSeconds = totalFrames / fps;
  const currentSeconds = currentFrame / fps;

  const isDemo = mode !== "editor";

  // Sync frame updates from Remotion Player via ref event listener
  const seekingFromStore = useRef(false);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    const onFrame = () => {
      // Don't write back to store if we're in the middle of a store-driven seek
      if (seekingFromStore.current) {
        return;
      }
      const frame = player.getCurrentFrame();
      setCurrentFrame(frame);
    };

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);

    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onEnded);

    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onEnded);
    };
  }, [mode, setCurrentFrame, setPlaying]);

  // Sync store → Player: when currentFrame changes from timeline click, seek the Player
  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    const playerFrame = player.getCurrentFrame();
    // Only seek if the store frame differs from the Player's frame (external change)
    if (Math.abs(playerFrame - currentFrame) > 1) {
      seekingFromStore.current = true;
      player.seekTo(currentFrame);
      // Allow frameupdate writes again after a tick
      requestAnimationFrame(() => {
        seekingFromStore.current = false;
      });
    }
  }, [currentFrame]);

  const togglePlay = useCallback(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    }
  }, [isPlaying]);

  const skipBack = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      setCurrentFrame(0);
    }
  }, [setCurrentFrame]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Player Container — canvas area with checkerboard bg */}
      <div
        className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden"
        style={{
          backgroundColor: "#1a1a1a",
          backgroundImage:
            "linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        }}
      >
        <div
          className="relative w-full bg-neutral-900 rounded-lg overflow-hidden"
          style={{
            maxWidth: 800,
            maxHeight: "100%",
            aspectRatio: `${width}/${height}`,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.5)",
          }}
        >
          {mode === "demo-apten" ? (
            <Player
              key="demo-apten"
              ref={playerRef}
              component={AptenDemo}
              inputProps={{}}
              durationInFrames={Math.max(APTEN_TOTAL_FRAMES, 1)}
              compositionWidth={APTEN_WIDTH}
              compositionHeight={APTEN_HEIGHT}
              fps={APTEN_FPS}
              style={{ width: "100%", height: "100%" }}
              acknowledgeRemotionLicense
            />
          ) : mode === "demo-openclawd" ? (
            <Player
              key="demo-openclawd"
              ref={playerRef}
              component={OpenClawdVideo}
              inputProps={{}}
              durationInFrames={Math.max(TOTAL_FRAMES, 1)}
              compositionWidth={VIDEO_WIDTH}
              compositionHeight={VIDEO_HEIGHT}
              fps={VIDEO_FPS}
              style={{ width: "100%", height: "100%" }}
              acknowledgeRemotionLicense
            />
          ) : (
            <Player
              key="edit"
              ref={playerRef}
              component={VideoComposition}
              inputProps={{ composition, showMotionGraphics }}
              durationInFrames={Math.max(editFrames, 1)}
              compositionWidth={composition.width}
              compositionHeight={composition.height}
              fps={composition.fps}
              style={{ width: "100%", height: "100%" }}
              acknowledgeRemotionLicense
            />
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-4 px-6 py-3 bg-editor-surface border-t border-editor-border">
        {/* Transport */}
        <div className="flex items-center gap-1">
          <button
            onClick={skipBack}
            className="p-1.5 rounded-lg hover:bg-editor-panel transition-colors text-editor-muted hover:text-editor-text"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            className="p-2.5 rounded-full bg-editor-accent hover:bg-editor-accent-hover transition-colors shadow-soft"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" />
            )}
          </button>
          <button className="p-1.5 rounded-lg hover:bg-editor-panel transition-colors text-editor-muted hover:text-editor-text">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-editor-text">{formatTime(currentSeconds)}</span>
          <span className="text-editor-muted">/</span>
          <span className="text-editor-muted">{formatTime(totalSeconds)}</span>
        </div>

        {/* Progress bar */}
        <div className="flex-1 h-1.5 bg-editor-border rounded-full overflow-hidden cursor-pointer group">
          <div
            className="h-full bg-editor-accent rounded-full transition-all"
            style={{ width: `${totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0}%` }}
          />
        </div>

        {/* Mode toggle — cycles: Editor → Apten Demo → OpenClawd Demo */}
        <button
          onClick={() => {
            const next: PreviewMode =
              mode === "editor"
                ? "demo-apten"
                : mode === "demo-apten"
                  ? "demo-openclawd"
                  : "editor";
            setMode(next);
            setCurrentFrame(0);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] text-editor-muted hover:text-editor-text hover:bg-editor-panel transition-colors"
          title={
            mode === "editor"
              ? "Switch to Apten demo"
              : mode === "demo-apten"
                ? "Switch to OpenClawd demo"
                : "Switch to editor mode"
          }
        >
          {isDemo ? (
            <ToggleLeft className="w-3.5 h-3.5" />
          ) : (
            <ToggleRight className="w-3.5 h-3.5 text-editor-accent" />
          )}
          {mode === "editor" ? "Editor" : mode === "demo-apten" ? "Apten" : "OpenClawd"}
        </button>

        {/* FPS / Resolution */}
        <div className="flex items-center gap-2 text-[10px] text-editor-muted">
          <span>
            {width}x{height}
          </span>
          <span>{fps}fps</span>
        </div>

        <button className="p-1.5 rounded-lg hover:bg-editor-panel transition-colors text-editor-muted hover:text-editor-text">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
}

import { AbsoluteFill, Sequence } from "remotion";
import { ChatInterface } from "./scenes/ChatInterface";
import { GitHubCta } from "./scenes/GitHubCta";
import { HomeScreen } from "./scenes/HomeScreen";
import { LogoCombo } from "./scenes/LogoCombo";
import { McpCatalog } from "./scenes/McpCatalog";
import { MessagingBots } from "./scenes/MessagingBots";
import { ProviderSwitch } from "./scenes/ProviderSwitch";
import { TerminalInstall } from "./scenes/TerminalInstall";
import { colors, SCENE_FRAMES } from "./theme";

const scenes = [
  { Component: TerminalInstall, frames: SCENE_FRAMES.terminal },
  { Component: HomeScreen, frames: SCENE_FRAMES.homeScreen },
  { Component: ChatInterface, frames: SCENE_FRAMES.chat },
  { Component: ProviderSwitch, frames: SCENE_FRAMES.providerSwitch },
  { Component: McpCatalog, frames: SCENE_FRAMES.mcpCatalog },
  { Component: MessagingBots, frames: SCENE_FRAMES.messaging },
  { Component: LogoCombo, frames: SCENE_FRAMES.logoComo },
  { Component: GitHubCta, frames: SCENE_FRAMES.githubCta },
];

export const OpenClawdVideo: React.FC = () => {
  let offset = 0;
  const sequencedScenes = scenes.map(({ Component, frames }, i) => {
    const from = offset;
    offset += frames;
    return (
      <Sequence
        key={i}
        from={from}
        durationInFrames={frames}
        name={Component.name || `Scene ${i + 1}`}
      >
        <AbsoluteFill
          style={{
            backgroundColor: colors.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Component />
        </AbsoluteFill>
      </Sequence>
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {sequencedScenes}

      {/* Background music — uncomment when audio file is available */}
      {/* <Audio src="/audio/headphonk.mp3" volume={musicVolume} /> */}
    </AbsoluteFill>
  );
};

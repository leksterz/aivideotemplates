import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { AppWindow } from "../components/AppWindow";
import { SceneTransition } from "../components/SceneTransition";
import { colors, fonts } from "../theme";

const CATEGORIES = ["All", "Core", "Database", "Developer", "Communication"];

const SERVERS = [
  {
    name: "Filesystem",
    icon: "📁",
    desc: "Read, write, search files",
    auth: "none",
    installed: true,
  },
  { name: "Git", icon: "🔀", desc: "Version control operations", auth: "none", installed: true },
  { name: "GitHub", icon: "🐙", desc: "Issues, PRs, repos", auth: "token", installed: true },
  {
    name: "PostgreSQL",
    icon: "🐘",
    desc: "Database queries & schema",
    auth: "token",
    installed: false,
  },
  { name: "Slack", icon: "💬", desc: "Messages & channels", auth: "token", installed: false },
  { name: "Puppeteer", icon: "🌐", desc: "Browser automation", auth: "none", installed: false },
];

export const McpCatalog: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const modalSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 }, delay: 5 });

  return (
    <SceneTransition durationInFrames={140}>
      <AppWindow title="OpenClawd — Settings">
        <div style={{ height: "100%", background: colors.bg, position: "relative" }}>
          {/* Dimmed background */}
          <div style={{ position: "absolute", inset: 0, background: `${colors.bg}cc` }} />

          {/* Modal */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) scale(${0.9 + modalSpring * 0.1})`,
              opacity: modalSpring,
              width: "88%",
              maxHeight: "85%",
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}` }}>
              <div
                style={{ fontSize: 16, fontWeight: 600, color: colors.white, fontFamily: fonts.ui }}
              >
                MCP Server Catalog
              </div>
              <div style={{ fontSize: 12, color: colors.dim, fontFamily: fonts.ui, marginTop: 4 }}>
                20+ servers available
              </div>
            </div>

            {/* Category filters */}
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "12px 20px",
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              {CATEGORIES.map((cat, i) => {
                const active = i === 0;
                const catSpring = spring({
                  frame,
                  fps,
                  config: { damping: 16 },
                  delay: 12 + i * 3,
                });
                return (
                  <div
                    key={cat}
                    style={{
                      opacity: catSpring,
                      padding: "5px 14px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontFamily: fonts.ui,
                      background: active ? colors.amber : colors.bg,
                      color: active ? colors.bg : colors.muted,
                      fontWeight: active ? 600 : 400,
                      border: active ? "none" : `1px solid ${colors.border}`,
                    }}
                  >
                    {cat}
                  </div>
                );
              })}
            </div>

            {/* Server Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10,
                padding: 20,
              }}
            >
              {SERVERS.map((server, i) => {
                const cardSpring = spring({
                  frame,
                  fps,
                  config: { damping: 14, stiffness: 90 },
                  delay: 20 + i * 6,
                });
                return (
                  <div
                    key={server.name}
                    style={{
                      opacity: cardSpring,
                      transform: `translateY(${(1 - cardSpring) * 15}px)`,
                      background: colors.bg,
                      border: `1px solid ${server.installed ? `${colors.amber}40` : colors.border}`,
                      borderRadius: 12,
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{server.icon}</span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: colors.white,
                            fontFamily: fonts.ui,
                          }}
                        >
                          {server.name}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: colors.dim,
                        fontFamily: fonts.ui,
                        lineHeight: 1.4,
                      }}
                    >
                      {server.desc}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "auto",
                      }}
                    >
                      {/* Auth badge */}
                      <div
                        style={{
                          fontSize: 9,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background:
                            server.auth === "none" ? `${colors.green}20` : `${colors.amber}20`,
                          color: server.auth === "none" ? colors.green : colors.amber,
                          fontFamily: fonts.ui,
                          fontWeight: 600,
                        }}
                      >
                        {server.auth === "none" ? "No Auth" : "Requires Auth"}
                      </div>
                      {/* Install button */}
                      <div
                        style={{
                          fontSize: 10,
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: server.installed ? `${colors.green}20` : colors.surface,
                          color: server.installed ? colors.green : colors.muted,
                          border: server.installed
                            ? `1px solid ${colors.green}40`
                            : `1px solid ${colors.border}`,
                          fontFamily: fonts.ui,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {server.installed ? "✓ Installed" : "Install"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AppWindow>
    </SceneTransition>
  );
};

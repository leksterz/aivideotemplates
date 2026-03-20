import React from "react";
import { colors } from "../theme";

interface AppWindowProps {
  children: React.ReactNode;
  title?: string;
  style?: React.CSSProperties;
}

export const AppWindow: React.FC<AppWindowProps> = ({ children, title, style }) => {
  return (
    <div
      style={{
        width: "92%",
        height: "88%",
        borderRadius: 12,
        overflow: "hidden",
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        ...style,
      }}
    >
      {/* Chrome bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          background: colors.bg,
          borderBottom: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fbbf24" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
        </div>
        {title && (
          <div
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 12,
              color: colors.dim,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {title}
          </div>
        )}
        {title && <div style={{ width: 54 }} />}
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>{children}</div>
    </div>
  );
};

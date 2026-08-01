"use client";

import React, { useState } from "react";

interface TopbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function Topbar({ isDark, onToggleTheme }: TopbarProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const pillBg = "#1A1410";
  const pillBorder = "#2E2418";
  const textPrimary = "#F0E6D3";
  const textMuted = "#7A6A55";
  const dividerColor = "#2E2418";
  const hoverBg = "rgba(255,255,255,0.08)";

  return (
    <>
      {/* Floating centered pill */}
      <nav
        style={{
          position: "fixed",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          height: 40,
          background: pillBg,
          border: `1px solid ${pillBorder}`,
          borderRadius: 999,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          whiteSpace: "nowrap",
        }}
      >
        {/* Logo square */}
        <div style={{ width: 10, height: 10, background: "#D4891A", borderRadius: 2, flexShrink: 0 }} />

        {/* Title */}
        <span style={{ fontSize: 13, fontWeight: 500, color: textPrimary }}>
          Infocreon Internship &middot; Procurement Intelligence
        </span>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: dividerColor, flexShrink: 0 }} />

        {/* Live status */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "#6DBF8A" }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#6DBF8A" }} />
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: textMuted }}>
            Live
          </span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1, minWidth: 8 }} />

        {/* Button 1 — Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            border: "none",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: isDark ? "#D4891A" : "#7A6A55",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          {isDark ? (
            /* Sun icon — shown in dark mode */
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            /* Moon icon — shown in light mode */
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Button 3 — Info modal */}
        <button
          onClick={() => setIsInfoOpen(true)}
          title="System info"
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            border: "none",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: textMuted,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </button>
      </nav>

      {/* Info Modal Overlay */}
      {isInfoOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            zIndex: 60,
          }}
          onClick={() => setIsInfoOpen(false)}
        >
          <div
            style={{
              background: "#1A1410",
              border: "1px solid #2E2418",
              borderRadius: 8,
              padding: 20,
              minWidth: 260,
              maxWidth: 340,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #2E2418", paddingBottom: 12, marginBottom: 16 }}>
              <h3 style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7A6A55", margin: 0 }}>
                System Info
              </h3>
              <button
                onClick={() => setIsInfoOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#7A6A55", transition: "color 0.15s", padding: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#F0E6D3"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#7A6A55"; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Architect", value: "Sangeeth PS" },
                { label: "POC ID", value: "65" },
                { label: "POC Title", value: "Procurement Transparency Dashboard" },
                { label: "Batch", value: "Batch 4" },
              ].map((row, i) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid #2E2418", paddingBottom: 8 }}>
                  <span style={{ fontSize: 10, textTransform: "uppercase", color: "#7A6A55" }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#F0E6D3" }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 10, textTransform: "uppercase", color: "#7A6A55" }}>Stack</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#F0E6D3", lineHeight: 1.6 }}>
                  Next.js &middot; FastAPI &middot; MapLibre &middot; ECharts
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

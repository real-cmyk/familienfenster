import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(<LogoSvg />, { width: 512, height: 512 });
}

function LogoSvg() {
  return (
    <div
      style={{
        width: 512,
        height: 512,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "linear-gradient(145deg, #FDE8D0 0%, #E8A060 50%, #C1703A 100%)",
        borderRadius: 100,
      }}
    >
      {/* Fensterrahmen */}
      <div
        style={{
          width: 320,
          height: 260,
          background: "rgba(255,255,255,0.95)",
          borderRadius: 28,
          display: "flex",
          position: "relative",
          boxShadow: "0 12px 48px rgba(61,43,31,0.35)",
          border: "6px solid rgba(193,112,58,0.3)",
        }}
      >
        {/* Querbalken */}
        <div
          style={{
            position: "absolute",
            top: "46%",
            left: 0,
            right: 0,
            height: 18,
            background: "#C1703A",
            borderRadius: 4,
          }}
        />
        {/* Pfosten */}
        <div
          style={{
            position: "absolute",
            left: "46%",
            top: 0,
            bottom: 0,
            width: 18,
            background: "#C1703A",
            borderRadius: 4,
          }}
        />
        {/* Herz groß oben links */}
        <div style={{ position: "absolute", top: 14, left: 20, fontSize: 72 }}>
          ❤️
        </div>
        {/* Herz oben rechts */}
        <div style={{ position: "absolute", top: 18, right: 22, fontSize: 52 }}>
          🧡
        </div>
        {/* Herz unten links */}
        <div style={{ position: "absolute", bottom: 14, left: 22, fontSize: 48 }}>
          💛
        </div>
        {/* Stern unten rechts */}
        <div style={{ position: "absolute", bottom: 14, right: 22, fontSize: 44 }}>
          ✨
        </div>
      </div>
      {/* App-Name */}
      <div
        style={{
          color: "white",
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: -1,
          textShadow: "0 2px 8px rgba(61,43,31,0.4)",
        }}
      >
        Familienfenster
      </div>
    </div>
  );
}

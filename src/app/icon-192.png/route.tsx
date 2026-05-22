import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(<LogoSvg />, { width: 192, height: 192 });
}

function LogoSvg() {
  return (
    <div
      style={{
        width: 192,
        height: 192,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #FDE8D0 0%, #C1703A 100%)",
        borderRadius: 40,
      }}
    >
      {/* Fensterrahmen */}
      <div
        style={{
          width: 130,
          height: 110,
          background: "white",
          borderRadius: 12,
          display: "flex",
          position: "relative",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}
      >
        {/* Horizontaler Querbalken */}
        <div
          style={{
            position: "absolute",
            top: "46%",
            left: 0,
            right: 0,
            height: 8,
            background: "#C1703A",
          }}
        />
        {/* Vertikaler Pfosten */}
        <div
          style={{
            position: "absolute",
            left: "46%",
            top: 0,
            bottom: 0,
            width: 8,
            background: "#C1703A",
          }}
        />
        {/* Herz oben links */}
        <div style={{ position: "absolute", top: 8, left: 10, fontSize: 28 }}>
          ❤️
        </div>
        {/* Herz oben rechts */}
        <div style={{ position: "absolute", top: 8, right: 10, fontSize: 20 }}>
          ❤️
        </div>
        {/* Kleines Herz unten */}
        <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", fontSize: 16 }}>
          💛
        </div>
      </div>
    </div>
  );
}

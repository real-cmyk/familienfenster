"use client";

import { useState } from "react";

export default function WohlbefindenButton() {
  const [gesendet, setGesendet] = useState(false);
  const [laedt, setLaedt] = useState(false);

  async function handleDruck() {
    if (laedt || gesendet) return;
    setLaedt(true);
    try {
      await fetch("/api/wohlbefinden", { method: "POST" });
      setGesendet(true);
      setTimeout(() => setGesendet(false), 5000);
    } finally {
      setLaedt(false);
    }
  }

  return (
    <button
      onClick={handleDruck}
      disabled={laedt}
      className="rounded-full flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 animate-herzpuls"
      style={{
        width: "200px",
        height: "200px",
        background: gesendet ? "var(--farbe-gruen)" : "var(--farbe-warm-akzent)",
        color: "white",
        fontSize: "1.2rem",
        fontWeight: "700",
        boxShadow: "0 8px 24px rgba(193,112,58,0.35)",
      }}
      aria-label="Mir geht es gut — Nachricht an die Familie senden"
    >
      <span style={{ fontSize: "3rem" }} aria-hidden="true">
        {gesendet ? "✓" : "❤️"}
      </span>
      <span>{gesendet ? "Nachricht gesendet!" : "Mir geht es gut"}</span>
    </button>
  );
}

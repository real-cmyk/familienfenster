"use client";

import { useState } from "react";

export default function WohlbefindenKachel() {
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
      className="hs-tile"
      style={{
        background: gesendet ? "#E8F5E9" : "#FFF3E0",
        borderColor: gesendet ? "#4CAF50" : "#E8623A",
        color: gesendet ? "#1B5E20" : "#8B2500",
        border: `3px solid ${gesendet ? "#4CAF50" : "#E8623A"}`,
        width: "100%",
        cursor: "pointer",
        opacity: laedt ? 0.7 : 1,
      }}
      aria-label="Mir geht es gut — Nachricht an die Familie senden"
    >
      <div className="hs-tile-bild" style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: "36px" }}>
        <svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
          style={{ width: "100%", height: "100%", display: "block" }}>
          {gesendet ? (
            <>
              <circle cx="80" cy="60" r="50" fill="#C8E6C9" />
              <circle cx="80" cy="60" r="40" fill="#4CAF50" />
              <path d="M58 60 L74 76 L104 46" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : (
            <>
              <circle cx="80" cy="65" r="50" fill="#FFE0B2" opacity="0.6" />
              <path d="M42 62 C42 48 52 38 64 44 C70 34 80 30 80 30 C80 30 90 34 96 44 C108 38 118 48 118 62 C118 82 80 105 80 105 C80 105 42 82 42 62Z"
                fill="#E8623A" />
              <path d="M54 58 C54 48 60 43 67 46 C71 40 76 38 80 38"
                fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
            </>
          )}
        </svg>
      </div>
      <span className="hs-tile-label">
        {gesendet ? "Gesendet! ✓" : "Mir geht es gut"}
      </span>
    </button>
  );
}

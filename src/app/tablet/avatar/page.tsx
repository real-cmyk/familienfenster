"use client";

import { useState, useRef, useEffect } from "react";

type Nachricht = {
  rolle: "user" | "assistant";
  text: string;
};

function LinaGesicht({ redet }: { redet: boolean }) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "160px", height: "160px" }} aria-hidden="true">
      {/* Schatten */}
      <ellipse cx="102" cy="192" rx="60" ry="10" fill="rgba(0,0,0,0.12)" />
      {/* Kopf */}
      <circle cx="100" cy="95" r="75" fill="#F5C5A0" />
      {/* Haare (grau, kurz) */}
      <ellipse cx="100" cy="30" rx="72" ry="35" fill="#B0B0B0" />
      <ellipse cx="34" cy="65" rx="22" ry="40" fill="#B0B0B0" />
      <ellipse cx="166" cy="65" rx="22" ry="40" fill="#B0B0B0" />
      {/* Wangen-Rouge */}
      <ellipse cx="62" cy="115" rx="18" ry="12" fill="rgba(230,100,80,0.25)" />
      <ellipse cx="138" cy="115" rx="18" ry="12" fill="rgba(230,100,80,0.25)" />
      {/* Augen */}
      <ellipse cx="76" cy="90" rx="11" ry="9" fill="white" />
      <ellipse cx="124" cy="90" rx="11" ry="9" fill="white" />
      <circle cx="78" cy="91" r="6" fill="#5D4037" />
      <circle cx="126" cy="91" r="6" fill="#5D4037" />
      <circle cx="80" cy="89" r="2" fill="white" />
      <circle cx="128" cy="89" r="2" fill="white" />
      {/* Augenbrauen */}
      <path d="M65 78 Q76 73 87 78" fill="none" stroke="#8D6E63" strokeWidth="3" strokeLinecap="round" />
      <path d="M113 78 Q124 73 135 78" fill="none" stroke="#8D6E63" strokeWidth="3" strokeLinecap="round" />
      {/* Nase */}
      <ellipse cx="100" cy="108" rx="7" ry="5" fill="#E8A070" />
      {/* Mund – animiert wenn redet */}
      {redet ? (
        <>
          <ellipse cx="100" cy="130" rx="18" ry="12" fill="#C0392B" />
          <ellipse cx="100" cy="132" rx="14" ry="7" fill="#E74C3C" />
          <ellipse cx="100" cy="127" rx="18" ry="5" fill="#F5C5A0" />
        </>
      ) : (
        <path d="M82 128 Q100 140 118 128" fill="none"
          stroke="#C0392B" strokeWidth="3.5" strokeLinecap="round" />
      )}
      {/* Ohrring links */}
      <circle cx="26" cy="100" r="6" fill="#C1703A" stroke="#8B4513" strokeWidth="1.5" />
      {/* Ohrring rechts */}
      <circle cx="174" cy="100" r="6" fill="#C1703A" stroke="#8B4513" strokeWidth="1.5" />
      {/* Lippenstift-Highlight */}
      <ellipse cx="95" cy="127" rx="6" ry="3" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}

export default function AvatarSeite() {
  const [nachrichten, setNachrichten] = useState<Nachricht[]>([
    {
      rolle: "assistant",
      text: "Moin moin! Ik bün Lina. Scheen, dat du mi besöökst! Worüm möchst du vandaag snacken?",
    },
  ]);
  const [eingabe, setEingabe] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState("");
  const listenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listenRef.current?.scrollTo({ top: listenRef.current.scrollHeight, behavior: "smooth" });
  }, [nachrichten]);

  async function senden() {
    const text = eingabe.trim();
    if (!text || laedt) return;

    const neueNachrichten: Nachricht[] = [
      ...nachrichten,
      { rolle: "user", text },
    ];
    setNachrichten(neueNachrichten);
    setEingabe("");
    setLaedt(true);
    setFehler("");

    try {
      const res = await fetch("/api/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: neueNachrichten.map(m => ({
            role: m.rolle,
            content: m.text,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setFehler(data.error ?? "Etwas hat nicht geklappt.");
      } else {
        setNachrichten(prev => [...prev, { rolle: "assistant", text: data.antwort }]);
      }
    } catch {
      setFehler("Keine Verbindung. Bitte erneut versuchen.");
    } finally {
      setLaedt(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      senden();
    }
  }

  const letzteNachrichtVonLina = [...nachrichten].reverse().find(m => m.rolle === "assistant");

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--farbe-warm-bg)" }}>

      {/* Avatar-Bereich */}
      <div
        className="flex flex-col items-center py-6 gap-2 shrink-0"
        style={{
          background: "linear-gradient(180deg, #FDE8D0 0%, var(--farbe-warm-bg) 100%)",
          borderBottom: "2px solid var(--farbe-warm-akzent-hell)",
        }}
      >
        <LinaGesicht redet={laedt} />
        <p className="text-xl font-bold" style={{ color: "var(--farbe-warm-akzent)" }}>
          Lina
        </p>
        <p className="text-sm" style={{ color: "var(--farbe-warm-text-weich)" }}>
          Plattdüütsche Gesprächspartnerin
        </p>
      </div>

      {/* Nachrichten-Liste */}
      <div
        ref={listenRef}
        className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4"
      >
        {nachrichten.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.rolle === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="rounded-2xl px-5 py-4 text-base leading-relaxed"
              style={{
                maxWidth: "80%",
                background: msg.rolle === "user"
                  ? "var(--farbe-warm-akzent)"
                  : "var(--farbe-hell-karte)",
                color: msg.rolle === "user"
                  ? "white"
                  : "var(--farbe-warm-text)",
                border: msg.rolle === "assistant"
                  ? "2px solid var(--farbe-warm-akzent-hell)"
                  : "none",
                borderRadius: msg.rolle === "user"
                  ? "20px 20px 6px 20px"
                  : "20px 20px 20px 6px",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {laedt && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-5 py-4"
              style={{
                background: "var(--farbe-hell-karte)",
                border: "2px solid var(--farbe-warm-akzent-hell)",
                borderRadius: "20px 20px 20px 6px",
              }}
            >
              <span style={{ color: "var(--farbe-warm-text-weich)" }}>
                Lina snackt…
              </span>
              <span className="ml-1" style={{ letterSpacing: "4px" }}>···</span>
            </div>
          </div>
        )}

        {fehler && (
          <p className="text-center text-red-600 text-sm px-4">{fehler}</p>
        )}
      </div>

      {/* Eingabe */}
      <div
        className="shrink-0 px-4 py-4 flex gap-3 items-end"
        style={{
          background: "var(--farbe-hell-karte)",
          borderTop: "2px solid var(--farbe-warm-akzent-hell)",
        }}
      >
        <textarea
          value={eingabe}
          onChange={e => setEingabe(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Wat möchst du seggen?"
          rows={2}
          disabled={laedt}
          className="flex-1 rounded-2xl border-2 px-4 py-3 text-lg resize-none outline-none"
          style={{
            borderColor: "var(--farbe-warm-akzent-hell)",
            background: "var(--farbe-warm-bg)",
            color: "var(--farbe-warm-text)",
            minHeight: "60px",
          }}
        />
        <button
          onClick={senden}
          disabled={!eingabe.trim() || laedt}
          className="rounded-2xl text-white text-2xl font-bold flex items-center justify-center disabled:opacity-40 shrink-0"
          style={{
            background: "var(--farbe-warm-akzent)",
            width: "64px",
            height: "64px",
            minHeight: "64px",
          }}
          aria-label="Senden"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

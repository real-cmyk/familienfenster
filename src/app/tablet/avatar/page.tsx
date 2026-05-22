"use client";

import { useState, useRef, useEffect } from "react";

/* ── SVG-Avatar ────────────────────────────────────────────────────────── */
function LinaGesicht({ redet, hoert }: { redet: boolean; hoert: boolean }) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "160px", height: "160px" }} aria-hidden="true">
      <ellipse cx="102" cy="192" rx="55" ry="8" fill="rgba(0,0,0,0.10)" />
      <circle cx="100" cy="95" r="74" fill="#F5C5A0" />
      <ellipse cx="100" cy="30" rx="72" ry="34" fill="#B8B8B8" />
      <ellipse cx="35" cy="64" rx="21" ry="38" fill="#B8B8B8" />
      <ellipse cx="165" cy="64" rx="21" ry="38" fill="#B8B8B8" />
      <ellipse cx="62" cy="114" rx="17" ry="11" fill="rgba(220,90,70,0.22)" />
      <ellipse cx="138" cy="114" rx="17" ry="11" fill="rgba(220,90,70,0.22)" />
      {/* Augen */}
      <ellipse cx="76" cy="90" rx="11" ry={redet ? 3 : 9} fill="white" />
      <ellipse cx="124" cy="90" rx="11" ry={redet ? 3 : 9} fill="white" />
      {!redet && <><circle cx="78" cy="91" r="6" fill="#5D4037" /><circle cx="126" cy="91" r="6" fill="#5D4037" /></>}
      {!redet && <><circle cx="80" cy="89" r="2" fill="white" /><circle cx="128" cy="89" r="2" fill="white" /></>}
      {/* Augenbrauen */}
      <path d="M65 78 Q76 73 87 78" fill="none" stroke="#8D6E63" strokeWidth="3" strokeLinecap="round" />
      <path d="M113 78 Q124 73 135 78" fill="none" stroke="#8D6E63" strokeWidth="3" strokeLinecap="round" />
      {/* Nase */}
      <ellipse cx="100" cy="108" rx="7" ry="5" fill="#E8A070" />
      {/* Mund */}
      {redet ? (
        <><ellipse cx="100" cy="130" rx="18" ry="13" fill="#C0392B" />
          <ellipse cx="100" cy="133" rx="13" ry="8" fill="#E74C3C" />
          <ellipse cx="100" cy="127" rx="18" ry="5" fill="#F5C5A0" /></>
      ) : hoert ? (
        <path d="M85 128 Q100 134 115 128" fill="none" stroke="#C0392B" strokeWidth="3.5" strokeLinecap="round" />
      ) : (
        <path d="M82 128 Q100 140 118 128" fill="none" stroke="#C0392B" strokeWidth="3.5" strokeLinecap="round" />
      )}
      <circle cx="26" cy="100" r="5" fill="#C1703A" />
      <circle cx="174" cy="100" r="5" fill="#C1703A" />
    </svg>
  );
}

/* ── Konstanten ────────────────────────────────────────────────────────── */
const BEGRUESSUNG = "Moin moin! Ik bün Lina. Snack eenfach mit mi – ik höör di to!";

/* ── Hauptseite ────────────────────────────────────────────────────────── */
export default function AvatarSeite() {
  const [phase, setPhase] = useState<"start" | "hoert" | "denkt" | "redet">("start");
  const [fehler, setFehler] = useState("");

  // Refs – kein Closure-Problem
  const audioEl = useRef<HTMLAudioElement | null>(null);
  const recEl = useRef<unknown>(null);
  const msgs = useRef<{ role: string; content: string }[]>([
    { role: "assistant", content: BEGRUESSUNG },
  ]);
  const phaseRef = useRef<string>("start");

  function ph(p: typeof phase) {
    phaseRef.current = p;
    setPhase(p);
  }

  /* ── TTS via OpenAI ────────────────────────────────────────────────── */
  async function sprich(text: string) {
    ph("redet");
    try { (recEl.current as { stop?: () => void })?.stop?.(); } catch { /* ignore */ }

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS-Fehler");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = audioEl.current!;
      a.src = url;
      a.onended = () => {
        URL.revokeObjectURL(url);
        ph("start");
        hoerZu();
      };
      await a.play();
    } catch {
      ph("start");
      hoerZu();
    }
  }

  /* ── GPT-Antwort holen ─────────────────────────────────────────────── */
  async function sende(text: string) {
    if (!text.trim()) { hoerZu(); return; }
    ph("denkt");
    setFehler("");
    msgs.current = [...msgs.current, { role: "user", content: text }];

    try {
      const res = await fetch("/api/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs.current.slice(-12) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setFehler(data.error ?? "Etwas hat nicht geklappt");
        ph("start");
        return;
      }
      msgs.current = [...msgs.current, { role: "assistant", content: data.antwort }];
      sprich(data.antwort);
    } catch {
      setFehler("Keine Verbindung");
      ph("start");
    }
  }

  /* ── Mikrofon starten ──────────────────────────────────────────────── */
  function hoerZu() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setFehler("Spracherkennung nicht verfügbar – bitte Chrome verwenden");
      return;
    }

    try { (recEl.current as { stop?: () => void })?.stop?.(); } catch { /* ignore */ }

    const r = new SR();
    recEl.current = r;
    r.lang = "de-DE";
    r.continuous = false;
    r.interimResults = false;

    r.onstart = () => ph("hoert");
    r.onend = () => { if (phaseRef.current === "hoert") ph("start"); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onerror = (e: any) => {
      if (e.error !== "no-speech") setFehler("Mikrofon: " + e.error);
      if (phaseRef.current === "hoert") ph("start");
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => sende(e.results[0][0].transcript);

    try { r.start(); } catch { /* ignore */ }
  }

  /* ── Initialisierung ───────────────────────────────────────────────── */
  useEffect(() => {
    audioEl.current = new Audio();
    // Begrüßung sprechen → danach auto-Start Mikrofon
    sprich(BEGRUESSUNG);

    return () => {
      try { (recEl.current as { stop?: () => void })?.stop?.(); } catch { /* ignore */ }
      if (audioEl.current) {
        audioEl.current.pause();
        audioEl.current.src = "";
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── UI ────────────────────────────────────────────────────────────── */
  const statusText: Record<typeof phase, string> = {
    start: "Tippe auf das Mikrofon zum Sprechen",
    hoert: "Ik höör di… snack mit mi!",
    denkt: "Lina denkt nach…",
    redet: "Lina snackt…",
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-full gap-10 p-6"
      style={{ background: "linear-gradient(180deg,#FDE8D0 0%,var(--farbe-warm-bg) 100%)" }}
    >
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="rounded-full p-8 transition-all duration-500"
          style={{
            background: "white",
            boxShadow: phase === "hoert"
              ? "0 0 0 16px rgba(232,98,58,0.2), 0 0 0 32px rgba(232,98,58,0.08)"
              : phase === "redet"
              ? "0 0 0 12px rgba(193,112,58,0.15)"
              : "0 12px 40px rgba(61,43,31,0.15)",
          }}
        >
          <LinaGesicht redet={phase === "redet"} hoert={phase === "hoert"} />
        </div>
        <p className="text-3xl font-bold" style={{ color: "var(--farbe-warm-akzent)" }}>Lina</p>
        <p className="text-base" style={{ color: "var(--farbe-warm-text-weich)" }}>
          Plattdüütsche Gesprächspartnerin
        </p>
      </div>

      {/* Status-Text */}
      <div className="text-center px-6">
        <p className="text-xl" style={{ color: "var(--farbe-warm-text)" }}>
          {statusText[phase]}
        </p>
        {fehler && <p className="text-red-600 text-base mt-2">{fehler}</p>}
      </div>

      {/* Audio-Wellen beim Hören */}
      {phase === "hoert" && (
        <div className="flex gap-2 items-end" style={{ height: "60px" }}>
          {[3, 5, 8, 6, 4, 7, 5, 3, 6, 4].map((h, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: "8px",
                background: "var(--farbe-warm-akzent)",
                height: `${h * 6}px`,
                animation: `linawelle ${0.5 + i * 0.08}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.07}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Denkt-Punkte */}
      {phase === "denkt" && (
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: "18px", height: "18px",
                background: "var(--farbe-warm-akzent)",
                animation: `linahupf 0.6s ${i * 0.2}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {/* Mic-Button (idle) */}
      {phase === "start" && (
        <button
          onClick={hoerZu}
          className="rounded-full flex items-center justify-center transition-transform active:scale-95"
          style={{
            width: "120px", height: "120px",
            background: "var(--farbe-warm-akzent)",
            color: "white",
            fontSize: "3rem",
            border: "none",
            boxShadow: "0 8px 28px rgba(193,112,58,0.5)",
          }}
          aria-label="Sprechen"
        >
          🎤
        </button>
      )}

      {/* Redet-Indikator */}
      {phase === "redet" && (
        <div className="flex gap-2 items-end" style={{ height: "48px" }}>
          {[2, 4, 6, 8, 6, 4, 2].map((h, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: "10px",
                background: "#E8623A",
                height: `${h * 5}px`,
                animation: `linawelle ${0.4 + i * 0.06}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes linawelle {
          from { transform: scaleY(0.4); opacity: 0.6; }
          to   { transform: scaleY(1.6); opacity: 1; }
        }
        @keyframes linahupf {
          from { transform: translateY(0); opacity: 0.4; }
          to   { transform: translateY(-14px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

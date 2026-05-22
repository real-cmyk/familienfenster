"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Nachricht = { rolle: "user" | "assistant"; text: string };

/* ── SVG-Avatar ────────────────────────────────────────────────────────── */
function LinaGesicht({ redet, hoert }: { redet: boolean; hoert: boolean }) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "140px", height: "140px" }} aria-hidden="true">
      <ellipse cx="102" cy="192" rx="55" ry="8" fill="rgba(0,0,0,0.10)" />
      <circle cx="100" cy="95" r="74" fill="#F5C5A0" />
      <ellipse cx="100" cy="30" rx="72" ry="34" fill="#B8B8B8" />
      <ellipse cx="35" cy="64" rx="21" ry="38" fill="#B8B8B8" />
      <ellipse cx="165" cy="64" rx="21" ry="38" fill="#B8B8B8" />
      <ellipse cx="62" cy="114" rx="17" ry="11" fill="rgba(220,90,70,0.22)" />
      <ellipse cx="138" cy="114" rx="17" ry="11" fill="rgba(220,90,70,0.22)" />
      {/* Augen – blinzeln wenn redet */}
      <ellipse cx="76" cy="90" rx="11" ry={redet ? 4 : 9} fill="white" />
      <ellipse cx="124" cy="90" rx="11" ry={redet ? 4 : 9} fill="white" />
      {!redet && <><circle cx="78" cy="91" r="6" fill="#5D4037" /><circle cx="126" cy="91" r="6" fill="#5D4037" /></>}
      {!redet && <><circle cx="80" cy="89" r="2" fill="white" /><circle cx="128" cy="89" r="2" fill="white" /></>}
      <path d="M65 78 Q76 73 87 78" fill="none" stroke="#8D6E63" strokeWidth="3" strokeLinecap="round" />
      <path d="M113 78 Q124 73 135 78" fill="none" stroke="#8D6E63" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="100" cy="108" rx="7" ry="5" fill="#E8A070" />
      {/* Mund */}
      {redet ? (
        <><ellipse cx="100" cy="130" rx="17" ry="11" fill="#C0392B" />
          <ellipse cx="100" cy="132" rx="13" ry="7" fill="#E74C3C" />
          <ellipse cx="100" cy="127" rx="17" ry="5" fill="#F5C5A0" /></>
      ) : hoert ? (
        <path d="M85 128 Q100 134 115 128" fill="none" stroke="#C0392B" strokeWidth="3.5" strokeLinecap="round" />
      ) : (
        <path d="M82 128 Q100 140 118 128" fill="none" stroke="#C0392B" strokeWidth="3.5" strokeLinecap="round" />
      )}
      <circle cx="26" cy="100" r="5" fill="#C1703A" />
      <circle cx="174" cy="100" r="5" fill="#C1703A" />
      {/* Mikrofon-Indikator wenn hört */}
      {hoert && <circle cx="100" cy="170" r="10" fill="#E8623A" opacity="0.7">
        <animate attributeName="r" values="10;14;10" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1s" repeatCount="indefinite" />
      </circle>}
    </svg>
  );
}

/* ── Sprach-Hilfen ─────────────────────────────────────────────────────── */
function sprich(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.9;
  utterance.pitch = 1.05;
  // Weibliche Stimme bevorzugen
  const stimmen = window.speechSynthesis.getVoices();
  const deutsch = stimmen.find(v => v.lang.startsWith("de") && v.name.toLowerCase().includes("female"))
    ?? stimmen.find(v => v.lang.startsWith("de"))
    ?? null;
  if (deutsch) utterance.voice = deutsch;
  window.speechSynthesis.speak(utterance);
}

/* ── Hauptseite ────────────────────────────────────────────────────────── */
export default function AvatarSeite() {
  const [nachrichten, setNachrichten] = useState<Nachricht[]>([
    { rolle: "assistant", text: "Moin moin! Ik bün Lina. Scheen, dat du mi besöökst! Worüm möchst du vandaag snacken?" },
  ]);
  const [eingabe, setEingabe] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [hoert, setHoert] = useState(false);
  const [fehler, setFehler] = useState("");
  const [sprachUnterstuetzt, setSprachUnterstuetzt] = useState(false);
  const listenRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    setSprachUnterstuetzt(!!SR && !!window.speechSynthesis);
    // Stimmen vorladen
    window.speechSynthesis?.getVoices();
    // Begrüßung vorlesen
    setTimeout(() => sprich("Moin moin! Ik bün Lina. Scheen, dat du mi besöökst!"), 800);
  }, []);

  useEffect(() => {
    listenRef.current?.scrollTo({ top: listenRef.current.scrollHeight, behavior: "smooth" });
  }, [nachrichten]);

  const senden = useCallback(async (text: string) => {
    if (!text.trim() || laedt) return;
    const neueNachrichten: Nachricht[] = [...nachrichten, { rolle: "user", text: text.trim() }];
    setNachrichten(neueNachrichten);
    setEingabe("");
    setLaedt(true);
    setFehler("");

    try {
      const res = await fetch("/api/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: neueNachrichten.map(m => ({ role: m.rolle, content: m.text })) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setFehler(data.error ?? "Etwas hat nicht geklappt.");
      } else {
        setNachrichten(prev => [...prev, { rolle: "assistant", text: data.antwort }]);
        sprich(data.antwort);
      }
    } catch {
      setFehler("Keine Verbindung. Bitte erneut versuchen.");
    } finally {
      setLaedt(false);
    }
  }, [nachrichten, laedt]);

  function starteSpracheingabe() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;
    window.speechSynthesis?.cancel();

    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = "de-DE";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => setHoert(true);
    rec.onend = () => setHoert(false);
    rec.onerror = () => setHoert(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transkript = e.results[0][0].transcript;
      senden(transkript);
    };
    rec.start();
  }

  function stoppeSpracheingabe() {
    recognitionRef.current?.stop();
    setHoert(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); senden(eingabe); }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--farbe-warm-bg)" }}>
      {/* Avatar */}
      <div className="flex flex-col items-center py-5 gap-1 shrink-0"
        style={{ background: "linear-gradient(180deg,#FDE8D0 0%,var(--farbe-warm-bg) 100%)", borderBottom: "2px solid var(--farbe-warm-akzent-hell)" }}>
        <LinaGesicht redet={laedt} hoert={hoert} />
        <p className="text-xl font-bold" style={{ color: "var(--farbe-warm-akzent)" }}>Lina</p>
        <p className="text-sm" style={{ color: "var(--farbe-warm-text-weich)" }}>
          {hoert ? "🎤 Ik höör di…" : laedt ? "Lina snackt…" : "Plattdüütsche Gesprächspartnerin"}
        </p>
      </div>

      {/* Nachrichten */}
      <div ref={listenRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {nachrichten.map((msg, i) => (
          <div key={i} className={`flex ${msg.rolle === "user" ? "justify-end" : "justify-start"}`}>
            <div className="rounded-2xl px-5 py-3 text-base leading-relaxed" style={{
              maxWidth: "82%",
              background: msg.rolle === "user" ? "var(--farbe-warm-akzent)" : "var(--farbe-hell-karte)",
              color: msg.rolle === "user" ? "white" : "var(--farbe-warm-text)",
              border: msg.rolle === "assistant" ? "2px solid var(--farbe-warm-akzent-hell)" : "none",
              borderRadius: msg.rolle === "user" ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {laedt && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-5 py-3" style={{ background: "var(--farbe-hell-karte)", border: "2px solid var(--farbe-warm-akzent-hell)", borderRadius: "20px 20px 20px 6px" }}>
              <span style={{ color: "var(--farbe-warm-text-weich)", letterSpacing: "6px" }}>···</span>
            </div>
          </div>
        )}
        {fehler && <p className="text-center text-red-600 text-sm">{fehler}</p>}
      </div>

      {/* Eingabe */}
      <div className="shrink-0 px-4 py-3 flex gap-3 items-end"
        style={{ background: "var(--farbe-hell-karte)", borderTop: "2px solid var(--farbe-warm-akzent-hell)" }}>

        {/* Sprach-Button */}
        {sprachUnterstuetzt && (
          <button
            onPointerDown={starteSpracheingabe}
            onPointerUp={stoppeSpracheingabe}
            onPointerLeave={stoppeSpracheingabe}
            disabled={laedt}
            className="rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-40 transition-transform active:scale-95"
            style={{
              width: "64px", height: "64px",
              background: hoert ? "#E8623A" : "var(--farbe-warm-akzent-hell)",
              color: hoert ? "white" : "var(--farbe-warm-akzent)",
              fontSize: "1.8rem",
              border: `3px solid ${hoert ? "#E8623A" : "var(--farbe-warm-akzent)"}`,
              boxShadow: hoert ? "0 0 0 6px rgba(232,98,58,0.25)" : "none",
            }}
            aria-label="Spracheingabe"
          >
            🎤
          </button>
        )}

        <textarea
          value={eingabe}
          onChange={e => setEingabe(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Wat möchst du seggen?"
          rows={2}
          disabled={laedt || hoert}
          className="flex-1 rounded-2xl border-2 px-4 py-3 text-lg resize-none outline-none"
          style={{
            borderColor: "var(--farbe-warm-akzent-hell)",
            background: "var(--farbe-warm-bg)",
            color: "var(--farbe-warm-text)",
            minHeight: "60px",
          }}
        />

        <button
          onClick={() => senden(eingabe)}
          disabled={!eingabe.trim() || laedt}
          className="rounded-2xl text-white text-2xl flex items-center justify-center disabled:opacity-40 shrink-0"
          style={{ background: "var(--farbe-warm-akzent)", width: "64px", height: "64px" }}
          aria-label="Senden"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

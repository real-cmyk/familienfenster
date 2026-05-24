"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ── SVG-Avatar ──────────────────────────────────────────────────────────── */
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
      {/* Augen – immer offen */}
      <ellipse cx="76" cy="90" rx="11" ry="9" fill="white" />
      <ellipse cx="124" cy="90" rx="11" ry="9" fill="white" />
      <circle cx="78" cy="91" r="6" fill="#5D4037" />
      <circle cx="126" cy="91" r="6" fill="#5D4037" />
      <circle cx="80" cy="89" r="2" fill="white" />
      <circle cx="128" cy="89" r="2" fill="white" />
      {/* Augenbrauen – angehoben beim Reden */}
      <path d={redet ? "M65 75 Q76 70 87 75" : "M65 78 Q76 73 87 78"}
        fill="none" stroke="#8D6E63" strokeWidth="3" strokeLinecap="round" />
      <path d={redet ? "M113 75 Q124 70 135 75" : "M113 78 Q124 73 135 78"}
        fill="none" stroke="#8D6E63" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="100" cy="108" rx="7" ry="5" fill="#E8A070" />
      {/* Mund */}
      {redet ? (
        <>
          <ellipse cx="100" cy="130" rx="18" ry="13" fill="#C0392B" />
          <ellipse cx="100" cy="133" rx="13" ry="8" fill="#E74C3C" />
          <ellipse cx="100" cy="127" rx="18" ry="5" fill="#F5C5A0" />
        </>
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

/* ── Typen ───────────────────────────────────────────────────────────────── */
type Phase = "laden" | "bereit" | "hoert" | "denkt" | "redet";
type Message = { role: "user" | "assistant"; content: string };

/* ── Hauptseite ──────────────────────────────────────────────────────────── */
export default function AvatarSeite() {
  const [phase, setPhase] = useState<Phase>("laden");
  const [fehler, setFehler] = useState("");
  const [verlauf, setVerlauf] = useState<Message[]>([]);
  const [linaText, setLinaText] = useState("");
  const [sprachtext, setSprachtext] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const phaseRef = useRef<Phase>("laden");
  const mountedRef = useRef(true);
  const aufnahmeAktivRef = useRef(false);
  const verlaufRef = useRef<Message[]>([]);

  function ph(p: Phase) {
    if (!mountedRef.current) return;
    phaseRef.current = p;
    setPhase(p);
  }

  // Verlauf-Ref synchron halten
  useEffect(() => { verlaufRef.current = verlauf; }, [verlauf]);

  /* ── Audio stoppen ──────────────────────────────────────────────────── */
  function stoppeAudio() {
    try { audioRef.current?.pause(); } catch { /**/ }
    audioRef.current = null;
  }

  /* ── Linas Antwort abspielen ────────────────────────────────────────── */
  async function spieleAntwort(text: string, neuerVerlauf: Message[]) {
    ph("redet");
    setLinaText(text);
    setVerlauf(neuerVerlauf);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error(`TTS ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        // 800ms Cooldown: verhindert dass Linas Stimme noch im Raum nachhallt
        // und sofort als nächste Aufnahme aufgenommen wird
        setTimeout(() => { if (mountedRef.current) ph("bereit"); }, 800);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setTimeout(() => { if (mountedRef.current) ph("bereit"); }, 300);
      };

      await audio.play();
    } catch (err) {
      console.error("TTS Fehler:", err);
      if (mountedRef.current) ph("bereit");
    }
  }

  /* ── Begrüßung beim Start ───────────────────────────────────────────── */
  const begruessung = useCallback(async () => {
    ph("denkt");
    try {
      const res = await fetch("/api/lina-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }), // Leerer Verlauf → Lina begrüßt
      });
      if (!res.ok) throw new Error(`Chat ${res.status}`);
      const { antwort } = await res.json();

      const neuerVerlauf: Message[] = [{ role: "assistant", content: antwort }];
      await spieleAntwort(antwort, neuerVerlauf);
    } catch (err) {
      console.error("Begrüßungsfehler:", err);
      setFehler("Lina konnte nicht gestartet werden.");
      ph("bereit");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    begruessung();
    return () => {
      mountedRef.current = false;
      stoppeAudio();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Aufnahme starten ───────────────────────────────────────────────── */
  async function startAufnahme() {
    if (aufnahmeAktivRef.current) return;
    if (phaseRef.current === "redet") stoppeAudio();

    setFehler("");
    ph("hoert");
    aufnahmeAktivRef.current = true;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,   // Linas Stimme aus Lautsprecher nicht aufnehmen
          noiseSuppression: true,   // Hintergrundgeräusche dämpfen
          autoGainControl: true,    // Lautstärke automatisch anpassen
        },
      });
    } catch (e) {
      setFehler("Mikrofon nicht verfügbar.");
      ph("bereit");
      aufnahmeAktivRef.current = false;
      return;
    }

    chunksRef.current = [];
    const mr = new MediaRecorder(stream);
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.start(100); // Alle 100ms ein Chunk → smooth
    mediaRecorderRef.current = mr;
  }

  /* ── Aufnahme stoppen und verarbeiten ───────────────────────────────── */
  async function stopAufnahme() {
    if (!aufnahmeAktivRef.current) return;
    aufnahmeAktivRef.current = false;

    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") { ph("bereit"); return; }

    ph("denkt");

    // Auf onstop warten um alle Chunks zu sammeln
    const audioBlob = await new Promise<Blob>((resolve) => {
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        resolve(blob);
      };
      mr.stop();
      mr.stream.getTracks().forEach((t) => t.stop());
    });

    if (audioBlob.size < 800) {
      // Zu kurz (versehentliche Berührung) — ignorieren
      ph("bereit");
      return;
    }

    try {
      // 1. Transkribieren
      const fd = new FormData();
      fd.append("audio", audioBlob, "audio.webm");
      const trRes = await fetch("/api/transcribe", { method: "POST", body: fd });
      if (!trRes.ok) throw new Error(`Transkription ${trRes.status}`);
      const { text } = await trRes.json();

      if (!text?.trim()) {
        // Nichts verstanden — freundlich nachfragen
        await spieleAntwort("Dat heff ik leider nicht verstahn. Snack noch mal!", verlaufRef.current);
        return;
      }

      setSprachtext(text);

      // 2. Chat
      const neuerVerlauf: Message[] = [
        ...verlaufRef.current,
        { role: "user", content: text },
      ];
      const crRes = await fetch("/api/lina-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: neuerVerlauf.slice(-12) }),
      });
      if (!crRes.ok) throw new Error(`Chat ${crRes.status}`);
      const { antwort } = await crRes.json();

      // 3. TTS + Abspielen
      await spieleAntwort(antwort, [
        ...neuerVerlauf,
        { role: "assistant", content: antwort },
      ]);
    } catch (err) {
      console.error("Verarbeitungsfehler:", err);
      setFehler("Etwas ist schiefgelaufen. Bitte nochmal versuchen.");
      ph("bereit");
    }
  }

  /* ── UI ──────────────────────────────────────────────────────────────── */
  const redet = phase === "redet";
  const hoert = phase === "hoert";
  const bereit = phase === "bereit";
  const denkt = phase === "denkt";
  const laden = phase === "laden";

  return (
    <div
      className="flex flex-col items-center justify-between min-h-full p-6 gap-6"
      style={{ background: "linear-gradient(180deg,#FDE8D0 0%,var(--farbe-warm-bg) 100%)" }}
    >
      {/* ── Avatar ── */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <div
          className="rounded-full p-8 transition-all duration-500"
          style={{
            background: "white",
            boxShadow: hoert
              ? "0 0 0 16px rgba(232,98,58,0.2), 0 0 0 32px rgba(232,98,58,0.08)"
              : redet
              ? "0 0 0 12px rgba(193,112,58,0.18), 0 0 0 24px rgba(193,112,58,0.07)"
              : "0 12px 40px rgba(61,43,31,0.15)",
          }}
        >
          <LinaGesicht redet={redet} hoert={hoert} />
        </div>
        <p className="text-3xl font-bold" style={{ color: "var(--farbe-warm-akzent)" }}>Lina</p>
        <p className="text-base" style={{ color: "var(--farbe-warm-text-weich)" }}>
          Plattdüütsche Gesprächspartnerin
        </p>
      </div>

      {/* ── Linas Text ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center max-w-lg w-full">
        {linaText ? (
          <p
            className="text-xl leading-relaxed"
            style={{ color: "var(--farbe-warm-text)" }}
          >
            {linaText}
          </p>
        ) : laden || denkt ? (
          <p className="text-lg" style={{ color: "var(--farbe-warm-text-weich)" }}>
            {laden ? "Lina wird geweckt…" : "Lina denkt nach…"}
          </p>
        ) : null}

        {/* Gesprochener Text des Nutzers */}
        {sprachtext && !hoert && (
          <p className="text-base italic" style={{ color: "var(--farbe-warm-text-weich)", opacity: 0.7 }}>
            „{sprachtext}"
          </p>
        )}

        {/* Lade-/Denk-Animation */}
        {(laden || denkt) && (
          <div className="flex gap-3 mt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-full" style={{
                width: "14px", height: "14px",
                background: "var(--farbe-warm-akzent)",
                animation: `linahupf 0.6s ${i * 0.2}s ease-in-out infinite alternate`,
              }} />
            ))}
          </div>
        )}

        {/* Hört-Wellen */}
        {hoert && (
          <div className="flex gap-2 items-end mt-2" style={{ height: "56px" }}>
            {[3, 5, 8, 6, 4, 7, 5, 3, 6, 4].map((h, i) => (
              <div key={i} className="rounded-full" style={{
                width: "8px", background: "var(--farbe-warm-akzent)",
                height: `${h * 6}px`,
                animation: `linawelle ${0.5 + i * 0.08}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.07}s`,
              }} />
            ))}
          </div>
        )}

        {/* Sprachbalken beim Reden */}
        {redet && (
          <div className="flex gap-2 items-end mt-2" style={{ height: "48px" }}>
            {[2, 4, 6, 8, 6, 4, 2].map((h, i) => (
              <div key={i} className="rounded-full" style={{
                width: "10px", background: "#E8623A",
                height: `${h * 5}px`,
                animation: `linawelle ${0.4 + i * 0.06}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.05}s`,
              }} />
            ))}
          </div>
        )}

        {/* Fehler */}
        {fehler && (
          <p className="text-red-600 text-base mt-2">{fehler}</p>
        )}
      </div>

      {/* ── Push-to-Talk Button ── */}
      <div className="w-full max-w-sm pb-4">
        {bereit || hoert ? (
          <button
            onMouseDown={startAufnahme}
            onMouseUp={stopAufnahme}
            onMouseLeave={() => { if (aufnahmeAktivRef.current) stopAufnahme(); }}
            onTouchStart={(e) => { e.preventDefault(); startAufnahme(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopAufnahme(); }}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full rounded-3xl text-white font-bold text-2xl transition-all duration-150 select-none"
            style={{
              minHeight: "100px",
              background: hoert
                ? "linear-gradient(135deg,#E8623A,#C1703A)"
                : "linear-gradient(135deg,#C1703A,#A05828)",
              boxShadow: hoert
                ? "0 0 0 8px rgba(232,98,58,0.25), 0 8px 24px rgba(193,112,58,0.5)"
                : "0 8px 24px rgba(193,112,58,0.4)",
              transform: hoert ? "scale(1.04)" : "scale(1)",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
            aria-label={hoert ? "Aufnahme läuft — loslassen zum Senden" : "Drücken und halten zum Sprechen"}
          >
            {hoert ? "🎙 Loslassen zum Senden" : "🎙 Drücken und reden"}
          </button>
        ) : (
          /* Während Denken/Laden/Reden: Button ausgegraut */
          <div
            className="w-full rounded-3xl text-white font-bold text-2xl flex items-center justify-center"
            style={{
              minHeight: "100px",
              background: "rgba(193,112,58,0.3)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {redet ? "🔊 Lina spricht…" : "⏳ Bitte warten…"}
          </div>
        )}
      </div>

      <style>{`
        @keyframes linawelle {
          from { transform: scaleY(0.4); opacity: 0.6; }
          to   { transform: scaleY(1.6); opacity: 1;   }
        }
        @keyframes linahupf {
          from { transform: translateY(0);     opacity: 0.4; }
          to   { transform: translateY(-12px); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}

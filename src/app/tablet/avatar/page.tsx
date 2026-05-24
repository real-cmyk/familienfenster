"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ── SVG-Avatar ──────────────────────────────────────────────────────────
   Augen-Fix: ry bleibt immer 9, Pupillen immer sichtbar → kein Augenrollen
   ─────────────────────────────────────────────────────────────────────── */
function LinaGesicht({ redet, hoert }: { redet: boolean; hoert: boolean }) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "160px", height: "160px" }}
      aria-hidden="true"
    >
      {/* Schatten */}
      <ellipse cx="102" cy="192" rx="55" ry="8" fill="rgba(0,0,0,0.10)" />
      {/* Gesicht */}
      <circle cx="100" cy="95" r="74" fill="#F5C5A0" />
      {/* Haare */}
      <ellipse cx="100" cy="30" rx="72" ry="34" fill="#B8B8B8" />
      <ellipse cx="35" cy="64" rx="21" ry="38" fill="#B8B8B8" />
      <ellipse cx="165" cy="64" rx="21" ry="38" fill="#B8B8B8" />
      {/* Wangen */}
      <ellipse cx="62" cy="114" rx="17" ry="11" fill="rgba(220,90,70,0.22)" />
      <ellipse cx="138" cy="114" rx="17" ry="11" fill="rgba(220,90,70,0.22)" />
      {/* Augen – ry immer 9, Pupillen immer sichtbar */}
      <ellipse cx="76" cy="90" rx="11" ry="9" fill="white" />
      <ellipse cx="124" cy="90" rx="11" ry="9" fill="white" />
      <circle cx="78" cy="91" r="6" fill="#5D4037" />
      <circle cx="126" cy="91" r="6" fill="#5D4037" />
      <circle cx="80" cy="89" r="2" fill="white" />
      <circle cx="128" cy="89" r="2" fill="white" />
      {/* Augenbrauen – beim Reden leicht angehoben (freudiges Gesicht) */}
      <path
        d={redet ? "M65 75 Q76 70 87 75" : "M65 78 Q76 73 87 78"}
        fill="none"
        stroke="#8D6E63"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ transition: "d 0.3s" }}
      />
      <path
        d={redet ? "M113 75 Q124 70 135 75" : "M113 78 Q124 73 135 78"}
        fill="none"
        stroke="#8D6E63"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ transition: "d 0.3s" }}
      />
      {/* Nase */}
      <ellipse cx="100" cy="108" rx="7" ry="5" fill="#E8A070" />
      {/* Mund */}
      {redet ? (
        <>
          <ellipse cx="100" cy="130" rx="18" ry="13" fill="#C0392B" />
          <ellipse cx="100" cy="133" rx="13" ry="8" fill="#E74C3C" />
          <ellipse cx="100" cy="127" rx="18" ry="5" fill="#F5C5A0" />
        </>
      ) : hoert ? (
        <path
          d="M85 128 Q100 134 115 128"
          fill="none"
          stroke="#C0392B"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M82 128 Q100 140 118 128"
          fill="none"
          stroke="#C0392B"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      )}
      {/* Ohrringe */}
      <circle cx="26" cy="100" r="5" fill="#C1703A" />
      <circle cx="174" cy="100" r="5" fill="#C1703A" />
    </svg>
  );
}

/* ── Typen & Konstanten ──────────────────────────────────────────────────── */
type Phase = "verbindet" | "bereit" | "hoert" | "denkt" | "redet";

/* ── Hauptseite ──────────────────────────────────────────────────────────── */
export default function AvatarSeite() {
  const [phase, setPhase] = useState<Phase>("verbindet");
  const [fehler, setFehler] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const phaseRef = useRef<Phase>("verbindet");
  const mountedRef = useRef(true);

  function ph(p: Phase) {
    if (!mountedRef.current) return;
    phaseRef.current = p;
    setPhase(p);
  }

  /* ── Aufräumen ──────────────────────────────────────────────────────── */
  function trenne() {
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /**/ }
    try { dcRef.current?.close(); } catch { /**/ }
    try { pcRef.current?.close(); } catch { /**/ }
    streamRef.current = null;
    dcRef.current = null;
    pcRef.current = null;
  }

  /* ── Web-Suche Tool-Call verarbeiten ────────────────────────────────── */
  async function handleWebSuche(callId: string, argsJson: string) {
    try {
      const { suchbegriff } = JSON.parse(argsJson);
      const res = await fetch("/api/web-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suchbegriff }),
      });
      const { ergebnis } = await res.json();

      if (dcRef.current?.readyState === "open") {
        dcRef.current.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: callId,
              output: ergebnis ?? "Keine Ergebnisse gefunden.",
            },
          })
        );
        dcRef.current.send(JSON.stringify({ type: "response.create" }));
      }
    } catch (err) {
      console.error("Web-Suche Fehler:", err);
    }
  }

  /* ── WebRTC-Verbindung aufbauen (GA Unified Interface) ─────────────────
     SDP-Offer → /api/realtime-sdp (unser Server) → /v1/realtime/calls
     Linas Instruktionen + App-Kontext gehen serverseitig mit in den Request
     ─────────────────────────────────────────────────────────────────────── */
  const verbinde = useCallback(async () => {
    trenne();
    ph("verbindet");
    setFehler("");

    try {
      // 1. Mikrofon anfordern
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        throw new Error(`Mikrofon: ${(e as Error).message}`);
      }
      streamRef.current = stream;

      // 2. RTCPeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Linas Audio-Ausgabe
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      document.body.appendChild(audioEl);
      pc.ontrack = (e) => { audioEl.srcObject = e.streams[0]; };

      // Mikrofon-Track
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // 3. Data-Channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => ph("bereit");

      dc.onmessage = async (e) => {
        let event: { type: string; [key: string]: unknown };
        try { event = JSON.parse(e.data as string); } catch { return; }

        switch (event.type) {
          // Session steht → Tools + VAD konfigurieren + Begrüßung starten
          case "session.created":
            if (dc.readyState === "open") {
              dc.send(JSON.stringify({
                type: "session.update",
                session: {
                  // VAD: robuste Einstellungen — hoher Threshold ignoriert Umgebungsgeräusche,
                  // lange Stille-Pause verhindert Abbrechen mitten im Satz
                  turn_detection: {
                    type: "server_vad",
                    threshold: 0.7,
                    prefix_padding_ms: 400,
                    silence_duration_ms: 2200,
                  },
                  tools: [
                    {
                      type: "function",
                      name: "web_suche",
                      description: "Sucht im Internet nach aktuellen Informationen (Wetter, Nachrichten, Rezepte usw.)",
                      parameters: {
                        type: "object",
                        properties: {
                          suchbegriff: { type: "string", description: "Suchbegriff oder Frage" },
                        },
                        required: ["suchbegriff"],
                      },
                    },
                  ],
                  tool_choice: "auto",
                },
              }));
              dc.send(JSON.stringify({ type: "response.create" }));
            }
            break;

          // Nutzer spricht
          case "input_audio_buffer.speech_started":
            ph("hoert");
            break;

          case "input_audio_buffer.speech_stopped":
            ph("denkt");
            break;

          // Lina spricht (GA API: output_audio_buffer Events)
          case "output_audio_buffer.started":
          case "response.audio.delta":
            if (phaseRef.current !== "redet") ph("redet");
            break;

          case "output_audio_buffer.stopped":
          case "response.done":
            if (phaseRef.current === "redet" || phaseRef.current === "denkt") {
              ph("bereit");
            }
            break;

          case "response.function_call_arguments.done": {
            const callId = event.call_id as string;
            const name = event.name as string;
            if (name === "web_suche") {
              await handleWebSuche(callId, event.arguments as string);
            }
            break;
          }

          case "session.updated":
            // Session-Konfiguration bestätigt — kein Action nötig
            break;

          case "error": {
            const errMsg = (event.error as { message?: string; code?: string })?.message ?? String(event.error);
            console.error("Realtime Fehler:", errMsg);
            // Nur fatale Fehler anzeigen (nicht session.update-Warnungen)
            if ((event.error as { code?: string })?.code !== "session_update_rejected") {
              // Stille Fehler — nicht im UI zeigen, nur loggen
            }
            break;
          }
        }
      };

      dc.onclose = () => {
        if (mountedRef.current && phaseRef.current !== "verbindet") ph("bereit");
      };

      // 4. SDP-Offer erstellen
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 5. SDP an unseren Server → OpenAI /v1/realtime/calls
      //    Linas Instruktionen + App-Kontext werden serverseitig mit eingebettet
      const sdpRes = await fetch("/api/realtime-sdp", {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      });

      if (!sdpRes.ok) {
        const errBody = await sdpRes.json().catch(() => ({ error: sdpRes.status }));
        throw new Error(errBody.error ?? `SDP-Fehler ${sdpRes.status}`);
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    } catch (err) {
      console.error("Verbindungsfehler:", err);
      trenne();
      if (mountedRef.current) {
        setFehler(String((err as Error).message ?? err));
        ph("bereit");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    verbinde();
    return () => {
      mountedRef.current = false;
      trenne();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── UI ──────────────────────────────────────────────────────────────── */
  const statusText: Record<Phase, string> = {
    verbindet: "Lina wird geweckt…",
    bereit: "Einfach losreden – Lina hört zu!",
    hoert: "Ik höör di… snack mit mi!",
    denkt: "Lina denkt nach…",
    redet: "Lina snackt…",
  };

  const redet = phase === "redet";
  const hoert = phase === "hoert";

  return (
    <div
      className="flex flex-col items-center justify-center min-h-full gap-10 p-6"
      style={{
        background: "linear-gradient(180deg,#FDE8D0 0%,var(--farbe-warm-bg) 100%)",
      }}
    >
      {/* ── Avatar ── */}
      <div className="flex flex-col items-center gap-3">
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
        <p className="text-3xl font-bold" style={{ color: "var(--farbe-warm-akzent)" }}>
          Lina
        </p>
        <p className="text-base" style={{ color: "var(--farbe-warm-text-weich)" }}>
          Plattdüütsche Gesprächspartnerin
        </p>
      </div>

      {/* ── Status-Text ── */}
      <div className="text-center px-6">
        <p className="text-xl" style={{ color: "var(--farbe-warm-text)" }}>
          {statusText[phase]}
        </p>
        {fehler && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <p className="text-red-600 text-base">{fehler}</p>
            <button
              onClick={() => verbinde()}
              className="px-8 py-4 rounded-2xl text-white text-lg font-bold transition-transform active:scale-95"
              style={{
                background: "var(--farbe-warm-akzent)",
                minHeight: "64px",
                boxShadow: "0 4px 16px rgba(193,112,58,0.4)",
              }}
            >
              🔄 Neu verbinden
            </button>
          </div>
        )}
      </div>

      {/* ── Verbindet-Spinner ── */}
      {phase === "verbindet" && (
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: "18px",
                height: "18px",
                background: "var(--farbe-warm-akzent-hell)",
                animation: `linahupf 0.6s ${i * 0.2}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Hört zu – Wellen ── */}
      {hoert && (
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

      {/* ── Denkt – Punkte ── */}
      {phase === "denkt" && (
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: "18px",
                height: "18px",
                background: "var(--farbe-warm-akzent)",
                animation: `linahupf 0.6s ${i * 0.2}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Redet – Sprachbalken ── */}
      {redet && (
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

      {/* ── Bereit – sanfter Puls ── */}
      {phase === "bereit" && !fehler && (
        <div
          className="rounded-full"
          style={{
            width: "20px",
            height: "20px",
            background: "var(--farbe-warm-akzent)",
            animation: "linapuls 2.2s ease-in-out infinite",
          }}
        />
      )}

      <style>{`
        @keyframes linawelle {
          from { transform: scaleY(0.4); opacity: 0.6; }
          to   { transform: scaleY(1.6); opacity: 1;   }
        }
        @keyframes linahupf {
          from { transform: translateY(0);    opacity: 0.4; }
          to   { transform: translateY(-14px); opacity: 1;   }
        }
        @keyframes linapuls {
          0%, 100% { transform: scale(1);   opacity: 0.4; }
          50%       { transform: scale(1.5); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client"; // nur noch für Playlists

/* ── Radio-Sender mit Backup-URLs ───────────────────────────────────────── */
export const RADIO_SENDER = [
  {
    id: "ndr1",
    name: "NDR 1 Welle Nord",
    region: "Norddeutschland",
    emoji: "🌊",
    farbe: "#E8F4FD",
    rand: "#2196F3",
    url: "https://icecast.ndr.de/ndr/ndr1wellenord/kiel/mp3/128/stream.mp3",
    backup: "https://icecast.ndr.de/ndr/ndr1niedersachsen/hannover/mp3/128/stream.mp3",
  },
  {
    id: "ndr2",
    name: "NDR 2",
    region: "Hits & Unterhaltung",
    emoji: "🎵",
    farbe: "#EDE7F6",
    rand: "#7B1FA2",
    url: "https://icecast.ndr.de/ndr/ndr2/niedersachsen/mp3/128/stream.mp3",
    backup: "https://icecast.ndr.de/ndr/ndr2/hamburg/mp3/128/stream.mp3",
  },
  {
    id: "wdr4",
    name: "WDR 4",
    region: "Schlager & Oldies",
    emoji: "🎶",
    farbe: "#FFF8E1",
    rand: "#F57F17",
    url: "https://wdr-wdr4-live.icecast.wdr.de/wdr/wdr4/live/mp3/128/stream.mp3",
    backup: "https://wdr-1live-live.icecast.wdr.de/wdr/1live/live/mp3/128/stream.mp3",
  },
  {
    id: "hr1",
    name: "hr1",
    region: "Klassisch modern",
    emoji: "🎼",
    farbe: "#E8F5E9",
    rand: "#388E3C",
    url: "https://dispatcher.rndfnk.com/hr/hr1/live/mp3/128/stream.mp3",
    backup: "https://dispatcher.rndfnk.com/hr/hr2/live/mp3/128/stream.mp3",
  },
  {
    id: "dlf",
    name: "Deutschlandfunk",
    region: "Nachrichten & Kultur",
    emoji: "📰",
    farbe: "#FCE4EC",
    rand: "#C62828",
    url: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3",
    backup: "https://st01.sslstream.dlf.de/dlf/01/64/mp3/stream.mp3",
  },
  {
    id: "bay1",
    name: "Bayern 1",
    region: "Volksmusik & Heimat",
    emoji: "🏔️",
    farbe: "#F3E5F5",
    rand: "#6A1B9A",
    url: "https://dispatcher.rndfnk.com/br/br1/obb/mp3/mid",
    backup: "https://dispatcher.rndfnk.com/br/br1/franken/mp3/mid",
  },
  {
    id: "swr4",
    name: "SWR4 BW",
    region: "Schlager & Evergreens",
    emoji: "🌻",
    farbe: "#FFFDE7",
    rand: "#F9A825",
    url: "https://dispatcher.rndfnk.com/swr/swr4/bw/mp3/128/stream.mp3",
    backup: "https://dispatcher.rndfnk.com/swr/swr1/bw/mp3/128/stream.mp3",
  },
  {
    id: "mdrjump",
    name: "MDR Jump",
    region: "Aktuelle Hits",
    emoji: "⚡",
    farbe: "#E0F2F1",
    rand: "#00796B",
    url: "https://mdr-284320-0.sslcast.mdr.de/mdr/284320/0/mp3/high/stream.mp3",
    backup: "https://dispatcher.rndfnk.com/mdr/jump/live/mp3/128/stream.mp3",
  },
];

type Playlist = { id: string; name: string; beschreibung: string | null };
type Titel = { id: string; titel: string; kuenstler: string | null; storage_key: string; reihenfolge: number };

/* ── Hauptseite ─────────────────────────────────────────────────────────── */
export default function MusikSeite() {
  const [tab, setTab] = useState<"radio" | "playlists">("radio");

  // Radio
  const [favoriten, setFavoriten] = useState<string[]>([]);
  const [favoritenGeladen, setFavoritenGeladen] = useState(false);
  const [aktivesSender, setAktivesSender] = useState<string | null>(null);
  const [radioSpielt, setRadioSpielt] = useState(false);
  const [radioFehler, setRadioFehler] = useState<string | null>(null);
  const radioRef = useRef<HTMLAudioElement | null>(null);

  // Playlists
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [aktivePlaylist, setAktivePlaylist] = useState<Playlist | null>(null);
  const [titel, setTitel] = useState<Titel[]>([]);
  const [titelIndex, setTitelIndex] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [spielt, setSpielt] = useState(false);
  const [lautstaerke, setLautstaerke] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ── Favoriten über API laden (admin-client, umgeht anon-RLS) ───────── */
  useEffect(() => {
    fetch("/api/radio-favoriten")
      .then((r) => r.json())
      .then(({ ids }) => {
        setFavoriten(ids ?? []);
        setFavoritenGeladen(true);
      })
      .catch(() => setFavoritenGeladen(true));
  }, []);

  /* ── Playlists laden ─────────────────────────────────────────────────── */
  useEffect(() => {
    const supabase = createClient();
    supabase.from("playlists").select("id, name, beschreibung").eq("aktiv", true)
      .then(({ data }) => setPlaylists(data ?? []));
  }, []);

  /* ── Lautstärke ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = lautstaerke;
    if (radioRef.current) radioRef.current.volume = lautstaerke;
  }, [lautstaerke]);

  /* ── Radio abspielen (mit Backup-URL + Timeout) ─────────────────────── */
  function spieleRadio(senderId: string, versuch: 1 | 2 = 1) {
    const sender = RADIO_SENDER.find((s) => s.id === senderId);
    if (!sender) return;

    // Playlist stoppen
    audioRef.current?.pause();
    setSpielt(false);
    setRadioFehler(null);

    // Toggle: gleicher Sender → stoppen
    if (aktivesSender === senderId && radioSpielt) {
      radioRef.current?.pause();
      if (radioRef.current) radioRef.current.src = "";
      setRadioSpielt(false);
      setAktivesSender(null);
      return;
    }

    // Altes Audio wegräumen
    if (radioRef.current) {
      radioRef.current.pause();
      radioRef.current.src = "";
    }

    const streamUrl = versuch === 1 ? sender.url : (sender.backup ?? sender.url);
    const audio = new Audio();
    radioRef.current = audio;
    audio.volume = lautstaerke;
    audio.preload = "none";

    setAktivesSender(senderId);
    setRadioSpielt(false); // erst true wenn wirklich spielt

    // Timeout: nach 8s ohne Wiedergabe → Backup versuchen oder Fehler
    const timeout = setTimeout(() => {
      if (audio.readyState < 3) {
        audio.pause();
        audio.src = "";
        if (versuch === 1 && sender.backup) {
          spieleRadio(senderId, 2);
        } else {
          setRadioFehler(`„${sender.name}" antwortet nicht – Internetverbindung prüfen.`);
          setRadioSpielt(false);
          setAktivesSender(null);
        }
      }
    }, 8000);

    audio.addEventListener("playing", () => {
      clearTimeout(timeout);
      setRadioSpielt(true);
      setRadioFehler(null);
    }, { once: true });

    audio.addEventListener("error", () => {
      clearTimeout(timeout);
      if (versuch === 1 && sender.backup) {
        spieleRadio(senderId, 2);
      } else {
        setRadioFehler(`„${sender.name}" ist gerade nicht erreichbar.`);
        setRadioSpielt(false);
        setAktivesSender(null);
      }
    }, { once: true });

    audio.src = streamUrl;
    // play() kann bei Streams sofort rejecten obwohl der Stream kurz danach läuft —
    // daher stumm ignorieren; Timeout und error-Event decken echte Fehler ab
    audio.play().catch(() => { /* stumm */ });
  }

  /* ── Playlist-Funktionen ─────────────────────────────────────────────── */
  async function ladePlaylist(playlist: Playlist) {
    radioRef.current?.pause();
    setRadioSpielt(false);
    setAktivesSender(null);
    const supabase = createClient();
    setAktivePlaylist(playlist);
    setSpielt(false);
    setTitelIndex(0);
    const { data } = await supabase
      .from("playlist_titel")
      .select("id, titel, kuenstler, storage_key, reihenfolge")
      .eq("playlist_id", playlist.id)
      .order("reihenfolge", { ascending: true });
    const liste = data ?? [];
    setTitel(liste);
    if (liste.length > 0) {
      const url = await ladeAudioUrl(liste[0].storage_key);
      setAudioUrl(url);
    }
  }

  async function ladeAudioUrl(storageKey: string): Promise<string | null> {
    const supabase = createClient();
    const { data } = await supabase.storage.from("musik").createSignedUrl(storageKey, 3600);
    return data?.signedUrl ?? null;
  }

  async function naechsterTitel() {
    const n = (titelIndex + 1) % titel.length;
    setTitelIndex(n);
    const url = await ladeAudioUrl(titel[n].storage_key);
    setAudioUrl(url);
    setSpielt(true);
  }

  async function vorherigeTitel() {
    const v = (titelIndex - 1 + titel.length) % titel.length;
    setTitelIndex(v);
    const url = await ladeAudioUrl(titel[v].storage_key);
    setAudioUrl(url);
    setSpielt(true);
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (spielt) { audioRef.current.pause(); setSpielt(false); }
    else { audioRef.current.play(); setSpielt(true); }
  }

  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    audioRef.current.src = audioUrl;
    if (spielt) audioRef.current.play();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  /* ── Favoriten filtern ───────────────────────────────────────────────── */
  // Wenn keine Favoriten gesetzt: alle Sender zeigen (Fallback)
  const favorisierteSender = favoriten.length > 0
    ? RADIO_SENDER.filter((s) => favoriten.includes(s.id))
    : RADIO_SENDER;

  /* ── UI ──────────────────────────────────────────────────────────────── */
  return (
    <div className="p-5 pb-8 flex flex-col gap-5">
      <h1 className="text-3xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>Musik</h1>

      {/* Tab-Auswahl */}
      <div className="flex rounded-2xl overflow-hidden border-2" style={{ borderColor: "var(--farbe-warm-akzent)" }}>
        {(["radio", "playlists"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-xl font-semibold transition-colors"
            style={{
              background: tab === t ? "var(--farbe-warm-akzent)" : "var(--farbe-hell-karte)",
              color: tab === t ? "white" : "var(--farbe-warm-akzent)",
              minHeight: "56px",
            }}
          >
            {t === "radio" ? "📻 Radio" : "🎵 Playlisten"}
          </button>
        ))}
      </div>

      {/* Lautstärke */}
      <div className="flex items-center gap-4 px-2">
        <span className="text-2xl">🔈</span>
        <input type="range" min="0" max="1" step="0.05" value={lautstaerke}
          onChange={(e) => setLautstaerke(parseFloat(e.target.value))}
          className="flex-1"
          style={{ height: "14px", accentColor: "var(--farbe-warm-akzent)", cursor: "pointer" }}
          aria-label="Lautstärke"
        />
        <span className="text-2xl">🔊</span>
      </div>

      {/* ── Radio-Tab ── */}
      {tab === "radio" && (
        <div className="flex flex-col gap-4">
          {/* Fehler-Banner */}
          {radioFehler && (
            <div className="rounded-2xl px-4 py-3 text-base" style={{ background: "#FEE2E2", color: "#DC2626" }}>
              ⚠️ {radioFehler}
            </div>
          )}

          {/* Sender als Kacheln (2 Spalten) */}
          {favoritenGeladen && (
            <div className="grid grid-cols-2 gap-4">
              {favorisierteSender.map((sender) => {
                const istAktiv = aktivesSender === sender.id && radioSpielt;
                return (
                  <button
                    key={sender.id}
                    onClick={() => spieleRadio(sender.id)}
                    className="rounded-3xl flex flex-col items-center justify-center gap-3 transition-transform active:scale-95"
                    style={{
                      background: istAktiv ? "var(--farbe-warm-akzent)" : sender.farbe,
                      border: `3px solid ${istAktiv ? "var(--farbe-warm-akzent)" : sender.rand}`,
                      minHeight: "150px",
                      padding: "20px 12px",
                      boxShadow: istAktiv ? "0 6px 20px rgba(193,112,58,0.35)" : "none",
                    }}
                  >
                    {/* Animierte Wellen wenn aktiv */}
                    {istAktiv ? (
                      <div className="flex gap-1 items-end" style={{ height: "36px" }}>
                        {[3,5,7,5,3,6,4].map((h, i) => (
                          <div key={i} className="rounded-full" style={{
                            width: "7px",
                            background: "white",
                            height: `${h * 4}px`,
                            animation: `linawelle ${0.4 + i * 0.07}s ease-in-out infinite alternate`,
                            animationDelay: `${i * 0.06}s`,
                          }} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-5xl">{sender.emoji}</span>
                    )}

                    <div className="text-center">
                      <p
                        className="text-lg font-bold leading-tight"
                        style={{ color: istAktiv ? "white" : "var(--farbe-warm-text)" }}
                      >
                        {sender.name}
                      </p>
                      <p
                        className="text-sm mt-1"
                        style={{ color: istAktiv ? "rgba(255,255,255,0.8)" : "var(--farbe-warm-text-weich)" }}
                      >
                        {istAktiv ? "Tippen zum Stoppen" : sender.region}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <style>{`
            @keyframes linawelle {
              from { transform: scaleY(0.4); }
              to   { transform: scaleY(1.8); }
            }
          `}</style>
        </div>
      )}

      {/* ── Playlisten-Tab ── */}
      {tab === "playlists" && !aktivePlaylist && (
        <div className="flex flex-col gap-3">
          {playlists.length === 0 ? (
            <div className="text-center py-12 rounded-3xl" style={{ background: "var(--farbe-hell-karte)" }}>
              <p className="text-5xl mb-4">🎵</p>
              <p className="text-xl" style={{ color: "var(--farbe-warm-text-weich)" }}>
                Noch keine Playlisten eingerichtet.
              </p>
            </div>
          ) : playlists.map((p) => (
            <button key={p.id} onClick={() => ladePlaylist(p)}
              className="rounded-2xl p-5 text-left flex items-center gap-4 transition-transform active:scale-98"
              style={{ background: "var(--farbe-hell-karte)", border: "2px solid var(--farbe-warm-akzent-hell)", minHeight: "80px" }}>
              <span className="text-3xl">🎵</span>
              <div>
                <p className="text-xl font-semibold" style={{ color: "var(--farbe-warm-text)" }}>{p.name}</p>
                {p.beschreibung && <p className="text-base" style={{ color: "var(--farbe-warm-text-weich)" }}>{p.beschreibung}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === "playlists" && aktivePlaylist && (
        <div className="flex flex-col gap-5">
          <button onClick={() => { setAktivePlaylist(null); setSpielt(false); audioRef.current?.pause(); }}
            className="text-left flex items-center gap-2"
            style={{ color: "var(--farbe-warm-akzent)", minHeight: "44px", fontSize: "1.1rem" }}>
            ← Alle Playlisten
          </button>

          <div className="rounded-3xl p-6 text-center"
            style={{ background: "var(--farbe-hell-karte)", border: "2px solid var(--farbe-warm-akzent-hell)" }}>
            <p className="text-4xl mb-2">🎵</p>
            <p className="text-2xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
              {titel[titelIndex]?.titel ?? "—"}
            </p>
            <p className="text-lg" style={{ color: "var(--farbe-warm-text-weich)" }}>
              {titel[titelIndex]?.kuenstler ?? ""}
            </p>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button onClick={vorherigeTitel} disabled={titel.length <= 1}
              className="rounded-full flex items-center justify-center disabled:opacity-30"
              style={{ width: "72px", height: "72px", background: "var(--farbe-warm-bg2)", fontSize: "1.8rem" }}>⏮</button>
            <button onClick={togglePlay}
              className="rounded-full flex items-center justify-center"
              style={{ width: "120px", height: "120px", background: "var(--farbe-warm-akzent)", color: "white", fontSize: "2.5rem", boxShadow: "0 6px 20px rgba(193,112,58,0.4)" }}>
              {spielt ? "⏸" : "▶"}
            </button>
            <button onClick={naechsterTitel} disabled={titel.length <= 1}
              className="rounded-full flex items-center justify-center disabled:opacity-30"
              style={{ width: "72px", height: "72px", background: "var(--farbe-warm-bg2)", fontSize: "1.8rem" }}>⏭</button>
          </div>

          {titel.map((t, i) => (
            <button key={t.id}
              onClick={async () => { setTitelIndex(i); const url = await ladeAudioUrl(t.storage_key); setAudioUrl(url); setSpielt(true); }}
              className="rounded-xl px-4 py-3 text-left"
              style={{
                background: i === titelIndex ? "var(--farbe-warm-bg2)" : "transparent",
                color: i === titelIndex ? "var(--farbe-warm-akzent)" : "var(--farbe-warm-text)",
                fontWeight: i === titelIndex ? "700" : "400",
                minHeight: "56px",
                border: i === titelIndex ? "2px solid var(--farbe-warm-akzent-hell)" : "2px solid transparent",
              }}>
              {i === titelIndex && spielt ? "▶ " : ""}{t.titel}{t.kuenstler ? ` — ${t.kuenstler}` : ""}
            </button>
          ))}
        </div>
      )}

      <audio ref={audioRef} onEnded={naechsterTitel} />
    </div>
  );
}

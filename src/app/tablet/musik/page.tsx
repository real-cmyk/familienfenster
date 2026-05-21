"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type Playlist = { id: string; name: string; beschreibung: string | null };
type Titel = { id: string; titel: string; kuenstler: string | null; storage_key: string; reihenfolge: number };

export default function MusikSeite() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [aktivePlaylist, setAktivePlaylist] = useState<Playlist | null>(null);
  const [titel, setTitel] = useState<Titel[]>([]);
  const [aktuelleTitelIndex, setAktuelleTitelIndex] = useState(0);
  const [audio_url, setAudioUrl] = useState<string | null>(null);
  const [spielt, setSpielt] = useState(false);
  const [lautstaerke, setLautstaerke] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("playlists")
      .select("id, name, beschreibung")
      .eq("aktiv", true)
      .then(({ data }) => setPlaylists(data ?? []));
  }, []);

  async function ladePlaylist(playlist: Playlist) {
    const supabase = createClient();
    setAktivePlaylist(playlist);
    setSpielt(false);
    setAktuelleTitelIndex(0);

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
    const { data } = await supabase.storage
      .from("musik")
      .createSignedUrl(storageKey, 3600);
    return data?.signedUrl ?? null;
  }

  async function naechsterTitel() {
    const naechster = (aktuelleTitelIndex + 1) % titel.length;
    setAktuelleTitelIndex(naechster);
    const url = await ladeAudioUrl(titel[naechster].storage_key);
    setAudioUrl(url);
    setSpielt(true);
  }

  async function vorherigeTitel() {
    const vorheriger = (aktuelleTitelIndex - 1 + titel.length) % titel.length;
    setAktuelleTitelIndex(vorheriger);
    const url = await ladeAudioUrl(titel[vorheriger].storage_key);
    setAudioUrl(url);
    setSpielt(true);
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (spielt) {
      audioRef.current.pause();
      setSpielt(false);
    } else {
      audioRef.current.play();
      setSpielt(true);
    }
  }

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = lautstaerke;
  }, [lautstaerke]);

  useEffect(() => {
    if (!audioRef.current || !audio_url) return;
    audioRef.current.src = audio_url;
    if (spielt) audioRef.current.play();
  }, [audio_url]);

  const aktuellerTitel = titel[aktuelleTitelIndex];

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
        Musik
      </h1>

      {/* Playlist-Auswahl */}
      {!aktivePlaylist && (
        <div className="flex flex-col gap-3">
          {playlists.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-5xl mb-4">🎵</p>
              <p className="text-xl" style={{ color: "var(--farbe-warm-text-weich)" }}>
                Noch keine Playlists eingerichtet.
              </p>
            </div>
          ) : (
            playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => ladePlaylist(p)}
                className="rounded-2xl p-5 text-left flex items-center gap-4 transition-transform active:scale-98"
                style={{
                  background: "var(--farbe-hell-karte)",
                  border: "2px solid var(--farbe-warm-akzent-hell)",
                  minHeight: "80px",
                }}
              >
                <span className="text-3xl" aria-hidden="true">🎵</span>
                <div>
                  <p className="text-xl font-semibold" style={{ color: "var(--farbe-warm-text)" }}>
                    {p.name}
                  </p>
                  {p.beschreibung && (
                    <p className="text-base" style={{ color: "var(--farbe-warm-text-weich)" }}>
                      {p.beschreibung}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Player */}
      {aktivePlaylist && (
        <div className="flex flex-col gap-5">
          <button
            onClick={() => { setAktivePlaylist(null); setSpielt(false); audioRef.current?.pause(); }}
            className="text-left flex items-center gap-2"
            style={{ color: "var(--farbe-warm-akzent)", minHeight: "44px" }}
          >
            ← Alle Playlists
          </button>

          <div
            className="rounded-3xl p-6 text-center"
            style={{ background: "var(--farbe-hell-karte)", border: "2px solid var(--farbe-warm-akzent-hell)" }}
          >
            <p className="text-4xl mb-2" aria-hidden="true">🎵</p>
            <p className="text-xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
              {aktuellerTitel?.titel ?? "—"}
            </p>
            <p className="text-base" style={{ color: "var(--farbe-warm-text-weich)" }}>
              {aktuellerTitel?.kuenstler ?? ""}
            </p>
          </div>

          {/* Steuerung */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={vorherigeTitel}
              disabled={titel.length <= 1}
              className="rounded-full flex items-center justify-center disabled:opacity-30 transition-transform active:scale-95"
              style={{
                width: "72px", height: "72px",
                background: "var(--farbe-warm-bg2)",
                fontSize: "1.8rem",
              }}
              aria-label="Vorheriger Titel"
            >
              ⏮
            </button>
            <button
              onClick={togglePlay}
              className="rounded-full flex items-center justify-center transition-transform active:scale-95"
              style={{
                width: "120px", height: "120px",
                background: "var(--farbe-warm-akzent)",
                color: "white",
                fontSize: "2.5rem",
                boxShadow: "0 6px 20px rgba(193,112,58,0.4)",
              }}
              aria-label={spielt ? "Pause" : "Abspielen"}
            >
              {spielt ? "⏸" : "▶"}
            </button>
            <button
              onClick={naechsterTitel}
              disabled={titel.length <= 1}
              className="rounded-full flex items-center justify-center disabled:opacity-30 transition-transform active:scale-95"
              style={{
                width: "72px", height: "72px",
                background: "var(--farbe-warm-bg2)",
                fontSize: "1.8rem",
              }}
              aria-label="Nächster Titel"
            >
              ⏭
            </button>
          </div>

          {/* Lautstärke */}
          <div className="flex items-center gap-4 px-2">
            <span className="text-2xl" aria-hidden="true">🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={lautstaerke}
              onChange={(e) => setLautstaerke(parseFloat(e.target.value))}
              className="flex-1"
              style={{ height: "12px", accentColor: "var(--farbe-warm-akzent)", cursor: "pointer" }}
              aria-label="Lautstärke"
            />
            <span className="text-2xl" aria-hidden="true">🔊</span>
          </div>

          {/* Titelliste */}
          {titel.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-base font-semibold" style={{ color: "var(--farbe-warm-text-weich)" }}>
                {aktivePlaylist.name}
              </p>
              {titel.map((t, i) => (
                <button
                  key={t.id}
                  onClick={async () => {
                    setAktuelleTitelIndex(i);
                    const url = await ladeAudioUrl(t.storage_key);
                    setAudioUrl(url);
                    setSpielt(true);
                  }}
                  className="rounded-xl px-4 py-3 text-left transition-colors"
                  style={{
                    background: i === aktuelleTitelIndex ? "var(--farbe-warm-bg2)" : "transparent",
                    color: i === aktuelleTitelIndex ? "var(--farbe-warm-akzent)" : "var(--farbe-warm-text)",
                    fontWeight: i === aktuelleTitelIndex ? "700" : "400",
                    minHeight: "56px",
                    border: i === aktuelleTitelIndex ? "2px solid var(--farbe-warm-akzent-hell)" : "2px solid transparent",
                  }}
                >
                  {i === aktuelleTitelIndex && spielt ? "▶ " : ""}{t.titel}
                  {t.kuenstler ? ` — ${t.kuenstler}` : ""}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <audio ref={audioRef} onEnded={naechsterTitel} />
    </div>
  );
}

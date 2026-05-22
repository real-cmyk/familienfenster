"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/* ── Radio-Sender ───────────────────────────────────────────────────────── */
export const RADIO_SENDER = [
  { id: "ndr1", name: "NDR 1 Welle Nord", region: "Norddeutschland", emoji: "🌊", url: "https://ndr-ndr1wellenord-kiel.cast.addradio.de/ndr/ndr1wellenord/kiel/mp3/128/stream.mp3" },
  { id: "ndr2", name: "NDR 2", region: "Hits & Unterhaltung", emoji: "🎵", url: "https://ndr-ndr2.cast.addradio.de/ndr/ndr2/niedersachsen/mp3/128/stream.mp3" },
  { id: "wdr4", name: "WDR 4", region: "Schlager & Oldies", emoji: "🎶", url: "https://wdr-wdr4.cast.addradio.de/wdr/wdr4/live/mp3/128/stream.mp3" },
  { id: "hr1", name: "hr1", region: "Klassisch modern", emoji: "🎼", url: "https://hr-hr1.cast.addradio.de/hr/hr1/live/mp3/128/stream.mp3" },
  { id: "dlf", name: "Deutschlandradio", region: "Nachrichten & Kultur", emoji: "📻", url: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3" },
  { id: "bay1", name: "Bayern 1", region: "Volksmusik & Heimat", emoji: "🏔️", url: "https://dispatcher.rndfnk.com/br/br1/live/mp3/low" },
  { id: "mdrjump", name: "MDR Jump", region: "Aktuelle Hits", emoji: "⭐", url: "https://mdr-jump.cast.addradio.de/mdr/jump/live/mp3/128/stream.mp3" },
  { id: "swrslager", name: "SWR4", region: "Schlager & Evergreens", emoji: "🌻", url: "https://dispatcher.rndfnk.com/swr/swr4/bw/mp3/128/stream.mp3" },
];

type Playlist = { id: string; name: string; beschreibung: string | null };
type Titel = { id: string; titel: string; kuenstler: string | null; storage_key: string; reihenfolge: number };

/* ── Hauptseite ─────────────────────────────────────────────────────────── */
export default function MusikSeite() {
  const [tab, setTab] = useState<"radio" | "playlists">("radio");

  // Radio
  const [favoriten, setFavoriten] = useState<string[]>([]);
  const [aktivesSender, setAktivesSender] = useState<string | null>(null);
  const [radioSpielt, setRadioSpielt] = useState(false);
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

  /* ── Favoriten aus Supabase ──────────────────────────────────────────── */
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("radio_favoriten")
      .select("station_id")
      .then(({ data }) => {
        setFavoriten((data ?? []).map((r: { station_id: string }) => r.station_id));
      });
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

  /* ── Radio abspielen ─────────────────────────────────────────────────── */
  function spieleRadio(senderId: string) {
    const sender = RADIO_SENDER.find((s) => s.id === senderId);
    if (!sender) return;

    // Playlist stoppen
    audioRef.current?.pause();
    setSpielt(false);

    if (!radioRef.current) radioRef.current = new Audio();
    const r = radioRef.current;

    if (aktivesSender === senderId && radioSpielt) {
      r.pause();
      setRadioSpielt(false);
      setAktivesSender(null);
      return;
    }

    r.src = sender.url;
    r.volume = lautstaerke;
    r.play().catch(() => {});
    setAktivesSender(senderId);
    setRadioSpielt(true);
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

  /* ── Favoriten-Sender (oben in Radio-Tab) ────────────────────────────── */
  const favorisierteSender = RADIO_SENDER.filter((s) => favoriten.includes(s.id));
  const andereSender = RADIO_SENDER.filter((s) => !favoriten.includes(s.id));

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
            className="flex-1 py-3 text-lg font-semibold transition-colors"
            style={{
              background: tab === t ? "var(--farbe-warm-akzent)" : "var(--farbe-hell-karte)",
              color: tab === t ? "white" : "var(--farbe-warm-akzent)",
              minHeight: "52px",
            }}
          >
            {t === "radio" ? "📻 Radio" : "🎵 Playlisten"}
          </button>
        ))}
      </div>

      {/* Lautstärke */}
      <div className="flex items-center gap-4 px-2">
        <span className="text-2xl" aria-hidden="true">🔈</span>
        <input
          type="range" min="0" max="1" step="0.05" value={lautstaerke}
          onChange={(e) => setLautstaerke(parseFloat(e.target.value))}
          className="flex-1"
          style={{ height: "12px", accentColor: "var(--farbe-warm-akzent)", cursor: "pointer" }}
          aria-label="Lautstärke"
        />
        <span className="text-2xl" aria-hidden="true">🔊</span>
      </div>

      {/* ── Radio-Tab ── */}
      {tab === "radio" && (
        <div className="flex flex-col gap-4">
          {favorisierteSender.length > 0 && (
            <div>
              <p className="text-base font-semibold mb-2" style={{ color: "var(--farbe-warm-text-weich)" }}>
                ⭐ Favoriten
              </p>
              <div className="flex flex-col gap-2">
                {favorisierteSender.map((s) => (
                  <SenderButton key={s.id} sender={s} aktiv={aktivesSender === s.id && radioSpielt} onPlay={spieleRadio} />
                ))}
              </div>
            </div>
          )}

          {andereSender.length > 0 && (
            <div>
              {favorisierteSender.length > 0 && (
                <p className="text-base font-semibold mb-2" style={{ color: "var(--farbe-warm-text-weich)" }}>
                  Alle Sender
                </p>
              )}
              <div className="flex flex-col gap-2">
                {andereSender.map((s) => (
                  <SenderButton key={s.id} sender={s} aktiv={aktivesSender === s.id && radioSpielt} onPlay={spieleRadio} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Playlisten-Tab ── */}
      {tab === "playlists" && !aktivePlaylist && (
        <div className="flex flex-col gap-3">
          {playlists.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-5xl mb-4">🎵</p>
              <p className="text-xl" style={{ color: "var(--farbe-warm-text-weich)" }}>
                Noch keine Playlisten eingerichtet.
              </p>
            </div>
          ) : playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => ladePlaylist(p)}
              className="rounded-2xl p-5 text-left flex items-center gap-4 transition-transform active:scale-98"
              style={{ background: "var(--farbe-hell-karte)", border: "2px solid var(--farbe-warm-akzent-hell)", minHeight: "80px" }}
            >
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
          <button
            onClick={() => { setAktivePlaylist(null); setSpielt(false); audioRef.current?.pause(); }}
            className="text-left flex items-center gap-2"
            style={{ color: "var(--farbe-warm-akzent)", minHeight: "44px", fontSize: "1.1rem" }}
          >
            ← Alle Playlisten
          </button>

          <div className="rounded-3xl p-6 text-center"
            style={{ background: "var(--farbe-hell-karte)", border: "2px solid var(--farbe-warm-akzent-hell)" }}>
            <p className="text-4xl mb-2">🎵</p>
            <p className="text-2xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>{titel[titelIndex]?.titel ?? "—"}</p>
            <p className="text-lg" style={{ color: "var(--farbe-warm-text-weich)" }}>{titel[titelIndex]?.kuenstler ?? ""}</p>
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

          {titel.length > 0 && (
            <div className="flex flex-col gap-2">
              {titel.map((t, i) => (
                <button
                  key={t.id}
                  onClick={async () => { setTitelIndex(i); const url = await ladeAudioUrl(t.storage_key); setAudioUrl(url); setSpielt(true); }}
                  className="rounded-xl px-4 py-3 text-left"
                  style={{
                    background: i === titelIndex ? "var(--farbe-warm-bg2)" : "transparent",
                    color: i === titelIndex ? "var(--farbe-warm-akzent)" : "var(--farbe-warm-text)",
                    fontWeight: i === titelIndex ? "700" : "400",
                    minHeight: "56px",
                    border: i === titelIndex ? "2px solid var(--farbe-warm-akzent-hell)" : "2px solid transparent",
                  }}
                >
                  {i === titelIndex && spielt ? "▶ " : ""}{t.titel}{t.kuenstler ? ` — ${t.kuenstler}` : ""}
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

/* ── Sender-Button ──────────────────────────────────────────────────────── */
function SenderButton({
  sender, aktiv, onPlay,
}: {
  sender: typeof RADIO_SENDER[0];
  aktiv: boolean;
  onPlay: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onPlay(sender.id)}
      className="rounded-2xl p-4 text-left flex items-center gap-4 transition-transform active:scale-98"
      style={{
        background: aktiv ? "var(--farbe-warm-akzent)" : "var(--farbe-hell-karte)",
        border: `2px solid ${aktiv ? "var(--farbe-warm-akzent)" : "var(--farbe-warm-akzent-hell)"}`,
        minHeight: "72px",
      }}
    >
      <span className="text-3xl shrink-0">{aktiv ? "🔊" : sender.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xl font-semibold truncate" style={{ color: aktiv ? "white" : "var(--farbe-warm-text)" }}>
          {sender.name}
        </p>
        <p className="text-base" style={{ color: aktiv ? "rgba(255,255,255,0.8)" : "var(--farbe-warm-text-weich)" }}>
          {sender.region}
        </p>
      </div>
      {aktiv && <span className="text-white text-xl shrink-0">⏸</span>}
    </button>
  );
}

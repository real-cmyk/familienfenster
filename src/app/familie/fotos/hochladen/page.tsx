"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function FotoHochladenSeite() {
  const [datei, setDatei] = useState<File | null>(null);
  const [vorschau, setVorschau] = useState<string | null>(null);
  const [beschriftung, setBeschriftung] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleDateiWahl(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setDatei(f);
    setVorschau(URL.createObjectURL(f));
  }

  async function handleHochladen(e: React.FormEvent) {
    e.preventDefault();
    if (!datei) return;
    setLaedt(true);
    setFehler("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setFehler("Nicht eingeloggt."); setLaedt(false); return; }

    const { data: person } = await supabase
      .from("personen")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!person) { setFehler("Profil nicht gefunden."); setLaedt(false); return; }

    const dateiname = `${Date.now()}_${datei.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: storageError } = await supabase.storage
      .from("fotos")
      .upload(dateiname, datei);

    if (storageError) {
      setFehler("Hochladen fehlgeschlagen. Bitte erneut versuchen.");
      setLaedt(false);
      return;
    }

    const { error: dbError } = await supabase.from("fotos").insert({
      hochgeladen_von: person.id,
      storage_key: dateiname,
      beschriftung: beschriftung || null,
      status: "ausstehend",
    });

    if (dbError) {
      setFehler("Datenbank-Fehler. Bitte erneut versuchen.");
      setLaedt(false);
      return;
    }

    router.push("/familie");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--farbe-warm-text)" }}>
        Foto hochladen
      </h1>

      <form onSubmit={handleHochladen} className="flex flex-col gap-6">
        {/* Datei-Wahl */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-3xl flex flex-col items-center justify-center gap-3 border-2 border-dashed transition-colors"
          style={{
            height: "200px",
            borderColor: vorschau ? "var(--farbe-gruen)" : "var(--farbe-warm-akzent-hell)",
            background: vorschau ? "var(--farbe-gruen-hell)" : "var(--farbe-hell-karte)",
            overflow: "hidden",
          }}
        >
          {vorschau ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vorschau} alt="Vorschau" className="w-full h-full object-cover" />
          ) : (
            <>
              <span className="text-4xl" aria-hidden="true">📸</span>
              <span className="text-lg" style={{ color: "var(--farbe-warm-text-weich)" }}>
                Foto auswählen
              </span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleDateiWahl}
          className="hidden"
        />

        {/* Beschriftung */}
        <div className="flex flex-col gap-2">
          <label className="font-medium text-lg" style={{ color: "var(--farbe-warm-text)" }}>
            Beschriftung (optional)
          </label>
          <input
            type="text"
            value={beschriftung}
            onChange={(e) => setBeschriftung(e.target.value)}
            placeholder="z.B. Urlaub am See 2024"
            className="rounded-2xl border-2 px-5 py-4 text-lg w-full outline-none focus:border-[var(--farbe-warm-akzent)]"
            style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-hell-karte)" }}
          />
        </div>

        <p className="text-sm" style={{ color: "var(--farbe-warm-text-weich)" }}>
          Das Foto wird nach dem Hochladen kurz geprüft, bevor es auf dem Tablet erscheint.
        </p>

        {fehler && <p className="text-red-600">{fehler}</p>}

        <button
          type="submit"
          disabled={!datei || laedt}
          className="rounded-2xl py-4 text-xl font-bold text-white transition-opacity disabled:opacity-40"
          style={{ background: "var(--farbe-warm-akzent)", minHeight: "64px" }}
        >
          {laedt ? "Wird hochgeladen…" : "Foto hochladen 📸"}
        </button>
      </form>
    </div>
  );
}

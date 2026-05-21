"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Foto = { id: string; storage_key: string; beschriftung: string | null; url: string };

export default function FamiliesFotos() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [laedt, setLaedt] = useState(true);
  const [loescht, setLoescht] = useState<string | null>(null);

  useEffect(() => {
    ladeFotos();
  }, []);

  async function ladeFotos() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: person } = await supabase
      .from("personen").select("id").eq("auth_id", user.id).single();
    if (!person) return;

    const { data } = await supabase
      .from("fotos")
      .select("id, storage_key, beschriftung")
      .eq("hochgeladen_von", person.id)
      .order("erstellt_am", { ascending: false });

    if (!data) { setLaedt(false); return; }

    // Signed URLs holen
    const mitUrls = await Promise.all(
      data.map(async (f) => {
        const { data: signed } = await supabase.storage
          .from("fotos").createSignedUrl(f.storage_key, 3600);
        return { ...f, url: signed?.signedUrl ?? "" };
      })
    );
    setFotos(mitUrls.filter(f => f.url));
    setLaedt(false);
  }

  async function handleLoeschen(foto: Foto) {
    if (!confirm(`Foto "${foto.beschriftung ?? foto.storage_key}" wirklich löschen?`)) return;
    setLoescht(foto.id);
    const supabase = createClient();

    // Storage löschen
    await supabase.storage.from("fotos").remove([foto.storage_key]);
    // DB-Eintrag löschen
    await supabase.from("fotos").delete().eq("id", foto.id);

    setFotos(prev => prev.filter(f => f.id !== foto.id));
    setLoescht(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
          Meine Fotos
        </h1>
        <Link
          href="/familie/fotos/hochladen"
          className="rounded-2xl px-5 py-3 text-base font-semibold text-white"
          style={{ background: "var(--farbe-warm-akzent)", minHeight: "48px", display: "flex", alignItems: "center" }}
        >
          + Foto hochladen
        </Link>
      </div>

      {laedt && (
        <p className="text-center py-12" style={{ color: "var(--farbe-warm-text-weich)" }}>
          Wird geladen…
        </p>
      )}

      {!laedt && fotos.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📸</p>
          <p className="text-lg" style={{ color: "var(--farbe-warm-text-weich)" }}>
            Noch keine Fotos hochgeladen.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {fotos.map((foto) => (
          <div
            key={foto.id}
            className="rounded-2xl overflow-hidden relative"
            style={{ background: "var(--farbe-hell-karte)", border: "2px solid var(--farbe-warm-akzent-hell)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto.url} alt={foto.beschriftung ?? ""} className="w-full aspect-square object-cover" />
            <div className="p-3">
              {foto.beschriftung && (
                <p className="text-sm font-medium mb-2 truncate" style={{ color: "var(--farbe-warm-text)" }}>
                  {foto.beschriftung}
                </p>
              )}
              <button
                onClick={() => handleLoeschen(foto)}
                disabled={loescht === foto.id}
                className="w-full rounded-xl py-2 text-sm font-medium transition-opacity disabled:opacity-50"
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  minHeight: "44px",
                }}
              >
                {loescht === foto.id ? "Wird gelöscht…" : "🗑 Löschen"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

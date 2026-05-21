"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Foto = { id: string; storage_key: string; beschriftung: string | null };

export default function FotosSeite() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [ausgewaehlt, setAusgewaehlt] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("fotos")
      .select("id, storage_key, beschriftung")
      .eq("status", "genehmigt")
      .order("anzeige_reihenfolge", { ascending: true })
      .then(({ data }) => {
        const liste = data ?? [];
        setFotos(liste);
        Promise.all(
          liste.map(async (f) => {
            const { data: url } = await supabase.storage
              .from("fotos")
              .createSignedUrl(f.storage_key, 3600);
            return [f.id, url?.signedUrl ?? ""] as [string, string];
          })
        ).then((eintraege) => setUrls(Object.fromEntries(eintraege)));
      });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--farbe-warm-text)" }}>
        Familienfotos
      </h1>

      {fotos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🖼️</p>
          <p className="text-xl" style={{ color: "var(--farbe-warm-text-weich)" }}>
            Noch keine Fotos vorhanden.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {fotos.map((foto) => (
            <button
              key={foto.id}
              onClick={() => setAusgewaehlt(foto.id)}
              className="rounded-2xl overflow-hidden transition-transform active:scale-95"
              style={{ height: "160px", background: "var(--farbe-warm-bg2)" }}
              aria-label={foto.beschriftung ?? "Foto öffnen"}
            >
              {urls[foto.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urls[foto.id]}
                  alt={foto.beschriftung ?? "Familienfoto"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl">🖼️</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Vollbild-Ansicht */}
      {ausgewaehlt && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setAusgewaehlt(null)}
        >
          {(() => {
            const foto = fotos.find((f) => f.id === ausgewaehlt);
            return foto && urls[foto.id] ? (
              <div className="max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={urls[foto.id]}
                  alt={foto.beschriftung ?? "Familienfoto"}
                  className="max-w-screen max-h-screen object-contain rounded-2xl"
                  style={{ maxWidth: "90vw", maxHeight: "80vh" }}
                />
                {foto.beschriftung && (
                  <p className="text-white text-center mt-3 text-lg">{foto.beschriftung}</p>
                )}
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setAusgewaehlt(null)}
                    className="rounded-2xl px-8 py-3 text-lg font-semibold text-white"
                    style={{ background: "var(--farbe-warm-akzent)", minHeight: "56px" }}
                  >
                    Schließen
                  </button>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}

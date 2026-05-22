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
    <div className="p-5 pb-8">
      <h1 className="text-3xl font-bold mb-5" style={{ color: "var(--farbe-warm-text)" }}>
        Familienfotos
      </h1>

      {fotos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-6xl mb-4">🖼️</p>
          <p className="text-xl" style={{ color: "var(--farbe-warm-text-weich)" }}>
            Noch keine Fotos vorhanden.
          </p>
        </div>
      ) : (
        /* Collage: 2-spaltig, natürliche Seitenverhältnisse erhalten */
        <div style={{ columns: 2, gap: "10px" }}>
          {fotos.map((foto) => (
            <button
              key={foto.id}
              onClick={() => setAusgewaehlt(foto.id)}
              className="rounded-2xl overflow-hidden transition-transform active:scale-97 w-full"
              style={{
                display: "block",
                breakInside: "avoid",
                marginBottom: "10px",
                background: "var(--farbe-warm-akzent-hell)",
                border: "none",
                padding: 0,
              }}
              aria-label={foto.beschriftung ?? "Foto öffnen"}
            >
              {urls[foto.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urls[foto.id]}
                  alt={foto.beschriftung ?? "Familienfoto"}
                  className="w-full"
                  style={{
                    display: "block",
                    borderRadius: "16px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  className="w-full flex items-center justify-center"
                  style={{ height: "140px", borderRadius: "16px" }}
                >
                  <span className="text-4xl">🖼️</span>
                </div>
              )}
              {foto.beschriftung && (
                <p
                  className="text-sm text-center px-2 py-2"
                  style={{ color: "var(--farbe-warm-text-weich)" }}
                >
                  {foto.beschriftung}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Vollbild-Overlay */}
      {ausgewaehlt && (() => {
        const foto = fotos.find((f) => f.id === ausgewaehlt);
        return foto ? (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ background: "rgba(0,0,0,0.9)" }}
            onClick={() => setAusgewaehlt(null)}
          >
            <div className="max-w-full max-h-full flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}>
              {urls[foto.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urls[foto.id]}
                  alt={foto.beschriftung ?? "Familienfoto"}
                  style={{
                    maxWidth: "92vw",
                    maxHeight: "78vh",
                    objectFit: "contain",
                    borderRadius: "16px",
                  }}
                />
              ) : null}
              {foto.beschriftung && (
                <p className="text-white text-xl text-center">{foto.beschriftung}</p>
              )}
              <button
                onClick={() => setAusgewaehlt(null)}
                className="rounded-2xl px-8 py-4 text-xl font-semibold text-white"
                style={{ background: "var(--farbe-warm-akzent)", minHeight: "60px" }}
              >
                Schließen
              </button>
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}

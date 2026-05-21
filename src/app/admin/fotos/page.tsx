"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Foto = { id: string; storage_key: string; beschriftung: string | null; status: string; erstellt_am: string };

export default function FotosModerationSeite() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [laedt, setLaedt] = useState(true);

  async function ladeFotos() {
    const supabase = createClient();
    const { data } = await supabase
      .from("fotos")
      .select("id, storage_key, beschriftung, status, erstellt_am")
      .order("erstellt_am", { ascending: false })
      .limit(50);

    const liste = data ?? [];
    setFotos(liste);

    const urlMap: Record<string, string> = {};
    await Promise.all(
      liste.map(async (f) => {
        const { data: url } = await supabase.storage
          .from("fotos")
          .createSignedUrl(f.storage_key, 3600);
        if (url?.signedUrl) urlMap[f.id] = url.signedUrl;
      })
    );
    setUrls(urlMap);
    setLaedt(false);
  }

  useEffect(() => { ladeFotos(); }, []);

  async function handleAktion(id: string, status: "genehmigt" | "abgelehnt") {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: person } = await supabase.from("personen").select("id").eq("auth_id", user!.id).single();

    await supabase.from("fotos").update({
      status,
      genehmigt_von: person?.id,
      genehmigt_am: new Date().toISOString(),
    }).eq("id", id);

    setFotos((prev) => prev.map((f) => f.id === id ? { ...f, status } : f));
  }

  if (laedt) return <p style={{ color: "var(--farbe-warm-text-weich)" }}>Wird geladen…</p>;

  const ausstehend = fotos.filter((f) => f.status === "ausstehend");
  const bearbeitet = fotos.filter((f) => f.status !== "ausstehend");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--farbe-warm-text)" }}>
        Fotos freigeben
      </h1>

      {ausstehend.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--farbe-gruen-hell)", border: "2px solid var(--farbe-gruen)" }}>
          <p className="text-2xl">✅</p>
          <p className="text-lg mt-2" style={{ color: "var(--farbe-gruen)" }}>Alle Fotos sind geprüft!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5 mb-8">
          <h2 className="text-lg font-semibold" style={{ color: "var(--farbe-warm-akzent)" }}>
            Ausstehend ({ausstehend.length})
          </h2>
          {ausstehend.map((foto) => (
            <div
              key={foto.id}
              className="rounded-2xl overflow-hidden"
              style={{ border: "2px solid var(--farbe-warm-akzent-hell)" }}
            >
              {urls[foto.id] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls[foto.id]} alt={foto.beschriftung ?? ""} className="w-full object-cover" style={{ maxHeight: "300px" }} />
              )}
              <div className="p-4 flex items-center justify-between gap-4" style={{ background: "var(--farbe-hell-karte)" }}>
                <p style={{ color: "var(--farbe-warm-text-weich)" }}>{foto.beschriftung ?? "Kein Titel"}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAktion(foto.id, "genehmigt")}
                    className="rounded-xl px-4 py-2 font-semibold text-white"
                    style={{ background: "var(--farbe-gruen)", minHeight: "48px" }}
                  >
                    Freigeben
                  </button>
                  <button
                    onClick={() => handleAktion(foto.id, "abgelehnt")}
                    className="rounded-xl px-4 py-2 font-semibold"
                    style={{ background: "var(--farbe-warm-bg2)", color: "var(--farbe-warm-text)", minHeight: "48px", border: "1px solid var(--farbe-warm-akzent-hell)" }}
                  >
                    Ablehnen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {bearbeitet.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--farbe-warm-text-weich)" }}>
            Bereits bearbeitet ({bearbeitet.length})
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {bearbeitet.map((foto) => (
              <div
                key={foto.id}
                className="rounded-xl overflow-hidden relative"
                style={{ height: "100px", background: "var(--farbe-warm-bg2)", opacity: foto.status === "abgelehnt" ? 0.4 : 1 }}
              >
                {urls[foto.id] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urls[foto.id]} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute top-1 right-1 text-xs px-1 rounded" style={{ background: foto.status === "genehmigt" ? "var(--farbe-gruen)" : "#888", color: "white" }}>
                  {foto.status === "genehmigt" ? "✓" : "✗"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

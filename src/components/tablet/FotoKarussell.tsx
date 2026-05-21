"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Foto = { id: string; storage_key: string; beschriftung: string | null };

export default function FotoKarussell({ fotos }: { fotos: Foto[] }) {
  const [aktuellIndex, setAktuellIndex] = useState(0);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all(
      fotos.map(async (f) => {
        const { data } = await supabase.storage
          .from("fotos")
          .createSignedUrl(f.storage_key, 3600);
        return data?.signedUrl ?? "";
      })
    ).then(setUrls);
  }, [fotos]);

  useEffect(() => {
    if (fotos.length <= 1) return;
    const interval = setInterval(() => {
      setAktuellIndex((i) => (i + 1) % fotos.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [fotos.length]);

  if (urls.length === 0 || !urls[aktuellIndex]) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ background: "var(--farbe-warm-bg2)" }}
      >
        <span className="text-5xl">🖼️</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={aktuellIndex}
        src={urls[aktuellIndex]}
        alt={fotos[aktuellIndex]?.beschriftung ?? "Familienfoto"}
        className="w-full h-full object-cover animate-einblenden"
      />
      {fotos[aktuellIndex]?.beschriftung && (
        <div
          className="absolute bottom-0 left-0 right-0 px-4 py-2 text-white text-base font-medium"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          {fotos[aktuellIndex].beschriftung}
        </div>
      )}
      {/* Punkt-Navigation */}
      {fotos.length > 1 && (
        <div className="absolute bottom-2 right-3 flex gap-1">
          {fotos.map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: "8px",
                height: "8px",
                background: i === aktuellIndex ? "white" : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginSeite() {
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState("");
  const [laedt, setLaedt] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLaedt(true);
    setFehler("");

    const { error } = await supabase.auth.signInWithPassword({ email, password: passwort });

    if (error) {
      setFehler("E-Mail oder Passwort ist falsch.");
      setLaedt(false);
      return;
    }

    // Rolle prüfen und weiterleiten
    const { data: person } = await supabase
      .from("personen")
      .select("rolle")
      .single();

    if (person?.rolle === "admin") {
      router.push("/admin");
    } else {
      router.push("/familie");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "var(--farbe-warm-bg)" }}>
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-center" style={{ color: "var(--farbe-warm-text)" }}>
          Familienfenster
        </h1>
        <p className="text-center mb-10" style={{ color: "var(--farbe-warm-text-weich)" }}>
          Familienmitglieder & Admin-Zugang
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <label className="font-medium" style={{ color: "var(--farbe-warm-text)" }}>
            E-Mail-Adresse
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@beispiel.de"
            required
            autoComplete="email"
            className="rounded-2xl border-2 px-5 py-4 text-xl w-full outline-none focus:border-[var(--farbe-warm-akzent)]"
            style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-hell-karte)" }}
          />
          <label className="font-medium" style={{ color: "var(--farbe-warm-text)" }}>
            Passwort
          </label>
          <input
            type="password"
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="rounded-2xl border-2 px-5 py-4 text-xl w-full outline-none focus:border-[var(--farbe-warm-akzent)]"
            style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-hell-karte)" }}
          />
          {fehler && <p className="text-red-600 text-sm">{fehler}</p>}
          <button
            type="submit"
            disabled={laedt}
            className="rounded-2xl py-4 text-xl font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: "var(--farbe-warm-akzent)", minHeight: "64px" }}
          >
            {laedt ? "Anmelden…" : "Anmelden"}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t text-center" style={{ borderColor: "var(--farbe-warm-akzent-hell)" }}>
          <p className="text-sm mb-4" style={{ color: "var(--farbe-warm-text-weich)" }}>
            Tablet-Ansicht (für Oma)
          </p>
          <button
            onClick={() => router.push("/tablet")}
            className="text-lg underline"
            style={{ color: "var(--farbe-warm-akzent)", minHeight: "44px" }}
          >
            Zum Familienfenster →
          </button>
        </div>
      </div>
    </div>
  );
}

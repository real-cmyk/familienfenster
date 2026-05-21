"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginSeite() {
  const [email, setEmail] = useState("");
  const [gesendet, setGesendet] = useState(false);
  const [fehler, setFehler] = useState("");
  const [laedt, setLaedt] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLaedt(true);
    setFehler("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setFehler("Anmeldung fehlgeschlagen. Bitte E-Mail-Adresse prüfen.");
      setLaedt(false);
      return;
    }
    setGesendet(true);
    setLaedt(false);
  }

  if (gesendet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "var(--farbe-warm-bg)" }}>
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">✉️</div>
          <h1 className="text-2xl font-semibold mb-4" style={{ color: "var(--farbe-warm-text)" }}>
            Wir haben dir einen Link geschickt
          </h1>
          <p style={{ color: "var(--farbe-warm-text-weich)" }}>
            Schau in dein Postfach bei <strong>{email}</strong> und klicke auf den Link, um dich anzumelden.
          </p>
        </div>
      </div>
    );
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

        <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
          <label className="font-medium" style={{ color: "var(--farbe-warm-text)" }}>
            Deine E-Mail-Adresse
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@beispiel.de"
            required
            className="rounded-2xl border-2 px-5 py-4 text-xl w-full outline-none focus:border-[var(--farbe-warm-akzent)]"
            style={{
              borderColor: "var(--farbe-warm-akzent-hell)",
              background: "var(--farbe-hell-karte)",
            }}
          />
          {fehler && (
            <p className="text-red-600 text-sm">{fehler}</p>
          )}
          <button
            type="submit"
            disabled={laedt}
            className="rounded-2xl py-4 text-xl font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: "var(--farbe-warm-akzent)", minHeight: "64px" }}
          >
            {laedt ? "Wird gesendet…" : "Anmelde-Link senden"}
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

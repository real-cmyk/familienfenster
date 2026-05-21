"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NachrichtSenden() {
  const [text, setText] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [gesendet, setGesendet] = useState(false);
  const [fehler, setFehler] = useState("");
  const router = useRouter();

  async function handleAbsenden(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
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

    const { error } = await supabase.from("nachrichten").insert({
      von_person_id: person?.id ?? null,
      text: text.trim(),
    });

    if (error) {
      setFehler("Senden fehlgeschlagen.");
      setLaedt(false);
      return;
    }

    setGesendet(true);
    setLaedt(false);
    setTimeout(() => router.push("/familie"), 2000);
  }

  if (gesendet) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">✅</p>
        <p className="text-xl font-semibold" style={{ color: "var(--farbe-gruen)" }}>
          Nachricht wurde gesendet!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--farbe-warm-text)" }}>
        Nachricht an Oma
      </h1>

      <form onSubmit={handleAbsenden} className="flex flex-col gap-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Schreib etwas Schönes…"
          rows={5}
          required
          className="rounded-2xl border-2 px-5 py-4 text-lg w-full outline-none resize-none"
          style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-hell-karte)" }}
        />

        {fehler && <p className="text-red-600">{fehler}</p>}

        <button
          type="submit"
          disabled={laedt || !text.trim()}
          className="rounded-2xl py-4 text-xl font-bold text-white disabled:opacity-40"
          style={{ background: "var(--farbe-warm-akzent)", minHeight: "64px" }}
        >
          {laedt ? "Wird gesendet…" : "Nachricht senden 💬"}
        </button>
      </form>
    </div>
  );
}

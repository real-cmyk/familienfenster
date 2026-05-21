"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Person = { id: string; name: string; spitzname: string | null; rolle: string; aktiv: boolean; erstellt_am: string };

export default function PersonenVerwaltung() {
  const [personen, setPersonen] = useState<Person[]>([]);
  const [neuerName, setNeuerName] = useState("");
  const [neueEmail, setNeueEmail] = useState("");
  const [neuesPasswort, setNeuesPasswort] = useState("");
  const [neueRolle, setNeueRolle] = useState<"familie" | "admin">("familie");
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("personen").select("id, name, spitzname, rolle, aktiv, erstellt_am")
      .order("erstellt_am", { ascending: true })
      .then(({ data }) => setPersonen(data ?? []));
  }, []);

  async function handleEinladen(e: React.FormEvent) {
    e.preventDefault();
    setLaedt(true);
    setFehler("");

    const res = await fetch("/api/admin/personen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: neuerName, email: neueEmail, rolle: neueRolle, passwort: neuesPasswort }),
    });

    if (!res.ok) {
      const data = await res.json();
      setFehler(data.fehler ?? "Fehler beim Anlegen.");
      setLaedt(false);
      return;
    }

    const { person } = await res.json();
    setPersonen((prev) => [...prev, person]);
    setNeuerName("");
    setNeueEmail("");
    setNeuesPasswort("");
    setLaedt(false);
  }

  async function toggleAktiv(id: string, aktiv: boolean) {
    const supabase = createClient();
    await supabase.from("personen").update({ aktiv: !aktiv }).eq("id", id);
    setPersonen((prev) => prev.map((p) => p.id === id ? { ...p, aktiv: !aktiv } : p));
  }

  const ROLLEN_LABEL: Record<string, string> = { oma: "Oma", familie: "Familie", admin: "Admin" };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--farbe-warm-text)" }}>
        Familienmitglieder
      </h1>

      {/* Bestehende Personen */}
      <div className="flex flex-col gap-3 mb-10">
        {personen.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl px-5 py-4 flex items-center justify-between"
            style={{
              background: "var(--farbe-hell-karte)",
              border: "2px solid var(--farbe-warm-akzent-hell)",
              opacity: p.aktiv ? 1 : 0.5,
            }}
          >
            <div>
              <p className="text-lg font-semibold" style={{ color: "var(--farbe-warm-text)" }}>
                {p.name} {p.spitzname ? `(${p.spitzname})` : ""}
              </p>
              <p className="text-sm" style={{ color: "var(--farbe-warm-text-weich)" }}>
                {ROLLEN_LABEL[p.rolle] ?? p.rolle}
                {!p.aktiv ? " · deaktiviert" : ""}
              </p>
            </div>
            {p.rolle !== "oma" && (
              <button
                onClick={() => toggleAktiv(p.id, p.aktiv)}
                className="rounded-xl px-3 py-2 text-sm font-medium"
                style={{
                  background: p.aktiv ? "var(--farbe-warm-bg2)" : "var(--farbe-gruen-hell)",
                  color: p.aktiv ? "var(--farbe-warm-text)" : "var(--farbe-gruen)",
                  border: "1px solid var(--farbe-warm-akzent-hell)",
                  minHeight: "44px",
                }}
              >
                {p.aktiv ? "Deaktivieren" : "Aktivieren"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Neue Person anlegen */}
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--farbe-warm-text)" }}>
        Neue Person anlegen
      </h2>
      <form onSubmit={handleEinladen} className="flex flex-col gap-4">
        <input
          type="text"
          value={neuerName}
          onChange={(e) => setNeuerName(e.target.value)}
          placeholder="Name (z.B. Anna Müller)"
          required
          className="rounded-2xl border-2 px-5 py-4 text-lg w-full outline-none"
          style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-hell-karte)" }}
        />
        <input
          type="email"
          value={neueEmail}
          onChange={(e) => setNeueEmail(e.target.value)}
          placeholder="E-Mail-Adresse"
          required
          className="rounded-2xl border-2 px-5 py-4 text-lg w-full outline-none"
          style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-hell-karte)" }}
        />
        <input
          type="text"
          value={neuesPasswort}
          onChange={(e) => setNeuesPasswort(e.target.value)}
          placeholder="Passwort festlegen"
          required
          minLength={6}
          className="rounded-2xl border-2 px-5 py-4 text-lg w-full outline-none"
          style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-hell-karte)" }}
        />
        <select
          value={neueRolle}
          onChange={(e) => setNeueRolle(e.target.value as "familie" | "admin")}
          className="rounded-2xl border-2 px-5 py-4 text-lg w-full outline-none"
          style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-hell-karte)" }}
        >
          <option value="familie">Familie</option>
          <option value="admin">Admin</option>
        </select>

        {fehler && <p className="text-red-600">{fehler}</p>}

        <button
          type="submit"
          disabled={laedt}
          className="rounded-2xl py-4 text-lg font-bold text-white disabled:opacity-60"
          style={{ background: "var(--farbe-warm-akzent)", minHeight: "64px" }}
        >
          {laedt ? "Wird angelegt…" : "Person anlegen"}
        </button>
      </form>
    </div>
  );
}

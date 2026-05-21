import { redirect } from "next/navigation";
import { getEigenePerson } from "@/lib/auth";
import Link from "next/link";

export default async function FamilieLayout({ children }: { children: React.ReactNode }) {
  const person = await getEigenePerson();
  if (!person) redirect("/auth/login");
  if (person.rolle !== "familie" && person.rolle !== "admin") redirect("/auth/login");

  return (
    <div className="min-h-screen" style={{ background: "var(--farbe-warm-bg)" }}>
      {/* Navigation */}
      <header
        className="sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between"
        style={{ background: "var(--farbe-hell-karte)", borderColor: "var(--farbe-warm-akzent-hell)" }}
      >
        <Link href="/familie" className="text-xl font-bold" style={{ color: "var(--farbe-warm-akzent)" }}>
          Familienfenster
        </Link>
        <nav className="flex gap-4 items-center flex-wrap">
          <Link href="/familie/besuche/neu" className="text-base" style={{ color: "var(--farbe-warm-text)" }}>
            Besuch ankündigen
          </Link>
          <Link href="/familie/fotos/hochladen" className="text-base" style={{ color: "var(--farbe-warm-text)" }}>
            Foto hochladen
          </Link>
          <Link href="/familie/kalender" className="text-base" style={{ color: "var(--farbe-warm-text)" }}>
            Termin eintragen
          </Link>
          <span className="text-base" style={{ color: "var(--farbe-warm-text-weich)" }}>
            {person.spitzname ?? person.name}
          </span>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

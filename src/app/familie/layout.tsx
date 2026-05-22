import { redirect } from "next/navigation";
import { getEigenePerson } from "@/lib/auth";
import Link from "next/link";

export default async function FamilieLayout({ children }: { children: React.ReactNode }) {
  const person = await getEigenePerson();
  if (!person) redirect("/auth/login");
  if (person.rolle !== "familie" && person.rolle !== "admin") redirect("/auth/login");

  const navLinks = [
    { href: "/familie", label: "Start", icon: "🏠" },
    { href: "/familie/kalender", label: "Kalender", icon: "📅" },
    { href: "/familie/fotos", label: "Fotos", icon: "📸" },
    { href: "/familie/nachrichten", label: "Nachricht", icon: "✉️" },
    { href: "/familie/musik", label: "Radio", icon: "📻" },
    ...(person.rolle === "admin" ? [{ href: "/admin", label: "Admin", icon: "⚙️" }] : []),
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--farbe-warm-bg)" }}>
      {/* Schmale Top-Leiste: nur Logo + Name */}
      <header
        className="sticky top-0 z-10 px-4 py-2 flex items-center justify-between border-b"
        style={{ background: "var(--farbe-hell-karte)", borderColor: "var(--farbe-warm-akzent-hell)" }}
      >
        <span className="text-base font-bold" style={{ color: "var(--farbe-warm-akzent)" }}>
          🪟 Familienfenster
        </span>
        <span
          className="text-sm px-3 py-1 rounded-full font-medium"
          style={{ background: "var(--farbe-warm-akzent-hell)", color: "var(--farbe-warm-akzent)" }}
        >
          {person.spitzname ?? person.name}
        </span>
      </header>

      {/* Hauptinhalt – Padding unten für Bottom-Nav */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-28">{children}</main>

      {/* Bottom-Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 border-t flex"
        style={{
          background: "var(--farbe-hell-karte)",
          borderColor: "var(--farbe-warm-akzent-hell)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {navLinks.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-opacity active:opacity-60"
            style={{ color: "var(--farbe-warm-akzent)", minHeight: "64px" }}
          >
            <span style={{ fontSize: "1.5rem" }} aria-hidden="true">{icon}</span>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.02em" }}>
              {label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

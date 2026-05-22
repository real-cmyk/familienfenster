import { redirect } from "next/navigation";
import { getEigenePerson } from "@/lib/auth";
import Link from "next/link";

export default async function FamilieLayout({ children }: { children: React.ReactNode }) {
  const person = await getEigenePerson();
  if (!person) redirect("/auth/login");
  if (person.rolle !== "familie" && person.rolle !== "admin") redirect("/auth/login");

  const navLinks = [
    { href: "/familie/kalender", label: "📅 Kalender" },
    { href: "/familie/fotos", label: "📸 Fotos" },
    { href: "/familie/nachrichten", label: "✉️ Nachricht" },
    ...(person.rolle === "admin" ? [{ href: "/admin", label: "⚙️ Admin" }] : []),
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--farbe-warm-bg)" }}>
      {/* Navigation */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{ background: "var(--farbe-hell-karte)", borderColor: "var(--farbe-warm-akzent-hell)" }}
      >
        {/* Top row: logo + person name */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <Link href="/familie" className="text-lg font-bold leading-tight" style={{ color: "var(--farbe-warm-akzent)" }}>
            Familienfenster
          </Link>
          <span className="text-sm px-3 py-1 rounded-full" style={{ background: "var(--farbe-warm-akzent-hell)", color: "var(--farbe-warm-akzent)" }}>
            {person.spitzname ?? person.name}
          </span>
        </div>
        {/* Bottom row: nav links */}
        <nav className="px-4 pb-2 flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium px-4 py-2 rounded-full whitespace-nowrap shrink-0"
              style={{
                background: "var(--farbe-warm-akzent-hell)",
                color: "var(--farbe-warm-akzent)",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--farbe-warm-text)" }}>
        Verwaltung
      </h1>
      <div className="grid grid-cols-1 gap-4">
        {[
          { href: "/admin/fotos", icon: "🖼️", titel: "Fotos freigeben", beschreibung: "Hochgeladene Fotos prüfen und genehmigen" },
          { href: "/admin/personen", icon: "👥", titel: "Familienmitglieder", beschreibung: "Personen anlegen und verwalten" },
          { href: "/admin/geraet", icon: "📱", titel: "Tablet-Status", beschreibung: "Verbindung, Akku und letzte Aktivität" },
        ].map(({ href, icon, titel, beschreibung }) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl p-6 flex items-center gap-5 transition-transform active:scale-98"
            style={{
              background: "var(--farbe-hell-karte)",
              border: "2px solid var(--farbe-warm-akzent-hell)",
              minHeight: "80px",
            }}
          >
            <span className="text-3xl" aria-hidden="true">{icon}</span>
            <div>
              <p className="text-lg font-semibold" style={{ color: "var(--farbe-warm-text)" }}>{titel}</p>
              <p className="text-base" style={{ color: "var(--farbe-warm-text-weich)" }}>{beschreibung}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

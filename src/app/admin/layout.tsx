import { redirect } from "next/navigation";
import { getEigenePerson } from "@/lib/auth";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const person = await getEigenePerson();
  if (!person || person.rolle !== "admin") redirect("/auth/login");

  return (
    <div className="min-h-screen" style={{ background: "var(--farbe-warm-bg)" }}>
      <header
        className="sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between"
        style={{ background: "var(--farbe-hell-karte)", borderColor: "var(--farbe-warm-akzent-hell)" }}
      >
        <Link href="/admin" className="text-xl font-bold" style={{ color: "var(--farbe-warm-akzent)" }}>
          Admin
        </Link>
        <nav className="flex gap-5 flex-wrap text-base">
          <Link href="/admin/fotos" style={{ color: "var(--farbe-warm-text)" }}>Fotos</Link>
          <Link href="/admin/personen" style={{ color: "var(--farbe-warm-text)" }}>Personen</Link>
          <Link href="/admin/geraet" style={{ color: "var(--farbe-warm-text)" }}>Tablet</Link>
          <Link href="/familie" style={{ color: "var(--farbe-warm-text-weich)" }}>→ Familien-Ansicht</Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

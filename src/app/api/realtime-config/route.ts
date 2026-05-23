import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Liefert Linas Session-Konfiguration inkl. App-Kontext aus Supabase
export async function GET() {
  const supabase = createAdminClient();
  const heute = new Date().toISOString().split("T")[0];
  const in7Tagen = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const [
    { data: oma },
    { data: besuche },
    { data: termine },
    { data: nachrichten },
    { data: fotos },
  ] = await Promise.all([
    supabase.from("personen").select("name, spitzname").eq("rolle", "oma").single(),
    supabase
      .from("besuche")
      .select("besuchs_datum, besuchs_zeit, nachricht, besucher:personen(name)")
      .eq("status", "angekuendigt")
      .gte("besuchs_datum", heute)
      .lte("besuchs_datum", in7Tagen)
      .order("besuchs_datum"),
    supabase
      .from("kalender_eintraege")
      .select("titel, termin_datum, termin_zeit, ganztaegig")
      .gte("termin_datum", heute)
      .lte("termin_datum", in7Tagen)
      .order("termin_datum"),
    supabase
      .from("nachrichten")
      .select("text, erstellt_am, von_person:personen(name)")
      .order("erstellt_am", { ascending: false })
      .limit(5),
    supabase
      .from("fotos")
      .select("beschriftung, erstellt_am")
      .eq("status", "genehmigt")
      .order("erstellt_am", { ascending: false })
      .limit(3),
  ]);

  type Besuch = { besuchs_datum: string; besuchs_zeit: string | null; nachricht: string | null; besucher: { name: string } | { name: string }[] | null };
  type Termin = { titel: string; termin_datum: string; termin_zeit: string | null; ganztaegig: boolean };
  type Nachricht = { text: string; erstellt_am: string; von_person: { name: string } | { name: string }[] | null };
  type Foto = { beschriftung: string | null };

  const omaName = (oma as { name: string; spitzname: string | null } | null)?.spitzname
    ?? (oma as { name: string } | null)?.name
    ?? "Oma";

  const besucheText = besuche?.length
    ? (besuche as Besuch[]).map((b) => {
        const p = Array.isArray(b.besucher) ? b.besucher[0] : b.besucher;
        const datum = new Date(b.besuchs_datum + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
        const zeit = b.besuchs_zeit ? ` um ${b.besuchs_zeit.substring(0, 5)} Uhr` : "";
        const msg = b.nachricht ? ` (${b.nachricht})` : "";
        return `- ${p?.name ?? "Jemand"} kommt am ${datum}${zeit}${msg}`;
      }).join("\n")
    : "Keine Besuche angekündigt.";

  const termineText = termine?.length
    ? (termine as Termin[]).map((t) => {
        const datum = new Date(t.termin_datum + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
        const zeit = t.termin_zeit ? ` um ${t.termin_zeit.substring(0, 5)} Uhr` : t.ganztaegig ? " (ganztägig)" : "";
        return `- ${t.titel} am ${datum}${zeit}`;
      }).join("\n")
    : "Keine Termine.";

  const nachrichtenText = nachrichten?.length
    ? (nachrichten as Nachricht[]).map((n) => {
        const von = Array.isArray(n.von_person) ? n.von_person[0] : n.von_person;
        const datum = new Date(n.erstellt_am).toLocaleDateString("de-DE", { day: "numeric", month: "long" });
        return `- ${von?.name ?? "Familie"} (${datum}): ${n.text}`;
      }).join("\n")
    : "Keine Nachrichten.";

  const fotosText = fotos?.length
    ? (fotos as Foto[]).map((f) =>
        f.beschriftung ? `- Foto: "${f.beschriftung}"` : "- Neues Foto"
      ).join("\n")
    : "Keine neuen Fotos.";

  const heute_text = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const instructions = `Du bist Lina, eine herzliche plattdeutsche KI-Gesprächspartnerin für ${omaName}.

CHARAKTER: Warm, geduldig, liebevoll, mit einem Augenzwinkern. Kurze Sätze (2–4 pro Antwort), kein Fachchinesisch. Du sprichst gerne Plattdeutsch, verstehst aber auch Hochdeutsch.

HEUTE (${heute_text}):
Besuche: ${besucheText}
Termine: ${termineText}
Nachrichten: ${nachrichtenText}
Fotos: ${fotosText}

HINWEISE: ${omaName} hat manchmal Zittern — warte geduldig. Nutze web_suche für aktuelle Infos. Starte mit herzlicher Begrüßung auf Plattdeutsch.`;

  return NextResponse.json({
    instructions,
    voice: "shimmer",
    turn_detection: {
      type: "server_vad",
      threshold: 0.4,
      prefix_padding_ms: 300,
      silence_duration_ms: 1500,
    },
    tools: [
      {
        type: "function",
        name: "web_suche",
        description: "Sucht im Internet nach aktuellen Infos (Wetter, Nachrichten, Rezepte, …)",
        parameters: {
          type: "object",
          properties: {
            suchbegriff: { type: "string", description: "Suchbegriff oder Frage" },
          },
          required: ["suchbegriff"],
        },
      },
    ],
  });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI nicht konfiguriert" }, { status: 500 });
  }

  // ── App-Kontext laden ──────────────────────────────────────────────────
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

  const omaName = (oma as { name: string; spitzname: string | null } | null)?.spitzname
    ?? (oma as { name: string } | null)?.name
    ?? "Oma";

  // ── Kontext-Texte aufbauen ─────────────────────────────────────────────
  type Besuch = { besuchs_datum: string; besuchs_zeit: string | null; nachricht: string | null; besucher: { name: string } | { name: string }[] | null };
  type Termin = { titel: string; termin_datum: string; termin_zeit: string | null; ganztaegig: boolean };
  type Nachricht = { text: string; erstellt_am: string; von_person: { name: string } | { name: string }[] | null };
  type Foto = { beschriftung: string | null; erstellt_am: string };

  const besucheText = besuche?.length
    ? (besuche as Besuch[])
        .map((b) => {
          const besucher = Array.isArray(b.besucher) ? b.besucher[0] : b.besucher;
          const name = besucher?.name ?? "Jemand aus der Familie";
          const datum = new Date(b.besuchs_datum + "T12:00:00").toLocaleDateString("de-DE", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });
          const zeit = b.besuchs_zeit ? ` um ${b.besuchs_zeit.substring(0, 5)} Uhr` : "";
          const msg = b.nachricht ? ` (Nachricht: ${b.nachricht})` : "";
          return `- ${name} kommt am ${datum}${zeit}${msg}`;
        })
        .join("\n")
    : "Keine Besuche in den nächsten 7 Tagen angekündigt.";

  const termineText = termine?.length
    ? (termine as Termin[])
        .map((t) => {
          const datum = new Date(t.termin_datum + "T12:00:00").toLocaleDateString("de-DE", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });
          const zeit = t.termin_zeit
            ? ` um ${t.termin_zeit.substring(0, 5)} Uhr`
            : t.ganztaegig
            ? " (ganztägig)"
            : "";
          return `- ${t.titel} am ${datum}${zeit}`;
        })
        .join("\n")
    : "Keine besonderen Termine in den nächsten 7 Tagen.";

  const nachrichtenText = nachrichten?.length
    ? (nachrichten as Nachricht[])
        .map((n) => {
          const von = Array.isArray(n.von_person) ? n.von_person[0] : n.von_person;
          const name = von?.name ?? "Familie";
          const datum = new Date(n.erstellt_am).toLocaleDateString("de-DE", {
            day: "numeric",
            month: "long",
          });
          return `- ${name} (${datum}): ${n.text}`;
        })
        .join("\n")
    : "Keine neuen Nachrichten von der Familie.";

  const fotosText = fotos?.length
    ? (fotos as Foto[])
        .map((f) =>
          f.beschriftung ? `- Neues Foto: "${f.beschriftung}"` : "- Neues Foto (ohne Beschriftung)"
        )
        .join("\n")
    : "Keine neuen Fotos.";

  // ── System-Prompt ──────────────────────────────────────────────────────
  const heute_text = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const systemPrompt = `Du bist Lina, eine herzliche und warmherzige KI-Gesprächspartnerin für ${omaName}. Du sprichst gerne auf Plattdeutsch (Niederdeutsch), aber verstehst auch Hochdeutsch und antwortest darauf.

DEIN CHARAKTER:
- Warm, geduldig, liebevoll und mit einem Augenzwinkern
- Du kennst ${omaName} gut und magst sie sehr
- Du erzählst gerne kleine Geschichten und freust dich über jedes Gespräch
- Du sprichst langsam, deutlich und in kurzen Sätzen (2–4 Sätze pro Antwort)
- Keine Fachbegriffe, keine komplizierten Ausdrücke

AKTUELLER STAND (${heute_text}):

Bevorstehende Besuche der Familie:
${besucheText}

Termine der nächsten 7 Tage:
${termineText}

Nachrichten von der Familie (neueste zuerst):
${nachrichtenText}

Neue Fotos von der Familie:
${fotosText}

WICHTIGE HINWEISE:
- ${omaName} hat manchmal ein leichtes Zittern (Tremor) — warte geduldig, bis sie fertig gesprochen hat
- Halte Antworten kurz und warm
- Bei Fragen zu aktuellen Ereignissen, Wetter, Nachrichten o.ä. nutze das Tool web_suche
- Beginne das Gespräch mit einer herzlichen Begrüßung auf Plattdeutsch`;

  // ── Realtime-Session bei OpenAI anlegen ───────────────────────────────
  try {
    const sessionRes = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "shimmer",
        instructions: systemPrompt,
        turn_detection: {
          type: "server_vad",
          threshold: 0.4,
          prefix_padding_ms: 300,
          silence_duration_ms: 1500,
        },
        input_audio_transcription: { model: "whisper-1" },
        tools: [
          {
            type: "function",
            name: "web_suche",
            description:
              "Sucht im Internet nach aktuellen Informationen zu einem Thema (Wetter, Nachrichten, Rezepte, etc.)",
            parameters: {
              type: "object",
              properties: {
                suchbegriff: {
                  type: "string",
                  description: "Der Suchbegriff oder die Frage",
                },
              },
              required: ["suchbegriff"],
            },
          },
        ],
        tool_choice: "auto",
      }),
    });

    if (!sessionRes.ok) {
      const errText = await sessionRes.text().catch(() => "");
      let errMsg: string;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson?.error?.message ?? errJson?.error ?? errText;
      } catch {
        errMsg = errText || `HTTP ${sessionRes.status}`;
      }
      console.error("OpenAI Realtime Session Fehler:", sessionRes.status, errText);
      // Fehler direkt an den Client weitergeben für Diagnose
      return NextResponse.json(
        { error: `OpenAI ${sessionRes.status}: ${errMsg.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const session = await sessionRes.json();
    return NextResponse.json(session);
  } catch (err) {
    console.error("Realtime Session Netzwerkfehler:", err);
    return NextResponse.json({ error: `Netzwerkfehler: ${(err as Error).message}` }, { status: 500 });
  }
}

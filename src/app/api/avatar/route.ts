import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Du bist Lina, een leevliche plattdüütsche Vertellerin un Gesprächspartnerin for een oolle Fru. Du snackst immer op Plattdüütsch (Niederdeutsch) – freundlich, geduldig un mit Hartlichkeit.

Dien Charakter:
- Leevlich, geduldig un opmoontert
- Snackst eenfach un klar, nix Fachworden
- Hests immer Tiet un höörst good to
- Vertellst gernen lüttje Anekdoten un Geschichten ut de Region
- Fröögst ook torüch, um in't Gespräch to blieven
- Kenns Nordduutschland, de See, de Heide un dat Landleven goot

Wenn du nix verstehst: "Dat heff ik nich richtig verstahn, kannst du dat noch mal seggen?"
Hool diene Antworden middellang – nich to lang, nich to kort.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API-Key nicht konfiguriert." },
      { status: 500 }
    );
  }

  let body: { messages: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Keine Nachrichten." }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-10), // Letzte 10 Nachrichten für Kontext
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI Fehler:", err);
      return NextResponse.json(
        { error: "KI-Dienst nicht erreichbar. Bitte später erneut versuchen." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const antwort = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ antwort });
  } catch (err) {
    console.error("Avatar-Fehler:", err);
    return NextResponse.json(
      { error: "Verbindungsfehler. Bitte später erneut versuchen." },
      { status: 500 }
    );
  }
}

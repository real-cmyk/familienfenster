import { NextRequest, NextResponse } from "next/server";
import { linaSystemPrompt } from "@/lib/lina-kontext";

// Text-Dialog: Transkription → gpt-4o-mini → Antworttext
// Kosten: $0.15 input / $0.60 output pro 1M Tokens — sehr günstig
export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Kein API-Key" }, { status: 500 });
  }

  let messages: { role: "user" | "assistant"; content: string }[] = [];
  try {
    ({ messages } = await request.json());
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  // System-Prompt frisch aus Supabase laden (aktuelle Besuchs-/Termininfos)
  const systemPrompt = await linaSystemPrompt().catch(
    () => "Du bist Lina, eine herzliche plattdeutsche KI-Gesprächspartnerin. Sei warm und geduldig."
  );

  // Konversation auf max. 12 Nachrichten kürzen (Token-Kosten niedrig halten)
  const trimmedMessages = messages.slice(-12);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...trimmedMessages,
        ],
        max_tokens: 250,   // Kurze Antworten → weniger TTS-Kosten
        temperature: 0.85,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("Chat Fehler:", res.status, err);
      return NextResponse.json({ error: `Chat ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const antwort: string =
      data.choices?.[0]?.message?.content?.trim() ?? "Dat weet ik leider nich…";

    return NextResponse.json({ antwort });
  } catch (err) {
    console.error("Chat Netzwerkfehler:", err);
    return NextResponse.json({ error: "Verbindungsfehler" }, { status: 500 });
  }
}

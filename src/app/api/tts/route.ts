import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TTS nicht konfiguriert." }, { status: 500 });
  }

  let text: string;
  try {
    ({ text } = await request.json());
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  if (!text?.trim()) {
    return NextResponse.json({ error: "Kein Text." }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        input: text.slice(0, 4096),
        voice: "coral",        // Warm, weiblich, natürlich klingend
        instructions: "Sprich warm, herzlich und geduldig – wie eine einfühlsame Freundin die mit einer älteren Dame plaudert. Sprich etwas langsamer und deutlich, mit echter Wärme in der Stimme. Keine steife Ansagerstimme – natürlich und menschlich.",
        response_format: "mp3",
        speed: 0.92,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI TTS Fehler:", response.status, errText);
      return NextResponse.json({ error: "TTS-Fehler" }, { status: 502 });
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("TTS-Netzwerkfehler:", err);
    return NextResponse.json({ error: "Verbindungsfehler" }, { status: 500 });
  }
}

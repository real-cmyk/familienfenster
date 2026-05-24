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
        model: "tts-1",        // Günstig ($15/1M chars vs $30 bei hd) – für Lina ausreichend
        input: text.slice(0, 4096),
        voice: "shimmer",      // Sanft, warm, weiblich – passt zu Lina
        response_format: "mp3",
        speed: 0.9,            // Etwas langsamer für ältere Nutzer
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

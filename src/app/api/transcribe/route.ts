import { NextRequest, NextResponse } from "next/server";

// Sprachaufnahme (Blob) → Text via Whisper-1
// Kosten: $0.006 / Minute — sehr günstig
export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Kein API-Key" }, { status: 500 });
  }

  let audioBlob: Blob | null = null;
  try {
    const fd = await request.formData();
    audioBlob = fd.get("audio") as Blob | null;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  if (!audioBlob || audioBlob.size < 100) {
    return NextResponse.json({ text: "" }); // Leere Aufnahme — kein Fehler
  }

  const fd = new FormData();
  fd.append("file", audioBlob, "audio.webm");
  fd.append("model", "whisper-1");
  fd.append("language", "de");
  fd.append("prompt", "Plattdeutsch, norddeutsch, familiäres Gespräch."); // Hint verbessert Qualität

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("Whisper Fehler:", res.status, err);
      return NextResponse.json({ error: `Transkription ${res.status}` }, { status: 502 });
    }

    const { text } = await res.json();
    return NextResponse.json({ text: (text ?? "").trim() });
  } catch (err) {
    console.error("Whisper Netzwerkfehler:", err);
    return NextResponse.json({ error: "Verbindungsfehler" }, { status: 500 });
  }
}

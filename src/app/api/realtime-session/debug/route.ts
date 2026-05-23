import { NextResponse } from "next/server";

// Diagnose-Endpoint: minimale Session ohne Kontext, zeigt rohen OpenAI-Fehler
// Aufruf: GET /api/realtime-session/debug
export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ diagnose: "KEIN API-KEY", detail: "OPENAI_API_KEY ist nicht gesetzt" });
  }

  // Minimale Anfrage – kein Kontext, keine Tools
  const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "shimmer",
    }),
  }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) } as Response));

  const body = await res.text();
  return NextResponse.json({
    diagnose: res.ok ? "OK" : "FEHLER",
    status: res.status,
    apiKeyPrefix: apiKey.slice(0, 10) + "...",
    body: body.slice(0, 500),
  });
}

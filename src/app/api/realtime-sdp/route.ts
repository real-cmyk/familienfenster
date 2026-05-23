import { NextRequest, NextResponse } from "next/server";

const MODEL = "gpt-4o-realtime-preview-2024-12-17";

// Proxyt den WebRTC SDP-Austausch: Browser → unser Server → OpenAI
// So bleibt der API-Key serverseitig und nie im Browser
export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY nicht konfiguriert" }, { status: 500 });
  }

  const sdpOffer = await request.text();
  if (!sdpOffer.startsWith("v=")) {
    return NextResponse.json({ error: "Kein gültiges SDP-Offer" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.openai.com/v1/realtime?model=${MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/sdp",
      },
      body: sdpOffer,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      let errMsg = errText;
      try { errMsg = JSON.parse(errText)?.error?.message ?? errText; } catch { /**/ }
      console.error("OpenAI Realtime SDP Fehler:", res.status, errMsg);
      return NextResponse.json(
        { error: `OpenAI ${res.status}: ${errMsg.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const answerSdp = await res.text();
    return new Response(answerSdp, {
      headers: { "Content-Type": "application/sdp" },
    });
  } catch (err) {
    console.error("Realtime SDP Netzwerkfehler:", err);
    return NextResponse.json({ error: `Netzwerkfehler: ${(err as Error).message}` }, { status: 500 });
  }
}

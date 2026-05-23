import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let suchbegriff: string;
  try {
    ({ suchbegriff } = await request.json());
  } catch {
    return NextResponse.json({ ergebnis: "Ungültige Anfrage." }, { status: 400 });
  }

  if (!suchbegriff?.trim()) {
    return NextResponse.json({ ergebnis: "Kein Suchbegriff angegeben." });
  }

  // ── Brave Search (falls API-Key konfiguriert) ──────────────────────────
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;
  if (braveKey) {
    try {
      const res = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
          suchbegriff
        )}&count=3&country=de&search_lang=de`,
        {
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": braveKey,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const results: { title: string; description: string }[] =
          data.web?.results?.slice(0, 3) ?? [];
        if (results.length > 0) {
          const text = results
            .map((r) => `${r.title}: ${r.description}`)
            .join("\n\n");
          return NextResponse.json({ ergebnis: text });
        }
      }
    } catch (err) {
      console.error("Brave Search Fehler:", err);
    }
  }

  // ── DuckDuckGo Instant Answer API (kein Schlüssel nötig) ──────────────
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(
        suchbegriff
      )}&format=json&no_html=1&skip_disambig=1&kl=de-de`,
      {
        headers: { "User-Agent": "Familienfenster/1.0 (private home assistant)" },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const parts: string[] = [];

      if (data.Answer) parts.push(String(data.Answer));
      if (data.AbstractText) parts.push(data.AbstractText);
      if (parts.length === 0 && data.RelatedTopics?.length > 0) {
        const first = data.RelatedTopics[0];
        if (first?.Text) parts.push(first.Text);
      }

      if (parts.length > 0) {
        return NextResponse.json({ ergebnis: parts.slice(0, 2).join("\n\n") });
      }
    }
  } catch (err) {
    console.error("DuckDuckGo Fehler:", err);
  }

  return NextResponse.json({
    ergebnis: `Leider konnte ich keine Informationen zu "${suchbegriff}" finden.`,
  });
}

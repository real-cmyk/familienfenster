import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const supabase = createAdminClient();

  // Nur einen Eintrag halten — löschen und neu anlegen
  await supabase.from("geraet_heartbeat").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("geraet_heartbeat").insert({
    batterie_prozent: body.batterie_prozent ?? null,
    netzwerk_ssid: body.ssid ?? null,
  });

  return NextResponse.json({ ok: true });
}

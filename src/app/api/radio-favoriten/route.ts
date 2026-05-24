import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Liefert die gespeicherten Radio-Favoriten (admin-client umgeht RLS-anon-Einschränkung)
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("radio_favoriten").select("station_id");
  if (error) {
    console.error("radio_favoriten Fehler:", error.message);
    return NextResponse.json({ ids: [] });
  }
  const ids = (data ?? []).map((r: { station_id: string }) => r.station_id);
  return NextResponse.json({ ids });
}

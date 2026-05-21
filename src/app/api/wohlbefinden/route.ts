import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("wohlbefinden_signale")
    .insert({});

  if (error) {
    return NextResponse.json({ fehler: "Konnte nicht gespeichert werden." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

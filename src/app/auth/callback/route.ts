import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Rolle bestimmen und weiterleiten
      const { data: person } = await supabase
        .from("personen")
        .select("rolle")
        .eq("auth_id", data.user.id)
        .single();

      const ziel = person?.rolle === "admin" ? "/admin" : "/familie";
      return NextResponse.redirect(`${origin}${ziel}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?fehler=auth`);
}

import { createAdminClient } from "@/lib/supabase/admin";
import { getEigenePerson } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const person = await getEigenePerson();
  if (!person || person.rolle !== "admin") {
    return NextResponse.json({ fehler: "Keine Berechtigung." }, { status: 403 });
  }

  const { name, email, rolle, passwort } = await request.json();
  if (!name || !email || !rolle || !passwort) {
    return NextResponse.json({ fehler: "Name, E-Mail, Rolle und Passwort sind erforderlich." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Auth-Benutzer direkt anlegen (kein E-Mail-Versand nötig)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: passwort,
    email_confirm: true, // sofort aktiv, kein Bestätigungs-Mail
  });
  if (authError) {
    return NextResponse.json({ fehler: authError.message }, { status: 500 });
  }

  // Personen-Eintrag anlegen
  const { data: neuerEintrag, error: dbError } = await supabase
    .from("personen")
    .insert({ auth_id: authData.user.id, name, rolle, aktiv: true })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ fehler: "Datenbankfehler." }, { status: 500 });
  }

  return NextResponse.json({ person: neuerEintrag });
}

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Benutzer = {
  authId: string;
  email: string;
  id: string;
  name: string;
  spitzname: string | null;
  rolle: "oma" | "familie" | "admin";
  aktiv: boolean;
};

export const getEigenePerson = cache(async (): Promise<Benutzer | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("personen")
    .select("id, name, spitzname, rolle, aktiv")
    .eq("auth_id", user.id)
    .single();

  if (!data || !data.aktiv) return null;

  return {
    authId: user.id,
    email: user.email ?? "",
    id: data.id,
    name: data.name,
    spitzname: data.spitzname,
    rolle: data.rolle,
    aktiv: data.aktiv,
  };
});

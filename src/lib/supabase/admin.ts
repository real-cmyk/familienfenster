import { createClient } from "@supabase/supabase-js";

// Nur serverseitig verwenden — enthält den Service-Role-Key
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

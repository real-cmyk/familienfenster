import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const hatSession = !!session;

  const pfad = request.nextUrl.pathname;

  // Root-URL direkt auf Tablet-Homescreen umleiten (kein History-Eintrag für /)
  if (pfad === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/tablet";
    return NextResponse.redirect(url, { status: 308 });
  }

  // Nur /auth/* ist öffentlich — alle anderen Routen (inkl. /tablet) erfordern Login
  // Oma meldet sich einmalig an; die Session bleibt im Browser gespeichert
  const isAuthRoute = pfad.startsWith("/auth/");

  if (!hatSession && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map)$).*)",
  ],
};

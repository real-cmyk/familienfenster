import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Root-URL direkt auf Tablet-Homescreen umleiten — verhindert /  im Browser-Verlauf
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/tablet", request.url), { status: 308 });
  }
}

export const config = {
  matcher: ["/"],
};

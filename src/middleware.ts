import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth: unknown }) => {
  const isLoggedIn = !!(req as { auth?: { user?: unknown } }).auth?.user;
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/orders", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!api/auth|api/health|_next/static|_next/image|favicon\\.ico|manifest\\.json|.*\\.png$).*)",
  ],
};

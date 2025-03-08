import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isAuthPage =
    request.nextUrl.pathname === "/sign-in" ||
    request.nextUrl.pathname === "/sign-up";
  const isApiAuthRoute = request.nextUrl.pathname.startsWith("/api/auth");
  const isRegisterRoute = request.nextUrl.pathname === "/api/register";

  // Allow access to auth API routes
  if (isApiAuthRoute || isRegisterRoute) {
    return NextResponse.next();
  }

  // If the user is on an auth page but is already logged in, redirect to home
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If the user is not on an auth page and is not logged in, redirect to login
  if (!isAuthPage && !session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};

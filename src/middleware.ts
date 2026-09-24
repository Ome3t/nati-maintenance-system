import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/*
 * Edge-safe protection: only checks whether a session COOKIE exists.
 * No token decryption here (that caused the edge/node mismatch).
 * Real session validation happens in each page/layout via auth() (node runtime).
 */
const SESSION_COOKIES = ["__Secure-authjs.session-token", "authjs.session-token"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static assets and auth endpoints always pass
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") return NextResponse.next()
  if (pathname.startsWith("/api/auth")) return NextResponse.next()
  if (/\.[a-zA-Z0-9]+$/.test(pathname) && !pathname.startsWith("/api")) return NextResponse.next()

  const hasSessionCookie = SESSION_COOKIES.some((name) => request.cookies.has(name))

  if (!hasSessionCookie) {
    // Logged out: APIs get 401 JSON, pages go to login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (pathname === "/login") return NextResponse.next()
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Logged in: don't sit on the login page
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
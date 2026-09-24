import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const OWNER_ONLY = ["/manager", "/inventory", "/expenses"]
const CASHIER_PAGES = ["/pos", "/sales-history"]
const TECH_PAGES = ["/my-jobs", "/pending-payments"]

const startsWithAny = (pathname: string, list: string[]) =>
  list.some((p) => pathname === p || pathname.startsWith(p + "/"))

const roleHome = (role: string) =>
  role === "OWNER" ? "/manager" : role === "CASHIER" ? "/pos" : "/my-jobs"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Never touch auth endpoints or static assets
  if (pathname.startsWith("/api/auth")) return NextResponse.next()
  if (pathname.startsWith("/_next")) return NextResponse.next()
  if (pathname === "/favicon.ico") return NextResponse.next()
  if (/\.[a-zA-Z0-9]+$/.test(pathname) && !pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    console.warn("[middleware] No AUTH_SECRET/NEXTAUTH_SECRET found — route protection disabled.")
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret })
  const isLoginPage = pathname === "/login" || pathname.startsWith("/login/")

  /* 1. Not signed in */
  if (!token) {
    if (isLoginPage) return NextResponse.next()
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = (token.role as string) || "TECHNICIAN"

  /* 2. Signed in but visiting /login → go home */
  if (isLoginPage) {
    return NextResponse.redirect(new URL(roleHome(role), request.url))
  }

  /* 3. API routes: authenticated is enough (each route does its own role checks) */
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  /* 4. Role-based page protection */
  if (role !== "OWNER" && startsWithAny(pathname, OWNER_ONLY)) {
    return NextResponse.redirect(new URL(roleHome(role), request.url))
  }
  if (role === "TECHNICIAN" && startsWithAny(pathname, CASHIER_PAGES)) {
    return NextResponse.redirect(new URL(roleHome(role), request.url))
  }
  if (role === "CASHIER" && startsWithAny(pathname, TECH_PAGES)) {
    return NextResponse.redirect(new URL(roleHome(role), request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
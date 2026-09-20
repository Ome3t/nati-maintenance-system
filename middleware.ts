import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// The function MUST be named exactly "middleware" for Next.js to recognize it
export function middleware(request: NextRequest) {
  // For now, we just let all requests pass through. 
  // This ensures the app loads instantly without auth blocking.
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (the public login page)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
  ],
}
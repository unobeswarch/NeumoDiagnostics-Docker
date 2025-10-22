import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /login, /patient/dashboard)
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const publicPaths = ["/", "/login", "/register"]

  // Check if the path is public
  const isPublicPath = publicPaths.includes(path)

  // Get token from cookies (in a real app, you'd validate this token)
  const token = request.cookies.get("auth-token")?.value || ""

  // If user is on a public path and has a token, redirect to appropriate dashboard
  if (isPublicPath && token) {
    const userRole = request.cookies.get("user-role")?.value
    if (userRole === "paciente") {
      return NextResponse.redirect(new URL("/patient/dashboard", request.nextUrl))
    } else if (userRole === "doctor") {
      return NextResponse.redirect(new URL("/doctor/dashboard", request.nextUrl))
    }
  }

  // If user is on a protected path and doesn't have a token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.nextUrl))
  }

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
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

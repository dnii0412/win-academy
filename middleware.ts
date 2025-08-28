import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })
  const isAdmin = token?.role === "admin"
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard")

  // If trying to access admin routes without admin role
  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If trying to access dashboard routes without authentication
  if (isDashboardRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"]
}

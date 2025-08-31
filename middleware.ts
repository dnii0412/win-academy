import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  try {
    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")
    const isAdminLoginRoute = request.nextUrl.pathname === "/admin/login"
    const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard")

    // For admin routes, let the admin layout handle authentication
    // Don't redirect here - let the client-side logic handle it
    if (isAdminRoute) {
      return NextResponse.next()
    }

    // Temporarily disable dashboard authentication check to debug the issue
    // if (isDashboardRoute && !token) {
    //   // Log the issue for debugging
    //   console.log("Middleware: No token found for dashboard route:", request.nextUrl.pathname)
    //   console.log("Token:", token)
    //   return NextResponse.redirect(new URL("/login", request.url))
    // }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    
    // If there's an error with token validation, allow the request to proceed
    // The page-level authentication will handle it
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"]
}

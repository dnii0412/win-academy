import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "No token provided" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    try {
      // Verify JWT token
      console.log("Verify API - JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not set")
      console.log("Verify API - Token length:", token.length)
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
      console.log("Verify API - Token decoded:", { userId: decoded.userId, email: decoded.email, role: decoded.role })
      
      // Check if user has admin role
      if (decoded.role !== "admin") {
        console.log("Verify API - User role is not admin:", decoded.role)
        return NextResponse.json(
          { message: "Access denied" },
          { status: 403 }
        )
      }

      // Token is valid and user is admin
      return NextResponse.json({
        message: "Token valid",
        user: {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role
        }
      })

    } catch (jwtError) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

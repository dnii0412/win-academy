import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import User from "@/lib/models/User"

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
      if (decoded.role !== "admin") {
        return NextResponse.json(
          { message: "Access denied" },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      )
    }

    // Connect to database
    await dbConnect()

    // Get total counts
    const totalUsers = await User.countDocuments()
    const totalCourses = await User.countDocuments({ role: "instructor" }) // Placeholder - replace with actual Course model
    const totalOrders = 0 // Placeholder - replace with actual Order model
    const totalRevenue = 0 // Placeholder - replace with actual Order model

    // Get recent users (last 5)
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email createdAt")
      .lean()

    // Get recent orders (placeholder - replace with actual Order model)
    const recentOrders: Array<{
      id: string
      courseTitle: string
      amount: number
      status: string
      createdAt: string
    }> = []

    return NextResponse.json({
      totalUsers,
      totalCourses,
      totalOrders,
      totalRevenue,
      recentUsers: recentUsers.map((user: any) => ({
        id: user._id.toString(),
        name: user.name || "Unknown",
        email: user.email,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString()
      })),
      recentOrders
    })

  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

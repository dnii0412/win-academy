import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import User from "@/lib/models/User"
import Course from "@/lib/models/Course"
import Order from "@/lib/models/Order"

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
    const totalCourses = await Course.countDocuments()
    
    // Calculate weekly income (last 7 days)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const weeklyRevenueData = await Order.aggregate([
      { 
        $match: { 
          status: "completed",
          createdAt: { $gte: oneWeekAgo }
        } 
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ])
    
    const weeklyIncome = weeklyRevenueData.length > 0 ? weeklyRevenueData[0].total : 0

    // Get recent users (last 5)
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email createdAt")
      .lean()



    return NextResponse.json({
      totalUsers,
      totalCourses,
      weeklyIncome,
      recentUsers: recentUsers.map((user: any) => ({
        id: user._id.toString(),
        name: user.name || "Unknown",
        email: user.email,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString()
      }))
    })

  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import User from "@/lib/models/User"
import mongoose from "mongoose"

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userIds } = await request.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "User IDs array is required" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()
    
    // Ensure CourseAccess model is loaded
    if (!mongoose.models.CourseAccess) {
      const CourseAccessModule = require('@/lib/models/CourseAccess')
      mongoose.model('CourseAccess', CourseAccessModule.default.schema)
    }

    // Prevent admin from deleting themselves
    if (userIds.includes(decoded.userId)) {
      return NextResponse.json({ 
        error: "Cannot delete your own account" 
      }, { status: 400 })
    }

    // Check if any of the users are admin users
    const adminUsers = await User.find({ 
      _id: { $in: userIds }, 
      role: "admin" 
    })

    if (adminUsers.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete admin users. Please change their role first.",
        adminUserIds: adminUsers.map(user => user._id)
      }, { status: 400 })
    }

    // Check if all users exist
    const existingUsers = await User.find({ _id: { $in: userIds } })
    if (existingUsers.length !== userIds.length) {
      const foundIds = existingUsers.map(user => user._id.toString())
      const notFoundIds = userIds.filter(id => !foundIds.includes(id))
      return NextResponse.json({ 
        error: "Some users not found",
        notFoundIds
      }, { status: 404 })
    }

    // Delete users (this will trigger the pre-delete hook to clean up enrollments)
    const deleteResult = await User.deleteMany({ _id: { $in: userIds } })

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: "No users were deleted" }, { status: 500 })
    }

    console.log(`${deleteResult.deletedCount} users deleted successfully`)

    return NextResponse.json({ 
      message: `${deleteResult.deletedCount} users deleted successfully`,
      deletedCount: deleteResult.deletedCount,
      deletedUserIds: userIds
    })

  } catch (error) {
    console.error("Error deleting users:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 })
  }
}

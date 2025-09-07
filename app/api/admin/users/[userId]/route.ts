import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import User from "@/lib/models/User"
import CourseAccess from "@/lib/models/CourseAccess"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Check if user exists
    const existingUser = await User.findById(userId)
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (body.email !== existingUser.email) {
      const emailExists = await User.findOne({ email: body.email, _id: { $ne: userId } })
      if (emailExists) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {
      fullName: body.fullName || "",
      email: body.email,
      phoneNumber: body.phoneNumber || "",
      role: body.role || "user",
      status: body.status || "completed"
    }

    // Hash password if provided
    if (body.password && body.password.trim()) {
      const saltRounds = 10
      updateData.password = await bcrypt.hash(body.password, saltRounds)
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    )

    // Remove password from response
    const userResponse = updatedUser?.toObject()
    if (userResponse) {
      delete userResponse.password
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: userResponse
    })

  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params

    // Connect to database
    await dbConnect()
    
    // Ensure CourseAccess model is loaded
    if (!mongoose.models.CourseAccess) {
      const CourseAccessModule = require('@/lib/models/CourseAccess')
      mongoose.model('CourseAccess', CourseAccessModule.default.schema)
    }

    // Check if user exists
    const existingUser = await User.findById(userId)
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent admin from deleting themselves
    if (decoded.userId === userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Prevent deleting other admin users (optional safety measure)
    if (existingUser.role === "admin") {
      return NextResponse.json({ 
        error: "Cannot delete admin users. Please change their role first." 
      }, { status: 400 })
    }

    // Check if user has any active course access
    let activeAccess = 0
    try {
      activeAccess = await CourseAccess.countDocuments({ 
        userId, 
        hasAccess: true 
      })
    } catch (courseAccessError) {
      console.warn('Could not check course access records:', courseAccessError instanceof Error ? courseAccessError.message : String(courseAccessError))
      // Continue with deletion even if course access check fails
    }

    if (activeAccess > 0) {
      console.log(`User ${userId} has ${activeAccess} active course access records`)
    }

    // Delete user (this will trigger the pre-delete hook to clean up enrollments)
    const deletedUser = await User.findByIdAndDelete(userId)

    if (!deletedUser) {
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    console.log(`User ${userId} deleted successfully`)

    return NextResponse.json({ 
      message: "User deleted successfully",
      deletedUserId: userId
    })

  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import User from "@/lib/models/User"
import Course from "@/lib/models/Course"
import CourseEnrollment from "@/lib/models/CourseEnrollment"

export async function GET(
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

    // Get user's course enrollments
    const enrollments = await CourseEnrollment.find({ userId })
      .populate('courseId', 'title titleMn description descriptionMn price status')
      .populate('accessGrantedBy', 'firstName lastName email')
      .sort({ enrolledAt: -1 })

    return NextResponse.json({ enrollments })

  } catch (error) {
    console.error("Error fetching course access:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
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
    if (!body.courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if course exists
    const course = await Course.findById(body.courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Check if enrollment already exists
    const existingEnrollment = await CourseEnrollment.findOne({
      userId,
      courseId: body.courseId
    })

    if (existingEnrollment) {
      return NextResponse.json({ error: "User already has access to this course" }, { status: 400 })
    }

    // Create new enrollment
    const enrollment = new CourseEnrollment({
      userId,
      courseId: body.courseId,
      status: body.status || 'active',
      expiresAt: body.expiresAt || null,
      accessGrantedBy: decoded.userId || decoded.sub,
      notes: body.notes || ''
    })

    await enrollment.save()

    // Populate course and admin info for response
    await enrollment.populate('courseId', 'title titleMn')
    await enrollment.populate('accessGrantedBy', 'firstName lastName')

    return NextResponse.json({
      message: "Course access granted successfully",
      enrollment
    }, { status: 201 })

  } catch (error) {
    console.error("Error granting course access:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    if (!body.enrollmentId) {
      return NextResponse.json({ error: "Enrollment ID is required" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Update enrollment
    const enrollment = await CourseEnrollment.findOneAndUpdate(
      { _id: body.enrollmentId, userId },
      {
        status: body.status,
        expiresAt: body.expiresAt,
        notes: body.notes
      },
      { new: true }
    )

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    // Populate course and admin info for response
    await enrollment.populate('courseId', 'title titleMn')
    await enrollment.populate('accessGrantedBy', 'firstName lastName')

    return NextResponse.json({
      message: "Course access updated successfully",
      enrollment
    })

  } catch (error) {
    console.error("Error updating course access:", error)
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
    const { searchParams } = new URL(request.url)
    const enrollmentId = searchParams.get('enrollmentId')

    if (!enrollmentId) {
      return NextResponse.json({ error: "Enrollment ID is required" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Delete enrollment
    const enrollment = await CourseEnrollment.findOneAndDelete({
      _id: enrollmentId,
      userId
    })

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Course access revoked successfully" })

  } catch (error) {
    console.error("Error revoking course access:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

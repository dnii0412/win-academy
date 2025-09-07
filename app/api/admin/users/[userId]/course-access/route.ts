import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import User from "@/lib/models/User"
import Course from "@/lib/models/Course"
import CourseAccess from "@/lib/models/CourseAccess"

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

    // Get user's course access from unified schema
    const courseAccess = await CourseAccess.find({ userId })
      .populate('courseId', 'title titleMn description descriptionMn price status')
      .populate('orderId', 'orderNumber status')
      .populate('accessGrantedBy', 'firstName lastName email')
      .sort({ grantedAt: -1 })

    return NextResponse.json({ 
      courseAccess,
      totalAccess: courseAccess.length
    })

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
    
    console.log('Course access request body:', body)

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

    const userStringId = user._id.toString()

    // Check if access already exists
    const existingAccess = await CourseAccess.findOne({
      userId: userStringId,
      courseId: body.courseId
    })

    if (existingAccess) {
      return NextResponse.json({ error: "User already has access to this course" }, { status: 400 })
    }

    // Create new CourseAccess record with admin grant
    const courseAccess = await CourseAccess.grantAccess(
      userStringId,
      body.courseId,
      undefined, // No orderId for admin grants
      'admin_grant',
      decoded.userId || decoded.sub, // grantedBy
      body.notes || '' // notes
    )

    // Set expiry if provided
    if (body.expiresAt) {
      courseAccess.expiresAt = new Date(body.expiresAt)
      await courseAccess.save()
    }

    // Update status if provided
    if (body.status) {
      courseAccess.status = body.status
      await courseAccess.save()
    }

    // Populate course info for response
    await courseAccess.populate('courseId', 'title titleMn')
    await courseAccess.populate('accessGrantedBy', 'firstName lastName')

    return NextResponse.json({
      message: "Course access granted successfully",
      courseAccess,
      accessType: 'admin_grant'
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

    if (!body.accessId) {
      return NextResponse.json({ error: "Access ID is required" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Update course access
    const courseAccess = await CourseAccess.findOneAndUpdate(
      { _id: body.accessId, userId },
      {
        status: body.status,
        expiresAt: body.expiresAt,
        notes: body.notes
      },
      { new: true }
    )

    if (!courseAccess) {
      return NextResponse.json({ error: "Course access not found" }, { status: 404 })
    }

    // Populate course and admin info for response
    await courseAccess.populate('courseId', 'title titleMn')
    await courseAccess.populate('accessGrantedBy', 'firstName lastName')

    return NextResponse.json({
      message: "Course access updated successfully",
      courseAccess
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
    const accessId = searchParams.get('accessId')

    if (!accessId) {
      return NextResponse.json({ error: "Access ID is required" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Find access record
    const courseAccess = await CourseAccess.findOne({
      _id: accessId,
      userId
    })

    if (!courseAccess) {
      return NextResponse.json({ error: "Course access not found" }, { status: 404 })
    }

    // Revoke access
    await CourseAccess.revokeAccess(userId, courseAccess.courseId.toString())

    return NextResponse.json({ message: "Course access revoked successfully" })

  } catch (error) {
    console.error("Error revoking course access:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

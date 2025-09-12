import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import Course from "@/lib/models/Course"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params
    console.log("Fetching course with ID:", courseId)
    
    // Verify admin token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No authorization header or invalid format")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log("Token received, length:", token.length)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
      console.log("Token decoded, role:", decoded.role)
      
      if (decoded.role !== "admin") {
        console.log("User is not admin")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    console.log("Course ID from params:", courseId)

    // Validate course ID format
    if (!courseId || courseId.length !== 24) {
      console.log("Invalid course ID format:", courseId)
      return NextResponse.json({ error: "Invalid course ID format" }, { status: 400 })
    }

    // Connect to database
    console.log("Connecting to database...")
    await dbConnect()
    console.log("Database connected successfully")

    // Fetch course with modules and topics
    console.log("Fetching course from database...")
    const course = await Course.findById(courseId)
    console.log("Course found:", course ? "Yes" : "No")

    if (!course) {
      console.log("Course not found in database")
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    console.log("Course fetched successfully, returning response")
    return NextResponse.json({ course })
  } catch (error) {
    console.error("Error fetching course:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
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

    const { courseId } = await params
    const body = await request.json()

    console.log("Updating course:", courseId)
    console.log("Update data:", JSON.stringify(body, null, 2))
    console.log("Pricing fields received:", {
      price45Days: body.price45Days,
      price90Days: body.price90Days,
      originalPrice45Days: body.originalPrice45Days,
      originalPrice90Days: body.originalPrice90Days
    })

    // Connect to database
    await dbConnect()

    // Validate required fields
    if (!body.title || !body.titleMn || !body.description || !body.descriptionMn || 
        body.price45Days === undefined || body.price90Days === undefined) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        required: ["title", "titleMn", "description", "descriptionMn", "price45Days", "price90Days"],
        received: Object.keys(body)
      }, { status: 400 })
    }

    // Ensure prices are numbers and valid
    if (typeof body.price45Days !== 'number' || isNaN(body.price45Days) || body.price45Days < 50) {
      return NextResponse.json({ 
        error: "45-day price must be a number >= 50",
        received: body.price45Days
      }, { status: 400 })
    }

    if (typeof body.price90Days !== 'number' || isNaN(body.price90Days) || body.price90Days < 50) {
      return NextResponse.json({ 
        error: "90-day price must be a number >= 50",
        received: body.price90Days
      }, { status: 400 })
    }

    // Update course
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      body,
      { new: true, runValidators: true }
    )

    if (!updatedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    console.log("Course updated successfully:", updatedCourse._id)
    console.log("Updated pricing fields:", {
      price45Days: updatedCourse.price45Days,
      price90Days: updatedCourse.price90Days,
      originalPrice45Days: updatedCourse.originalPrice45Days,
      originalPrice90Days: updatedCourse.originalPrice90Days
    })
    
    return NextResponse.json({ course: updatedCourse })
  } catch (error) {
    console.error("Error updating course:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      courseId: await params.then(p => p.courseId)
    })
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
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

    const { courseId } = await params

    // Connect to database
    await dbConnect()

    // Delete course
    const deletedCourse = await Course.findByIdAndDelete(courseId)

    if (!deletedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Course deleted successfully" })
  } catch (error) {
    console.error("Error deleting course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

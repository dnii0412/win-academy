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

    // Connect to database
    await dbConnect()

    // Validate required fields
    if (!body.title || !body.titleMn || !body.description || !body.descriptionMn || body.price === undefined) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        required: ["title", "titleMn", "description", "descriptionMn", "price"],
        received: Object.keys(body)
      }, { status: 400 })
    }

    // Ensure price is a number
    if (typeof body.price !== 'number' || body.price < 0) {
      return NextResponse.json({ 
        error: "Price must be a positive number",
        received: body.price
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

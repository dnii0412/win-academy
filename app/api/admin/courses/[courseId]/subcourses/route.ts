import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import Subcourse from "@/lib/models/Subcourse"
import Course from "@/lib/models/Course"

export async function GET(
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

    // Verify course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Get subcourses for this course
    const subcourses = await Subcourse.find({ courseId })
      .sort({ order: 1, createdAt: -1 })

    return NextResponse.json({ subcourses })

  } catch (error) {
    console.error("Error fetching subcourses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
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

    // Validate required fields
    if (!body.title || !body.titleMn) {
      return NextResponse.json({ error: "Title is required in both languages" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Verify course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Generate slug from title
    const slug = body.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Get the next order number
    const lastSubcourse = await Subcourse.findOne({ courseId })
      .sort({ order: -1 })
    const nextOrder = (lastSubcourse?.order || 0) + 1

    // Create subcourse
    const subcourse = new Subcourse({
      courseId,
      title: body.title,
      titleMn: body.titleMn,
      description: body.description || "",
      descriptionMn: body.descriptionMn || "",
      slug,
      status: body.status || 'published',
      thumbnailUrl: body.thumbnailUrl,
      order: nextOrder
    })

    await subcourse.save()

    return NextResponse.json({
      message: "Subcourse created successfully",
      subcourse
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating subcourse:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
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

    // Validate required fields
    if (!body.subcourseIds || !Array.isArray(body.subcourseIds)) {
      return NextResponse.json({ error: "Subcourse IDs array is required" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Verify course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Update order for each subcourse
    const updatePromises = body.subcourseIds.map((subcourseId: string, index: number) => {
      return Subcourse.findByIdAndUpdate(
        subcourseId,
        { order: index + 1 },
        { new: true }
      )
    })

    await Promise.all(updatePromises)

    return NextResponse.json({
      message: "Subcourse order updated successfully"
    })

  } catch (error) {
    console.error("Error updating subcourse order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

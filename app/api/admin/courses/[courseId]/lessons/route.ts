import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import Lesson from "@/lib/models/Lesson"
import Course from "@/lib/models/Course"
import Subcourse from "@/lib/models/Subcourse"

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

    // Get lessons for this course
    const lessons = await Lesson.find({ courseId })
      .sort({ order: 1, createdAt: -1 })

    return NextResponse.json({ lessons })

  } catch (error) {
    console.error("Error fetching lessons:", error)
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
    if (!body.title || !body.titleMn || !body.subcourseId) {
      return NextResponse.json({ error: "Title and subcourseId are required" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Verify course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Verify subcourse exists and belongs to this course
    const subcourse = await Subcourse.findOne({ _id: body.subcourseId, courseId })
    if (!subcourse) {
      return NextResponse.json({ error: "Subcourse not found" }, { status: 404 })
    }

    // Generate unique slug from title
    let slug = body.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    // Check if slug already exists and make it unique
    let counter = 1
    let uniqueSlug = slug
    while (await Lesson.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    // Get the next order number for this subcourse
    const lastLesson = await Lesson.findOne({ subcourseId: body.subcourseId })
      .sort({ order: -1 })
    const nextOrder = (lastLesson?.order || 0) + 1

    // Create lesson
    const lesson = new Lesson({
      courseId,
      subcourseId: body.subcourseId,
      title: body.title,
      titleMn: body.titleMn,
      description: body.description || "",
      descriptionMn: body.descriptionMn || "",
      slug: uniqueSlug,
      type: body.type || 'video',
      status: body.status || 'draft',
      order: nextOrder,
      durationSec: body.durationSec || 0,
      content: body.content || "",
      contentMn: body.contentMn || "",
      video: body.video || {
        status: 'processing',
        videoId: '',
        thumbnailUrl: '',
        duration: 0
      }
    })

    await lesson.save()

    // Update subcourse total lessons count
    await Subcourse.findByIdAndUpdate(body.subcourseId, {
      $inc: { totalLessons: 1 }
    })

    return NextResponse.json({
      message: "Lesson created successfully",
      lesson
    }, { status: 201 })

  } catch (error: any) {
    console.error("Error creating lesson:", error)
    
    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "Duplicate lesson title or slug. Please use a different title." 
      }, { status: 400 })
    }
    
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
    if (!body.subcourseId || !body.lessonIds || !Array.isArray(body.lessonIds)) {
      return NextResponse.json({ error: "SubcourseId and lessonIds array are required" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Verify course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Verify subcourse exists and belongs to this course
    const subcourse = await Subcourse.findOne({ _id: body.subcourseId, courseId })
    if (!subcourse) {
      return NextResponse.json({ error: "Subcourse not found" }, { status: 404 })
    }

    // Update order for each lesson
    const updatePromises = body.lessonIds.map((lessonId: string, index: number) => {
      return Lesson.findByIdAndUpdate(
        lessonId,
        { order: index + 1 },
        { new: true }
      )
    })

    await Promise.all(updatePromises)

    return NextResponse.json({
      message: "Lesson order updated successfully"
    })

  } catch (error) {
    console.error("Error updating lesson order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

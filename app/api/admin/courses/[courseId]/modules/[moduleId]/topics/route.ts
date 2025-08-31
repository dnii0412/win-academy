import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import Course from "@/lib/models/Course"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
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

    const { courseId, moduleId } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.titleMn) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Find course and module
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const moduleIndex = course.modules.findIndex(
      (module: any) => module._id.toString() === moduleId
    )

    if (moduleIndex === -1) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    // Create new topic
    const newTopic = {
      title: body.title,
      titleMn: body.titleMn,
      description: body.description || "",
      descriptionMn: body.descriptionMn || "",
      order: body.order || (course.modules[moduleIndex].topics.length + 1),
      videoUrl: body.videoUrl || "",
      videoDuration: body.videoDuration || 0,
      thumbnailUrl: body.thumbnailUrl || "",
      materials: body.materials || [],
      assignments: body.assignments || []
    }

    course.modules[moduleIndex].topics.push(newTopic)
    await course.save()

    // Return the newly created topic
    const createdTopic = course.modules[moduleIndex].topics[course.modules[moduleIndex].topics.length - 1]

    return NextResponse.json({ 
      message: "Topic created successfully",
      topic: createdTopic
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating topic:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
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

    const { courseId, moduleId } = await params
    const body = await request.json()

    if (!body.topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Update topic
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const moduleIndex = course.modules.findIndex(
      (module: any) => module._id.toString() === moduleId
    )

    if (moduleIndex === -1) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    const topicIndex = course.modules[moduleIndex].topics.findIndex(
      (topic: any) => topic._id.toString() === body.topicId
    )

    if (topicIndex === -1) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // Update topic fields
    if (body.title) course.modules[moduleIndex].topics[topicIndex].title = body.title
    if (body.titleMn) course.modules[moduleIndex].topics[topicIndex].titleMn = body.titleMn
    if (body.description !== undefined) course.modules[moduleIndex].topics[topicIndex].description = body.description
    if (body.descriptionMn !== undefined) course.modules[moduleIndex].topics[topicIndex].descriptionMn = body.descriptionMn
    if (body.order !== undefined) course.modules[moduleIndex].topics[topicIndex].order = body.order
    if (body.videoUrl !== undefined) course.modules[moduleIndex].topics[topicIndex].videoUrl = body.videoUrl
    if (body.videoDuration !== undefined) course.modules[moduleIndex].topics[topicIndex].videoDuration = body.videoDuration
    if (body.thumbnailUrl !== undefined) course.modules[moduleIndex].topics[topicIndex].thumbnailUrl = body.thumbnailUrl
    if (body.materials !== undefined) course.modules[moduleIndex].topics[topicIndex].materials = body.materials
    if (body.assignments !== undefined) course.modules[moduleIndex].topics[topicIndex].assignments = body.assignments

    await course.save()

    return NextResponse.json({ 
      message: "Topic updated successfully",
      topic: course.modules[moduleIndex].topics[topicIndex]
    })

  } catch (error) {
    console.error("Error updating topic:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
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

    const { courseId, moduleId } = params
    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topicId')

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Delete topic
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const moduleIndex = course.modules.findIndex(
      (module: any) => module._id.toString() === moduleId
    )

    if (moduleIndex === -1) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    course.modules[moduleIndex].topics = course.modules[moduleIndex].topics.filter(
      (topic: any) => topic._id.toString() !== topicId
    )

    await course.save()

    return NextResponse.json({ message: "Topic deleted successfully" })

  } catch (error) {
    console.error("Error deleting topic:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

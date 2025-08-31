import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import Course from "@/lib/models/Course"

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
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Find course and add module
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Create new module
    const newModule = {
      title: body.title,
      titleMn: body.titleMn,
      description: body.description || "",
      descriptionMn: body.descriptionMn || "",
      order: body.order || (course.modules.length + 1),
      topics: []
    }

    course.modules.push(newModule)
    await course.save()

    // Return the newly created module
    const createdModule = course.modules[course.modules.length - 1]

    return NextResponse.json({ 
      message: "Module created successfully",
      module: createdModule
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating module:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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

    if (!body.moduleId) {
      return NextResponse.json({ error: "Module ID is required" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Update module
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const moduleIndex = course.modules.findIndex(
      (module: any) => module._id.toString() === body.moduleId
    )

    if (moduleIndex === -1) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    // Update module fields
    if (body.title) course.modules[moduleIndex].title = body.title
    if (body.titleMn) course.modules[moduleIndex].titleMn = body.titleMn
    if (body.description !== undefined) course.modules[moduleIndex].description = body.description
    if (body.descriptionMn !== undefined) course.modules[moduleIndex].descriptionMn = body.descriptionMn
    if (body.order !== undefined) course.modules[moduleIndex].order = body.order

    await course.save()

    return NextResponse.json({ 
      message: "Module updated successfully",
      module: course.modules[moduleIndex]
    })

  } catch (error) {
    console.error("Error updating module:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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

    const { courseId } = params
    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('moduleId')

    if (!moduleId) {
      return NextResponse.json({ error: "Module ID is required" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Delete module
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    course.modules = course.modules.filter(
      (module: any) => module._id.toString() !== moduleId
    )

    await course.save()

    return NextResponse.json({ message: "Module deleted successfully" })

  } catch (error) {
    console.error("Error deleting module:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

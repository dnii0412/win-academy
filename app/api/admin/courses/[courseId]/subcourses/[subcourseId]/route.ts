import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import Subcourse from "@/lib/models/Subcourse"
import Course from "@/lib/models/Course"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; subcourseId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { courseId, subcourseId } = await params
    const body = await request.json()

    if (!body.title || !body.titleMn) {
      return NextResponse.json({ error: "Title is required in both languages" }, { status: 400 })
    }

    await dbConnect()

    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Generate unique slug if title is being updated
    let updateData: any = {
      title: body.title,
      titleMn: body.titleMn,
      description: body.description || "",
      descriptionMn: body.descriptionMn || "",
      thumbnailUrl: body.thumbnailUrl
    }

    // Only update slug if title is being changed
    if (body.title) {
      let slug = body.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      
      // Ensure slug is unique within this course (excluding current subcourse)
      let counter = 1
      let uniqueSlug = slug
      while (await Subcourse.findOne({ slug: uniqueSlug, courseId, _id: { $ne: subcourseId } })) {
        uniqueSlug = `${slug}-${counter}`
        counter++
      }
      updateData.slug = uniqueSlug
    }

    const subcourse = await Subcourse.findOneAndUpdate(
      { _id: subcourseId, courseId },
      updateData,
      { new: true, runValidators: true }
    )

    if (!subcourse) {
      return NextResponse.json({ error: "Subcourse not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Subcourse updated successfully",
      subcourse
    })

  } catch (error) {
    console.error("Error updating subcourse:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; subcourseId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { courseId, subcourseId } = await params

    await dbConnect()

    // First, delete all lessons in this subcourse
    const deletedLessons = await Lesson.deleteMany({
      courseId,
      subcourseId
    })

    console.log(`Deleted ${deletedLessons.deletedCount} lessons from subcourse ${subcourseId}`)

    // Then delete the subcourse
    const subcourse = await Subcourse.findOneAndDelete({
      _id: subcourseId,
      courseId
    })

    if (!subcourse) {
      return NextResponse.json({ error: "Subcourse not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Subcourse and all its lessons deleted successfully",
      deletedLessons: deletedLessons.deletedCount
    })

  } catch (error) {
    console.error("Error deleting subcourse:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import Lesson from "@/lib/models/Lesson"
import Course from "@/lib/models/Course"
import Subcourse from "@/lib/models/Subcourse"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
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

    const { courseId, lessonId } = await params
    const body = await request.json()

    if (!body.title || !body.titleMn) {
      return NextResponse.json({ error: "Title is required in both languages" }, { status: 400 })
    }

    await dbConnect()

    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const lesson = await Lesson.findOneAndUpdate(
      { _id: lessonId, courseId },
      {
        title: body.title,
        titleMn: body.titleMn,
        description: body.description || "",
        descriptionMn: body.descriptionMn || "",
        type: body.type || 'video',
        durationSec: body.durationSec || 0,
        content: body.content || "",
        contentMn: body.contentMn || "",
        video: body.video || {
          status: 'processing',
          videoId: '',
          thumbnailUrl: '',
          duration: 0
        }
      },
      { new: true, runValidators: true }
    )

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Lesson updated successfully",
      lesson
    })

  } catch (error) {
    console.error("Error updating lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
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

    const { courseId, lessonId } = await params

    await dbConnect()

    const lesson = await Lesson.findOneAndDelete({
      _id: lessonId,
      courseId
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    // Update subcourse totalLessons count
    await Subcourse.findByIdAndUpdate(lesson.subcourseId, {
      $inc: { totalLessons: -1 }
    })

    return NextResponse.json({ message: "Lesson deleted successfully" })

  } catch (error) {
    console.error("Error deleting lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const subcourse = await Subcourse.findOneAndUpdate(
      { _id: subcourseId, courseId },
      {
        title: body.title,
        titleMn: body.titleMn,
        description: body.description || "",
        descriptionMn: body.descriptionMn || "",
        thumbnailUrl: body.thumbnailUrl
      },
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

    const subcourse = await Subcourse.findOneAndDelete({
      _id: subcourseId,
      courseId
    })

    if (!subcourse) {
      return NextResponse.json({ error: "Subcourse not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Subcourse deleted successfully" })

  } catch (error) {
    console.error("Error deleting subcourse:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

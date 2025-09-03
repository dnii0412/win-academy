import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import Course from "@/lib/models/Course"

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
      if (decoded.role !== "admin") {
        return NextResponse.json(
          { message: "Access denied" },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      )
    }

    // Connect to database
    await dbConnect()

    // Fetch courses from database
    const courses = await Course.find({}).sort({ createdAt: -1 })

    return NextResponse.json({
      courses: courses
    })

  } catch (error) {
    console.error("Admin courses error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
      if (decoded.role !== "admin") {
        return NextResponse.json(
          { message: "Access denied" },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      title, 
      titleMn, 
      description, 
      descriptionMn, 
      shortDescription,
      shortDescriptionMn,
      price, 
      status,
      category,
      categoryMn,
      level,
      levelMn,
      instructor,
      instructorMn,
      tags,
      tagsMn,
      featured,
      certificate,
      language
    } = body

    // Validate required fields
    if (!title || !titleMn || !description || !descriptionMn || !price) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Connect to database
    await dbConnect()

    // Create new course
    const newCourse = new Course({
      title,
      titleMn,
      description,
      descriptionMn,
      shortDescription: shortDescription || description.substring(0, 150),
      shortDescriptionMn: shortDescriptionMn || descriptionMn.substring(0, 150),
      price: parseFloat(price),
      status: status || "inactive",
      category,
      categoryMn,
      level: level || "beginner",
      levelMn: levelMn || "Эхлэгч",
      instructor: instructor || "WIN Academy",
      instructorMn: instructorMn || "WIN Academy",
      tags: tags || [],
      tagsMn: tagsMn || [],
      featured: featured || false,
      certificate: certificate || false,
      language: language || "both",
      modules: []
    })

    const savedCourse = await newCourse.save()

    return NextResponse.json({
      message: "Course created successfully",
      course: savedCourse
    })

  } catch (error) {
    console.error("Create course error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
      if (decoded.role !== "admin") {
        return NextResponse.json(
          { message: "Access denied" },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { courseId, ...updateData } = body

    if (!courseId) {
      return NextResponse.json(
        { message: "Course ID is required" },
        { status: 400 }
      )
    }

    // Connect to database
    await dbConnect()

    // Update the course
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      updateData,
      { new: true, runValidators: true }
    )

    if (!updatedCourse) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: "Course updated successfully",
      course: updatedCourse
    })

  } catch (error) {
    console.error("Update course error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

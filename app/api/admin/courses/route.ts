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
      price45Days,
      price90Days,
      originalPrice,
      originalPrice45Days,
      originalPrice90Days,
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
      language,
      thumbnailUrl,
      thumbnailPublicId
    } = body

    // Validate required fields - prioritize Mongolian fields, fallback to English if needed
    const finalTitle = titleMn || title
    const finalDescription = descriptionMn || description
    
    if (!finalTitle || !finalDescription || !price45Days || !price90Days) {
      return NextResponse.json(
        { 
          message: "Missing required fields",
          required: ["titleMn (or title)", "descriptionMn (or description)", "price45Days", "price90Days"],
          received: { title, titleMn, description, descriptionMn, price45Days, price90Days }
        },
        { status: 400 }
      )
    }

    // Validate pricing
    if (typeof price45Days !== 'number' || price45Days < 50) {
      return NextResponse.json(
        { 
          message: "45-day price must be a number >= 50",
          received: price45Days
        },
        { status: 400 }
      )
    }

    if (typeof price90Days !== 'number' || price90Days < 50) {
      return NextResponse.json(
        { 
          message: "90-day price must be a number >= 50",
          received: price90Days
        },
        { status: 400 }
      )
    }

    // Connect to database
    await dbConnect()

    // Create new course - use final values with fallbacks
    const courseData = {
      title: title || finalTitle,
      titleMn: titleMn || finalTitle,
      description: description || finalDescription,
      descriptionMn: descriptionMn || finalDescription,
      shortDescription: shortDescription || (description || finalDescription).substring(0, 150),
      shortDescriptionMn: shortDescriptionMn || (descriptionMn || finalDescription).substring(0, 150),
      price: price45Days, // Use 45-day price as default price
      price45Days: Number(price45Days),
      price90Days: Number(price90Days),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      originalPrice45Days: originalPrice45Days ? Number(originalPrice45Days) : undefined,
      originalPrice90Days: originalPrice90Days ? Number(originalPrice90Days) : undefined,
      status: status || "inactive",
      category,
      categoryMn,
      level: level || "beginner",
      levelMn: levelMn || "Эхлэгч",
      instructor: instructor || "WIN Academy",
      instructorMn: instructorMn || "WIN Academy",
      tags: tags || tagsMn || [],
      tagsMn: tagsMn || tags || [],
      featured: featured || false,
      certificate: certificate || false,
      language: language || "both",
      thumbnailUrl: thumbnailUrl || "",
      thumbnailPublicId: thumbnailPublicId || "",
      modules: []
    }

    const newCourse = new Course(courseData)
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

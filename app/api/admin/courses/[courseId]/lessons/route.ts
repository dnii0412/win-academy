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
    console.log('📚 Lesson creation API called')
    
    // Verify admin token
    const authHeader = request.headers.get("authorization")
    console.log('🔐 Lesson API - Auth header received:', {
      hasHeader: !!authHeader,
      headerValue: authHeader ? `${authHeader.substring(0, 20)}...` : 'MISSING',
      startsWithBearer: authHeader?.startsWith('Bearer ')
    })
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('❌ Lesson API - No admin token found in Authorization header')
      return NextResponse.json({ 
        Success: false,
        Message: "Authentication has been denied for this request.",
        StatusCode: 401 
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log('🔐 Lesson API - Token extracted:', {
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...',
      tokenEnd: '...' + token.substring(token.length - 10)
    })
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
    console.log('✅ Lesson API - Token verified successfully:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    })

    if (decoded.role !== "admin") {
      console.log('❌ Lesson API - Invalid admin token or user role:', { role: decoded.role })
      return NextResponse.json({ 
        Success: false,
        Message: "Authentication has been denied for this request.",
        StatusCode: 403 
      }, { status: 403 })
    }

    const { courseId } = await params
    const body = await request.json()

    console.log('📥 Lesson creation request body:', {
      title: body.title,
      titleMn: body.titleMn,
      subcourseId: body.subcourseId,
      video: body.video,
      hasVideo: !!body.video,
      videoId: body.video?.videoId,
      videoStatus: body.video?.status,
      videoUrl: body.videoUrl,
      hasVideoUrl: !!body.videoUrl
    })
    
    console.log('🔍 Detailed videoUrl analysis:', {
      videoUrl: body.videoUrl,
      videoUrlType: typeof body.videoUrl,
      videoUrlLength: body.videoUrl?.length,
      isString: typeof body.videoUrl === 'string',
      isEmpty: body.videoUrl === '',
      isUndefined: body.videoUrl === undefined,
      isNull: body.videoUrl === null
    })

    // Validate required fields
    if (!body.title || !body.titleMn || !body.subcourseId) {
      return NextResponse.json({ error: "Title and subcourseId are required" }, { status: 400 })
    }

    // Connect to database
    console.log('🔗 Connecting to database...')
    await dbConnect()
    console.log('✅ Database connected successfully')

    // Verify course exists
    console.log('🔍 Looking for course:', courseId)
    const course = await Course.findById(courseId)
    if (!course) {
      console.log('❌ Course not found:', courseId)
      return NextResponse.json({ 
        Success: false,
        Message: "Course not found",
        StatusCode: 404 
      }, { status: 404 })
    }
    console.log('✅ Course found:', course.title)

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
      order: nextOrder,
      durationSec: body.durationSec || 0,
      content: body.content || "",
      contentMn: body.contentMn || "",
      videoUrl: body.videoUrl || "",
      video: body.video || {
        status: 'processing',
        videoId: '',
        thumbnailUrl: '',
        duration: 0
      }
    })

    console.log('📝 Creating lesson with video data:', {
      videoId: body.video?.videoId,
      status: body.video?.status,
      hasVideo: !!body.video,
      videoUrl: body.videoUrl,
      hasVideoUrl: !!body.videoUrl
    })

    await lesson.save()

    console.log('✅ Lesson saved successfully:', {
      lessonId: lesson._id,
      videoUrl: lesson.videoUrl,
      hasVideoUrl: !!lesson.videoUrl,
      videoUrlType: typeof lesson.videoUrl,
      videoUrlLength: lesson.videoUrl?.length
    })
    
    // Verify the lesson was saved correctly by fetching it back
    const savedLesson = await Lesson.findById(lesson._id)
    console.log('🔍 Verification - fetched lesson from DB:', {
      lessonId: savedLesson?._id,
      videoUrl: savedLesson?.videoUrl,
      hasVideoUrl: !!savedLesson?.videoUrl,
      videoUrlType: typeof savedLesson?.videoUrl
    })

    // Update subcourse total lessons count
    await Subcourse.findByIdAndUpdate(body.subcourseId, {
      $inc: { totalLessons: 1 }
    })

    return NextResponse.json({
      message: "Lesson created successfully",
      lesson
    }, { status: 201 })

  } catch (error: any) {
    console.error("❌ Error creating lesson:", error)
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    })
    
    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      return NextResponse.json({ 
        Success: false,
        Message: "Duplicate lesson title or slug. Please use a different title.",
        StatusCode: 400
      }, { status: 400 })
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        Success: false,
        Message: "Validation error: " + error.message,
        StatusCode: 400
      }, { status: 400 })
    }
    
    // Handle database connection errors
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return NextResponse.json({ 
        Success: false,
        Message: "Database error: " + error.message,
        StatusCode: 500
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      Success: false,
      Message: "Internal server error: " + (error.message || "Unknown error"),
      StatusCode: 500
    }, { status: 500 })
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

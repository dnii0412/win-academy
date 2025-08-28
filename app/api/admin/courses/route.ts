import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import dbConnect from '@/lib/mongoose'

// POST /api/admin/courses - Create a new video course (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    await requireAdmin()

    const body = await request.json()
    const {
      title,
      description,
      category,
      difficulty,
      duration,
      price,
      videoId,
      thumbnailUrl,
      thumbnailPublicId,
      status = 'draft'
    } = body

    // Validate required fields
    if (!title || !description || !category || !videoId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: title, description, category, and videoId are required' 
        },
        { status: 400 }
      )
    }

    // Ensure MongoDB is connected
    await dbConnect()

    // Create course object
    const courseData = {
      title,
      description,
      category,
      difficulty: difficulty || 'beginner',
      duration: duration || '',
      price: price || 0,
      videoId,
      thumbnailUrl,
      thumbnailPublicId,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // For now, we'll store in a simple structure
    // In a real app, you'd have a proper Course model
    const courseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Here you would typically save to your database
    // For now, we'll return success with the generated ID
    console.log('Course created:', { courseId, ...courseData })

    return NextResponse.json({
      success: true,
      courseId,
      message: 'Course created successfully',
      course: courseData
    })

  } catch (error: any) {
    console.error('Failed to create course:', error)
    
    if (error.message === 'Admin access required') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Admin access required' 
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create course',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// GET /api/admin/courses - List all courses (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    await requireAdmin()

    // Ensure MongoDB is connected
    await dbConnect()

    // Here you would typically fetch from your database
    // For now, we'll return an empty array
    const courses = []

    return NextResponse.json({
      success: true,
      courses,
      count: courses.length
    })

  } catch (error: any) {
    console.error('Failed to fetch courses:', error)
    
    if (error.message === 'Admin access required') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Admin access required' 
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch courses',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

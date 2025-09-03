import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import Lesson from '@/lib/models/Lesson'
import Course from '@/lib/models/Course'

// GET /api/courses/[courseId]/lessons - Get all lessons for a course (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await dbConnect()

    const { courseId } = await params

    // Validate courseId
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Verify course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Get all lessons for this course
    const lessons = await Lesson.find({ 
      courseId
    }).sort({ order: 1, createdAt: -1 })

    // Log for debugging
    console.log(`Found ${lessons.length} lessons for course ${courseId}:`, 
      lessons.map(l => ({ id: l._id, title: l.title, status: l.status, order: l.order }))
    )

    return NextResponse.json({
      lessons: lessons
    })

  } catch (error: any) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

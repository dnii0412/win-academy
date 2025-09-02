import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import Subcourse from '@/lib/models/Subcourse'
import Course from '@/lib/models/Course'

// GET /api/courses/[courseId]/subcourses - Get subcourses for a course (public endpoint)
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

    // Get subcourses for this course, including all statuses for debugging
    const subcourses = await Subcourse.find({ 
      courseId
    }).sort({ order: 1, createdAt: -1 })

    // Log for debugging
    console.log(`Found ${subcourses.length} subcourses for course ${courseId}:`, 
      subcourses.map(s => ({ id: s._id, title: s.title, status: s.status, order: s.order }))
    )

    return NextResponse.json({
      subcourses: subcourses
    })

  } catch (error: any) {
    console.error('Error fetching subcourses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

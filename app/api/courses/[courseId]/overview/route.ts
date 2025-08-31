import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import Course from '@/lib/models/Course'

// GET /api/courses/[courseId]/overview - Get complete course data for overview page
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

    // Fetch the complete course from database with all modules and topics
    const course = await Course.findById(courseId).lean()

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      course: course
    })

  } catch (error: any) {
    console.error('Error fetching course overview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

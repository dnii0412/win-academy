import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import Course from '@/lib/models/Course'

// GET /api/courses - Get all available courses
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // Fetch active and draft courses from the database
    const courses = await Course.find({ 
      status: { $in: ['active', 'draft'] }
    }).select({
      _id: 1,
      title: 1,
      titleMn: 1,
      description: 1,
      descriptionMn: 1,
      price: 1,
      category: 1,
      categoryMn: 1,
      level: 1,
      levelMn: 1,
      duration: 1,
      instructor: 1,
      instructorMn: 1,
      thumbnailUrl: 1,
      featured: 1,
      totalLessons: 1,
      enrolledUsers: 1,
      createdAt: 1,
      status: 1
    }).sort({ featured: -1, createdAt: -1 })

    return NextResponse.json({
      courses: courses
    })

  } catch (error: any) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

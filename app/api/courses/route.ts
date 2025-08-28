import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'

// GET /api/courses - Get all available courses
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // Return empty array since we haven't implemented the course creation system yet
    // This will be populated when admins create actual courses
    return NextResponse.json({
      courses: []
    })

  } catch (error: any) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

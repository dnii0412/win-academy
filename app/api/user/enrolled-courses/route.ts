import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'

// GET /api/user/enrolled-courses - Get courses enrolled by the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Ensure user can only access their own enrolled courses
    if (email !== session.user.email) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await dbConnect()

    // Find user and populate their enrolled courses
    const user = await User.findOne({ email }).populate('enrolledCourses')
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // For now, return empty array as we need to implement course enrollment system
    // This will be populated when we implement the payment and enrollment system
    return NextResponse.json({
      courses: []
    })

  } catch (error: any) {
    console.error('Error fetching enrolled courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Find user to verify they exist
    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's enrolled courses
    const CourseEnrollment = (await import('@/lib/models/CourseEnrollment')).default
    const Course = (await import('@/lib/models/Course')).default

    const enrollments = await CourseEnrollment.find({
      userId: user._id,
      status: 'active'
    }).populate('courseId')

    const courses = enrollments.map(enrollment => ({
      _id: enrollment.courseId._id,
      title: enrollment.courseId.title,
      titleMn: enrollment.courseId.titleMn,
      description: enrollment.courseId.description,
      descriptionMn: enrollment.courseId.descriptionMn,
      thumbnailUrl: enrollment.courseId.thumbnailUrl,
      price: enrollment.courseId.price,
      enrolledAt: enrollment.enrolledAt,
      progress: enrollment.progress,
      lastAccessedAt: enrollment.lastAccessedAt
    }))

    return NextResponse.json({
      courses
    })

  } catch (error: any) {
    console.error('Error fetching enrolled courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

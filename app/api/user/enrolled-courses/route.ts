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

    // Get user's enrolled courses from both CourseEnrollment and CourseAccess
    const CourseEnrollment = (await import('@/lib/models/CourseEnrollment')).default
    const CourseAccess = (await import('@/lib/models/CourseAccess')).default
    const Course = (await import('@/lib/models/Course')).default

    // Get courses from CourseEnrollment (old system)
    const enrollments = await CourseEnrollment.find({
      userId: user._id,
      status: 'completed'
    }).populate('courseId')

    // Get courses from CourseAccess (new payment system)
    const accessRecords = await CourseAccess.find({
      userId: user._id,
      hasAccess: true
    }).populate('courseId')

    console.log('Enrolled courses debug:', {
      userId: user._id,
      userEmail: user.email,
      accessRecordsCount: accessRecords.length,
      accessRecords: accessRecords.map(ar => ({
        courseId: ar.courseId?._id,
        hasAccess: ar.hasAccess,
        accessType: ar.accessType
      }))
    })

    // Combine both sources and remove duplicates
    const allCourses = new Map()

    // Add enrollment courses
    enrollments.forEach(enrollment => {
      if (enrollment.courseId) {
        allCourses.set(enrollment.courseId._id.toString(), {
          _id: enrollment.courseId._id,
          title: enrollment.courseId.title,
          titleMn: enrollment.courseId.titleMn,
          description: enrollment.courseId.description,
          descriptionMn: enrollment.courseId.descriptionMn,
          thumbnailUrl: enrollment.courseId.thumbnailUrl,
          price: enrollment.courseId.price,
          enrolledAt: enrollment.enrolledAt,
          progress: enrollment.progress,
          lastAccessedAt: enrollment.lastAccessedAt,
          accessType: 'enrollment'
        })
      }
    })

    // Add access courses (from payments)
    accessRecords.forEach(access => {
      if (access.courseId) {
        allCourses.set(access.courseId._id.toString(), {
          _id: access.courseId._id,
          title: access.courseId.title,
          titleMn: access.courseId.titleMn,
          description: access.courseId.description,
          descriptionMn: access.courseId.descriptionMn,
          thumbnailUrl: access.courseId.thumbnailUrl,
          price: access.courseId.price,
          enrolledAt: access.grantedAt,
          progress: 0, // New purchases start at 0 progress
          lastAccessedAt: access.grantedAt,
          accessType: access.accessType || 'purchase'
        })
      }
    })

    const courses = Array.from(allCourses.values())

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

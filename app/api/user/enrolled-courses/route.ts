import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import Course from '@/lib/models/Course'
import CourseAccess from '@/lib/models/CourseAccess'
import mongoose from 'mongoose'

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

    // Get all courses user has access to from unified CourseAccess schema
    const accessRecords = await CourseAccess.find({
      userId: user._id.toString(),
      hasAccess: true
    })

    // Manually populate course data to avoid schema registration issues
    const courses = []
    for (const access of accessRecords) {
      if (access.courseId) {
        const course = await Course.findById(access.courseId)
        if (course) {
          courses.push({
            _id: course._id,
            title: course.title,
            titleMn: course.titleMn,
            description: course.description,
            descriptionMn: course.descriptionMn,
            thumbnailUrl: course.thumbnailUrl,
            price: course.price,
            enrolledAt: access.grantedAt,
            progress: access.progress || 0,
            lastAccessedAt: access.lastAccessedAt,
            accessType: access.accessType || 'purchase',
            status: access.status || 'active',
            notes: access.notes
          })
        }
      }
    }

    console.log('Enrolled courses debug:', {
      userId: user._id,
      userEmail: user.email,
      accessRecordsCount: accessRecords.length,
      coursesCount: courses.length
    })


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

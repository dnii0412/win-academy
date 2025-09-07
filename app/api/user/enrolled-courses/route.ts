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

    // Get user's enrolled courses from unified CourseAccess schema
    const CourseAccess = (await import('@/lib/models/CourseAccess')).default

    // Get all courses user has access to
    const accessRecords = await CourseAccess.find({
      userId: user._id.toString(),
      hasAccess: true
    }).populate('courseId')

    console.log('Enrolled courses debug:', {
      userId: user._id,
      userEmail: user.email,
      accessRecordsCount: accessRecords.length,
      accessRecords: accessRecords.map(ar => ({
        courseId: ar.courseId?._id,
        hasAccess: ar.hasAccess,
        accessType: ar.accessType,
        status: ar.status,
        progress: ar.progress
      }))
    })

    // Convert access records to course format
    const courses = accessRecords.map(access => {
      if (access.courseId) {
        return {
          _id: access.courseId._id,
          title: access.courseId.title,
          titleMn: access.courseId.titleMn,
          description: access.courseId.description,
          descriptionMn: access.courseId.descriptionMn,
          thumbnailUrl: access.courseId.thumbnailUrl,
          price: access.courseId.price,
          enrolledAt: access.grantedAt,
          progress: access.progress || 0,
          lastAccessedAt: access.lastAccessedAt,
          accessType: access.accessType || 'purchase',
          status: access.status || 'active',
          notes: access.notes
        }
      }
      return null
    }).filter(Boolean)

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

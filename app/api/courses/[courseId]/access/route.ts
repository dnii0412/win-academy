import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import CourseAccess from '@/lib/models/CourseAccess'
import CourseEnrollment from '@/lib/models/CourseEnrollment'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId } = await params
    const userId = session.user.id || session.user.email

    console.log('Course access check:', {
      courseId,
      courseIdType: typeof courseId,
      userId,
      userIdType: typeof userId,
      userEmail: session.user.email,
      sessionUserId: session.user.id,
      sessionUser: session.user
    })

    // If we don't have a userId, we can't check access
    if (!userId) {
      console.error('No userId found in session:', { session: session.user })
      return NextResponse.json({ 
        hasAccess: false,
        error: 'User ID not found in session',
        courseId,
        userId: null,
        accessSource: 'none',
        accessDetails: { courseAccess: null, enrollment: null }
      })
    }

    await dbConnect()

    // Import User model to find user by email if needed
    const User = require('@/lib/models/User').default

    // First try with the userId from session
    let courseAccess = await CourseAccess.findOne({
      userId,
      courseId,
      hasAccess: true
    })

    let enrollment = await CourseEnrollment.findOne({
      userId,
      courseId,
      status: 'completed'
    })

    // If no access found and userId looks like an email, try to find user by email
    if (!courseAccess && !enrollment && session.user.email && session.user.email.includes('@')) {
      console.log('No access found with userId, trying to find user by email:', session.user.email)
      
      const user = await User.findOne({ email: session.user.email })
      if (user) {
        console.log('Found user by email:', { userId: user._id.toString(), email: user.email })
        
        // Try again with the found user ID
        courseAccess = await CourseAccess.findOne({
          userId: user._id.toString(),
          courseId,
          hasAccess: true
        })

        enrollment = await CourseEnrollment.findOne({
          userId: user._id.toString(),
          courseId,
          status: 'completed'
        })
      }
    }

    console.log('Access check results:', {
      courseAccess: courseAccess ? {
        userId: courseAccess.userId,
        hasAccess: courseAccess.hasAccess,
        accessType: courseAccess.accessType
      } : null,
      enrollment: enrollment ? {
        userId: enrollment.userId,
        status: enrollment.status
      } : null
    })

    const hasAccess = !!(courseAccess?.hasAccess || enrollment)

    return NextResponse.json({
      hasAccess,
      courseId,
      userId,
      accessSource: courseAccess ? 'CourseAccess' : enrollment ? 'CourseEnrollment' : 'none',
      accessDetails: {
        courseAccess: courseAccess ? {
          hasAccess: courseAccess.hasAccess,
          accessType: courseAccess.accessType,
          grantedAt: courseAccess.grantedAt,
          orderId: courseAccess.orderId
        } : null,
        enrollment: enrollment ? {
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          accessGrantedBy: enrollment.accessGrantedBy
        } : null
      }
    })

  } catch (error: any) {
    console.error('Course access check error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

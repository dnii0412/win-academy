import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import CourseAccess from '@/lib/models/CourseAccess'

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

    // Find user by email first to get consistent user ID
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      console.error('User not found:', { email: session.user.email })
      return NextResponse.json({ 
        hasAccess: false,
        error: 'User not found',
        courseId,
        userId: null,
        accessSource: 'none',
        accessDetails: { courseAccess: null, enrollment: null }
      })
    }

    const userObjectId = user._id.toString()
    console.log('Found user:', { userId: userObjectId, email: user.email })

    // Check unified CourseAccess schema
    let courseAccess = await CourseAccess.findOne({
      userId: userObjectId,
      courseId,
      hasAccess: true
    })

    console.log('Access check results:', {
      courseAccess: courseAccess ? {
        userId: courseAccess.userId,
        hasAccess: courseAccess.hasAccess,
        accessType: courseAccess.accessType,
        status: courseAccess.status,
        progress: courseAccess.progress
      } : null
    })

    const hasAccess = !!(courseAccess?.hasAccess)

    return NextResponse.json({
      hasAccess,
      courseId,
      userId,
      accessSource: courseAccess ? 'CourseAccess' : 'none',
      accessDetails: {
        courseAccess: courseAccess ? {
          hasAccess: courseAccess.hasAccess,
          accessType: courseAccess.accessType,
          status: courseAccess.status,
          progress: courseAccess.progress,
          grantedAt: courseAccess.grantedAt,
          lastAccessedAt: courseAccess.lastAccessedAt,
          orderId: courseAccess.orderId,
          accessGrantedBy: courseAccess.accessGrantedBy,
          notes: courseAccess.notes
        } : null
      }
    })

  } catch (error: any) {
    console.error('Course access check error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

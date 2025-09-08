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


    // If we don't have a userId, we can't check access
    if (!userId) {
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

    // Check unified CourseAccess schema
    // Try both user._id.toString() and user.email since orders might use either format
    let courseAccess = await CourseAccess.findOne({
      $or: [
        { userId: userObjectId, courseId, hasAccess: true },
        { userId: user.email, courseId, hasAccess: true }
      ]
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

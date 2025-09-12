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

    await dbConnect()

    // Import User model to find user by email
    const User = require('@/lib/models/User').default

    // Find user by email to get consistent user ID
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ 
        hasAccess: false,
        error: 'User not found in database',
        courseId,
        userId: null,
        accessSource: 'none',
        accessDetails: { courseAccess: null, enrollment: null }
      })
    }

    const userObjectId = user._id.toString()

    // Check unified CourseAccess schema using consistent user ID
    let courseAccess = await CourseAccess.findOne({
      userId: userObjectId,
      courseId,
      hasAccess: true
    })


    const hasAccess = !!(courseAccess?.hasAccess)

    return NextResponse.json({
      hasAccess,
      courseId,
      userId: userObjectId,
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

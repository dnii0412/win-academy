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

    await dbConnect()

    // Check CourseAccess (new payment system)
    const courseAccess = await CourseAccess.findOne({
      userId,
      courseId,
      hasAccess: true
    })

    // Check CourseEnrollment (legacy system)
    const enrollment = await CourseEnrollment.findOne({
      userId,
      courseId,
      status: 'completed'
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

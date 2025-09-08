import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import CourseAccess from '@/lib/models/CourseAccess'
import Order from '@/lib/models/Order'
import Course from '@/lib/models/Course'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const { courseId } = await request.json()
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 })
    }

    await dbConnect()

    // Get user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get course
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if user has paid for this course
    const paidOrder = await Order.findOne({
      $or: [
        { userId: user._id.toString(), courseId: courseId },
        { userId: user.email, courseId: courseId }
      ],
      status: { $in: ['PAID', 'completed'] }
    })

    if (!paidOrder) {
      return NextResponse.json({ 
        error: 'No paid order found for this course',
        suggestion: 'Please purchase the course first'
      }, { status: 400 })
    }

    // Grant course access
    const courseAccess = await CourseAccess.grantAccess(
      user._id.toString(),
      courseId,
      paidOrder._id.toString(),
      'purchase',
      user._id.toString(),
      'Manual access grant via debug endpoint'
    )

    return NextResponse.json({
      success: true,
      message: 'Course access granted successfully',
      courseAccess: {
        id: courseAccess._id.toString(),
        userId: courseAccess.userId,
        courseId: courseAccess.courseId,
        hasAccess: courseAccess.hasAccess,
        accessType: courseAccess.accessType,
        status: courseAccess.status,
        grantedAt: courseAccess.grantedAt
      },
      order: {
        id: paidOrder._id.toString(),
        status: paidOrder.status,
        amount: paidOrder.amount,
        currency: paidOrder.currency
      }
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

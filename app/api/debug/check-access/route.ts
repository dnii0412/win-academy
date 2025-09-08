import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import CourseAccess from '@/lib/models/CourseAccess'
import Order from '@/lib/models/Order'
import Course from '@/lib/models/Course'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId') || '68be5d3570b8624249055c3a'

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

    // Get all orders for this user
    const orders = await Order.find({
      $or: [
        { userId: user._id.toString() },
        { userId: user.email }
      ]
    }).populate('courseId', 'title titleMn')

    // Get all course access records for this user
    const allAccess = await CourseAccess.find({
      $or: [
        { userId: user._id.toString() },
        { userId: user.email }
      ]
    }).populate('courseId', 'title titleMn')

    // Check specific course access
    const courseAccess = await CourseAccess.findOne({
      $or: [
        { userId: user._id.toString(), courseId: courseId, hasAccess: true },
        { userId: user.email, courseId: courseId, hasAccess: true }
      ]
    })

    // Check if user has paid for this specific course
    const paidOrder = await Order.findOne({
      $or: [
        { userId: user._id.toString(), courseId: courseId },
        { userId: user.email, courseId: courseId }
      ],
      status: { $in: ['PAID', 'completed'] }
    })

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.fullName || `${user.firstName} ${user.lastName}`.trim()
      },
      course: {
        id: course._id.toString(),
        title: course.title,
        titleMn: course.titleMn
      },
      orders: orders.map(o => ({
        id: o._id.toString(),
        courseId: o.courseId?._id?.toString(),
        courseTitle: o.courseId?.title,
        status: o.status,
        amount: o.amount,
        currency: o.currency,
        createdAt: o.createdAt
      })),
      allAccess: allAccess.map(a => ({
        id: a._id.toString(),
        courseId: a.courseId?._id?.toString(),
        courseTitle: a.courseId?.title,
        userId: a.userId,
        hasAccess: a.hasAccess,
        accessType: a.accessType,
        status: a.status,
        grantedAt: a.grantedAt
      })),
      specificCourseAccess: courseAccess ? {
        id: courseAccess._id.toString(),
        userId: courseAccess.userId,
        hasAccess: courseAccess.hasAccess,
        accessType: courseAccess.accessType,
        status: courseAccess.status,
        grantedAt: courseAccess.grantedAt
      } : null,
      paidForThisCourse: !!paidOrder,
      paidOrder: paidOrder ? {
        id: paidOrder._id.toString(),
        status: paidOrder.status,
        amount: paidOrder.amount,
        currency: paidOrder.currency,
        createdAt: paidOrder.createdAt
      } : null,
      hasAccessToCourse: !!courseAccess,
      debug: {
        userIdFormats: {
          objectId: user._id.toString(),
          email: user.email
        },
        courseIdFormats: {
          string: courseId,
          objectId: course._id.toString()
        }
      }
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

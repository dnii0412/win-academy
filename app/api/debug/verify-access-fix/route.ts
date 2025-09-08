import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import CourseAccess from '@/lib/models/CourseAccess'
import Order from '@/lib/models/Order'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's orders
    const orders = await Order.find({ 
      $or: [
        { userId: user._id.toString() },
        { userId: user.email }
      ],
      status: { $in: ['PAID', 'completed'] }
    }).populate('courseId', 'title titleMn')

    // Get user's course access
    const courseAccess = await CourseAccess.find({
      $or: [
        { userId: user._id.toString() },
        { userId: user.email }
      ],
      hasAccess: true
    }).populate('courseId', 'title titleMn')

    // Test the new verification logic
    const verificationResults = []
    for (const order of orders) {
      if (!order.courseId) continue
      
      const access = await CourseAccess.findOne({
        $or: [
          { userId: user._id.toString(), courseId: order.courseId._id, hasAccess: true },
          { userId: user.email, courseId: order.courseId._id, hasAccess: true }
        ]
      })

      verificationResults.push({
        orderId: order._id,
        courseId: order.courseId._id,
        courseTitle: order.courseId.title,
        orderStatus: order.status,
        hasAccess: !!access,
        accessType: access?.accessType,
        accessStatus: access?.status,
        userIdInAccess: access?.userId
      })
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.fullName || `${user.firstName} ${user.lastName}`.trim()
      },
      orders: orders.map(o => ({
        id: o._id,
        courseId: o.courseId?._id,
        courseTitle: o.courseId?.title,
        status: o.status,
        amount: o.amount,
        currency: o.currency,
        createdAt: o.createdAt
      })),
      courseAccess: courseAccess.map(ca => ({
        id: ca._id,
        courseId: ca.courseId?._id,
        courseTitle: ca.courseId?.title,
        userId: ca.userId,
        hasAccess: ca.hasAccess,
        accessType: ca.accessType,
        status: ca.status,
        grantedAt: ca.grantedAt
      })),
      verificationResults,
      summary: {
        totalOrders: orders.length,
        totalAccess: courseAccess.length,
        paidOrdersWithAccess: verificationResults.filter(r => r.hasAccess).length,
        paidOrdersWithoutAccess: verificationResults.filter(r => !r.hasAccess).length
      }
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error'
    }, { status: 500 })
  }
}

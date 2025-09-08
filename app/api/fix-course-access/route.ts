import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import CourseAccess from '@/lib/models/CourseAccess'
import Order from '@/lib/models/Order'
import mongoose from 'mongoose'

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

    // Check if user has any paid orders (not necessarily for this course)
    const paidOrders = await Order.find({
      $or: [
        { userId: user._id.toString() },
        { userId: user.email }
      ],
      status: { $in: ['PAID', 'completed'] }
    })

    if (paidOrders.length === 0) {
      return NextResponse.json({ 
        error: 'No paid orders found',
        suggestion: 'Please purchase a course first'
      }, { status: 400 })
    }

    // Grant access to the specific course
    const courseAccess = await CourseAccess.grantAccess(
      user._id.toString(),
      courseId,
      paidOrders[0]._id.toString(), // Use the first paid order
      'purchase',
      user._id.toString(),
      'Manual access grant via fix endpoint'
    )

    // Also create access with email as userId for compatibility
    await CourseAccess.grantAccess(
      user.email,
      courseId,
      paidOrders[0]._id.toString(),
      'purchase',
      user._id.toString(),
      'Manual access grant via fix endpoint (email format)'
    )

    return NextResponse.json({
      success: true,
      message: 'Course access granted successfully',
      user: {
        id: user._id.toString(),
        email: user.email
      },
      courseId: courseId,
      courseAccess: {
        id: courseAccess._id.toString(),
        userId: courseAccess.userId,
        hasAccess: courseAccess.hasAccess,
        accessType: courseAccess.accessType,
        status: courseAccess.status
      },
      paidOrders: paidOrders.length
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import CourseAccess from '@/lib/models/CourseAccess'
import Order from '@/lib/models/Order'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const userId = session.user.id || session.user.email

    await dbConnect()

    // Get all course access records for this user
    const accessRecords = await CourseAccess.find({ userId }).populate('courseId')
    
    // Get all orders for this user
    const orders = await Order.find({ userId })

    return NextResponse.json({
      userId,
      userEmail: session.user.email,
      courseId,
      accessRecords: accessRecords.map(ar => ({
        _id: ar._id,
        courseId: ar.courseId?._id,
        courseTitle: ar.courseId?.title,
        hasAccess: ar.hasAccess,
        accessType: ar.accessType,
        grantedAt: ar.grantedAt,
        orderId: ar.orderId
      })),
      orders: orders.map(o => ({
        _id: o._id,
        courseId: o.courseId,
        courseTitle: o.courseTitle,
        status: o.status,
        paymentMethod: o.paymentMethod,
        amount: o.amount,
        qpayInvoiceId: o.qpay?.invoiceId
      })),
      hasAccessToCourse: courseId ? accessRecords.some(ar => 
        ar.courseId?._id.toString() === courseId && ar.hasAccess
      ) : null
    })
  } catch (error: any) {
    console.error('Debug course access error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import Order from '@/lib/models/Order'
import CourseAccess from '@/lib/models/CourseAccess'
import { qpayPaymentCheckByInvoice } from '@/lib/qpay/api'

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

    await dbConnect()
    const order = await Order.findById(orderId)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Verify ownership - check both user ID formats
    const sessionUserId = session.user.id || session.user.email
    if (order.userId !== sessionUserId) {
      console.log('User ID mismatch:', { 
        orderUserId: order.userId, 
        sessionUserId, 
        sessionUser: session.user 
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (order.status === 'PAID') {
      const access = await CourseAccess.findOne({
        userId: order.userId,
        courseId: order.courseId
      })
      return NextResponse.json({
        status: 'PAID',
        access: !!access?.hasAccess,
        order: {
          id: order._id,
          amount: order.amount,
          currency: order.currency,
          courseTitle: order.courseTitle
        }
      })
    }

    // Poll QPay as a fallback in case webhook is delayed
    if (order.qpay?.invoiceId) {
      try {
        const check = await qpayPaymentCheckByInvoice(order.qpay.invoiceId)
        order.qpay.lastCheckRes = check

        const paidAmount = check?.paid_amount || 0

        if (paidAmount >= order.amount && order.status !== 'PAID') {
          // Use atomic update to prevent race conditions with webhook
          const updateResult = await Order.updateOne(
            { 
              _id: order._id, 
              status: { $ne: 'PAID' } // Only update if not already paid
            },
            {
              $set: {
                status: 'PAID',
                transactionId: check.payments?.[0]?.payment_id || order.qpay.invoiceId,
                updatedAt: new Date()
              }
            }
          )

          if (updateResult.modifiedCount > 0) {
            console.log('qpay.status.poll.paid', { orderId: order._id, paidAmount, requiredAmount: order.amount })
            
            try {
              const accessResult = await CourseAccess.grantAccess(
                order.userId,
                order.courseId,
                order._id.toString(),
                'purchase'
              )
              console.log('Course access granted:', { 
                userId: order.userId, 
                courseId: order.courseId, 
                accessResult: accessResult?._id 
              })
            } catch (accessError) {
              console.error('Failed to grant course access:', accessError)
            }
          } else {
            console.log('qpay.status.poll.already_processed', { orderId: order._id })
          }

          return NextResponse.json({
            status: 'PAID',
            access: true,
            order: {
              id: order._id,
              amount: order.amount,
              currency: order.currency,
              courseTitle: order.courseTitle
            }
          })
        }
      } catch (checkError) {
        console.error('QPay status check error:', checkError)
        // Continue with current order status
      }
    }

    return NextResponse.json({
      status: order.status,
      order: {
        id: order._id,
        amount: order.amount,
        currency: order.currency,
        courseTitle: order.courseTitle,
        createdAt: order.createdAt
      }
    })
  } catch (e: any) {
    console.error('QPay status check error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import Order from '@/lib/models/Order'
import CourseAccess from '@/lib/models/CourseAccess'
import { qpayPaymentCheckByInvoice } from '@/lib/qpay/api'

// QPay sends a callback when payment happens. Treat it as a signal only.
// We always verify by calling payment/check.

export async function POST(req: NextRequest) {
  const correlationId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const body = await req.json()
    await dbConnect()

    console.log('qpay.webhook.received', { 
      correlationId, 
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      headers: {
        'user-agent': req.headers.get('user-agent'),
        'content-type': req.headers.get('content-type')
      }
    })

    // QPay usually includes invoice_id or payment info in the callback body.
    // Support both shapes: body.invoice_id OR body.invoice.id
    const invoiceId = body?.invoice_id || body?.invoice?.id || body?.object_id
    if (!invoiceId) {
      console.log('qpay.webhook.ack', { correlationId, decision: 'ignored', reason: 'no_invoice_id' })
      return NextResponse.json({ ok: true, note: 'No invoice id in webhook' })
    }

    // Find the order linked to this invoice
    const order = await Order.findOne({ 'qpay.invoiceId': invoiceId })
    if (!order) {
      console.log('qpay.webhook.ack', { correlationId, decision: 'ignored', reason: 'no_local_order', invoiceId })
      return NextResponse.json({ ok: true, note: 'No local order for invoice' })
    }

    // Check if already processed (idempotency)
    if (order.status === 'PAID') {
      console.log('qpay.webhook.ack', { correlationId, decision: 'ignored', reason: 'already_paid', orderId: order._id })
      return NextResponse.json({ ok: true, note: 'Order already paid' })
    }

    // Record webhook event
    if (!order.qpay.webhookEvents) {
      order.qpay.webhookEvents = []
    }
    order.qpay.webhookEvents.push({
      timestamp: new Date(),
      payload: body,
      processed: false
    })

    // Verify with QPay
    console.log('qpay.webhook.verify', { correlationId, invoiceId })
    const check = await qpayPaymentCheckByInvoice(invoiceId)
    order.qpay.lastCheckRes = check

    // The check response typically lists payments for the invoice.
    const paidAmount = check?.paid_amount || 0

    const fullyPaid = paidAmount >= order.amount

    console.log('qpay.webhook.verify.result', { 
      correlationId, 
      paidAmount, 
      requiredAmount: order.amount, 
      fullyPaid 
    })

    if (fullyPaid && order.status !== 'PAID') {
      // Use atomic update to prevent race conditions
      const updateResult = await Order.updateOne(
        { 
          _id: order._id, 
          status: { $ne: 'PAID' } // Only update if not already paid
        },
        {
          $set: {
            status: 'PAID',
            transactionId: check.payments?.[0]?.payment_id || invoiceId,
            updatedAt: new Date()
          },
          $push: {
            'qpay.webhookEvents': {
              timestamp: new Date(),
              payload: body,
              processed: true
            }
          }
        }
      )

      if (updateResult.modifiedCount === 0) {
        console.log('qpay.webhook.ack', { correlationId, decision: 'ignored', reason: 'already_processed' })
        return NextResponse.json({ ok: true, note: 'Order already processed' })
      }

      console.log('qpay.webhook.ack', { correlationId, decision: 'paid', orderId: order._id })

      // Grant access using the CourseAccess model's static method
      try {
        const accessResult = await CourseAccess.grantAccess(
          order.userId, 
          order.courseId, 
          order._id.toString(), 
          'purchase'
        )
        console.log('Course access granted successfully:', accessResult._id)
      } catch (accessError) {
        console.error('Failed to grant course access:', accessError)
        // Don't fail the webhook if access granting fails
      }

      return NextResponse.json({ ok: true, paid: true })
    } else {
      await order.save()
      console.log('qpay.webhook.ack', { correlationId, decision: 'ignored', reason: 'not_paid', paidAmount, requiredAmount: order.amount })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('qpay.webhook.error', { correlationId, error: e.message })
    return NextResponse.json({ error: e.message || 'Webhook error' }, { status: 200 })
  }
}

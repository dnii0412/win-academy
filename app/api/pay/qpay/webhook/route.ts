import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import Order from '@/lib/models/Order'
import CourseAccess from '@/lib/models/CourseAccess'
import { qpayPaymentCheckByInvoice } from '@/lib/qpay/api'

// QPay sends a callback when payment happens. Treat it as a signal only.
// We always verify by calling payment/check.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await dbConnect()

    console.log('QPay webhook received:', JSON.stringify(body, null, 2))

    // QPay usually includes invoice_id or payment info in the callback body.
    // Support both shapes: body.invoice_id OR body.invoice.id
    const invoiceId = body?.invoice_id || body?.invoice?.id || body?.object_id
    if (!invoiceId) {
      // Accept the webhook to avoid retries, but do nothing.
      return NextResponse.json({ ok: true, note: 'No invoice id in webhook' })
    }

    // Find the order linked to this invoice
    const order = await Order.findOne({ 'qpay.invoiceId': invoiceId })
    if (!order) {
      return NextResponse.json({ ok: true, note: 'No local order for invoice' })
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
    const check = await qpayPaymentCheckByInvoice(invoiceId)
    order.qpay.lastCheckRes = check

    // The check response typically lists payments for the invoice.
    const paidAmount = Array.isArray(check?.payments)
      ? check.payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
      : 0

    const fullyPaid = paidAmount >= order.amount

    if (fullyPaid && order.status !== 'PAID') {
      order.status = 'PAID'
      order.transactionId = check.payments?.[0]?.payment_id || invoiceId
      
      // Mark webhook as processed
      if (order.qpay.webhookEvents.length > 0) {
        order.qpay.webhookEvents[order.qpay.webhookEvents.length - 1].processed = true
      }
      
      await order.save()

      // Grant access using the CourseAccess model's static method
      await CourseAccess.grantAccess(
        order.userId, 
        order.courseId, 
        order._id.toString(), 
        'purchase'
      )

      console.log(`✅ Payment confirmed for order ${order._id}, access granted`)
    } else {
      await order.save()
      console.log(`⏳ Payment not yet complete. Paid: ${paidAmount}, Required: ${order.amount}`)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('QPay webhook error:', e)
    return NextResponse.json({ error: e.message || 'Webhook error' }, { status: 200 })
  }
}

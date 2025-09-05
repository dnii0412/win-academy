import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import Order from '@/lib/models/Order'
import CourseAccess from '@/lib/models/CourseAccess'
import Course from '@/lib/models/Course'
import { qpayCreateInvoice } from '@/lib/qpay/api'
import crypto from 'node:crypto'

function uid() {
  return crypto.randomBytes(8).toString('hex')
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId, priceMnt } = await req.json()
    if (!courseId || !priceMnt) {
      return NextResponse.json({ error: 'Missing fields: courseId, priceMnt' }, { status: 400 })
    }

    await dbConnect()

    // Verify course exists and get details
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Ensure the user doesn't already have access
    const existingAccess = await CourseAccess.findOne({
      userId: session.user.id || session.user.email,
      courseId
    })
    if (existingAccess?.hasAccess) {
      return NextResponse.json({ error: 'Already purchased' }, { status: 409 })
    }

    // Check for existing pending order
    const existingOrder = await Order.findOne({
      userId: session.user.id || session.user.email,
      courseId,
      status: 'PENDING',
      paymentMethod: 'qpay'
    })

    if (existingOrder) {
      // Return existing order data if still valid
      return NextResponse.json({
        orderId: existingOrder._id.toString(),
        invoiceId: existingOrder.qpay?.invoiceId,
        qr_text: existingOrder.qpay?.qrText,
        qr_image: existingOrder.qpay?.qrImage,
        urls: existingOrder.qpay?.urls || [],
      })
    }

    // Idempotent sender invoice no
    const sender_invoice_no = `WA-${courseId.slice(-8)}-${(session.user.id || session.user.email).slice(-8)}-${uid()}`

    // Create local order (PENDING)
    const order = await Order.create({
      userId: session.user.id || session.user.email,
      userName: session.user.name || 'Unknown',
      userEmail: session.user.email,
      courseId,
      courseTitle: course.title,
      courseTitleMn: course.titleMn,
      amount: priceMnt,
      currency: 'MNT',
      status: 'PENDING',
      paymentMethod: 'qpay',
      paymentProvider: 'QPay',
      qpay: { senderInvoiceNo: sender_invoice_no },
    })

    // Create QPay invoice
    const inv = await qpayCreateInvoice({
      sender_invoice_no,
      amount: priceMnt,
      description: `Win Academy — ${course.title}`,
    })

    // Validate QPay response
    if (!inv.invoice_id) {
      throw new Error('QPay did not return invoice ID')
    }

    if (!inv.qr_text && !inv.qr_image) {
      console.warn('QPay invoice created but no QR code returned', { 
        invoiceId: inv.invoice_id, 
        response: inv 
      })
    }

    // Persist invoice linkage
    order.qpay = {
      ...order.qpay,
      invoiceId: inv.invoice_id,
      qrText: inv.qr_text,
      qrImage: inv.qr_image,
      urls: inv.urls || [],
      rawCreateRes: inv,
    }
    await order.save()

    // Return data to client: QR + deeplinks
    return NextResponse.json({
      orderId: order._id.toString(),
      invoiceId: inv.invoice_id,
      qr_text: inv.qr_text,
      qr_image: inv.qr_image, // base64 image
      urls: inv.urls || [], // deeplinks for bank apps
    })
  } catch (e: any) {
    console.error('QPay create invoice error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import Order from '@/lib/models/Order'
import CourseAccess from '@/lib/models/CourseAccess'
import Course from '@/lib/models/Course'
import { qpayCreateInvoice } from '@/lib/qpay/api'
import { createSimpleCourseInvoice, createReceiverData } from '@/lib/qpay/invoice-helpers'
import crypto from 'node:crypto'

function uid() {
  return crypto.randomBytes(8).toString('hex')
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== QPay Create Debug ===')
    console.log('QPAY_MOCK_MODE env:', process.env.QPAY_MOCK_MODE)
    console.log('NODE_ENV:', process.env.NODE_ENV)
    
    // Parse request body
    const body = await req.json()
    const { courseId, priceMnt, markAsPaid, customerData } = body
    
    // Check if this is a manual "mark as paid" request for testing
    if (markAsPaid && process.env.QPAY_MOCK_MODE === 'true') {
      console.log('🔧 Manual payment completion requested for testing')
      
      // Find the most recent pending order for this course
      const session = await auth()
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      await dbConnect()
      const order = await Order.findOne({
        userId: session.user.id || session.user.email,
        courseId,
        status: 'PENDING',
        paymentMethod: 'qpay'
      }).sort({ createdAt: -1 })
      
      if (order) {
        // Mark order as paid
        order.status = 'PAID'
        await order.save()
        
        // Grant course access using the static method
        await CourseAccess.grantAccess(
          session.user.id || session.user.email,
          courseId,
          order._id.toString(),
          'purchase'
        )
        
        return NextResponse.json({ 
          success: true, 
          message: 'Payment marked as completed for testing',
          orderId: order._id.toString()
        })
      }
      
      return NextResponse.json({ error: 'No pending order found' }, { status: 404 })
    }
    
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      console.log('Found existing pending order:', {
        orderId: existingOrder._id.toString(),
        hasInvoiceId: !!existingOrder.qpay?.invoiceId,
        hasQrText: !!existingOrder.qpay?.qrText,
        hasQrImage: !!existingOrder.qpay?.qrImage,
        urlsCount: existingOrder.qpay?.urls?.length || 0,
        qpayData: existingOrder.qpay
      })
      
      // If existing order doesn't have QR code data, generate it now
      if (!existingOrder.qpay?.qrImage && !existingOrder.qpay?.qrText) {
        console.log('Existing order missing QR data, generating now...')
        
        // Create enhanced invoice with customer data and proper lines
        const invoiceData = createSimpleCourseInvoice({
          courseTitle: course.title,
          price: priceMnt,
          senderInvoiceNo: existingOrder.qpay?.senderInvoiceNo || `WA-${courseId.slice(-8)}-${(session.user.id || session.user.email).slice(-8)}-${uid()}`,
          receiverCode: session.user.id || session.user.email,
          receiverData: customerData ? createReceiverData({
            name: customerData.name || session.user.name,
            email: customerData.email || session.user.email,
            phone: customerData.phone
          }) : undefined,
          callbackUrl: `${process.env.NEXTAUTH_URL}/api/payments/callback?payment_id=${existingOrder._id}`,
          note: `Win Academy course payment - ${course.title}`
        })

        const inv = await qpayCreateInvoice(invoiceData)
        
        console.log('Generated QR data for existing order:', { 
          invoiceId: inv.invoice_id, 
          hasQrImage: !!inv.qr_image, 
          hasQrText: !!inv.qr_text,
          urls: inv.urls?.length || 0
        })
        
        // Update the existing order with QR data
        existingOrder.qpay = {
          ...existingOrder.qpay,
          invoiceId: inv.invoice_id,
          qrText: inv.qr_text,
          qrImage: inv.qr_image,
          urls: inv.urls || [],
          rawCreateRes: inv,
        }
        await existingOrder.save()
        
        // Return updated order data
        return NextResponse.json({
          orderId: existingOrder._id.toString(),
          invoiceId: inv.invoice_id,
          qr_text: inv.qr_text,
          qr_image: inv.qr_image,
          urls: inv.urls || [],
        })
      }
      
      // Return existing order data if it already has QR code
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

    // Create enhanced QPay invoice with customer data and proper lines
    console.log('Creating QPay invoice in mock mode:', process.env.QPAY_MOCK_MODE)
    
    const invoiceData = createSimpleCourseInvoice({
      courseTitle: course.title,
      price: priceMnt,
      senderInvoiceNo: sender_invoice_no,
      receiverCode: session.user.id || session.user.email,
      receiverData: customerData ? createReceiverData({
        name: customerData.name || session.user.name,
        email: customerData.email || session.user.email,
        phone: customerData.phone
      }) : undefined,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/payments/callback?payment_id=${order._id}`,
      note: `Win Academy course payment - ${course.title}`
    })
    
    console.log('About to call qpayCreateInvoice with enhanced params:', invoiceData)
    
    const inv = await qpayCreateInvoice(invoiceData)
    
    console.log('QPay invoice response:', { 
      invoiceId: inv.invoice_id, 
      hasQrImage: !!inv.qr_image, 
      hasQrText: !!inv.qr_text,
      urls: inv.urls?.length || 0,
      fullResponse: inv
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
    
    // Handle QPay-specific errors
    if (e.code && e.toUserMessage) {
      return NextResponse.json({ 
        error: e.toUserMessage(),
        code: e.code,
        details: process.env.NODE_ENV === 'development' ? e.detail : undefined
      }, { status: e.status || 500 })
    }
    
    // Handle other errors
    return NextResponse.json({ 
      error: e.message || 'Internal error',
      details: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 })
  }
}

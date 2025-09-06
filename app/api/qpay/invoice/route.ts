import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import Course from '@/lib/models/Course'
import QPayInvoice from '@/lib/models/QPayInvoice'
import { createQPayInvoice, generateSenderInvoiceNo, QPayError } from '@/lib/qpay'

interface CreateInvoiceRequest {
  courseId: string
  amount?: number
  description?: string
}

export async function POST(request: NextRequest) {
  const correlationId = `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    console.log(`=== QPay Invoice Creation Started ===`, { correlationId })
    
    // Get user session first
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({
        error: 'Unauthorized',
        details: 'User session required'
      }, { status: 401 })
    }

    // Parse request body
    const body: CreateInvoiceRequest = await request.json()
    const { courseId, amount, description } = body
    const userId = session.user.id

    // Validate required fields
    if (!courseId) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'courseId is required'
      }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Get course details and validate price
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({
        error: 'Course not found',
        details: `Course with ID ${courseId} does not exist`
      }, { status: 404 })
    }

    // Use course price from database (server-side validation)
    const coursePrice = course.price
    if (!coursePrice || coursePrice <= 0) {
      return NextResponse.json({
        error: 'Invalid course price',
        details: 'Course price must be greater than 0'
      }, { status: 400 })
    }

    // Override client amount with server-side price for security
    const finalAmount = coursePrice
    const finalDescription = description || `Course: ${course.titleMn || course.title}`

    console.log('Course validation:', {
      correlationId,
      courseId,
      courseTitle: course.titleMn || course.title,
      coursePrice,
      finalAmount,
      finalDescription
    })

    // Check for existing active invoice for this user and course
    const existingInvoice = await QPayInvoice.findOne({
      userId,
      courseId,
      status: { $in: ['NEW', 'PAID'] },
      expiresAt: { $gt: new Date() }
    })

    if (existingInvoice) {
      console.log('Found existing active invoice:', {
        correlationId,
        existingInvoiceId: existingInvoice.qpayInvoiceId,
        status: existingInvoice.status
      })

      return NextResponse.json({
        success: true,
        invoice: {
          invoice_id: existingInvoice.qpayInvoiceId,
          qr_text: existingInvoice.qrText,
          qr_image: existingInvoice.qrImage,
          urls: existingInvoice.urls,
          status: existingInvoice.status,
          amount: existingInvoice.amount,
          expires_at: existingInvoice.expiresAt
        },
        message: 'Existing active invoice found'
      })
    }

    // Generate unique sender invoice number
    const senderInvoiceNo = generateSenderInvoiceNo('WIN')
    
    // QPay invoice data
    const invoiceData = {
      sender_invoice_no: senderInvoiceNo,
      sender_branch_code: 'WIN_ACADEMY', // Your branch code
      invoice_receiver_code: userId, // User ID as receiver code
      invoice_description: finalDescription,
      amount: finalAmount,
      callback_url: process.env.QPAY_CALLBACK_URL || `${process.env.NEXTAUTH_URL}/api/qpay/webhook`,
      allow_partial: false,
      allow_exceed: false
    }

    console.log('Creating QPay invoice:', {
      correlationId,
      senderInvoiceNo,
      amount: finalAmount,
      description: finalDescription
    })

    // Create invoice in QPay
    const qpayResponse = await createQPayInvoice(invoiceData)

    console.log('QPay invoice created:', {
      correlationId,
      qpayInvoiceId: qpayResponse.invoice_id,
      qrText: qpayResponse.qr_text ? 'Present' : 'Missing',
      urls: qpayResponse.urls?.length || 0,
      urlsData: qpayResponse.urls
    })

    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Prepare URLs object - QPay returns array of objects with 'link' property
    const urlsObject = {
      deeplink: qpayResponse.urls?.[0]?.link || '',
      qr: qpayResponse.urls?.[0]?.link || '' // Use the same link for both deeplink and qr
    }
    
    console.log('URLs object being saved:', urlsObject)

    // Store invoice in database
    const invoice = new QPayInvoice({
      qpayInvoiceId: qpayResponse.invoice_id,
      senderInvoiceNo,
      senderBranchCode: invoiceData.sender_branch_code,
      invoiceReceiverCode: invoiceData.invoice_receiver_code,
      invoiceDescription: invoiceData.invoice_description,
      amount: finalAmount,
      callbackUrl: invoiceData.callback_url,
      allowPartial: invoiceData.allow_partial,
      allowExceed: invoiceData.allow_exceed,
      qrText: qpayResponse.qr_text,
      qrImage: qpayResponse.qr_image,
      urls: urlsObject,
      status: 'NEW',
      userId,
      courseId,
      expiresAt
    })

    await invoice.save()

    console.log('Invoice saved to database:', {
      correlationId,
      invoiceId: invoice._id,
      qpayInvoiceId: invoice.qpayInvoiceId
    })

    // Return success response
    return NextResponse.json({
      success: true,
      invoice: {
        invoice_id: qpayResponse.invoice_id,
        qr_text: qpayResponse.qr_text,
        qr_image: qpayResponse.qr_image,
        urls: qpayResponse.urls || [],
        status: 'NEW',
        amount: finalAmount,
        expires_at: expiresAt.toISOString()
      }
    })

  } catch (error) {
    console.error('QPay invoice creation failed:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    if (error instanceof QPayError) {
      return NextResponse.json({
        error: 'QPay API error',
        details: error.message,
        qpayError: error.qpayError
      }, { status: error.httpCode || 500 })
    }

    return NextResponse.json({
      error: 'Invoice creation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

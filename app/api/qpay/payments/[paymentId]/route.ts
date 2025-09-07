import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import QPayInvoice from '@/lib/models/QPayInvoice'
import { getQPayInvoice } from '@/lib/qpay'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const correlationId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    console.log(`=== QPay Payment Details Started ===`, { correlationId })
    
    // Get user session
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({
        error: 'Unauthorized',
        details: 'User session required'
      }, { status: 401 })
    }

    const { paymentId } = await params
    const userId = session.user.id

    // Connect to database
    await dbConnect()

    // Find invoice by payment ID
    const invoice = await QPayInvoice.findOne({ 
      paymentId,
      userId 
    }).populate('courseId', 'title titleMn price')

    if (!invoice) {
      return NextResponse.json({
        error: 'Payment not found',
        details: `Payment with ID ${paymentId} does not exist or you don't have permission to view it`
      }, { status: 404 })
    }

    console.log('Found payment invoice:', {
      correlationId,
      paymentId,
      invoiceId: invoice._id,
      qpayInvoiceId: invoice.qpayInvoiceId,
      status: invoice.status
    })

    // Get payment details from QPay
    let qpayPaymentDetails = null
    try {
      // Get invoice details from QPay using the invoice ID
      qpayPaymentDetails = await getQPayInvoice(invoice.qpayInvoiceId)
      console.log('QPay payment details retrieved:', {
        correlationId,
        paymentId,
        hasDetails: !!qpayPaymentDetails
      })
    } catch (qpayError) {
      console.error('Failed to get QPay payment details:', {
        correlationId,
        paymentId,
        error: qpayError instanceof Error ? qpayError.message : 'Unknown error'
      })
      // Continue without QPay details
    }

    // Format response
    const paymentDetails = {
      id: invoice._id,
      qpayInvoiceId: invoice.qpayInvoiceId,
      senderInvoiceNo: invoice.senderInvoiceNo,
      amount: invoice.amount,
      status: invoice.status,
      courseId: invoice.courseId,
      courseTitle: invoice.courseId?.title || invoice.courseId?.titleMn,
      createdAt: invoice.createdAt,
      paidAt: invoice.paidAt,
      expiresAt: invoice.expiresAt,
      paymentId: invoice.paymentId,
      qrText: invoice.qrText,
      urls: invoice.urls,
      qpayDetails: qpayPaymentDetails
    }

    return NextResponse.json({
      success: true,
      payment: paymentDetails
    })

  } catch (error) {
    console.error('Payment details failed:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json({
      error: 'Failed to fetch payment details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

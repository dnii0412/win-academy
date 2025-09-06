import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import QPayInvoice from '@/lib/models/QPayInvoice'
import { checkQPayPayment, QPayError } from '@/lib/qpay'

export async function POST(request: NextRequest) {
  const correlationId = `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    console.log(`=== QPay Payment Check Started ===`, { correlationId })

    // Parse request body
    const body = await request.json()
    const { invoice_id } = body

    if (!invoice_id) {
      return NextResponse.json({
        error: 'Missing invoice_id',
        details: 'invoice_id is required'
      }, { status: 400 })
    }

    // Get user session for authorization
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Unauthorized',
        details: 'User session required'
      }, { status: 401 })
    }

    // Connect to database
    await dbConnect()

    // Find invoice in database
    const invoice = await QPayInvoice.findOne({ qpayInvoiceId: invoice_id })
    if (!invoice) {
      return NextResponse.json({
        error: 'Invoice not found',
        details: `Invoice with ID ${invoice_id} does not exist`
      }, { status: 404 })
    }

    // Check if user owns this invoice
    if (invoice.userId !== session.user.id) {
      return NextResponse.json({
        error: 'Forbidden',
        details: 'You can only check your own invoices'
      }, { status: 403 })
    }

    console.log('Checking payment status:', {
      correlationId,
      invoiceId: invoice._id,
      qpayInvoiceId: invoice.qpayInvoiceId,
      currentStatus: invoice.status,
      userId: invoice.userId
    })

    // Check payment status with QPay API
    try {
      const paymentCheck = await checkQPayPayment(invoice_id)
      console.log('QPay payment check result:', { correlationId, paymentCheck })

      // Determine payment status
      const isPaid = paymentCheck.payment_status === 'PAID' || 
                    paymentCheck.payment_status === 'PAID_PARTIAL' ||
                    (paymentCheck.payments && paymentCheck.payments.length > 0)

      const payments = paymentCheck.payments || []
      const primaryPayment = payments[0]

      // Update local invoice if payment status changed
      if (isPaid && invoice.status === 'NEW') {
        const actualPaymentId = primaryPayment?.payment_id || invoice_id
        await invoice.markAsPaid(actualPaymentId)
        
        console.log('Invoice status updated to PAID:', {
          correlationId,
          paymentId: actualPaymentId
        })
      }

      // Return normalized status
      return NextResponse.json({
        success: true,
        status: {
          invoice_id: invoice_id,
          status: isPaid ? 'PAID' : 'PENDING',
          amount: invoice.amount,
          paid_amount: paymentCheck.paid_amount || primaryPayment?.amount || 0,
          payment_id: primaryPayment?.payment_id || invoice.paymentId,
          paid_at: invoice.paidAt,
          expires_at: invoice.expiresAt,
          qr_text: invoice.qrText,
          qr_image: invoice.qrImage,
          urls: invoice.urls
        }
      })

    } catch (qpayError) {
      console.error('QPay API error during payment check:', {
        correlationId,
        error: qpayError instanceof Error ? qpayError.message : 'Unknown error'
      })

      // Return local status if QPay API fails
      return NextResponse.json({
        success: true,
        status: {
          invoice_id: invoice_id,
          status: invoice.status,
          amount: invoice.amount,
          paid_amount: invoice.status === 'PAID' ? invoice.amount : 0,
          payment_id: invoice.paymentId,
          paid_at: invoice.paidAt,
          expires_at: invoice.expiresAt,
          qr_text: invoice.qrText,
          qr_image: invoice.qrImage,
          urls: invoice.urls,
          note: 'Status from local database (QPay API unavailable)'
        }
      })
    }

  } catch (error) {
    console.error('Payment check failed:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json({
      error: 'Payment check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for simple status check
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const invoice_id = searchParams.get('invoice_id')

  if (!invoice_id) {
    return NextResponse.json({
      error: 'Missing invoice_id parameter'
    }, { status: 400 })
  }

  // Use POST logic with invoice_id from query params
  const mockRequest = new NextRequest('http://localhost/api/qpay/check', {
    method: 'POST',
    body: JSON.stringify({ invoice_id })
  })

  return POST(mockRequest)
}

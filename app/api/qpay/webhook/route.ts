import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import QPayInvoice from '@/lib/models/QPayInvoice'
import CourseAccess from '@/lib/models/CourseAccess'
import Course from '@/lib/models/Course'
import { checkQPayPayment, QPayError } from '@/lib/qpay'

interface QPayWebhookPayload {
  invoice_id: string
  payment_id?: string
  amount?: number
  status?: string
  [key: string]: any
}

export async function POST(request: NextRequest) {
  const correlationId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {

    // Parse webhook payload
    const payload: QPayWebhookPayload = await request.json()

    const { invoice_id, payment_id } = payload

    if (!invoice_id) {
      return NextResponse.json({ 
        success: true, 
        message: 'No invoice_id in webhook payload' 
      })
    }

    // Connect to database
    await dbConnect()

    // Find invoice in database
    const invoice = await QPayInvoice.findOne({ qpayInvoiceId: invoice_id })
    if (!invoice) {
      return NextResponse.json({ 
        success: true, 
        message: 'Invoice not found in database' 
      })
    }


    // Check if already processed
    if (invoice.status === 'PAID') {
      return NextResponse.json({ 
        success: true, 
        message: 'Invoice already processed' 
      })
    }

    // Verify payment with QPay API
    
    try {
      const paymentCheck = await checkQPayPayment(invoice_id)

      // Check if payment is actually paid
      const isPaid = paymentCheck.payment_status === 'PAID' || 
                    paymentCheck.payment_status === 'PAID_PARTIAL' ||
                    (paymentCheck.payments && paymentCheck.payments.length > 0)

      if (!isPaid) {
        return NextResponse.json({ 
          success: true, 
          message: 'Payment not confirmed' 
        })
      }

      // Get payment details
      const payments = paymentCheck.payments || []
      const primaryPayment = payments[0]
      const actualPaymentId = primaryPayment?.payment_id || payment_id || invoice_id


      // Check for duplicate payment processing
      if (actualPaymentId && invoice.paymentId === actualPaymentId) {
        return NextResponse.json({ 
          success: true, 
          message: 'Payment already processed' 
        })
      }

      // Mark invoice as paid
      await invoice.markAsPaid(actualPaymentId)


      // Grant course access to user
      try {
        // First verify the course still exists
        const course = await Course.findById(invoice.courseId)
        if (!course) {
          // Don't fail the webhook, but log the issue
          return NextResponse.json({ 
            success: true, 
            message: 'Payment processed but course access not granted - course not found',
            invoice_id: invoice_id,
            payment_id: actualPaymentId
          })
        }

        await CourseAccess.grantAccess(
          invoice.userId,
          invoice.courseId,
          invoice._id.toString(),
          'qpay_purchase'
        )

          correlationId,
          userId: invoice.userId,
          courseId: invoice.courseId,
          accessType: 'qpay_purchase'
        })

      } catch (accessError) {
          correlationId,
          error: accessError instanceof Error ? accessError.message : 'Unknown error',
          userId: invoice.userId,
          courseId: invoice.courseId
        })
        
        // Don't fail the webhook if access granting fails
        // The payment is still valid, access can be granted manually
      }

        correlationId,
        invoiceId: invoice._id,
        paymentId: actualPaymentId,
        userId: invoice.userId,
        courseId: invoice.courseId
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Payment processed successfully',
        invoice_id: invoice_id,
        payment_id: actualPaymentId
      })

    } catch (qpayError) {
        correlationId,
        error: qpayError instanceof Error ? qpayError.message : 'Unknown error',
        invoice_id
      })

      // Don't fail the webhook for QPay API errors
      // The webhook might be retried later
      return NextResponse.json({ 
        success: true, 
        message: 'Payment verification failed, will retry later' 
      })
    }

  } catch (error) {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    // Return 200 to prevent webhook retries for application errors
    return NextResponse.json({ 
      success: false, 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 })
  }
}

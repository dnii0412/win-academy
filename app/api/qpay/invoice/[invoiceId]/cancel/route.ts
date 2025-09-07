import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import QPayInvoice from '@/lib/models/QPayInvoice'
import { cancelQPayInvoice } from '@/lib/qpay'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const correlationId = `cancel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    console.log(`=== QPay Invoice Cancellation Started ===`, { correlationId })
    
    // Get user session
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({
        error: 'Unauthorized',
        details: 'User session required'
      }, { status: 401 })
    }

    const { invoiceId } = await params
    const userId = session.user.id

    // Connect to database
    await dbConnect()

    // Find invoice in database
    const invoice = await QPayInvoice.findOne({ 
      qpayInvoiceId: invoiceId,
      userId 
    })
    
    if (!invoice) {
      return NextResponse.json({
        error: 'Invoice not found',
        details: `Invoice with ID ${invoiceId} does not exist or you don't have permission to cancel it`
      }, { status: 404 })
    }

    // Check if invoice can be cancelled
    if (invoice.status === 'CANCELLED') {
      return NextResponse.json({
        success: true,
        message: 'Invoice already cancelled',
        invoice: {
          invoice_id: invoice.qpayInvoiceId,
          status: invoice.status
        }
      })
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({
        error: 'Cannot cancel paid invoice',
        details: 'This invoice has already been paid and cannot be cancelled'
      }, { status: 400 })
    }

    console.log('Cancelling invoice:', {
      correlationId,
      invoiceId: invoice._id,
      qpayInvoiceId: invoice.qpayInvoiceId,
      currentStatus: invoice.status,
      userId: invoice.userId
    })

    // Cancel invoice in QPay
    try {
      await cancelQPayInvoice(invoiceId)
      console.log('QPay invoice cancelled successfully:', { correlationId, invoiceId })
    } catch (qpayError) {
      console.error('QPay cancellation failed, but cancelling locally:', {
        correlationId,
        invoiceId,
        error: qpayError instanceof Error ? qpayError.message : 'Unknown error'
      })
      // Continue with local cancellation even if QPay fails
    }

    // Cancel invoice locally
    await invoice.cancel()

    console.log('Invoice cancelled successfully:', {
      correlationId,
      invoiceId: invoice._id,
      qpayInvoiceId: invoice.qpayInvoiceId
    })

    return NextResponse.json({
      success: true,
      message: 'Invoice cancelled successfully',
      invoice: {
        invoice_id: invoice.qpayInvoiceId,
        status: invoice.status,
        cancelled_at: new Date()
      }
    })

  } catch (error) {
    console.error('Invoice cancellation failed:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json({
      error: 'Invoice cancellation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

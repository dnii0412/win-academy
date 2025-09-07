#!/usr/bin/env tsx

/**
 * Manual payment processing script
 * Usage: npx tsx scripts/process-payment.ts <invoiceId>
 */

import dbConnect from '../lib/mongoose'
import QPayInvoice from '../lib/models/QPayInvoice'
import { checkQPayPayment } from '../lib/qpay'

async function processPayment(invoiceId: string) {
  try {
    console.log('=== Manual Payment Processing ===')
    console.log('Invoice ID:', invoiceId)
    console.log('')

    await dbConnect()

    // Find the invoice
    const invoice = await QPayInvoice.findOne({ qpayInvoiceId: invoiceId })
    if (!invoice) {
      console.error('Invoice not found:', invoiceId)
      return
    }

    console.log('Found invoice:', {
      id: invoice._id,
      qpayInvoiceId: invoice.qpayInvoiceId,
      status: invoice.status,
      amount: invoice.amount,
      userId: invoice.userId,
      courseId: invoice.courseId
    })

    // Check payment status with QPay
    console.log('Checking payment status with QPay...')
    const paymentCheck = await checkQPayPayment(invoiceId)
    console.log('QPay payment check result:', paymentCheck)

    // Determine if paid
    const isPaid = paymentCheck.payment_status === 'PAID' || 
                  paymentCheck.payment_status === 'PAID_PARTIAL' ||
                  (paymentCheck.payments && paymentCheck.payments.length > 0) ||
                  (paymentCheck.paid_amount && paymentCheck.paid_amount > 0) ||
                  (paymentCheck.count && paymentCheck.count > 0)

    console.log('Payment status:', {
      isPaid,
      paymentStatus: paymentCheck.payment_status,
      paidAmount: paymentCheck.paid_amount,
      count: paymentCheck.count,
      paymentsLength: paymentCheck.payments?.length || 0
    })

    if (isPaid && invoice.status === 'NEW') {
      console.log('Processing payment...')
      const payments = paymentCheck.payments || []
      const primaryPayment = payments[0]
      const actualPaymentId = primaryPayment?.payment_id || invoiceId

      await invoice.markAsPaid(actualPaymentId)
      console.log('✅ Payment processed successfully!')
    } else if (invoice.status === 'PAID') {
      console.log('✅ Invoice already marked as paid')
    } else {
      console.log('❌ Payment not detected or invoice not eligible')
    }

  } catch (error) {
    console.error('Error processing payment:', error)
  }
}

// Get command line arguments
const args = process.argv.slice(2)
if (args.length < 1) {
  console.log('Usage: npx tsx scripts/process-payment.ts <invoiceId>')
  process.exit(1)
}

const [invoiceId] = args
processPayment(invoiceId).then(() => process.exit(0))

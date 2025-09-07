#!/usr/bin/env tsx

/**
 * Debug script to check payment flow and course access
 * Usage: npx tsx scripts/debug-payment-flow.ts <userId> <courseId>
 */

import dbConnect from '../lib/mongoose'
import QPayInvoice from '../lib/models/QPayInvoice'
import CourseAccess from '../lib/models/CourseAccess'
import Order from '../lib/models/Order'

async function debugPaymentFlow(userId: string, courseId: string) {
  try {
    console.log('=== Payment Flow Debug ===')
    console.log('UserId:', userId)
    console.log('CourseId:', courseId)
    console.log('')

    await dbConnect()

    // Check QPay invoices
    console.log('1. QPay Invoices:')
    const invoices = await QPayInvoice.find({ userId, courseId }).sort({ createdAt: -1 })
    invoices.forEach((invoice, index) => {
      console.log(`  ${index + 1}. Invoice ${invoice.qpayInvoiceId}:`)
      console.log(`     Status: ${invoice.status}`)
      console.log(`     Amount: ${invoice.amount}`)
      console.log(`     Payment ID: ${invoice.paymentId || 'N/A'}`)
      console.log(`     Paid At: ${invoice.paidAt || 'N/A'}`)
      console.log(`     Created: ${invoice.createdAt}`)
      console.log(`     Expires: ${invoice.expiresAt}`)
      console.log(`     QR Text: ${invoice.qrText ? 'Present' : 'Missing'}`)
      console.log('')
    })

    // Check Course Access
    console.log('2. Course Access Records:')
    const accessRecords = await CourseAccess.find({ userId, courseId })
    accessRecords.forEach((access, index) => {
      console.log(`  ${index + 1}. Access Record:`)
      console.log(`     Has Access: ${access.hasAccess}`)
      console.log(`     Access Type: ${access.accessType}`)
      console.log(`     Granted At: ${access.grantedAt}`)
      console.log(`     Order ID: ${access.orderId || 'N/A'}`)
      console.log('')
    })

    // Check Course Enrollments
    console.log('3. Course Enrollments:')
    const enrollments = await CourseAccess.find({ userId, courseId })
    enrollments.forEach((enrollment, index) => {
      console.log(`  ${index + 1}. Enrollment:`)
      console.log(`     Status: ${enrollment.status}`)
      console.log(`     Enrolled At: ${enrollment.enrolledAt}`)
      console.log(`     Access Granted By: ${enrollment.accessGrantedBy}`)
      console.log('')
    })

    // Check Orders
    console.log('4. Orders:')
    const orders = await Order.find({ userId, courseId })
    orders.forEach((order, index) => {
      console.log(`  ${index + 1}. Order:`)
      console.log(`     Status: ${order.status}`)
      console.log(`     Amount: ${order.amount}`)
      console.log(`     Payment Method: ${order.paymentMethod}`)
      console.log(`     QPay Invoice ID: ${order.qpay?.invoiceId || 'N/A'}`)
      console.log('')
    })

    // Summary
    console.log('=== Summary ===')
    const hasCourseAccess = accessRecords.some(ar => ar.hasAccess)
    const hasEnrollment = enrollments.some(e => e.status === 'completed')
    const hasPaidInvoice = invoices.some(i => i.status === 'PAID')
    const hasPaidOrder = orders.some(o => o.status === 'PAID')

    console.log(`Has Course Access: ${hasCourseAccess}`)
    console.log(`Has Enrollment: ${hasEnrollment}`)
    console.log(`Has Paid Invoice: ${hasPaidInvoice}`)
    console.log(`Has Paid Order: ${hasPaidOrder}`)
    console.log(`Overall Access: ${hasCourseAccess || hasEnrollment}`)

  } catch (error) {
    console.error('Debug error:', error)
  }
}

// Get command line arguments
const args = process.argv.slice(2)
if (args.length < 2) {
  console.log('Usage: npx tsx scripts/debug-payment-flow.ts <userId> <courseId>')
  process.exit(1)
}

const [userId, courseId] = args
debugPaymentFlow(userId, courseId).then(() => process.exit(0))

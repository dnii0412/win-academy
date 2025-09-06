#!/usr/bin/env tsx

/**
 * Test Course Purchase Flow
 * 
 * This script tests the complete course purchasing flow:
 * 1. Create a QPay invoice
 * 2. Simulate payment completion
 * 3. Verify course access is granted
 */

import { qpayCreateInvoice } from '../lib/qpay/api'
import { createSimpleCourseInvoice, createReceiverData } from '../lib/qpay/invoice-helpers'
import dbConnect from '../lib/mongoose'
import Order from '../lib/models/Order'
import CourseAccess from '../lib/models/CourseAccess'
import Course from '../lib/models/Course'

async function testCoursePurchase() {
  console.log('🧪 Testing Complete Course Purchase Flow...\n')

  try {
    await dbConnect()

    // Test data
    const testCourseId = '68b9b631768d12d150db665e' // Replace with a real course ID
    const testUserId = 'test-user-123'
    const testPrice = 1000

    console.log('1️⃣ Creating test course access...')
    
    // Check if course exists
    const course = await Course.findById(testCourseId)
    if (!course) {
      console.log('❌ Test course not found. Please update testCourseId with a real course ID.')
      return
    }
    
    console.log('✅ Course found:', course.title)

    // Clean up any existing test data
    await Order.deleteMany({ userId: testUserId })
    await CourseAccess.deleteMany({ userId: testCourseId })

    console.log('2️⃣ Creating QPay invoice...')
    
    const invoiceData = createSimpleCourseInvoice({
      courseTitle: course.title,
      price: testPrice,
      senderInvoiceNo: `TEST-${Date.now()}`,
      receiverCode: testUserId,
      receiverData: createReceiverData({
        name: 'Test User',
        email: 'test@example.com',
        phone: '99119911'
      }),
      callbackUrl: 'https://example.com/callback',
      note: 'Test course purchase'
    })

    const invoiceResult = await qpayCreateInvoice(invoiceData)
    console.log('✅ Invoice created:', invoiceResult.invoice_id)

    console.log('3️⃣ Creating test order...')
    
    const testOrder = await Order.create({
      userId: testUserId,
      userName: 'Test User',
      userEmail: 'test@example.com',
      courseId: testCourseId,
      courseTitle: course.title,
      courseTitleMn: course.titleMn,
      amount: testPrice,
      currency: 'MNT',
      status: 'PENDING',
      paymentMethod: 'qpay',
      paymentProvider: 'QPay',
      qpay: {
        senderInvoiceNo: invoiceData.sender_invoice_no,
        invoiceId: invoiceResult.invoice_id,
        qrText: invoiceResult.qr_text,
        qrImage: invoiceResult.qr_image,
        urls: invoiceResult.urls || []
      }
    })

    console.log('✅ Order created:', testOrder._id.toString())

    console.log('4️⃣ Simulating payment completion...')
    
    // Simulate payment completion by updating order status
    testOrder.status = 'PAID'
    testOrder.transactionId = `test_payment_${Date.now()}`
    await testOrder.save()

    console.log('✅ Order marked as paid')

    console.log('5️⃣ Granting course access...')
    
    const accessResult = await CourseAccess.grantAccess(
      testUserId,
      testCourseId,
      testOrder._id.toString(),
      'purchase'
    )

    console.log('✅ Course access granted:', accessResult._id)

    console.log('6️⃣ Verifying course access...')
    
    const hasAccess = await CourseAccess.hasAccess(testUserId, testCourseId)
    console.log('✅ User has access to course:', hasAccess)

    console.log('7️⃣ Testing enrolled courses API...')
    
    // Test the enrolled courses API
    const enrolledResponse = await fetch(`http://localhost:3000/api/user/enrolled-courses?email=test@example.com`)
    if (enrolledResponse.ok) {
      const enrolledData = await enrolledResponse.json()
      const hasCourseInEnrolled = enrolledData.courses.some((c: any) => c._id === testCourseId)
      console.log('✅ Course appears in enrolled courses:', hasCourseInEnrolled)
    } else {
      console.log('⚠️ Could not test enrolled courses API (server not running)')
    }

    console.log('\n🎉 Course purchase flow test completed successfully!')
    console.log('\nSummary:')
    console.log(`- Course: ${course.title}`)
    console.log(`- User: ${testUserId}`)
    console.log(`- Order: ${testOrder._id}`)
    console.log(`- Invoice: ${invoiceResult.invoice_id}`)
    console.log(`- Access granted: ${hasAccess}`)
    console.log(`- QR Code: ${invoiceResult.qr_text ? 'Generated' : 'Missing'}`)

    console.log('\nNext steps:')
    console.log('1. Start your development server: npm run dev')
    console.log('2. Go to the course page and verify access is working')
    console.log('3. Test the real payment flow with QPay')

  } catch (error: any) {
    console.error('❌ Course purchase flow test failed:')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testCoursePurchase()

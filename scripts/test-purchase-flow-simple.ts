#!/usr/bin/env tsx

/**
 * Simple Course Purchase Flow Test
 * 
 * This script tests the course purchasing flow without requiring database connection.
 * It focuses on testing the API endpoints and QPay integration.
 */

import { qpayCreateInvoice } from '../lib/qpay/api'
import { createSimpleCourseInvoice, createReceiverData } from '../lib/qpay/invoice-helpers'

async function testPurchaseFlow() {
  console.log('🧪 Testing Course Purchase Flow (Simple)...\n')

  try {
    console.log('1️⃣ Testing QPay invoice creation...')
    
    const invoiceData = createSimpleCourseInvoice({
      courseTitle: 'Test Course',
      price: 1000,
      senderInvoiceNo: `TEST-${Date.now()}`,
      receiverCode: 'test-user-123',
      receiverData: createReceiverData({
        name: 'Test User',
        email: 'test@example.com',
        phone: '99119911'
      }),
      callbackUrl: 'https://example.com/callback',
      note: 'Test course purchase'
    })

    console.log('✅ Invoice data created:', {
      senderInvoiceNo: invoiceData.sender_invoice_no,
      amount: invoiceData.amount,
      description: invoiceData.description,
      receiverCode: invoiceData.invoice_receiver_code
    })

    console.log('2️⃣ Testing QPay API call...')
    
    const invoiceResult = await qpayCreateInvoice(invoiceData)
    console.log('✅ QPay invoice created successfully!')
    console.log('   Invoice ID:', invoiceResult.invoice_id)
    console.log('   QR Text:', invoiceResult.qr_text ? 'Present' : 'Missing')
    console.log('   QR Image:', invoiceResult.qr_image ? 'Present' : 'Missing')
    console.log('   URLs:', invoiceResult.urls?.length || 0, 'deeplinks')

    console.log('3️⃣ Testing API endpoints...')
    
    // Test the create endpoint
    const createResponse = await fetch('https://0ccf2f2a7785.ngrok-free.app/api/pay/qpay/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: '68b9b631768d12d150db665e',
        priceMnt: 1000,
        customerData: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '99119911'
        }
      })
    })

    if (createResponse.ok) {
      const createData = await createResponse.json()
      console.log('✅ Create endpoint working:', createData.orderId ? 'Order created' : 'Order found')
    } else {
      console.log('⚠️ Create endpoint not available (server not running)')
    }

    console.log('\n🎉 Course purchase flow test completed!')
    console.log('\nNext steps:')
    console.log('1. Start your development server: npm run dev')
    console.log('2. Go to a course page and test the full flow')
    console.log('3. Use the "Mark as Paid" button for testing')

  } catch (error: any) {
    console.error('❌ Test failed:')
    console.error('Error:', error.message)
    
    if (error.message.includes('MONGODB_URI')) {
      console.log('\n💡 Tip: Make sure your .env.local file has MONGODB_URI defined')
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Tip: Start your development server with: npm run dev')
    }
  }
}

// Run the test
testPurchaseFlow()

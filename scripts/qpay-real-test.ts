#!/usr/bin/env tsx

/**
 * QPay Real Integration Test Script
 * 
 * This script tests the real QPay integration with your actual credentials.
 * Run this after setting up your .env.local file with real QPay credentials.
 */

import { qpayCreateInvoice, qpayPaymentCheckByInvoice } from '../lib/qpay/api'
import { createSimpleCourseInvoice, createReceiverData } from '../lib/qpay/invoice-helpers'

async function testQPayIntegration() {
  console.log('🧪 Testing QPay Real Integration...\n')

  try {
    // Test 1: Create a test invoice
    console.log('1️⃣ Creating test invoice...')
    
    const testInvoice = createSimpleCourseInvoice({
      courseTitle: 'Test Course - QPay Integration',
      price: 1000, // 1000 MNT test amount
      senderInvoiceNo: `TEST-${Date.now()}`,
      receiverCode: 'test-user-123',
      receiverData: createReceiverData({
        name: 'Test User',
        email: 'test@example.com',
        phone: '99119911'
      }),
      callbackUrl: 'https://example.com/callback',
      note: 'QPay integration test'
    })

    console.log('Invoice data:', JSON.stringify(testInvoice, null, 2))

    const invoiceResult = await qpayCreateInvoice(testInvoice)
    
    console.log('✅ Invoice created successfully!')
    console.log('Invoice ID:', invoiceResult.invoice_id)
    console.log('QR Text length:', invoiceResult.qr_text?.length || 0)
    console.log('QR Image present:', !!invoiceResult.qr_image)
    console.log('Bank URLs count:', invoiceResult.urls?.length || 0)
    console.log('')

    // Test 2: Check payment status (should be empty for new invoice)
    console.log('2️⃣ Checking payment status...')
    
    const paymentCheck = await qpayPaymentCheckByInvoice(invoiceResult.invoice_id)
    
    console.log('✅ Payment check completed!')
    console.log('Payment count:', paymentCheck.count)
    console.log('Paid amount:', paymentCheck.paid_amount)
    console.log('Payment rows:', paymentCheck.rows.length)
    console.log('')

    // Test 3: Display QR code info
    console.log('3️⃣ QR Code Information:')
    console.log('QR Text (first 100 chars):', invoiceResult.qr_text?.substring(0, 100) + '...')
    console.log('QR Image type:', invoiceResult.qr_image ? 'Base64 image provided' : 'No image, use QR text')
    console.log('')

    // Test 4: Display bank URLs
    console.log('4️⃣ Available Bank Apps:')
    invoiceResult.urls?.forEach((url, index) => {
      console.log(`${index + 1}. ${url.name} (${url.description})`)
      console.log(`   Link: ${url.link?.substring(0, 50)}...`)
    })
    console.log('')

    console.log('🎉 QPay integration test completed successfully!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Copy the QR text and test with a real bank app')
    console.log('2. Or click one of the bank app links above')
    console.log('3. Complete a test payment to verify the full flow')
    console.log('4. Check your QPay merchant dashboard for the transaction')

  } catch (error: any) {
    console.error('❌ QPay integration test failed:')
    console.error('Error:', error.message)
    console.error('')
    
    if (error.message.includes('Missing QPay env')) {
      console.log('💡 Solution: Set up your .env.local file with QPay credentials')
      console.log('See QPAY_REAL_SETUP.md for instructions')
    } else if (error.message.includes('AUTH_FAILED')) {
      console.log('💡 Solution: Check your QPay username and password')
    } else if (error.message.includes('INVOICE_CREATE_FAILED')) {
      console.log('💡 Solution: Check your QPay invoice code and permissions')
    } else {
      console.log('💡 Check the error details above and QPay documentation')
    }
  }
}

// Run the test
testQPayIntegration()

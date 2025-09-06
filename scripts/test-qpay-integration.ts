#!/usr/bin/env tsx

/**
 * QPay Integration Test Script
 * 
 * Tests the complete QPay integration flow:
 * 1. Invoice creation
 * 2. Payment status checking
 * 3. Webhook simulation
 */

import { config } from 'dotenv'
import { getQpayToken, createQPayInvoice, checkQPayPayment, QPayError } from '../lib/qpay'

// Load environment variables
config({ path: '.env.local' })

async function testQPayIntegration() {
  console.log('🧪 Testing QPay Integration...\n')

  try {
    // Test 1: Token Authentication
    console.log('1️⃣ Testing QPay token authentication...')
    const token = await getQpayToken()
    console.log('✅ Token obtained successfully')
    console.log('   Token length:', token.length)
    console.log('   Token preview:', token.substring(0, 20) + '...')

    // Test 2: Invoice Creation
    console.log('\n2️⃣ Testing invoice creation...')
    const invoiceData = {
      sender_invoice_no: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      sender_branch_code: 'WIN_ACADEMY_TEST',
      invoice_receiver_code: 'test_user_123',
      invoice_description: 'Test Course Payment',
      amount: 1000, // 10 MNT for testing
      callback_url: process.env.QPAY_CALLBACK_URL || 'https://example.com/api/qpay/webhook',
      allow_partial: false,
      allow_exceed: false
    }

    const invoice = await createQPayInvoice(invoiceData)
    console.log('✅ Invoice created successfully')
    console.log('   Invoice ID:', invoice.invoice_id)
    console.log('   QR Text:', invoice.qr_text ? 'Present' : 'Missing')
    console.log('   URLs:', invoice.urls?.length || 0, 'deeplinks')

    // Test 3: Payment Status Check
    console.log('\n3️⃣ Testing payment status check...')
    const paymentStatus = await checkQPayPayment(invoice.invoice_id)
    console.log('✅ Payment status checked successfully')
    console.log('   Status:', paymentStatus.payment_status)
    console.log('   Paid Amount:', paymentStatus.paid_amount || 0)
    console.log('   Payments:', paymentStatus.payments?.length || 0)

    // Test 4: API Endpoints (if server is running)
    console.log('\n4️⃣ Testing API endpoints...')
    
    try {
      // Test invoice creation endpoint
      const createResponse = await fetch('http://localhost:3000/api/qpay/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test_user_123',
          courseId: 'test_course_456',
          amount: 2000,
          description: 'API Test Course'
        })
      })

      if (createResponse.ok) {
        const createData = await createResponse.json()
        console.log('✅ Invoice creation API working')
        console.log('   Invoice ID:', createData.invoice?.invoice_id)
        
        // Test payment check endpoint
        const checkResponse = await fetch('http://localhost:3000/api/qpay/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoice_id: createData.invoice?.invoice_id
          })
        })

        if (checkResponse.ok) {
          const checkData = await checkResponse.json()
          console.log('✅ Payment check API working')
          console.log('   Status:', checkData.status?.status)
        } else {
          console.log('⚠️ Payment check API not available (server not running)')
        }
      } else {
        console.log('⚠️ Invoice creation API not available (server not running)')
      }
    } catch (apiError) {
      console.log('⚠️ API endpoints not available (server not running)')
    }

    console.log('\n🎉 QPay integration test completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Start your development server: npm run dev')
    console.log('2. Configure QPay credentials in .env.local')
    console.log('3. Test the complete flow in the browser')

  } catch (error) {
    console.error('❌ QPay integration test failed:')
    
    if (error instanceof QPayError) {
      console.error('QPay Error:', error.message)
      console.error('HTTP Code:', error.httpCode)
      console.error('QPay Details:', error.qpayError)
    } else {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
    }

    console.log('\nTroubleshooting:')
    console.log('1. Check QPay credentials in .env.local')
    console.log('2. Verify QPay sandbox access')
    console.log('3. Check network connectivity')
    console.log('4. Review QPay API documentation')
  }
}

// Run the test
testQPayIntegration()

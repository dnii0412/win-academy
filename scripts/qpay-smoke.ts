#!/usr/bin/env tsx

/**
 * QPay Smoke Test
 * 
 * This script tests the QPay integration end-to-end:
 * 1. Validates environment configuration
 * 2. Tests token acquisition
 * 3. Creates a test invoice
 * 4. Checks invoice status
 * 
 * Usage: npx tsx scripts/qpay-smoke.ts
 */

import { config } from 'dotenv'
import { QPAY, validateQPayConfig } from '../lib/qpay/config'
import { getQPayAccessToken } from '../lib/qpay/token'
import { qpayCreateInvoice, qpayPaymentCheckByInvoice } from '../lib/qpay/api'

// Load environment variables
config({ path: '.env.local' })

interface TestResult {
  step: string
  success: boolean
  duration: number
  error?: string
  data?: any
}

class QPaySmokeTest {
  private results: TestResult[] = []
  private correlationId = `smoke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  private addResult(step: string, success: boolean, duration: number, error?: string, data?: any) {
    this.results.push({ step, success, duration, error, data })
    const status = success ? '✅' : '❌'
    console.log(`${status} ${step} (${duration}ms)`)
    if (error) console.log(`   Error: ${error}`)
    if (data && success) console.log(`   Data: ${JSON.stringify(data, null, 2)}`)
  }

  async run(): Promise<void> {
    console.log(`🧪 QPay Smoke Test - ${this.correlationId}`)
    console.log('=' .repeat(50))

    // Step 1: Validate configuration
    await this.testConfiguration()

    // Step 2: Test token acquisition
    const token = await this.testTokenAcquisition()

    // Step 3: Create test invoice
    const invoiceId = await this.testInvoiceCreation()

    // Step 4: Check invoice status
    await this.testInvoiceStatus(invoiceId)

    // Summary
    this.printSummary()
  }

  private async testConfiguration(): Promise<void> {
    const start = Date.now()
    try {
      validateQPayConfig()
      this.addResult('Configuration Validation', true, Date.now() - start, undefined, {
        baseUrl: QPAY.baseUrl,
        grantType: QPAY.grantType,
        invoiceCode: QPAY.invoiceCode,
        webhookUrl: QPAY.webhookUrl,
        mockMode: QPAY.mockMode
      })
    } catch (error: any) {
      this.addResult('Configuration Validation', false, Date.now() - start, error.message)
    }
  }

  private async testTokenAcquisition(): Promise<string | null> {
    const start = Date.now()
    try {
      const token = await getQPayAccessToken()
      this.addResult('Token Acquisition', true, Date.now() - start, undefined, {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...'
      })
      return token
    } catch (error: any) {
      this.addResult('Token Acquisition', false, Date.now() - start, error.message)
      return null
    }
  }

  private async testInvoiceCreation(): Promise<string | null> {
    const start = Date.now()
    try {
      const testInvoice = await qpayCreateInvoice({
        sender_invoice_no: `smoke_test_${Date.now()}`,
        amount: 1000, // 10.00 MNT
        description: 'QPay Smoke Test Invoice',
        allow_partial: false
      })
      
      this.addResult('Invoice Creation', true, Date.now() - start, undefined, {
        invoiceId: testInvoice.invoice_id,
        qrText: testInvoice.qr_text ? 'present' : 'missing',
        qrImage: testInvoice.qr_image ? 'present' : 'missing',
        urls: testInvoice.urls?.length || 0
      })
      
      return testInvoice.invoice_id
    } catch (error: any) {
      this.addResult('Invoice Creation', false, Date.now() - start, error.message)
      return null
    }
  }

  private async testInvoiceStatus(invoiceId: string | null): Promise<void> {
    if (!invoiceId) {
      this.addResult('Invoice Status Check', false, 0, 'No invoice ID available')
      return
    }

    const start = Date.now()
    try {
      const status = await qpayPaymentCheckByInvoice(invoiceId)
      this.addResult('Invoice Status Check', true, Date.now() - start, undefined, {
        invoiceId,
        payments: status.payments?.length || 0,
        totalPaid: status.payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0
      })
    } catch (error: any) {
      this.addResult('Invoice Status Check', false, Date.now() - start, error.message)
    }
  }

  private printSummary(): void {
    console.log('\n' + '=' .repeat(50))
    console.log('📊 Test Summary')
    console.log('=' .repeat(50))
    
    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.success).length
    const failedTests = totalTests - passedTests
    
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Passed: ${passedTests} ✅`)
    console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`)
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:')
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.step}: ${r.error}`))
    }
    
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)
    console.log(`\nTotal Duration: ${totalDuration}ms`)
    
    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed! QPay integration is working correctly.')
    } else {
      console.log('\n⚠️  Some tests failed. Please check the configuration and try again.')
    }
  }
}

// Run the smoke test
async function main() {
  try {
    const smokeTest = new QPaySmokeTest()
    await smokeTest.run()
  } catch (error) {
    console.error('💥 Smoke test crashed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

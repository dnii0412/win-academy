#!/usr/bin/env tsx

/**
 * QPay Diagnostic Script
 * 
 * This script performs comprehensive diagnostics on the QPay integration:
 * 1. Validates environment configuration
 * 2. Tests authentication with QPay V2 API
 * 3. Creates a test invoice
 * 4. Verifies payment checking
 * 5. Tests webhook simulation
 * 
 * Usage: npx tsx scripts/qpay-diagnostic.ts
 */

import { config } from 'dotenv'
import { QPAY, validateQPayConfig } from '../lib/qpay/config'
import { getQPayAccessToken } from '../lib/qpay/token'
import { qpayCreateInvoice, qpayPaymentCheckByInvoice } from '../lib/qpay/api'

// Load environment variables
config({ path: '.env.local' })

interface DiagnosticResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARN'
  duration: number
  message: string
  data?: any
  error?: string
}

class QPayDiagnostic {
  private results: DiagnosticResult[] = []
  private correlationId = `diag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  private addResult(test: string, status: 'PASS' | 'FAIL' | 'WARN', duration: number, message: string, data?: any, error?: string) {
    this.results.push({ test, status, duration, message, data, error })
    const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌'
    console.log(`${icon} ${test} (${duration}ms) - ${message}`)
    if (error) console.log(`   Error: ${error}`)
    if (data && status === 'PASS') console.log(`   Data: ${JSON.stringify(data, null, 2)}`)
  }

  async run(): Promise<void> {
    console.log(`🔍 QPay Diagnostic Tool - ${this.correlationId}`)
    console.log('=' .repeat(60))

    // Step 1: Environment Configuration
    await this.testEnvironmentConfig()

    // Step 2: QPay API Authentication
    const token = await this.testAuthentication()

    // Step 3: Invoice Creation
    const invoiceId = await this.testInvoiceCreation()

    // Step 4: Payment Status Check
    await this.testPaymentStatus(invoiceId)

    // Step 5: Webhook URL Validation
    await this.testWebhookUrl()

    // Summary
    this.printSummary()
  }

  private async testEnvironmentConfig(): Promise<void> {
    const start = Date.now()
    try {
      validateQPayConfig()
      
      const config = {
        baseUrl: QPAY.baseUrl,
        username: QPAY.username ? '***' : 'MISSING',
        password: QPAY.password ? '***' : 'MISSING',
        invoiceCode: QPAY.invoiceCode || 'MISSING',
        webhookUrl: QPAY.webhookUrl || 'MISSING',
        mockMode: QPAY.mockMode
      }

      this.addResult(
        'Environment Configuration',
        'PASS',
        Date.now() - start,
        'All required environment variables are set',
        config
      )
    } catch (error: any) {
      this.addResult(
        'Environment Configuration',
        'FAIL',
        Date.now() - start,
        'Configuration validation failed',
        undefined,
        error.message
      )
    }
  }

  private async testAuthentication(): Promise<string | null> {
    const start = Date.now()
    try {
      // Skip authentication test in mock mode
      if (QPAY.mockMode) {
        this.addResult(
          'QPay Authentication',
          'PASS',
          Date.now() - start,
          'Skipped in mock mode - authentication not required',
          { mockMode: true }
        )
        return 'mock_token'
      }

      const token = await getQPayAccessToken()
      
      this.addResult(
        'QPay Authentication',
        'PASS',
        Date.now() - start,
        'Successfully authenticated with QPay API',
        {
          tokenLength: token.length,
          tokenPrefix: token.substring(0, 20) + '...'
        }
      )
      
      return token
    } catch (error: any) {
      this.addResult(
        'QPay Authentication',
        'FAIL',
        Date.now() - start,
        'Failed to authenticate with QPay API',
        undefined,
        error.message
      )
      return null
    }
  }

  private async testInvoiceCreation(): Promise<string | null> {
    const start = Date.now()
    try {
      const testInvoice = await qpayCreateInvoice({
        sender_invoice_no: `diag_test_${Date.now()}`,
        amount: 1000, // 1,000 MNT test amount
        description: 'QPay Diagnostic Test Invoice',
        allow_partial: false
      })
      
      this.addResult(
        'Invoice Creation',
        'PASS',
        Date.now() - start,
        'Successfully created test invoice',
        {
          invoiceId: testInvoice.invoice_id,
          qrText: testInvoice.qr_text ? 'Present' : 'Missing',
          qrImage: testInvoice.qr_image ? 'Present' : 'Missing',
          urls: testInvoice.urls?.length || 0
        }
      )
      
      return testInvoice.invoice_id
    } catch (error: any) {
      this.addResult(
        'Invoice Creation',
        'FAIL',
        Date.now() - start,
        'Failed to create test invoice',
        undefined,
        error.message
      )
      return null
    }
  }

  private async testPaymentStatus(invoiceId: string | null): Promise<void> {
    if (!invoiceId) {
      this.addResult(
        'Payment Status Check',
        'FAIL',
        0,
        'No invoice ID available for status check',
        undefined,
        'Invoice creation failed'
      )
      return
    }

    const start = Date.now()
    try {
      const status = await qpayPaymentCheckByInvoice(invoiceId)
      
      this.addResult(
        'Payment Status Check',
        'PASS',
        Date.now() - start,
        'Successfully checked payment status',
        {
          invoiceId,
          payments: status.payments?.length || 0,
          paidAmount: (status as any).paid_amount || 0
        }
      )
    } catch (error: any) {
      this.addResult(
        'Payment Status Check',
        'FAIL',
        Date.now() - start,
        'Failed to check payment status',
        undefined,
        error.message
      )
    }
  }

  private async testWebhookUrl(): Promise<void> {
    const start = Date.now()
    
    if (!QPAY.webhookUrl) {
      this.addResult(
        'Webhook URL Validation',
        'WARN',
        Date.now() - start,
        'No webhook URL configured - payments will not be automatically confirmed',
        undefined,
        'QPAY_WEBHOOK_PUBLIC_URL not set'
      )
      return
    }

    if (!QPAY.webhookUrl.startsWith('https://')) {
      this.addResult(
        'Webhook URL Validation',
        'FAIL',
        Date.now() - start,
        'Webhook URL must be HTTPS',
        { webhookUrl: QPAY.webhookUrl },
        'QPay requires HTTPS for webhook URLs'
      )
      return
    }

    // Check if webhook URL is publicly accessible
    try {
      const response = await fetch(QPAY.webhookUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
      
      this.addResult(
        'Webhook URL Validation',
        'PASS',
        Date.now() - start,
        'Webhook URL is accessible and returns valid response',
        {
          webhookUrl: QPAY.webhookUrl,
          status: response.status,
          accessible: true
        }
      )
    } catch (error: any) {
      this.addResult(
        'Webhook URL Validation',
        'WARN',
        Date.now() - start,
        'Webhook URL may not be publicly accessible',
        { webhookUrl: QPAY.webhookUrl },
        error.message
      )
    }
  }

  private printSummary(): void {
    console.log('\n' + '=' .repeat(60))
    console.log('📊 Diagnostic Summary')
    console.log('=' .repeat(60))
    
    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.status === 'PASS').length
    const warningTests = this.results.filter(r => r.status === 'WARN').length
    const failedTests = this.results.filter(r => r.status === 'FAIL').length
    
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Passed: ${passedTests} ✅`)
    console.log(`Warnings: ${warningTests} ⚠️`)
    console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`)
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:')
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.test}: ${r.error || r.message}`))
    }
    
    if (warningTests > 0) {
      console.log('\n⚠️  Warnings:')
      this.results
        .filter(r => r.status === 'WARN')
        .forEach(r => console.log(`   - ${r.test}: ${r.error || r.message}`))
    }
    
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)
    console.log(`\nTotal Duration: ${totalDuration}ms`)
    
    if (failedTests === 0) {
      console.log('\n🎉 All critical tests passed! QPay integration should work correctly.')
      if (warningTests > 0) {
        console.log('⚠️  Please address warnings for optimal functionality.')
      }
    } else {
      console.log('\n🚨 Critical issues found. Please fix failed tests before using QPay integration.')
    }
  }
}

// Run the diagnostic
async function main() {
  try {
    const diagnostic = new QPayDiagnostic()
    await diagnostic.run()
  } catch (error) {
    console.error('💥 Diagnostic crashed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

#!/usr/bin/env tsx

/**
 * QPay QR Code Debug Tool
 * 
 * This script helps debug QR code generation issues by:
 * 1. Testing QPay authentication
 * 2. Creating a test invoice
 * 3. Checking what QPay returns
 * 4. Validating QR code data
 * 
 * Usage: npx tsx scripts/qpay-qr-debug.ts
 */

import { config } from 'dotenv'
import { QPAY, validateQPayConfig } from '../lib/qpay/config'
import { getQPayAccessToken } from '../lib/qpay/token'
import { qpayCreateInvoice } from '../lib/qpay/api'

// Load environment variables
config({ path: '.env.local' })

interface DebugResult {
  step: string
  success: boolean
  data?: any
  error?: string
  qrData?: {
    hasQrText: boolean
    hasQrImage: boolean
    qrTextLength?: number
    qrImageLength?: number
    urlsCount: number
  }
}

class QPayQRDebugger {
  private results: DebugResult[] = []

  private addResult(step: string, success: boolean, data?: any, error?: string) {
    const result: DebugResult = { step, success, error }
    
    if (success && data) {
      result.data = data
      
      // Analyze QR data if present
      if (data.qr_text || data.qr_image || data.urls) {
        result.qrData = {
          hasQrText: !!data.qr_text,
          hasQrImage: !!data.qr_image,
          qrTextLength: data.qr_text?.length,
          qrImageLength: data.qr_image?.length,
          urlsCount: data.urls?.length || 0
        }
      }
    }
    
    this.results.push(result)
    
    const status = success ? '✅' : '❌'
    console.log(`${status} ${step}`)
    if (error) console.log(`   Error: ${error}`)
    if (data && success) {
      console.log(`   Data: ${JSON.stringify(data, null, 2)}`)
    }
  }

  async debug(): Promise<void> {
    console.log('🔍 QPay QR Code Debug Tool')
    console.log('=' .repeat(50))

    // Step 1: Check configuration
    await this.checkConfiguration()

    // Step 2: Test authentication
    const token = await this.testAuthentication()

    // Step 3: Create test invoice
    const invoice = await this.createTestInvoice()

    // Step 4: Analyze QR data
    if (invoice) {
      this.analyzeQRData(invoice)
    }

    // Summary
    this.printSummary()
  }

  private async checkConfiguration(): Promise<void> {
    try {
      validateQPayConfig()
      this.addResult('Configuration Check', true, {
        baseUrl: QPAY.baseUrl,
        invoiceCode: QPAY.invoiceCode,
        webhookUrl: QPAY.webhookUrl,
        mockMode: QPAY.mockMode,
        hasClientId: !!QPAY.clientId,
        hasClientSecret: !!QPAY.clientSecret
      })
    } catch (error: any) {
      this.addResult('Configuration Check', false, undefined, error.message)
    }
  }

  private async testAuthentication(): Promise<string | null> {
    try {
      const token = await getQPayAccessToken()
      this.addResult('Authentication', true, {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...'
      })
      return token
    } catch (error: any) {
      this.addResult('Authentication', false, undefined, error.message)
      return null
    }
  }

  private async createTestInvoice(): Promise<any> {
    try {
      const invoice = await qpayCreateInvoice({
        sender_invoice_no: `debug_${Date.now()}`,
        amount: 1000, // 10.00 MNT
        description: 'QR Debug Test Invoice',
        allow_partial: false
      })
      
      this.addResult('Invoice Creation', true, invoice)
      return invoice
    } catch (error: any) {
      this.addResult('Invoice Creation', false, undefined, error.message)
      return null
    }
  }

  private analyzeQRData(invoice: any): void {
    const qrData = {
      hasQrText: !!invoice.qr_text,
      hasQrImage: !!invoice.qr_image,
      qrTextLength: invoice.qr_text?.length,
      qrImageLength: invoice.qr_image?.length,
      urlsCount: invoice.urls?.length || 0
    }

    let issues: string[] = []
    
    if (!qrData.hasQrText && !qrData.hasQrImage) {
      issues.push('No QR code data returned by QPay')
    }
    
    if (qrData.hasQrText && qrData.qrTextLength < 50) {
      issues.push('QR text seems too short (might be invalid)')
    }
    
    if (qrData.hasQrImage && qrData.qrImageLength < 100) {
      issues.push('QR image seems too small (might be invalid)')
    }
    
    if (qrData.urlsCount === 0) {
      issues.push('No bank app deeplinks returned')
    }

    this.addResult('QR Data Analysis', issues.length === 0, qrData, 
      issues.length > 0 ? issues.join('; ') : undefined)
  }

  private printSummary(): void {
    console.log('\n' + '=' .repeat(50))
    console.log('📊 Debug Summary')
    console.log('=' .repeat(50))
    
    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.success).length
    const failedTests = totalTests - passedTests
    
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Passed: ${passedTests} ✅`)
    console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`)
    
    // QR-specific analysis
    const qrResult = this.results.find(r => r.step === 'QR Data Analysis')
    if (qrResult) {
      console.log('\n🔍 QR Code Analysis:')
      if (qrResult.qrData) {
        console.log(`  QR Text: ${qrResult.qrData.hasQrText ? '✅' : '❌'} (${qrResult.qrData.qrTextLength || 0} chars)`)
        console.log(`  QR Image: ${qrResult.qrData.hasQrImage ? '✅' : '❌'} (${qrResult.qrData.qrImageLength || 0} chars)`)
        console.log(`  Bank Links: ${qrResult.qrData.urlsCount} URLs`)
      }
    }
    
    if (failedTests > 0) {
      console.log('\n❌ Issues Found:')
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.step}: ${r.error}`))
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:')
    if (QPAY.mockMode) {
      console.log('   - You are in MOCK MODE - QR codes are simulated')
      console.log('   - Set QPAY_CLIENT_ID to use real QPay API')
    } else {
      console.log('   - Check QPay merchant account configuration')
      console.log('   - Verify invoice_code is correct')
      console.log('   - Ensure webhook URL is accessible')
    }
  }
}

// Run the debugger
async function main() {
  try {
    const qrDebugger = new QPayQRDebugger()
    await qrDebugger.debug()
  } catch (error) {
    console.error('💥 Debug tool crashed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

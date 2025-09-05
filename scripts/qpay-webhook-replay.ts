#!/usr/bin/env tsx

/**
 * QPay Webhook Replay Tool
 * 
 * This script replays recorded webhook payloads to test the webhook handler.
 * Useful for testing webhook idempotency and error handling.
 * 
 * Usage: npx tsx scripts/qpay-webhook-replay.ts [webhook-url] [payload-file]
 */

import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
config({ path: '.env.local' })

interface WebhookPayload {
  invoice_id?: string
  invoice?: { id?: string }
  object_id?: string
  amount?: number
  status?: string
  [key: string]: any
}

class WebhookReplayer {
  private baseUrl: string
  private correlationId: string

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl
    this.correlationId = `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async replayWebhook(payload: WebhookPayload, times: number = 1): Promise<void> {
    console.log(`🔄 Replaying webhook ${times} time(s) - ${this.correlationId}`)
    console.log('=' .repeat(50))

    for (let i = 1; i <= times; i++) {
      console.log(`\n📤 Attempt ${i}/${times}`)
      await this.sendWebhook(payload, i)
      
      // Small delay between requests
      if (i < times) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log('\n✅ Webhook replay completed')
  }

  private async sendWebhook(payload: WebhookPayload, attempt: number): Promise<void> {
    const start = Date.now()
    
    try {
      const response = await fetch(`${this.baseUrl}/api/pay/qpay/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'QPay-Webhook-Replayer/1.0',
          'X-Correlation-ID': `${this.correlationId}_${attempt}`
        },
        body: JSON.stringify(payload)
      })

      const responseText = await response.text()
      const duration = Date.now() - start

      console.log(`   Status: ${response.status} ${response.statusText}`)
      console.log(`   Duration: ${duration}ms`)
      
      if (response.ok) {
        console.log(`   Response: ${responseText}`)
      } else {
        console.log(`   Error: ${responseText}`)
      }
    } catch (error: any) {
      const duration = Date.now() - start
      console.log(`   Error: ${error.message} (${duration}ms)`)
    }
  }

  static createTestPayloads(): WebhookPayload[] {
    return [
      // Valid payment webhook
      {
        invoice_id: 'test_invoice_123',
        amount: 1000,
        status: 'PAID',
        payment_id: 'test_payment_456',
        timestamp: new Date().toISOString()
      },
      
      // Webhook with different structure
      {
        invoice: { id: 'test_invoice_456' },
        amount: 2000,
        status: 'PAID'
      },
      
      // Webhook with object_id
      {
        object_id: 'test_invoice_789',
        amount: 3000,
        status: 'PAID'
      },
      
      // Invalid webhook (no invoice ID)
      {
        amount: 1000,
        status: 'PAID'
      },
      
      // Partial payment
      {
        invoice_id: 'test_invoice_partial',
        amount: 500,
        status: 'PARTIAL'
      }
    ]
  }
}

async function main() {
  const args = process.argv.slice(2)
  const webhookUrl = args[0] || 'http://localhost:3000'
  const payloadFile = args[1]
  const replayCount = parseInt(args[2]) || 1

  console.log(`🎯 QPay Webhook Replay Tool`)
  console.log(`Target: ${webhookUrl}`)
  console.log(`Replay Count: ${replayCount}`)
  console.log('')

  const replayer = new WebhookReplayer(webhookUrl)

  if (payloadFile && fs.existsSync(payloadFile)) {
    // Replay from file
    console.log(`📁 Loading payload from: ${payloadFile}`)
    const payloadData = fs.readFileSync(payloadFile, 'utf8')
    const payload = JSON.parse(payloadData)
    await replayer.replayWebhook(payload, replayCount)
  } else {
    // Use test payloads
    console.log('🧪 Using test payloads')
    const testPayloads = WebhookReplayer.createTestPayloads()
    
    for (const payload of testPayloads) {
      console.log(`\n📋 Testing payload: ${JSON.stringify(payload, null, 2)}`)
      await replayer.replayWebhook(payload, 1)
    }
  }
}

if (require.main === module) {
  main().catch(console.error)
}

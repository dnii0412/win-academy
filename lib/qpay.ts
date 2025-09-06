/**
 * QPay Integration Library
 * 
 * Provides secure token management, API communication, and error handling
 * for QPay payment integration with Next.js App Router.
 */

interface QPayConfig {
  baseUrl: string
  clientId: string
  clientSecret: string
  invoiceCode: string
  callbackUrl: string
}

interface QPayToken {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  expires_at: number
}

interface QPayError {
  error: string
  error_description: string
  http_code?: number
}

class QPayError extends Error {
  public httpCode?: number
  public qpayError?: QPayError

  constructor(message: string, httpCode?: number, qpayError?: QPayError) {
    super(message)
    this.name = 'QPayError'
    this.httpCode = httpCode
    this.qpayError = qpayError
  }
}

// Global token cache
let tokenCache: QPayToken | null = null

/**
 * Get QPay configuration from environment variables
 */
function getQPayConfig(): QPayConfig {
  const config = {
    baseUrl: process.env.QPAY_BASE_URL || 'https://merchant-sandbox.qpay.mn',
    clientId: process.env.QPAY_CLIENT_ID || '',
    clientSecret: process.env.QPAY_CLIENT_SECRET || '',
    invoiceCode: process.env.QPAY_INVOICE_CODE || '',
    callbackUrl: process.env.QPAY_CALLBACK_URL || ''
  }

  // Validate required configuration
  const missing = Object.entries(config)
    .filter(([key, value]) => !value && key !== 'baseUrl')
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing QPay configuration: ${missing.join(', ')}`)
  }

  return config
}

/**
 * Get QPay access token with caching and auto-refresh
 */
export async function getQpayToken(): Promise<string> {
  const config = getQPayConfig()
  
  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expires_at > Date.now() + 60000) { // 1 minute buffer
    console.log('🔑 Using cached QPay token')
    return tokenCache.access_token
  }

  console.log('🔑 Fetching new QPay token...')

  try {
    const authString = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')
    
    const response = await fetch(`${config.baseUrl}/v2/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        grant_type: 'client_credentials'
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new QPayError(
        `Failed to get QPay token: ${response.status} ${response.statusText}`,
        response.status,
        errorData
      )
    }

    const tokenData: QPayToken = await response.json()
    
    // Calculate expiration timestamp
    tokenData.expires_at = Date.now() + (tokenData.expires_in * 1000)
    
    // Cache the token
    tokenCache = tokenData
    
    console.log('✅ QPay token obtained successfully', {
      expires_in: tokenData.expires_in,
      expires_at: new Date(tokenData.expires_at).toISOString()
    })

    return tokenData.access_token

  } catch (error) {
    console.error('❌ Failed to get QPay token:', error)
    throw error
  }
}


/**
 * Make authenticated request to QPay API with automatic token refresh
 */
export async function qpayFetch<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const config = getQPayConfig()
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Get fresh token
      const token = await getQpayToken()
      
      const url = endpoint.startsWith('http') ? endpoint : `${config.baseUrl}${endpoint}`
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      })

      // Handle 401 - token might be expired, clear cache and retry
      if (response.status === 401 && attempt < maxRetries) {
        console.log(`🔄 Token expired, clearing cache and retrying (attempt ${attempt + 1}/${maxRetries})`)
        tokenCache = null
        continue
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new QPayError(
          `QPay API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        )
      }

      const data = await response.json()
      console.log(`✅ QPay API success: ${options.method || 'GET'} ${endpoint}`)
      return data

    } catch (error) {
      lastError = error as Error
      console.error(`❌ QPay API attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        break
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  throw lastError || new Error('QPay API request failed after all retries')
}

/**
 * Create QPay invoice
 */
export async function createQPayInvoice(invoiceData: {
  sender_invoice_no: string
  sender_branch_code: string
  invoice_receiver_code: string
  invoice_description: string
  amount: number
  callback_url: string
  allow_partial?: boolean
  allow_exceed?: boolean
}) {
  const config = getQPayConfig()
  
  const payload = {
    invoice_code: config.invoiceCode,
    sender_invoice_no: invoiceData.sender_invoice_no,
    sender_branch_code: invoiceData.sender_branch_code,
    invoice_receiver_code: invoiceData.invoice_receiver_code,
    invoice_description: invoiceData.invoice_description,
    amount: invoiceData.amount,
    callback_url: invoiceData.callback_url,
    allow_partial: invoiceData.allow_partial || false,
    allow_exceed: invoiceData.allow_exceed || false
  }

  console.log('📄 Creating QPay invoice:', {
    sender_invoice_no: payload.sender_invoice_no,
    amount: payload.amount,
    invoice_receiver_code: payload.invoice_receiver_code
  })

  return qpayFetch('/v2/invoice', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

/**
 * Check QPay payment status
 */
export async function checkQPayPayment(invoiceId: string) {
  console.log('🔍 Checking QPay payment status:', invoiceId)
  
  return qpayFetch('/v2/payment/check', {
    method: 'POST',
    body: JSON.stringify({
      object_type: 'INVOICE',
      object_id: invoiceId
    })
  })
}

/**
 * Get QPay invoice details
 */
export async function getQPayInvoice(invoiceId: string) {
  console.log('📋 Getting QPay invoice details:', invoiceId)
  
  return qpayFetch(`/v2/invoice/${invoiceId}`)
}

/**
 * Cancel QPay invoice
 */
export async function cancelQPayInvoice(invoiceId: string) {
  console.log('❌ Canceling QPay invoice:', invoiceId)
  
  return qpayFetch(`/v2/invoice/${invoiceId}/cancel`, {
    method: 'POST'
  })
}

/**
 * Generate unique sender invoice number
 */
export function generateSenderInvoiceNo(prefix: string = 'WIN'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}_${timestamp}_${random}`
}

/**
 * Validate QPay webhook signature (if needed)
 */
export function validateQPayWebhook(payload: any, signature: string): boolean {
  // QPay doesn't use webhook signatures in their current implementation
  // This is a placeholder for future signature validation if needed
  return true
}

export { QPayError, type QPayConfig, type QPayToken }

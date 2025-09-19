import { qpayFetch } from './http'
import { QPAY } from './config'

let inMemoryToken: { access_token: string; refresh_token?: string; expires_at?: number } | null = null

function expSoon() {
  if (!inMemoryToken?.expires_at) return true
  return Date.now() + 60_000 >= inMemoryToken.expires_at // refresh 60s before expiry (clock skew safe)
}

function generateCorrelationId(): string {
  return `qpay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function getQPayAccessToken(): Promise<string> {
  const correlationId = generateCorrelationId()
  
  if (inMemoryToken && !expSoon()) {
    return inMemoryToken.access_token
  }

  // Try refresh first
  if (inMemoryToken?.refresh_token) {
    try {
      const refreshed = await qpayFetch('/v2/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: inMemoryToken.refresh_token }),
      })
      
      inMemoryToken = {
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token ?? inMemoryToken.refresh_token,
        expires_at: Date.now() + (refreshed.expires_in || 300) * 1000,
      }
      
      console.log('qpay.token.refresh.success', { 
        correlationId, 
        expiresIn: refreshed.expires_in,
        expiresAt: inMemoryToken.expires_at 
      })
      return inMemoryToken.access_token
    } catch (e: any) {
      console.warn('qpay.token.refresh.failed', { 
        correlationId, 
        error: e.message,
        fallbackToNew: true 
      })
      // fall through to full token fetch
    }
  }

  // Fresh token - Try client credentials first, then username/password
  console.log('qpay.token.request', { 
    correlationId, 
    method: 'Basic Authentication',
    url: `${QPAY.baseUrl}/v2/auth/token`
  })

  try {
    // Try Basic Authentication first (production QPay)
    const authRes = await qpayFetch('/v2/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${QPAY.username}:${QPAY.password}`).toString('base64')}`
      },
      body: JSON.stringify({}),
    })

    inMemoryToken = {
      access_token: authRes.access_token,
      refresh_token: authRes.refresh_token,
      expires_at: Date.now() + (authRes.expires_in || 300) * 1000,
    }
    
    console.log('qpay.token.success', { 
      correlationId, 
      expiresIn: authRes.expires_in,
      expiresAt: inMemoryToken.expires_at 
    })
    
    return inMemoryToken.access_token
  } catch (e: any) {
    console.warn('qpay.token.client_credentials.failed', { 
      correlationId, 
      error: e.message,
      status: e.status || 'unknown',
      fallbackToUsernamePassword: true
    })
    
    // Fallback to username/password authentication
    try {
      console.log('qpay.token.request', { 
        correlationId, 
        method: 'Username/Password (fallback)',
        url: `${QPAY.baseUrl}/v2/auth/token`
      })
      
      const authRes = await qpayFetch('/v2/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'password',
          username: QPAY.username,
          password: QPAY.password
        }),
      })

      inMemoryToken = {
        access_token: authRes.access_token,
        refresh_token: authRes.refresh_token,
        expires_at: Date.now() + (authRes.expires_in || 300) * 1000,
      }
      
      console.log('qpay.token.success', { 
        correlationId, 
        method: 'Username/Password',
        expiresIn: authRes.expires_in,
        expiresAt: inMemoryToken.expires_at 
      })
      
      return inMemoryToken.access_token
    } catch (e2: any) {
      console.error('qpay.token.error', { 
        correlationId, 
        error: e2.message,
        status: e2.status || 'unknown'
      })
      throw new Error(`QPay authentication failed: ${e2.message}`)
    }
  }
}

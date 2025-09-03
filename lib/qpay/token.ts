import { qpayFetch } from './http'
import { QPAY } from './config'

let inMemoryToken: { access_token: string; refresh_token?: string; expires_at?: number } | null = null

function expSoon() {
  if (!inMemoryToken?.expires_at) return true
  return Date.now() + 30_000 >= inMemoryToken.expires_at // refresh 30s before expiry
}

export async function getQPayAccessToken() {
  if (inMemoryToken && !expSoon()) return inMemoryToken.access_token

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
      return inMemoryToken.access_token
    } catch (e) {
      // fall through to full token fetch
    }
  }

  // Fresh token
  const body: Record<string, any> = {
    grant_type: QPAY.grantType,
    client_id: QPAY.clientId,
    client_secret: QPAY.clientSecret,
  }
  if (QPAY.grantType === 'password') {
    body.username = QPAY.username
    body.password = QPAY.password
  }

  const authRes = await qpayFetch('/v2/auth/token', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  inMemoryToken = {
    access_token: authRes.access_token,
    refresh_token: authRes.refresh_token,
    expires_at: Date.now() + (authRes.expires_in || 300) * 1000,
  }
  return inMemoryToken.access_token
}

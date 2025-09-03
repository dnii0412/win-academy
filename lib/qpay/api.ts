import { qpayFetch } from './http'
import { getQPayAccessToken } from './token'
import { QPAY, validateQPayConfig } from './config'
import { mockQPay } from './mock'

async function authed(path: string, init: RequestInit = {}) {
  const token = await getQPayAccessToken()
  return qpayFetch(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function qpayCreateInvoice(params: {
  sender_invoice_no: string
  amount: number
  description?: string
  callback_url?: string // optional; we'll default to env
  allow_partial?: boolean
  expiry_date?: string // ISO
}) {
  validateQPayConfig() // Validate config at runtime

  // Use mock in development if no real credentials
  if (QPAY.mockMode) {
    console.log('🔧 Using mock QPay createInvoice')
    return mockQPay.createInvoice(params)
  }

  const payload: Record<string, any> = {
    invoice_code: QPAY.invoiceCode,
    sender_invoice_no: params.sender_invoice_no,
    invoice_description: params.description || 'Win Academy course payment',
    amount: params.amount,
    callback_url: params.callback_url || QPAY.webhookUrl,
    allow_partial: params.allow_partial ?? false,
  }
  if (params.expiry_date) payload.expiry_date = params.expiry_date

  return authed('/v2/invoice', { method: 'POST', body: JSON.stringify(payload) })
}

export async function qpayPaymentCheckByInvoice(invoiceId: string) {
  validateQPayConfig() // Validate config at runtime

  // Use mock in development if no real credentials
  if (QPAY.mockMode) {
    console.log('🔧 Using mock QPay paymentCheck')
    return mockQPay.paymentCheck(invoiceId)
  }

  return authed('/v2/payment/check', {
    method: 'POST',
    body: JSON.stringify({ object_type: 'INVOICE', object_id: invoiceId }),
  })
}

export async function qpayGetInvoice(invoiceId: string) {
  validateQPayConfig() // Validate config at runtime
  return authed(`/v2/invoice/${invoiceId}`)
}

export async function qpayCancelInvoice(invoiceId: string) {
  validateQPayConfig() // Validate config at runtime
  return authed(`/v2/invoice/${invoiceId}`, { method: 'DELETE' })
}

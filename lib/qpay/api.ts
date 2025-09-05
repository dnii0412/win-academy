import { qpayFetch } from './http'
import { getQPayAccessToken } from './token'
import { QPAY, validateQPayConfig } from './config'
import { mockQPay } from './mock'
import { createQPayError, handleQPayError, logQPayError } from './errors'

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
  const correlationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  validateQPayConfig() // Validate config at runtime

  // Validate input
  if (!Number.isInteger(params.amount) || params.amount <= 0) {
    throw createQPayError('INVALID_AMOUNT', 400, { amount: params.amount }, correlationId)
  }
  if (!params.sender_invoice_no || params.sender_invoice_no.length < 3) {
    throw createQPayError('INVALID_INVOICE_CODE', 400, { sender_invoice_no: params.sender_invoice_no }, correlationId)
  }

  // Use mock in development if no real credentials
  if (QPAY.mockMode) {
    console.log('qpay.invoice.create.mock', { correlationId, senderInvoiceNo: params.sender_invoice_no })
    return mockQPay.createInvoice(params)
  }

  const payload: Record<string, any> = {
    invoice_code: QPAY.invoiceCode,
    sender_invoice_no: params.sender_invoice_no,
    invoice_receiver_code: QPAY.invoiceCode, // Required field - using invoice_code as receiver
    invoice_description: params.description || 'Win Academy course payment',
    amount: params.amount,
    callback_url: params.callback_url || QPAY.webhookUrl, // Fixed typo: "callback_url" not "calback_url"
    allow_partial: params.allow_partial ?? false,
  }
  if (params.expiry_date) payload.expiry_date = params.expiry_date

  console.log('qpay.invoice.create.request', { 
    correlationId, 
    senderInvoiceNo: params.sender_invoice_no,
    amount: params.amount,
    invoiceCode: QPAY.invoiceCode,
    callbackUrl: payload.callback_url
  })

  try {
    const result = await authed('/v2/invoice', { method: 'POST', body: JSON.stringify(payload) })
    
    console.log('qpay.invoice.create.success', { 
      correlationId, 
      invoiceId: result.invoice_id,
      amount: params.amount,
      qrText: result.qr_text ? 'present' : 'missing',
      qrImage: result.qr_image ? 'present' : 'missing',
      urls: result.urls?.length || 0,
      fullResponse: result // Log full response for debugging
    })
    
    // Validate that QPay returned QR data
    if (!result.qr_text && !result.qr_image) {
      console.warn('qpay.invoice.create.no_qr', { 
        correlationId, 
        response: result,
        message: 'QPay did not return QR code data'
      })
    }
    
    return result
  } catch (e: any) {
    const qpayError = handleQPayError(e, correlationId)
    logQPayError(qpayError, 'invoice.create')
    throw qpayError
  }
}

export async function qpayPaymentCheckByInvoice(invoiceId: string) {
  const correlationId = `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  validateQPayConfig() // Validate config at runtime

  // Use mock in development if no real credentials
  if (QPAY.mockMode) {
    console.log('qpay.payment.check.mock', { correlationId, invoiceId })
    return mockQPay.paymentCheck(invoiceId)
  }

  console.log('qpay.payment.check.request', { correlationId, invoiceId })

  try {
    const result = await authed('/v2/payment/check', {
      method: 'POST',
      body: JSON.stringify({ 
        object_type: 'INVOICE', 
        object_id: invoiceId,
        offset: {
          page_number: 1,
          page_limit: 100
        }
      }),
    })

    console.log('qpay.payment.check.success', { 
      correlationId, 
      count: result.count,
      paidAmount: result.paid_amount,
      rows: result.rows?.length || 0
    })

    // Convert QPay response format to our expected format
    return {
      payments: result.rows || [],
      count: result.count || 0,
      paid_amount: result.paid_amount || 0
    }
  } catch (e: any) {
    const qpayError = handleQPayError(e, correlationId)
    logQPayError(qpayError, 'payment.check')
    throw qpayError
  }
}

export async function qpayGetInvoice(invoiceId: string) {
  validateQPayConfig() // Validate config at runtime
  return authed(`/v2/invoice/${invoiceId}`)
}

export async function qpayCancelInvoice(invoiceId: string) {
  validateQPayConfig() // Validate config at runtime
  return authed(`/v2/invoice/${invoiceId}`, { method: 'DELETE' })
}

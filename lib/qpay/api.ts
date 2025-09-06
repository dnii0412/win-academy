import { qpayFetch } from './http'
import { getQPayAccessToken } from './token'
import { QPAY, validateQPayConfig } from './config'
import { mockQPay } from './mock'
import { createQPayError, handleQPayError, logQPayError } from './errors'
import { validateQPayInvoiceParams } from './validation'
import { 
  QPayInvoiceCreateRequest, 
  QPayInvoiceCreateResponse, 
  QPayInvoiceParams,
  QPayPaymentCheckRequest,
  QPayPaymentCheckResponse,
  QPayPaymentCancelRequest,
  QPayPaymentRefundRequest
} from '../../types/qpay'

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

export async function qpayCreateInvoice(params: QPayInvoiceParams): Promise<QPayInvoiceCreateResponse> {
  const correlationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  validateQPayConfig() // Validate config at runtime
  validateQPayInvoiceParams(params, correlationId) // Validate input parameters

  // Use mock in development if no real credentials
  if (QPAY.mockMode) {
    console.log('qpay.invoice.create.mock', { correlationId, senderInvoiceNo: params.sender_invoice_no })
    return mockQPay.createInvoice(params)
  }

  // Build the full QPay invoice request payload
  const payload: QPayInvoiceCreateRequest = {
    invoice_code: QPAY.invoiceCode,
    sender_invoice_no: params.sender_invoice_no,
    invoice_receiver_code: params.invoice_receiver_code || QPAY.invoiceCode,
    invoice_description: params.description || 'Win Academy course payment',
    amount: params.amount,
    callback_url: params.callback_url || QPAY.webhookUrl,
    allow_partial: params.allow_partial ?? false,
    note: params.note,
  }

  // Add optional fields if provided
  if (params.expiry_date) {
    payload.expiry_date = params.expiry_date
    payload.enable_expiry = true
  }

  if (params.invoice_receiver_data) {
    payload.invoice_receiver_data = params.invoice_receiver_data
  }

  if (params.lines && params.lines.length > 0) {
    payload.lines = params.lines
  }

  // Add sender branch and terminal data if provided
  if (params.sender_branch_code) {
    payload.sender_branch_code = params.sender_branch_code
  }

  if (params.sender_branch_data) {
    payload.sender_branch_data = params.sender_branch_data
  }

  if (params.sender_staff_code) {
    payload.sender_staff_code = params.sender_staff_code
  }

  if (params.sender_staff_data) {
    payload.sender_staff_data = params.sender_staff_data
  }

  if (params.sender_terminal_code) {
    payload.sender_terminal_code = params.sender_terminal_code
  }

  if (params.sender_terminal_data) {
    payload.sender_terminal_data = params.sender_terminal_data
  }

  console.log('qpay.invoice.create.request', { 
    correlationId, 
    senderInvoiceNo: params.sender_invoice_no,
    amount: params.amount,
    invoiceCode: QPAY.invoiceCode,
    callbackUrl: payload.callback_url,
    hasReceiverData: !!payload.invoice_receiver_data,
    linesCount: payload.lines?.length || 0
  })

  try {
    const result = await authed('/v2/invoice', { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    }) as QPayInvoiceCreateResponse
    
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
      
      // This is a warning, not an error - some QPay configurations might not return QR
      // But we should log it for debugging
    }
    
    // Validate response structure
    if (!result.invoice_id) {
      throw createQPayError('QPAY_INVALID_RESPONSE', 500, 
        { response: result, message: 'QPay did not return invoice_id' }, correlationId)
    }
    
    return result
  } catch (e: any) {
    const qpayError = handleQPayError(e, correlationId)
    logQPayError(qpayError, 'invoice.create')
    throw qpayError
  }
}

export async function qpayPaymentCheckByInvoice(invoiceId: string): Promise<QPayPaymentCheckResponse> {
  const correlationId = `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  validateQPayConfig() // Validate config at runtime

  // Use mock in development if no real credentials
  if (QPAY.mockMode) {
    console.log('qpay.payment.check.mock', { correlationId, invoiceId })
    return mockQPay.paymentCheck(invoiceId)
  }

  console.log('qpay.payment.check.request', { correlationId, invoiceId })

  try {
    const request: QPayPaymentCheckRequest = {
      object_type: 'INVOICE',
      object_id: invoiceId,
      offset: {
        page_number: 1,
        page_limit: 100
      }
    }

    const result = await authed('/v2/payment/check', {
      method: 'POST',
      body: JSON.stringify(request),
    }) as QPayPaymentCheckResponse

    console.log('qpay.payment.check.success', { 
      correlationId, 
      count: result.count,
      paidAmount: result.paid_amount,
      rows: result.rows?.length || 0
    })

    return result
  } catch (e: any) {
    const qpayError = handleQPayError(e, correlationId)
    logQPayError(qpayError, 'payment.check')
    throw qpayError
  }
}

export async function qpayGetInvoice(invoiceId: string): Promise<any> {
  validateQPayConfig() // Validate config at runtime
  return authed(`/v2/invoice/${invoiceId}`)
}

export async function qpayCancelInvoice(invoiceId: string): Promise<any> {
  validateQPayConfig() // Validate config at runtime
  return authed(`/v2/invoice/${invoiceId}`, { method: 'DELETE' })
}

export async function qpayGetPayment(paymentId: string): Promise<any> {
  validateQPayConfig() // Validate config at runtime
  return authed(`/v2/payment/${paymentId}`)
}

export async function qpayCancelPayment(paymentId: string, params?: QPayPaymentCancelRequest): Promise<any> {
  validateQPayConfig() // Validate config at runtime
  
  const body = params ? JSON.stringify(params) : undefined
  return authed(`/v2/payment/cancel/${paymentId}`, { 
    method: 'DELETE',
    body
  })
}

export async function qpayRefundPayment(paymentId: string, params?: QPayPaymentRefundRequest): Promise<any> {
  validateQPayConfig() // Validate config at runtime
  
  const body = params ? JSON.stringify(params) : undefined
  return authed(`/v2/payment/refund/${paymentId}`, { 
    method: 'DELETE',
    body
  })
}

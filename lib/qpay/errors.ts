/**
 * QPay Error Handling Utilities
 * 
 * Provides structured error handling for QPay operations with
 * user-safe messages and developer details.
 */

export class QPayError extends Error {
  constructor(
    public code: string,
    public status: number,
    public detail?: unknown,
    public correlationId?: string
  ) {
    super(code)
    this.name = 'QPayError'
  }

  toUserMessage(): string {
    switch (this.code) {
      case 'AUTH_FAILED':
        return 'Payment authentication failed. Please try again.'
      case 'INVOICE_CREATE_FAILED':
        return 'Unable to create payment invoice. Please try again.'
      case 'INVOICE_NOT_FOUND':
        return 'Payment invoice not found. Please create a new payment.'
      case 'PAYMENT_VERIFICATION_FAILED':
        return 'Unable to verify payment status. Please contact support.'
      case 'INVALID_AMOUNT':
        return 'Invalid payment amount. Please check your order.'
      case 'INVALID_INVOICE_CODE':
        return 'Invalid invoice configuration. Please contact support.'
      case 'NETWORK_ERROR':
        return 'Network error occurred. Please check your connection and try again.'
      case 'TIMEOUT':
        return 'Request timed out. Please try again.'
      case 'RATE_LIMITED':
        return 'Too many requests. Please wait a moment and try again.'
      default:
        return 'Payment error occurred. Please try again or contact support.'
    }
  }

  toLogData() {
    return {
      code: this.code,
      status: this.status,
      message: this.message,
      correlationId: this.correlationId,
      detail: this.detail,
      timestamp: new Date().toISOString()
    }
  }
}

export function createQPayError(
  code: string,
  status: number,
  detail?: unknown,
  correlationId?: string
): QPayError {
  return new QPayError(code, status, detail, correlationId)
}

export function handleQPayError(error: unknown, correlationId?: string): QPayError {
  if (error instanceof QPayError) {
    return error
  }

  if (error instanceof Error) {
    // Try to extract status code from error message
    const statusMatch = error.message.match(/HTTP (\d+)/)
    const status = statusMatch ? parseInt(statusMatch[1]) : 500

    // Map common error patterns to QPay error codes
    let code = 'UNKNOWN_ERROR'
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      code = 'AUTH_FAILED'
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      code = 'INVOICE_NOT_FOUND'
    } else if (error.message.includes('timeout')) {
      code = 'TIMEOUT'
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      code = 'NETWORK_ERROR'
    } else if (error.message.includes('429') || error.message.includes('rate limit')) {
      code = 'RATE_LIMITED'
    }

    return new QPayError(code, status, error.message, correlationId)
  }

  return new QPayError('UNKNOWN_ERROR', 500, String(error), correlationId)
}

export function logQPayError(error: QPayError, context?: string) {
  const logData = error.toLogData()
  console.error(`qpay.error${context ? `.${context}` : ''}`, logData)
}

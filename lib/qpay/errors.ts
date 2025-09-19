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
      case 'INVALID_SENDER_INVOICE_NO':
        return 'Invalid invoice number. Please try again.'
      case 'INVALID_SENDER_INVOICE_NO_LENGTH':
        return 'Invoice number must be between 3 and 45 characters.'
      case 'INVALID_DESCRIPTION_LENGTH':
        return 'Description is too long. Please shorten it and try again.'
      case 'INVALID_CALLBACK_URL':
        return 'Invalid callback URL. Please contact support.'
      case 'INVALID_EXPIRY_DATE':
        return 'Invalid expiry date format. Please contact support.'
      case 'INVALID_RECEIVER_CODE_LENGTH':
        return 'Receiver code is too long. Please contact support.'
      case 'INVALID_NOTE_LENGTH':
        return 'Note is too long. Please shorten it and try again.'
      case 'INVALID_LINE_DESCRIPTION':
        return 'Invalid line item description. Please contact support.'
      case 'INVALID_LINE_DESCRIPTION_LENGTH':
        return 'Line item description is too long. Please shorten it.'
      case 'INVALID_LINE_QUANTITY':
        return 'Invalid quantity. Please enter a positive number.'
      case 'INVALID_LINE_UNIT_PRICE':
        return 'Invalid unit price. Please enter a positive number.'
      case 'INVALID_PRODUCT_CODE_LENGTH':
        return 'Product code is too long. Please contact support.'
      case 'INVALID_TAX_PRODUCT_CODE_LENGTH':
        return 'Tax product code is too long. Please contact support.'
      case 'INVALID_DISCOUNT_DESCRIPTION':
        return 'Invalid discount description. Please contact support.'
      case 'INVALID_DISCOUNT_DESCRIPTION_LENGTH':
        return 'Discount description is too long. Please shorten it.'
      case 'INVALID_DISCOUNT_AMOUNT':
        return 'Invalid discount amount. Please enter a positive number.'
      case 'INVALID_DISCOUNT_CODE_LENGTH':
        return 'Discount code is too long. Please contact support.'
      case 'INVALID_SURCHARGE_DESCRIPTION':
        return 'Invalid surcharge description. Please contact support.'
      case 'INVALID_SURCHARGE_DESCRIPTION_LENGTH':
        return 'Surcharge description is too long. Please shorten it.'
      case 'INVALID_SURCHARGE_AMOUNT':
        return 'Invalid surcharge amount. Please enter a positive number.'
      case 'INVALID_SURCHARGE_CODE_LENGTH':
        return 'Surcharge code is too long. Please contact support.'
      case 'INVALID_TAX_DESCRIPTION':
        return 'Invalid tax description. Please contact support.'
      case 'INVALID_TAX_DESCRIPTION_LENGTH':
        return 'Tax description is too long. Please shorten it.'
      case 'INVALID_TAX_AMOUNT':
        return 'Invalid tax amount. Please enter a positive number.'
      case 'INVALID_TAX_CODE':
        return 'Invalid tax code. Please use VAT or CITY_TAX.'
      case 'INVALID_RECEIVER_REGISTER_LENGTH':
        return 'Receiver register number is too long. Please contact support.'
      case 'INVALID_RECEIVER_NAME_LENGTH':
        return 'Receiver name is too long. Please shorten it.'
      case 'INVALID_RECEIVER_EMAIL':
        return 'Invalid receiver email address. Please check the format.'
      case 'INVALID_RECEIVER_PHONE_LENGTH':
        return 'Receiver phone number is too long. Please shorten it.'
      case 'NETWORK_ERROR':
        return 'Network error occurred. Please check your connection and try again.'
      case 'TIMEOUT':
        return 'Request timed out. Please try again.'
      case 'RATE_LIMITED':
        return 'Too many requests. Please wait a moment and try again.'
      case 'QPAY_SERVICE_ERROR':
        return 'Payment service is temporarily unavailable. Please try again later.'
      case 'QPAY_INVALID_RESPONSE':
        return 'Invalid response from payment service. Please try again.'
      case 'QPAY_MISSING_QR_DATA':
        return 'Payment QR code could not be generated. Please try again.'
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
}

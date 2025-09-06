import { QPayInvoiceParams, QPayInvoiceLine, QPayDiscount, QPaySurcharge, QPayTax, QPayInvoiceReceiverData } from '../../types/qpay'
import { createQPayError } from './errors'

export function validateQPayInvoiceParams(params: QPayInvoiceParams, correlationId: string): void {
  // Validate sender_invoice_no
  if (!params.sender_invoice_no || typeof params.sender_invoice_no !== 'string') {
    throw createQPayError('INVALID_SENDER_INVOICE_NO', 400, 
      { sender_invoice_no: params.sender_invoice_no }, correlationId)
  }
  
  if (params.sender_invoice_no.length < 3 || params.sender_invoice_no.length > 45) {
    throw createQPayError('INVALID_SENDER_INVOICE_NO_LENGTH', 400, 
      { sender_invoice_no: params.sender_invoice_no, length: params.sender_invoice_no.length }, correlationId)
  }

  // Validate amount
  if (!Number.isInteger(params.amount) || params.amount <= 0) {
    throw createQPayError('INVALID_AMOUNT', 400, 
      { amount: params.amount }, correlationId)
  }

  // Validate description
  if (params.description && (params.description.length > 255)) {
    throw createQPayError('INVALID_DESCRIPTION_LENGTH', 400, 
      { description: params.description, length: params.description.length }, correlationId)
  }

  // Validate callback_url
  if (params.callback_url && !isValidUrl(params.callback_url)) {
    throw createQPayError('INVALID_CALLBACK_URL', 400, 
      { callback_url: params.callback_url }, correlationId)
  }

  // Validate expiry_date
  if (params.expiry_date && !isValidDate(params.expiry_date)) {
    throw createQPayError('INVALID_EXPIRY_DATE', 400, 
      { expiry_date: params.expiry_date }, correlationId)
  }

  // Validate invoice_receiver_code
  if (params.invoice_receiver_code && (params.invoice_receiver_code.length > 45)) {
    throw createQPayError('INVALID_RECEIVER_CODE_LENGTH', 400, 
      { invoice_receiver_code: params.invoice_receiver_code, length: params.invoice_receiver_code.length }, correlationId)
  }

  // Validate note
  if (params.note && (params.note.length > 1000)) {
    throw createQPayError('INVALID_NOTE_LENGTH', 400, 
      { note: params.note, length: params.note.length }, correlationId)
  }

  // Validate lines if provided
  if (params.lines && params.lines.length > 0) {
    validateInvoiceLines(params.lines, correlationId)
  }

  // Validate receiver data if provided
  if (params.invoice_receiver_data) {
    validateReceiverData(params.invoice_receiver_data, correlationId)
  }
}

export function validateInvoiceLines(lines: QPayInvoiceLine[], correlationId: string): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Validate line_description
    if (!line.line_description || typeof line.line_description !== 'string') {
      throw createQPayError('INVALID_LINE_DESCRIPTION', 400, 
        { lineIndex: i, line_description: line.line_description }, correlationId)
    }
    
    if (line.line_description.length > 255) {
      throw createQPayError('INVALID_LINE_DESCRIPTION_LENGTH', 400, 
        { lineIndex: i, line_description: line.line_description, length: line.line_description.length }, correlationId)
    }

    // Validate line_quantity
    if (typeof line.line_quantity !== 'number' || line.line_quantity <= 0) {
      throw createQPayError('INVALID_LINE_QUANTITY', 400, 
        { lineIndex: i, line_quantity: line.line_quantity }, correlationId)
    }

    // Validate line_unit_price
    if (typeof line.line_unit_price !== 'number' || line.line_unit_price <= 0) {
      throw createQPayError('INVALID_LINE_UNIT_PRICE', 400, 
        { lineIndex: i, line_unit_price: line.line_unit_price }, correlationId)
    }

    // Validate optional fields
    if (line.sender_product_code && line.sender_product_code.length > 45) {
      throw createQPayError('INVALID_PRODUCT_CODE_LENGTH', 400, 
        { lineIndex: i, sender_product_code: line.sender_product_code, length: line.sender_product_code.length }, correlationId)
    }

    if (line.tax_product_code && line.tax_product_code.length > 45) {
      throw createQPayError('INVALID_TAX_PRODUCT_CODE_LENGTH', 400, 
        { lineIndex: i, tax_product_code: line.tax_product_code, length: line.tax_product_code.length }, correlationId)
    }

    // Validate discounts
    if (line.discounts && line.discounts.length > 0) {
      validateDiscounts(line.discounts, i, correlationId)
    }

    // Validate surcharges
    if (line.surcharges && line.surcharges.length > 0) {
      validateSurcharges(line.surcharges, i, correlationId)
    }

    // Validate taxes
    if (line.taxes && line.taxes.length > 0) {
      validateTaxes(line.taxes, i, correlationId)
    }
  }
}

export function validateDiscounts(discounts: QPayDiscount[], lineIndex: number, correlationId: string): void {
  for (let i = 0; i < discounts.length; i++) {
    const discount = discounts[i]
    
    if (!discount.description || typeof discount.description !== 'string') {
      throw createQPayError('INVALID_DISCOUNT_DESCRIPTION', 400, 
        { lineIndex, discountIndex: i, description: discount.description }, correlationId)
    }
    
    if (discount.description.length > 100) {
      throw createQPayError('INVALID_DISCOUNT_DESCRIPTION_LENGTH', 400, 
        { lineIndex, discountIndex: i, description: discount.description, length: discount.description.length }, correlationId)
    }
    
    if (typeof discount.amount !== 'number' || discount.amount < 0) {
      throw createQPayError('INVALID_DISCOUNT_AMOUNT', 400, 
        { lineIndex, discountIndex: i, amount: discount.amount }, correlationId)
    }
    
    if (discount.discount_code && discount.discount_code.length > 45) {
      throw createQPayError('INVALID_DISCOUNT_CODE_LENGTH', 400, 
        { lineIndex, discountIndex: i, discount_code: discount.discount_code, length: discount.discount_code.length }, correlationId)
    }
  }
}

export function validateSurcharges(surcharges: QPaySurcharge[], lineIndex: number, correlationId: string): void {
  for (let i = 0; i < surcharges.length; i++) {
    const surcharge = surcharges[i]
    
    if (!surcharge.description || typeof surcharge.description !== 'string') {
      throw createQPayError('INVALID_SURCHARGE_DESCRIPTION', 400, 
        { lineIndex, surchargeIndex: i, description: surcharge.description }, correlationId)
    }
    
    if (surcharge.description.length > 100) {
      throw createQPayError('INVALID_SURCHARGE_DESCRIPTION_LENGTH', 400, 
        { lineIndex, surchargeIndex: i, description: surcharge.description, length: surcharge.description.length }, correlationId)
    }
    
    if (typeof surcharge.amount !== 'number' || surcharge.amount < 0) {
      throw createQPayError('INVALID_SURCHARGE_AMOUNT', 400, 
        { lineIndex, surchargeIndex: i, amount: surcharge.amount }, correlationId)
    }
    
    if (surcharge.surcharge_code && surcharge.surcharge_code.length > 45) {
      throw createQPayError('INVALID_SURCHARGE_CODE_LENGTH', 400, 
        { lineIndex, surchargeIndex: i, surcharge_code: surcharge.surcharge_code, length: surcharge.surcharge_code.length }, correlationId)
    }
  }
}

export function validateTaxes(taxes: QPayTax[], lineIndex: number, correlationId: string): void {
  for (let i = 0; i < taxes.length; i++) {
    const tax = taxes[i]
    
    if (!tax.description || typeof tax.description !== 'string') {
      throw createQPayError('INVALID_TAX_DESCRIPTION', 400, 
        { lineIndex, taxIndex: i, description: tax.description }, correlationId)
    }
    
    if (tax.description.length > 100) {
      throw createQPayError('INVALID_TAX_DESCRIPTION_LENGTH', 400, 
        { lineIndex, taxIndex: i, description: tax.description, length: tax.description.length }, correlationId)
    }
    
    if (typeof tax.amount !== 'number' || tax.amount < 0) {
      throw createQPayError('INVALID_TAX_AMOUNT', 400, 
        { lineIndex, taxIndex: i, amount: tax.amount }, correlationId)
    }
    
    if (tax.tax_code && !['VAT', 'CITY_TAX'].includes(tax.tax_code)) {
      throw createQPayError('INVALID_TAX_CODE', 400, 
        { lineIndex, taxIndex: i, tax_code: tax.tax_code }, correlationId)
    }
  }
}

export function validateReceiverData(data: QPayInvoiceReceiverData, correlationId: string): void {
  if (data.register && data.register.length > 20) {
    throw createQPayError('INVALID_RECEIVER_REGISTER_LENGTH', 400, 
      { register: data.register, length: data.register.length }, correlationId)
  }
  
  if (data.name && data.name.length > 100) {
    throw createQPayError('INVALID_RECEIVER_NAME_LENGTH', 400, 
      { name: data.name, length: data.name.length }, correlationId)
  }
  
  if (data.email && (!isValidEmail(data.email) || data.email.length > 255)) {
    throw createQPayError('INVALID_RECEIVER_EMAIL', 400, 
      { email: data.email }, correlationId)
  }
  
  if (data.phone && data.phone.length > 20) {
    throw createQPayError('INVALID_RECEIVER_PHONE_LENGTH', 400, 
      { phone: data.phone, length: data.phone.length }, correlationId)
  }
}

// Helper functions
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

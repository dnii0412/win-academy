// QPay API Types based on official documentation

export interface QPayAddress {
  city?: string
  district?: string
  street?: string
  building?: string
  address?: string
  zipcode?: string
  longitude?: string
  latitude?: string
}

export interface QPaySenderBranchData {
  register?: string
  name?: string
  email?: string
  phone?: string
  address?: QPayAddress
}

export interface QPaySenderTerminalData {
  name?: string
}

export interface QPayInvoiceReceiverData {
  register?: string
  name?: string
  email?: string
  phone?: string
  address?: QPayAddress
}

export interface QPayDiscount {
  discount_code?: string
  description: string
  amount: number
  note?: string
}

export interface QPaySurcharge {
  surcharge_code?: string
  description: string
  amount: number
  note?: string
}

export interface QPayTax {
  tax_code?: string
  description: string
  amount: number
  city_tax?: number
  note?: string
}

export interface QPayInvoiceLine {
  sender_product_code?: string
  tax_product_code?: string
  line_description: string
  line_quantity: number
  line_unit_price: number
  note?: string
  discounts?: QPayDiscount[]
  surcharges?: QPaySurcharge[]
  taxes?: QPayTax[]
}

export interface QPayAccount {
  account_bank_code: string
  account_number: string
  account_name: string
  account_currency: string
}

export interface QPayTransaction {
  description: string
  amount: number
  accounts?: QPayAccount[]
}

export interface QPayInvoiceCreateRequest {
  invoice_code: string
  sender_invoice_no: string
  sender_branch_code?: string
  sender_branch_data?: QPaySenderBranchData
  sender_staff_code?: string
  sender_staff_data?: object
  sender_terminal_code?: string
  sender_terminal_data?: QPaySenderTerminalData
  invoice_receiver_code: string
  invoice_receiver_data?: QPayInvoiceReceiverData
  invoice_description: string
  invoice_due_date?: string
  enable_expiry?: boolean
  expiry_date?: string
  calculate_vat?: boolean
  tax_customer_code?: string
  line_tax_code?: string
  allow_partial?: boolean
  minimum_amount?: number
  allow_exceed?: boolean
  maximum_amount?: number
  amount?: number
  callback_url?: string
  note?: string
  lines?: QPayInvoiceLine[]
  transactions?: QPayTransaction[]
}

export interface QPayUrl {
  name?: string
  description?: string
  link?: string
}

export interface QPayInvoiceCreateResponse {
  invoice_id: string
  qr_text: string
  qr_image: string
  urls: QPayUrl[]
}

export interface QPayPaymentRow {
  payment_id: string
  payment_status: 'NEW' | 'FAILED' | 'PAID' | 'REFUNDED'
  payment_date: string
  payment_fee: number
  payment_amount: number
  payment_currency: string
  payment_wallet: string
  transaction_type: 'P2P' | 'CARD'
}

export interface QPayPaymentCheckRequest {
  object_type: 'INVOICE' | 'QR' | 'ITEM'
  object_id: string
  offset?: {
    page_number: number
    page_limit: number
  }
}

export interface QPayPaymentCheckResponse {
  count: number
  paid_amount: number
  rows: QPayPaymentRow[]
}

export interface QPayPaymentCancelRequest {
  callback_url?: string
  note?: string
}

export interface QPayPaymentRefundRequest {
  callback_url?: string
  note?: string
}

// Simplified types for our application
export interface QPayInvoiceParams {
  sender_invoice_no: string
  amount: number
  description?: string
  callback_url?: string
  allow_partial?: boolean
  expiry_date?: string
  invoice_receiver_code?: string
  invoice_receiver_data?: QPayInvoiceReceiverData
  lines?: QPayInvoiceLine[]
  note?: string
  sender_branch_code?: string
  sender_branch_data?: QPaySenderBranchData
  sender_staff_code?: string
  sender_staff_data?: object
  sender_terminal_code?: string
  sender_terminal_data?: QPaySenderTerminalData
}

export interface QPayError {
  error: string
  message: string
  correlationId?: string
}

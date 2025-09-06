import { 
  QPayInvoiceLine, 
  QPayDiscount, 
  QPaySurcharge, 
  QPayTax, 
  QPayInvoiceReceiverData,
  QPayAddress,
  QPaySenderBranchData,
  QPaySenderTerminalData
} from '../../types/qpay'

/**
 * Helper functions for building QPay invoice components
 */

export function createInvoiceLine(params: {
  description: string
  quantity: number
  unitPrice: number
  productCode?: string
  taxProductCode?: string
  note?: string
  discounts?: QPayDiscount[]
  surcharges?: QPaySurcharge[]
  taxes?: QPayTax[]
}): QPayInvoiceLine {
  return {
    sender_product_code: params.productCode,
    tax_product_code: params.taxProductCode,
    line_description: params.description,
    line_quantity: params.quantity,
    line_unit_price: params.unitPrice,
    note: params.note,
    discounts: params.discounts || [],
    surcharges: params.surcharges || [],
    taxes: params.taxes || []
  }
}

export function createDiscount(params: {
  code?: string
  description: string
  amount: number
  note?: string
}): QPayDiscount {
  return {
    discount_code: params.code,
    description: params.description,
    amount: params.amount,
    note: params.note
  }
}

export function createSurcharge(params: {
  code?: string
  description: string
  amount: number
  note?: string
}): QPaySurcharge {
  return {
    surcharge_code: params.code,
    description: params.description,
    amount: params.amount,
    note: params.note
  }
}

export function createTax(params: {
  code?: 'VAT' | 'CITY_TAX'
  description: string
  amount: number
  cityTax?: number
  note?: string
}): QPayTax {
  return {
    tax_code: params.code,
    description: params.description,
    amount: params.amount,
    city_tax: params.cityTax,
    note: params.note
  }
}

export function createAddress(params: {
  city?: string
  district?: string
  street?: string
  building?: string
  address?: string
  zipcode?: string
  longitude?: string
  latitude?: string
}): QPayAddress {
  return {
    city: params.city,
    district: params.district,
    street: params.street,
    building: params.building,
    address: params.address,
    zipcode: params.zipcode,
    longitude: params.longitude,
    latitude: params.latitude
  }
}

export function createReceiverData(params: {
  register?: string
  name?: string
  email?: string
  phone?: string
  address?: QPayAddress
}): QPayInvoiceReceiverData {
  return {
    register: params.register,
    name: params.name,
    email: params.email,
    phone: params.phone,
    address: params.address
  }
}

export function createSenderBranchData(params: {
  register?: string
  name?: string
  email?: string
  phone?: string
  address?: QPayAddress
}): QPaySenderBranchData {
  return {
    register: params.register,
    name: params.name,
    email: params.email,
    phone: params.phone,
    address: params.address
  }
}

export function createSenderTerminalData(params: {
  name?: string
}): QPaySenderTerminalData {
  return {
    name: params.name
  }
}

/**
 * Common invoice line builders for Win Academy
 */
export function createCourseInvoiceLine(params: {
  courseTitle: string
  price: number
  quantity?: number
  discountAmount?: number
  discountDescription?: string
  vatAmount?: number
  vatRate?: number
}): QPayInvoiceLine {
  const quantity = params.quantity || 1
  const discounts: QPayDiscount[] = []
  const taxes: QPayTax[] = []

  // Add discount if provided
  if (params.discountAmount && params.discountAmount > 0) {
    discounts.push(createDiscount({
      code: 'COURSE_DISCOUNT',
      description: params.discountDescription || 'Course discount',
      amount: params.discountAmount
    }))
  }

  // Add VAT if provided
  if (params.vatAmount && params.vatAmount > 0) {
    taxes.push(createTax({
      code: 'VAT',
      description: `НӨАТ ${params.vatRate || 10}%`,
      amount: params.vatAmount
    }))
  }

  return createInvoiceLine({
    description: `Win Academy - ${params.courseTitle}`,
    quantity,
    unitPrice: params.price,
    productCode: 'WIN_ACADEMY_COURSE',
    taxProductCode: '83051', // Education services code
    discounts,
    taxes
  })
}

/**
 * Calculate VAT amount based on price and rate
 */
export function calculateVAT(price: number, rate: number = 10): number {
  return Math.round((price * rate) / 100)
}

/**
 * Calculate discount amount based on price and percentage
 */
export function calculateDiscount(price: number, percentage: number): number {
  return Math.round((price * percentage) / 100)
}

/**
 * Create a simple course payment invoice
 */
export function createSimpleCourseInvoice(params: {
  courseTitle: string
  price: number
  senderInvoiceNo: string
  receiverCode?: string
  receiverData?: QPayInvoiceReceiverData
  callbackUrl?: string
  note?: string
}) {
  const vatAmount = calculateVAT(params.price)
  const line = createCourseInvoiceLine({
    courseTitle: params.courseTitle,
    price: params.price,
    vatAmount,
    vatRate: 10
  })

  return {
    sender_invoice_no: params.senderInvoiceNo,
    amount: params.price,
    description: `Win Academy course payment - ${params.courseTitle}`,
    invoice_receiver_code: params.receiverCode,
    invoice_receiver_data: params.receiverData,
    callback_url: params.callbackUrl,
    note: params.note,
    lines: [line]
  }
}

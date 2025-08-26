export const paymentConfig = {
    byl: {
        apiUrl: process.env.BYL_API_URL || 'https://byl.mn/api/v1',
        accessToken: process.env.BYL_ACCESS_TOKEN,
        projectId: process.env.BYL_PROJECT_ID,
    },
    qpay: {
        apiUrl: process.env.QPAY_API_URL || 'https://merchant.qpay.mn/v2',
        merchantCode: process.env.QPAY_MERCHANT_CODE,
        mccCode: process.env.QPAY_MCC_CODE,
    },
} as const

export type PaymentProvider = 'byl' | 'qpay'

export interface PaymentRequest {
    amount: number
    currency: string
    description: string
    orderId: string
    customerEmail?: string
    customerPhone?: string
    returnUrl?: string
    callbackUrl?: string
}

export interface PaymentResponse {
    success: boolean
    paymentId?: string
    paymentUrl?: string
    qrCode?: string
    error?: string
    provider: PaymentProvider
}

export interface PaymentStatus {
    paymentId: string
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
    amount: number
    currency: string
    orderId: string
    provider: PaymentProvider
    transactionId?: string
    paidAt?: Date
}

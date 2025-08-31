export interface Course {
    id: string
    title: string
    description: string
    price: number
    currency: string
    image: string
    duration: string
    instructor: string
    modality: 'online' | 'onsite' | 'hybrid'
}

export interface CheckoutItem {
    courseId: string
    title: string
    price: number
    currency: string
    image: string
}

export interface PaymentMethodInfo {
    provider: 'byl' | 'qpay'
    name: string
    description: string
    logo: string
    supportedCurrencies: string[]
}

export interface PaymentTransaction {
    id: string
    orderId: string
    amount: number
    currency: string
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
    provider: 'byl' | 'qpay'
    courseId: string
    userId: string
    paymentUrl?: string
    qrCode?: string
    transactionId?: string
    createdAt: Date
    updatedAt: Date
    completedAt?: Date
}

export interface CheckoutFormData {
    email: string
    phone: string
    firstName: string
    lastName: string
    paymentMethod: 'byl' | 'qpay'
    agreeToTerms: boolean
}

import { NextRequest, NextResponse } from 'next/server'
import { paymentConfig, PaymentStatus } from '@/lib/payment-config'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const paymentId = searchParams.get('paymentId')
        const provider = searchParams.get('provider') as 'byl' | 'qpay'

        if (!paymentId || !provider) {
            return NextResponse.json(
                { error: 'Missing paymentId or provider' },
                { status: 400 }
            )
        }

        let paymentStatus: PaymentStatus | null

        if (provider === 'byl') {
            paymentStatus = await getBylPaymentStatus(paymentId)
        } else if (provider === 'qpay') {
            paymentStatus = await getQPayPaymentStatus(paymentId)
        } else {
            return NextResponse.json(
                { error: 'Invalid payment provider' },
                { status: 400 }
            )
        }

        if (!paymentStatus) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(paymentStatus)
    } catch (error) {
        console.error('Payment status check error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

async function getBylPaymentStatus(paymentId: string): Promise<PaymentStatus | null> {
    try {
        const response = await fetch(`${paymentConfig.byl.apiUrl}/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${paymentConfig.byl.accessToken}`,
            },
        })

        if (!response.ok) {
            return null
        }

        const data = await response.json()

        return {
            paymentId: data.payment_id || data.id,
            status: mapBylStatus(data.status),
            amount: data.amount,
            currency: data.currency,
            orderId: data.order_id,
            provider: 'byl',
            transactionId: data.transaction_id,
            paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
        }
    } catch (error) {
        console.error('BYL status check error:', error)
        return null
    }
}

async function getQPayPaymentStatus(paymentId: string): Promise<PaymentStatus | null> {
    try {
        const response = await fetch(`${paymentConfig.qpay.apiUrl}/payment/check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${paymentConfig.qpay.merchantCode}`,
            },
            body: JSON.stringify({
                object_type: 'INVOICE',
                object_id: paymentId,
            }),
        })

        if (!response.ok) {
            return null
        }

        const data = await response.json()

        return {
            paymentId: data.invoice_id,
            status: mapQPayStatus(data.payment_status),
            amount: data.amount,
            currency: 'MNT',
            orderId: data.invoice_code,
            provider: 'qpay',
            transactionId: data.payment_id,
            paidAt: data.paid_date ? new Date(data.paid_date) : undefined,
        }
    } catch (error) {
        console.error('QPay status check error:', error)
        return null
    }
}

function mapBylStatus(status: string): 'pending' | 'completed' | 'failed' | 'cancelled' {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'paid':
        case 'success':
            return 'completed'
        case 'failed':
        case 'error':
            return 'failed'
        case 'cancelled':
        case 'canceled':
            return 'cancelled'
        default:
            return 'pending'
    }
}

function mapQPayStatus(status: string): 'pending' | 'completed' | 'failed' | 'cancelled' {
    switch (status?.toLowerCase()) {
        case 'paid':
        case 'complete':
        case 'completed':
            return 'completed'
        case 'failed':
        case 'declined':
            return 'failed'
        case 'cancelled':
        case 'canceled':
            return 'cancelled'
        default:
            return 'pending'
    }
}

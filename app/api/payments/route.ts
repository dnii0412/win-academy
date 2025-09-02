import { NextRequest, NextResponse } from 'next/server'
import { paymentConfig, PaymentRequest, PaymentResponse } from '@/lib/payment-config'

export async function POST(request: NextRequest) {
    try {
        const body: PaymentRequest & { provider: 'byl' | 'qpay' } = await request.json()

        const { provider, amount, currency, description, orderId, customerEmail, customerPhone, returnUrl, callbackUrl } = body

        if (!provider || !amount || !orderId) {
            return NextResponse.json(
                { error: 'Missing required fields: provider, amount, orderId' },
                { status: 400 }
            )
        }

        // Check if payment configuration is available
        if (provider === 'qpay' && !paymentConfig.qpay.merchantCode) {
            return NextResponse.json(
                { error: 'QPay payment configuration missing. Please contact support.' },
                { status: 500 }
            )
        }

        if (provider === 'byl' && (!paymentConfig.byl.accessToken || !paymentConfig.byl.projectId)) {
            return NextResponse.json(
                { error: 'BYL payment configuration missing. Please contact support.' },
                { status: 500 }
            )
        }

        let paymentResponse: PaymentResponse

        if (provider === 'byl') {
            paymentResponse = await createBylPayment({
                amount,
                currency,
                description,
                orderId,
                customerEmail,
                customerPhone,
                returnUrl,
                callbackUrl,
            })
        } else if (provider === 'qpay') {
            paymentResponse = await createQPayPayment({
                amount,
                currency,
                description,
                orderId,
                customerEmail,
                customerPhone,
                returnUrl,
                callbackUrl,
            })
        } else {
            return NextResponse.json(
                { error: 'Invalid payment provider' },
                { status: 400 }
            )
        }

        return NextResponse.json(paymentResponse)
    } catch (error) {
        console.error('Payment creation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

async function createBylPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
        const response = await fetch(`${paymentConfig.byl.apiUrl}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${paymentConfig.byl.accessToken}`,
            },
            body: JSON.stringify({
                project_id: paymentConfig.byl.projectId,
                amount: request.amount,
                currency: request.currency || 'MNT',
                description: request.description,
                order_id: request.orderId,
                customer_email: request.customerEmail,
                customer_phone: request.customerPhone,
                return_url: request.returnUrl,
                callback_url: request.callbackUrl,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            return {
                success: false,
                error: data.message || 'BYL payment creation failed',
                provider: 'byl',
            }
        }

        return {
            success: true,
            paymentId: data.payment_id || data.id,
            paymentUrl: data.payment_url || data.url,
            qrCode: data.qr_code,
            provider: 'byl',
        }
    } catch (error) {
        console.error('BYL payment error:', error)
        return {
            success: false,
            error: 'Failed to create BYL payment',
            provider: 'byl',
        }
    }
}

async function createQPayPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
        const response = await fetch(`${paymentConfig.qpay.apiUrl}/invoice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${paymentConfig.qpay.merchantCode}`,
            },
            body: JSON.stringify({
                invoice_code: request.orderId,
                sender_invoice_no: request.orderId,
                invoice_receiver_code: paymentConfig.qpay.merchantCode,
                invoice_description: request.description,
                amount: request.amount,
                callback_url: request.callbackUrl,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            return {
                success: false,
                error: data.message || 'QPay payment creation failed',
                provider: 'qpay',
            }
        }

        return {
            success: true,
            paymentId: data.invoice_id,
            paymentUrl: data.qpay_shortlink,
            qrCode: data.qr_text,
            provider: 'qpay',
        }
    } catch (error) {
        console.error('QPay payment error:', error)
        return {
            success: false,
            error: 'Failed to create QPay payment',
            provider: 'qpay',
        }
    }
}

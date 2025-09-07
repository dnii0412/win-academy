import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const provider = request.headers.get('x-payment-provider') || 'unknown'

        console.log('Payment callback received:', {
            provider,
            body,
            timestamp: new Date().toISOString(),
        })

        // Handle different payment providers
        if (provider === 'byl' || body.source === 'byl') {
            return handleBylCallback(body)
        } else if (provider === 'qpay' || body.source === 'qpay') {
            return handleQPayCallback(body)
        } else {
            // Try to determine provider from callback data
            if (body.payment_id || body.transaction_id) {
                return handleBylCallback(body)
            } else if (body.invoice_id || body.qpay_shortlink) {
                return handleQPayCallback(body)
            }
        }

        return NextResponse.json({ success: true, message: 'Callback received' })
    } catch (error) {
        console.error('Payment callback error:', error)
        return NextResponse.json(
            { error: 'Callback processing failed' },
            { status: 500 }
        )
    }
}

async function handleBylCallback(data: any) {
    try {
        const {
            payment_id,
            order_id,
            status,
            amount,
            currency,
            transaction_id,
            paid_at,
        } = data

        console.log('BYL callback processed:', {
            payment_id,
            order_id,
            status,
            amount,
            transaction_id,
        })

        // Here you would typically:
        // 1. Verify the callback signature/authenticity
        // 2. Update your database with payment status
        // 3. Send confirmation emails
        // 4. Grant access to purchased courses
        // 5. Log the transaction

        // Example of what you might do:
        if (status === 'completed' || status === 'paid') {
            // Update user enrollment
            // Send confirmation email
            // Log successful payment
            console.log(`Payment ${payment_id} completed for order ${order_id}`)
        } else if (status === 'failed') {
            // Log failed payment
            // Optionally notify user
            console.log(`Payment ${payment_id} failed for order ${order_id}`)
        }

        return NextResponse.json({ success: true, processed: 'byl' })
    } catch (error) {
        console.error('BYL callback error:', error)
        return NextResponse.json(
            { error: 'BYL callback processing failed' },
            { status: 500 }
        )
    }
}

async function handleQPayCallback(data: any) {
    try {
        const {
            invoice_id,
            invoice_code,
            payment_status,
            amount,
            payment_id,
            paid_date,
        } = data

        console.log('QPay callback processed:', {
            invoice_id,
            invoice_code,
            payment_status,
            amount,
            payment_id,
        })

        // Import required models
        const dbConnect = require('@/lib/mongoose').default
        const Order = require('@/lib/models/Order').default
        const CourseAccess = require('@/lib/models/CourseAccess').default
        
        await dbConnect()

        // Find the order by invoice code (orderId)
        const order = await Order.findOne({ 
            $or: [
                { qpayInvoiceCode: invoice_code },
                { 'metadata.orderId': invoice_code }
            ]
        })

        if (!order) {
            console.error('Order not found for invoice code:', invoice_code)
            return NextResponse.json({ success: false, error: 'Order not found' })
        }

        if (payment_status === 'paid' || payment_status === 'completed') {
            // Update order status
            order.status = 'completed'
            order.transactionId = payment_id
            order.qpayInvoiceId = invoice_id
            order.qpayInvoiceCode = invoice_code
            order.metadata = {
                ...order.metadata,
                paidDate: paid_date,
                paymentId: payment_id
            }
            await order.save()

            // Create course enrollment
            try {
                const existingEnrollment = await CourseAccess.findOne({
                    userId: order.userId,
                    courseId: order.courseId
                })

                if (!existingEnrollment) {
                    const enrollment = new CourseAccess({
                        userId: order.userId,
                        courseId: order.courseId,
                        status: 'completed',
                        accessGrantedBy: order.userId, // Self-enrollment through payment
                        notes: `Enrolled via QPay payment. Order ID: ${order._id}`
                    })
                    await enrollment.save()
                    console.log(`Course enrollment created for user ${order.userId}, course ${order.courseId}`)
                }
            } catch (enrollmentError) {
                console.error('Error creating enrollment:', enrollmentError)
            }

            console.log(`QPay payment ${payment_id} completed for invoice ${invoice_code}. User enrolled in course.`)
        } else if (payment_status === 'failed' || payment_status === 'declined') {
            // Update order status to failed
            order.status = 'failed'
            order.transactionId = payment_id
            order.qpayInvoiceId = invoice_id
            order.qpayInvoiceCode = invoice_code
            await order.save()
            
            console.log(`QPay payment ${payment_id} failed for invoice ${invoice_code}`)
        }

        return NextResponse.json({ success: true, processed: 'qpay' })
    } catch (error) {
        console.error('QPay callback error:', error)
        return NextResponse.json(
            { error: 'QPay callback processing failed' },
            { status: 500 }
        )
    }
}

// Handle GET requests for webhook verification (some providers send verification requests)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const challenge = searchParams.get('challenge')
    const verify = searchParams.get('verify')

    if (challenge) {
        // Some payment providers send a challenge parameter for webhook verification
        return NextResponse.json({ challenge })
    }

    if (verify) {
        // Return verification response
        return NextResponse.json({ verified: true })
    }

    return NextResponse.json({ status: 'webhook endpoint active' })
}

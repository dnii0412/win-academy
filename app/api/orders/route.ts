import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongoose'
import Order from '@/lib/models/Order'
import Course from '@/lib/models/Course'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            courseId,
            courseTitle,
            courseTitleMn,
            amount,
            currency,
            paymentMethod,
            customerEmail,
            customerPhone,
            customerName,
            orderId
        } = body

        // Validate required fields
        if (!courseId || !courseTitle || !amount || !paymentMethod || !customerEmail || !orderId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        await dbConnect()

        // Verify course exists
        const course = await Course.findById(courseId)
        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            )
        }

        // Find or create user
        let user = await User.findOne({ email: customerEmail })
        if (!user) {
            // Create user if they don't exist
            user = new User({
                email: customerEmail,
                fullName: customerName,
                phone: customerPhone,
                provider: 'credentials',
                emailVerified: false
            })
            await user.save()
        } else {
            // Check if the existing user has different information
            // This helps prevent account confusion
            if (user.fullName && user.fullName !== customerName) {
                return NextResponse.json(
                    { 
                        error: 'Email already registered',
                        message: 'This email address is already registered with a different name. Please use your existing account or a different email address.',
                        existingUser: true
                    },
                    { status: 409 }
                )
            }
        }

        // Create order
        const order = new Order({
            courseId,
            courseTitle,
            courseTitleMn,
            userId: user._id,
            userName: customerName,
            userEmail: customerEmail,
            amount,
            currency: currency || 'MNT',
            paymentMethod,
            paymentProvider: paymentMethod === 'qpay' ? 'qpay' : 'byl',
            status: 'pending',
            metadata: {
                orderId,
                customerPhone
            }
        })

        await order.save()

        return NextResponse.json({
            success: true,
            order: {
                _id: order._id,
                orderId: orderId,
                courseId,
                amount,
                currency,
                status: order.status
            }
        })

    } catch (error) {
        console.error('Error creating order:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        // This could be used to get order status
        const { searchParams } = new URL(request.url)
        const orderId = searchParams.get('orderId')

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            )
        }

        await dbConnect()

        const order = await Order.findOne({ 
            $or: [
                { _id: orderId },
                { 'metadata.orderId': orderId }
            ]
        }).populate('courseId', 'title titleMn')

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ order })

    } catch (error) {
        console.error('Error fetching order:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

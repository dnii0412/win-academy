import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
    try {
        // Ensure MongoDB is connected
        await dbConnect()
        
        const body = await request.json()
        const { fullName, firstName, lastName, email, phone, phoneNumber, password } = body

        // Server-side validation
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Check if we have either fullName or firstName+lastName
        if (!fullName && (!firstName || !lastName)) {
            return NextResponse.json(
                { error: 'Either fullName or both firstName and lastName are required' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            )
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 12)

        // Prepare user data
        const userData: any = {
            email,
            password: hashedPassword,
            provider: 'credentials',
            emailVerified: false,
        }

        // Handle name fields
        if (firstName && lastName) {
            userData.firstName = firstName
            userData.lastName = lastName
            userData.fullName = `${firstName} ${lastName}`.trim()
        } else if (fullName) {
            userData.fullName = fullName
            // The pre-save middleware will handle firstName/lastName splitting
        }

        // Handle phone fields
        if (phoneNumber) {
            userData.phoneNumber = phoneNumber
            userData.phone = phoneNumber
        } else if (phone) {
            userData.phone = phone
            userData.phoneNumber = phone
        }

        // Create new user
        const user = new User(userData)

        await user.save()

        // Return success without password
        const { password: _, ...userWithoutPassword } = user.toObject()

        return NextResponse.json({
            message: 'User registered successfully',
            user: userWithoutPassword
        })

    } catch (error: any) {
        console.error('Registration error:', error)
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            )
        }
        
        if (error.name === 'MongooseServerSelectionError') {
            return NextResponse.json(
                { error: 'Database connection failed. Please try again in a moment.' },
                { status: 503 }
            )
        }
        
        if (error.name === 'MongoServerError' && error.code === 8000) {
            return NextResponse.json(
                { error: 'Database authentication failed. Please contact support.' },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        )
    }
}

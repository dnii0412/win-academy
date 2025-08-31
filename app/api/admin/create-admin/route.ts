import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
    try {
        // Ensure MongoDB is connected
        await dbConnect()

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ email: 'admin@winacademy.mn' })

        if (existingAdmin) {
            return NextResponse.json(
                { message: 'Admin user already exists' },
                { status: 400 }
            )
        }

        // Hash the password
        const hashedPassword = await bcryptjs.hash('password', 12)

        // Create admin user
        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'User',
            fullName: 'Admin User',
            email: 'admin@winacademy.mn',
            password: hashedPassword,
            provider: 'credentials',
            emailVerified: true,
            role: 'admin'
        })

        await adminUser.save()

        return NextResponse.json(
            {
                message: 'Admin user created successfully!',
                credentials: {
                    email: 'admin@winacademy.mn',
                    password: 'password',
                    role: 'admin'
                }
            },
            { status: 201 }
        )

    } catch (error: any) {
        console.error('Error creating admin user:', error)
        return NextResponse.json(
            { error: 'Failed to create admin user', details: error.message },
            { status: 500 }
        )
    }
}

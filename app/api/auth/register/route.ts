import { NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"
import { z } from "zod"

const client = new MongoClient(process.env.MONGODB_URI!)

const registerSchema = z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(8, "Phone number must be at least 8 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate input
        const validationResult = registerSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                },
                { status: 400 }
            )
        }

        const { fullName, email, phone, password } = validationResult.data

        // Connect to MongoDB
        await client.connect()
        const db = client.db("newera_auth")
        const users = db.collection("users")

        // Check if user already exists
        const existingUser = await users.findOne({
            $or: [{ email }, { phone }]
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email or phone already exists" },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const newUser = {
            name: fullName,
            email,
            phone,
            password: hashedPassword,
            provider: "credentials",
            emailVerified: null,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        const result = await users.insertOne(newUser)

        return NextResponse.json(
            {
                message: "User created successfully",
                userId: result.insertedId.toString()
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    } finally {
        await client.close()
    }
}

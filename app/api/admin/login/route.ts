import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import User from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      )
    }

    // Connect to database
    await dbConnect()

    // Find user with admin role
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      role: "admin"
    })

    console.log("Admin login attempt:", { email: email.toLowerCase(), userFound: !!user })

    if (!user) {
      // Also check if user exists but doesn't have admin role
      const regularUser = await User.findOne({ email: email.toLowerCase() })
      if (regularUser) {
        console.log("User found but not admin:", { email: regularUser.email, role: regularUser.role })
        return NextResponse.json(
          { message: "User exists but doesn't have admin privileges" },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Verify password
    console.log("Password check:", { 
      hasPassword: !!user.password, 
      passwordLength: user.password?.length,
      inputPasswordLength: password?.length 
    })
    
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log("Password validation result:", isPasswordValid)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    )

    // Return success response
    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

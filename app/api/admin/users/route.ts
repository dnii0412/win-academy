import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import User from "@/lib/models/User"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
      if (decoded.role !== "admin") {
        return NextResponse.json(
          { message: "Access denied" },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      )
    }

    // Connect to database
    await dbConnect()

    // Get all users
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select("firstName lastName fullName email role createdAt lastLogin status phoneNumber")
      .lean()

    return NextResponse.json({
      users: users.map((user: any) => ({
        _id: user._id.toString(),
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        fullName: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.email,
        role: user.role || "user",
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        lastLogin: user.lastLogin?.toISOString(),
        status: user.status || "completed",
        phoneNumber: user.phoneNumber || ""
      }))
    })

  } catch (error) {
    console.error("Admin users error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
      if (decoded.role !== "admin") {
        return NextResponse.json(
          { message: "Access denied" },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, email, password, role, phoneNumber, status } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { message: "Missing required fields: firstName, lastName, email, password, role" },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      )
    }

    // Validate role
    if (!["user", "admin", "instructor"].includes(role)) {
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      )
    }

    // Connect to database
    await dbConnect()

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 10), // Hash the password
      role,
      phoneNumber: phoneNumber || "",
      status: status || "completed",
      createdAt: new Date()
    })

    await newUser.save()

    return NextResponse.json({
      message: "User created successfully",
      user: {
        _id: newUser._id.toString(),
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        phoneNumber: newUser.phoneNumber,
        createdAt: newUser.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

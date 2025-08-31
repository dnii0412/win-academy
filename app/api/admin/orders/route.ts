import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import Order from "@/lib/models/Order"
import Course from "@/lib/models/Course"
import User from "@/lib/models/User"

export async function GET(
  request: NextRequest,
) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Connect to database
    await dbConnect()

    // Get all orders with populated course and user information
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(100) // Limit to prevent performance issues

    return NextResponse.json({ 
      orders,
      total: orders.length
    })

  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.courseId || !body.userId || !body.amount) {
      return NextResponse.json({ 
        error: "Missing required fields",
        required: ["courseId", "userId", "amount"]
      }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Verify course exists
    const course = await Course.findById(body.courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Verify user exists
    const user = await User.findById(body.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create order
    const order = new Order({
      courseId: body.courseId,
      courseTitle: course.title,
      courseTitleMn: course.titleMn,
      userId: body.userId,
      userName: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
      userEmail: user.email,
      amount: body.amount,
      currency: body.currency || 'USD',
      paymentMethod: body.paymentMethod || 'manual',
      paymentProvider: body.paymentProvider,
      transactionId: body.transactionId,
      status: body.status || 'pending',
      notes: body.notes
    })

    await order.save()

    return NextResponse.json({
      message: "Order created successfully",
      order
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

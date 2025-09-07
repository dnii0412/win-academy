import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/mongoose"
import User from "@/lib/models/User"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Find user by email
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return user profile data
    const profile = {
      _id: user._id.toString(),
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      fullName: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      avatar: user.avatar || "",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { fullName, firstName, lastName, phoneNumber, avatar } = body

    await dbConnect()

    // Find user by email
    const user = await User.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user profile - handle fullName like admin API
    const updateData: any = {}
    if (fullName !== undefined) {
      updateData.fullName = fullName
      // Also update firstName and lastName for backward compatibility
      const nameParts = fullName.trim().split(" ")
      updateData.firstName = nameParts[0] || ""
      updateData.lastName = nameParts.slice(1).join(" ") || ""
    } else {
      // Fallback to individual firstName/lastName if fullName not provided
      if (firstName !== undefined) updateData.firstName = firstName
      if (lastName !== undefined) updateData.lastName = lastName
    }
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber
    if (avatar !== undefined) updateData.avatar = avatar

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    // Return updated profile data
    const profile = {
      _id: updatedUser._id.toString(),
      firstName: updatedUser.firstName || "",
      lastName: updatedUser.lastName || "",
      fullName: updatedUser.fullName || `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber || "",
      avatar: updatedUser.avatar || "",
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
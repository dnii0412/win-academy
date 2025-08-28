import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'

// GET /api/user/profile - Get user profile by email
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Ensure user can only access their own profile
    if (email !== session.user.email) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await dbConnect()

    const user = await User.findOne({ email })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      profile: {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        avatar: user.avatar || ''
      }
    })

  } catch (error: any) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, profile } = body

    if (!email || !profile) {
      return NextResponse.json(
        { error: 'Email and profile data are required' },
        { status: 400 }
      )
    }

    // Ensure user can only update their own profile
    if (email !== session.user.email) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await dbConnect()

    // Find and update user
    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phoneNumber: profile.phoneNumber,
          avatar: profile.avatar,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        avatar: updatedUser.avatar
      }
    })

  } catch (error: any) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

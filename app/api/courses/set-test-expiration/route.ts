import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import CourseAccess from '@/lib/models/CourseAccess'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId, daysFromNow } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    const days = daysFromNow || 7 // Default to 7 days if not specified

    await dbConnect()

    // Find user by email
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate expiration date
    const now = new Date()
    const expirationDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    // Update course access with new expiration date
    const courseAccess = await CourseAccess.findOneAndUpdate(
      { 
        userId: user._id.toString(),
        courseId: courseId,
        hasAccess: true
      },
      { 
        expiresAt: expirationDate
      },
      { new: true }
    )

    if (!courseAccess) {
      return NextResponse.json({ error: 'Course access not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: `Course expiration set to ${days} days from now`,
      courseAccess: {
        courseId: courseAccess.courseId,
        expiresAt: courseAccess.expiresAt,
        daysFromNow: days
      }
    })

  } catch (error) {
    console.error('Error setting test expiration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

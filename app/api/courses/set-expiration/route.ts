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

    const { courseId, expiresAt } = await request.json()

    if (!courseId || !expiresAt) {
      return NextResponse.json({ error: 'Course ID and expiration date are required' }, { status: 400 })
    }

    await dbConnect()

    // Find user by email
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update course access with new expiration date
    const courseAccess = await CourseAccess.findOneAndUpdate(
      { 
        userId: user._id.toString(),
        courseId: courseId,
        hasAccess: true
      },
      { 
        expiresAt: new Date(expiresAt)
      },
      { new: true }
    )

    if (!courseAccess) {
      return NextResponse.json({ error: 'Course access not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Course expiration updated successfully',
      courseAccess: {
        courseId: courseAccess.courseId,
        expiresAt: courseAccess.expiresAt
      }
    })

  } catch (error) {
    console.error('Error setting course expiration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

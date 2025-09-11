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

    await dbConnect()

    // Find user by email
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    
    // Find all expired course access records for this user
    const expiredAccess = await CourseAccess.find({
      userId: user._id.toString(),
      hasAccess: true,
      expiresAt: { $lt: now }
    })

    if (expiredAccess.length === 0) {
      return NextResponse.json({ 
        message: 'No expired courses found',
        expiredCount: 0,
        revokedCourses: []
      })
    }

    // Revoke access for expired courses
    const revokedCourses = []
    for (const access of expiredAccess) {
      await CourseAccess.findOneAndUpdate(
        { _id: access._id },
        { 
          hasAccess: false,
          status: 'expired'
        }
      )
      revokedCourses.push({
        courseId: access.courseId,
        expiresAt: access.expiresAt
      })
    }

    return NextResponse.json({
      message: `Successfully revoked access for ${expiredAccess.length} expired courses`,
      expiredCount: expiredAccess.length,
      revokedCourses
    })

  } catch (error) {
    console.error('Error checking expired courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

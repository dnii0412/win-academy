import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/mongoose"
import User from "@/lib/models/User"
import CourseAccess from "@/lib/models/CourseAccess"
import Lesson from "@/lib/models/Lesson"

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

    // Get enrolled courses
    const courseAccesses = await CourseAccess.find({
      userId: user._id.toString(),
      hasAccess: true
    }).lean()

    const courseIds = courseAccesses.map(access => access.courseId)

    // Get total lessons across all enrolled courses
    const totalLessons = await Lesson.countDocuments({
      courseId: { $in: courseIds }
    })

    // Get completed lessons (this would need to be tracked in a separate collection)
    // For now, we'll use a mock value
    const completedLessons = 0

    const stats = {
      totalLessons,
      completedLessons,
      enrolledCourses: courseIds.length,
      completionRate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error("Error fetching lesson stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch lesson stats" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/mongoose"
import User from "@/lib/models/User"
import CourseAccess from "@/lib/models/CourseAccess"
import CourseModel from "@/lib/models/Course"
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

    // Fetch course details
    const courses = await CourseModel.find({
      _id: { $in: courseIds }
    }).select({
      _id: 1,
      title: 1,
      titleMn: 1,
      description: 1,
      descriptionMn: 1,
      thumbnailUrl: 1,
      instructor: 1,
      instructorMn: 1,
      totalLessons: 1,
      enrolledUsers: 1,
      createdAt: 1
    }).lean()

    // Get lesson counts and progress for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        // Get total lessons for this course
        const totalLessons = await Lesson.countDocuments({
          courseId: course._id
        })

        // Get completed lessons (this would need to be tracked in a separate collection)
        // For now, we'll use a mock value
        const completedLessons = 0
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

        return {
          ...course,
          _id: (course._id as any).toString(),
          totalLessons,
          completedLessons,
          progress
        }
      })
    )

    return NextResponse.json({
      courses: coursesWithStats,
      total: coursesWithStats.length
    })

  } catch (error) {
    console.error("Error fetching enrolled courses:", error)
    return NextResponse.json(
      { error: "Failed to fetch enrolled courses" },
      { status: 500 }
    )
  }
}
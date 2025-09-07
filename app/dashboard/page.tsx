import { auth } from "@/auth"
import { redirect } from "next/navigation"
import dbConnect from "@/lib/mongoose"
import User from "@/lib/models/User"
import CourseAccess from "@/lib/models/CourseAccess"
import CourseModel from "@/lib/models/Course"
import Lesson from "@/lib/models/Lesson"
import DashboardClient from "./DashboardClient"

interface EnrolledCourse {
  _id: string
  title: string
  titleMn?: string
  description: string
  descriptionMn?: string
  thumbnailUrl?: string
  progress?: number
  totalLessons?: number
  completedLessons?: number
  instructor: string
  instructorMn?: string
}

async function getEnrolledCourses(userEmail: string): Promise<EnrolledCourse[]> {
  try {
    await dbConnect()

    // Find user by email
    const user = await User.findOne({ email: userEmail })
    if (!user) {
      return []
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
          title: course.title || "",
          titleMn: course.titleMn || "",
          description: course.description || "",
          descriptionMn: course.descriptionMn || "",
          thumbnailUrl: course.thumbnailUrl || "",
          instructor: course.instructor || "",
          instructorMn: course.instructorMn || "",
          totalLessons,
          completedLessons,
          progress
        }
      })
    )

    return coursesWithStats

  } catch (error) {
    console.error("Error fetching enrolled courses:", error)
    return []
  }
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect("/login")
  }

  const enrolledCourses = await getEnrolledCourses(session.user.email)

  return (
    <DashboardClient 
      enrolledCourses={enrolledCourses}
      user={session.user}
    />
  )
}

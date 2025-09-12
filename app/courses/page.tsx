import { Course } from "@/types/course"
import dbConnect from "@/lib/mongoose"
import CourseModel from "@/lib/models/Course"
import { auth } from "@/auth"
import User from "@/lib/models/User"
import { getMultipleCourseEnrollmentCounts, getUserEnrolledCourses } from "@/lib/course-enrollment"
import dynamicImport from "next/dynamic"
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const CoursesPageClient = dynamicImport(() => import("@/app/courses/CoursesPageClient"), {
  loading: () => <div>Loading...</div>
})

export const metadata: Metadata = {
  title: 'All Courses - Digital Skills Training',
  description: 'Browse all our digital skills courses including digital marketing, web design, AI programming, and more. Learn from industry experts and advance your career.',
  keywords: [
    'digital marketing courses',
    'web design training',
    'AI programming courses',
    'digital skills training',
    'online courses Mongolia',
    'professional development',
    'tech education',
    'programming courses'
  ],
  openGraph: {
    title: 'All Courses - Digital Skills Training | WIN Academy',
    description: 'Browse all our digital skills courses including digital marketing, web design, AI programming, and more. Learn from industry experts and advance your career.',
    images: [
      {
        url: '/images/win_logo_main.jpg',
        width: 1200,
        height: 630,
        alt: 'WIN Academy Courses - Digital Skills Training',
      },
    ],
  },
  twitter: {
    title: 'All Courses - Digital Skills Training | WIN Academy',
    description: 'Browse all our digital skills courses including digital marketing, web design, AI programming, and more.',
    images: ['/images/win_logo_main.jpg'],
  },
  alternates: {
    canonical: '/courses',
  },
}

async function getCoursesWithEnrollment(): Promise<Course[]> {
  try {
    await dbConnect()
    
    // Fetch all courses from database
    const courses = await CourseModel.find({ 
      status: { $ne: 'archived' }
    }).select({
      _id: 1,
      title: 1,
      titleMn: 1,
      description: 1,
      descriptionMn: 1,
      price: 1,
      price45Days: 1,
      price90Days: 1,
      originalPrice: 1,
      originalPrice45Days: 1,
      originalPrice90Days: 1,
      category: 1,
      categoryMn: 1,
      level: 1,
      levelMn: 1,
      duration: 1,
      instructor: 1,
      instructorMn: 1,
      thumbnailUrl: 1,
      featured: 1,
      totalLessons: 1,
      createdAt: 1,
      status: 1
    }).sort({ featured: -1, createdAt: -1 }).lean()

    const courseIds = courses.map(course => (course._id as any).toString())
    
    // Get enrollment counts for all courses
    const enrollmentCounts = await getMultipleCourseEnrollmentCounts(courseIds)
    
    // Get session to check user enrollment status
    const session = await auth()
    let userEnrolledCourses: string[] = []
    
    if (session?.user?.email) {
      // Find user by email
      const user = await User.findOne({ email: session.user.email })
      if (user) {
        // Get user's enrolled course IDs
        userEnrolledCourses = await getUserEnrolledCourses(user._id.toString())
      }
    }
    
    // Add enrollment data to courses
    const coursesWithEnrollment = courses.map(course => {
      const courseId = (course._id as any).toString()
      return {
        ...course,
        _id: courseId,
        enrolledUsers: enrollmentCounts.get(courseId) || 0,
        isEnrolled: userEnrolledCourses.includes(courseId)
      }
    })
    
    return coursesWithEnrollment as unknown as Course[]
    
  } catch (error) {
    console.error('Error fetching courses:', error)
    return []
  }
}

export default async function CoursesPage() {
  const courses = await getCoursesWithEnrollment()

  return <CoursesPageClient courses={courses} />
}

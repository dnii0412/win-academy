import { Course } from "@/types/course"
import dbConnect from "@/lib/mongoose"
import CourseModel from "@/lib/models/Course"
import { auth } from "@/auth"
import CourseAccess from "@/lib/models/CourseAccess"
import User from "@/lib/models/User"
import dynamic from "next/dynamic"
import type { Metadata } from 'next'

const CoursesPageClient = dynamic(() => import("@/app/courses/CoursesPageClient"), {
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
      enrolledUsers: 1,
      createdAt: 1,
      status: 1
    }).sort({ featured: -1, createdAt: -1 }).lean()

    // Get session to check enrollment status
    const session = await auth()
    
        if (session?.user?.email) {
      // Find user by email
      const user = await User.findOne({ email: session.user.email })
      if (user) {
        // Get enrolled course IDs
        const enrolledCourses = await CourseAccess.find({
          userId: user._id.toString(),
          hasAccess: true
        }).select('courseId').lean()
        
        const enrolledCourseIds = enrolledCourses.map(access => access.courseId.toString())
        
        // Add enrollment status to courses
        const coursesWithEnrollment = courses.map(course => ({
          ...course,
          _id: (course._id as any).toString(),
          isEnrolled: enrolledCourseIds.includes((course._id as any).toString())
        }))
        
        
        return coursesWithEnrollment as unknown as Course[]
      }
    }
    
    // If no session or user not found, return courses without enrollment status
    return courses.map(course => ({
      ...course,
      _id: (course._id as any).toString(),
      isEnrolled: false
    })) as unknown as Course[]
    
  } catch (error) {
    console.error('Error fetching courses:', error)
    return []
  }
}

export default async function CoursesPage() {
  const courses = await getCoursesWithEnrollment()

  return <CoursesPageClient courses={courses} />
}

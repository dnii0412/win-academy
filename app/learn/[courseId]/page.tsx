import { Course } from "@/types/course"
import dbConnect from "@/lib/mongoose"
import CourseModel from "@/lib/models/Course"
import Subcourse from "@/lib/models/Subcourse"
import Lesson from "@/lib/models/Lesson"
import { BUNNY_STREAM_CONFIG } from "@/lib/bunny-stream"
import { auth } from "@/auth"
import CourseAccess from "@/lib/models/CourseAccess"
import User from "@/lib/models/User"
import dynamicImport from "next/dynamic"
import mongoose from "mongoose"

export const dynamic = 'force-dynamic'

const LearnPageClient = dynamicImport(() => import("@/app/learn/[courseId]/LearnPageClient"), {
  loading: () => <div>Loading...</div>
})

interface Lesson {
  _id: string
  title: string
  titleMn: string
  type: string
  duration: number
  videoUrl?: string
  videoStatus?: string
  description?: string
  descriptionMn?: string
  order: number
}

interface Subcourse {
  _id: string
  title: string
  titleMn: string
  description?: string
  descriptionMn?: string
  order: number
  status: string
  lessons: Lesson[]
}

async function getLearnPageData(courseId: string) {
  try {
    console.log('getLearnPageData: Starting with courseId:', courseId)
    
    // Validate courseId
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      console.error('getLearnPageData: Invalid courseId:', courseId)
      return { 
        course: null, 
        subcourses: [], 
        hasAccess: false, 
        error: "Invalid course ID" 
      }
    }

    await dbConnect()
    console.log('getLearnPageData: Database connected')
    
    // Get session to check access
    const session = await auth()
    console.log('getLearnPageData: Session retrieved:', !!session?.user?.email)
    
    if (!session?.user?.email) {
      console.log('getLearnPageData: No session found')
      return { 
        course: null, 
        subcourses: [], 
        hasAccess: false, 
        error: "Please log in to access this course" 
      }
    }

    // Find user by email
    const user = await User.findOne({ email: session.user.email })
    console.log('getLearnPageData: User found:', !!user)
    if (!user) {
      console.error('getLearnPageData: User not found for email:', session.user.email)
      return { 
        course: null, 
        subcourses: [], 
        hasAccess: false, 
        error: "User not found" 
      }
    }

    // Fetch course data
    const course = await CourseModel.findById(courseId).lean()
    console.log('getLearnPageData: Course found:', !!course)
    if (!course) {
      console.error('getLearnPageData: Course not found for ID:', courseId)
      return { 
        course: null, 
        subcourses: [], 
        hasAccess: false, 
        error: "Course not found" 
      }
    }

    // Check if user has access to this course
    // Try both user._id.toString() and user.email since orders might use either format
    const courseAccess = await CourseAccess.findOne({
      $or: [
        { userId: user._id.toString(), courseId: new mongoose.Types.ObjectId(courseId), hasAccess: true },
        { userId: user.email, courseId: new mongoose.Types.ObjectId(courseId), hasAccess: true }
      ]
    }).lean()
    
    const hasAccess = !!courseAccess
    console.log('getLearnPageData: User has access:', hasAccess, 'Access record:', !!courseAccess, 'User ID:', user._id.toString(), 'User email:', user.email)

    // Fetch subcourses if user has access
    let subcourses: Subcourse[] = []
    if (hasAccess) {
      console.log('getLearnPageData: Fetching subcourses for course:', courseId)
      const fetchedSubcourses = await Subcourse.find({ courseId })
        .sort({ order: 1 })
        .lean()
      
      console.log('getLearnPageData: Found subcourses:', fetchedSubcourses.length)
      
      // Fetch lessons for each subcourse
      const subcoursesWithLessons = await Promise.all(
        fetchedSubcourses.map(async (subcourse) => {
          const lessons = await Lesson.find({ 
            subcourseId: subcourse._id 
          })
          .sort({ order: 1 })
          .lean()
          
          console.log(`getLearnPageData: Found ${lessons.length} lessons for subcourse ${subcourse._id}`)
          
          return {
            ...subcourse,
            lessons: lessons.map(lesson => ({
              ...lesson,
              _id: (lesson._id as any).toString(),
              subcourseId: (lesson.subcourseId as any).toString(),
              courseId: (lesson.courseId as any).toString(),
              // Map video properties to match the expected interface
              videoUrl: lesson.video?.videoId ? `https://iframe.mediadelivery.net/embed/${BUNNY_STREAM_CONFIG.libraryId}/${lesson.video.videoId}` : undefined,
              videoStatus: lesson.video?.status || 'processing',
              duration: lesson.video?.duration || lesson.durationSec || 0
            }))
          }
        })
      )
      
      subcourses = subcoursesWithLessons as unknown as Subcourse[]
      console.log('getLearnPageData: Processed subcourses with lessons:', subcourses.length)
    }

    console.log('getLearnPageData: Returning data successfully')
    return {
      course: course ? {
        ...course,
        _id: (course as any)._id.toString()
      } as unknown as Course : null,
      subcourses: subcourses.map(subcourse => ({
        ...subcourse,
        _id: (subcourse._id as any).toString(),
        courseId: (subcourse as any).courseId.toString()
      })),
      hasAccess,
      error: null
    }
    } catch (error) {
    console.error('getLearnPageData: Error fetching learn page data:', error)
    console.error('getLearnPageData: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      courseId
    })
    return { 
      course: null, 
      subcourses: [], 
      hasAccess: false, 
      error: "Failed to load course information" 
    }
  }
}

export default async function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const { course, subcourses, hasAccess, error } = await getLearnPageData(courseId)
    
    return (
    <LearnPageClient 
      course={course}
      subcourses={subcourses}
      hasAccess={hasAccess}
      error={error}
      courseId={courseId}
    />
  )
}
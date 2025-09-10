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
    // Validate courseId
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return { 
        course: null, 
        subcourses: [], 
        hasAccess: false, 
        error: "Invalid course ID" 
      }
    }

    await dbConnect()
    
    // Get session to check access
    const session = await auth()
    
    if (!session?.user?.email) {
      return { 
        course: null, 
        subcourses: [], 
        hasAccess: false, 
        error: "Please log in to access this course" 
      }
    }

    // Find user by email
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return { 
        course: null, 
        subcourses: [], 
        hasAccess: false, 
        error: "User not found" 
      }
    }

    // Fetch course data
    const course = await CourseModel.findById(courseId).lean()
    if (!course) {
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
    
    // Also check without hasAccess filter to see if access record exists
    const anyAccess = await CourseAccess.findOne({
      $or: [
        { userId: user._id.toString(), courseId: new mongoose.Types.ObjectId(courseId) },
        { userId: user.email, courseId: new mongoose.Types.ObjectId(courseId) }
      ]
    }).lean()
    
    const hasAccess = !!courseAccess

    // Fetch subcourses if user has access
    let subcourses: Subcourse[] = []
    if (hasAccess) {
      const fetchedSubcourses = await Subcourse.find({ courseId })
        .sort({ order: 1 })
        .lean()
      
      // Fetch lessons for each subcourse
      const subcoursesWithLessons = await Promise.all(
        fetchedSubcourses.map(async (subcourse) => {
          const lessons = await Lesson.find({ 
            subcourseId: subcourse._id 
          })
          .sort({ order: 1 })
          .lean()
          
          return {
            ...subcourse,
            lessons: lessons.map(lesson => {
              const mappedLesson = {
                ...lesson,
                _id: (lesson._id as any).toString(),
                subcourseId: (lesson.subcourseId as any).toString(),
                courseId: (lesson.courseId as any).toString(),
                // Map video properties to match the expected interface
                videoUrl: lesson.videoUrl || (lesson.video?.videoId ? `https://iframe.mediadelivery.net/embed/${BUNNY_STREAM_CONFIG.libraryId}/${lesson.video.videoId}` : undefined),
                videoStatus: lesson.videoUrl ? 'ready' : (lesson.video?.status || 'processing'),
                duration: lesson.video?.duration || lesson.durationSec || 0
              }
              
              // Debug logging for video data
              console.log('📹 Lesson video data:', {
                lessonId: mappedLesson._id,
                title: (lesson as any).title,
                
                videoUrl: mappedLesson.videoUrl,
                videoStatus: mappedLesson.videoStatus,
                originalVideoUrl: lesson.videoUrl,
                originalVideo: lesson.video
              })
              
              return mappedLesson
            })
          }
        })
      )
      
      subcourses = subcoursesWithLessons as unknown as Subcourse[]
    }
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
      error: null,
      // Debug information
      debug: {
        userId: user._id.toString(),
        userEmail: user.email,
        courseId: courseId,
        courseAccessExists: !!courseAccess,
        anyAccessExists: !!anyAccess,
        courseAccessData: courseAccess ? {
          userId: (courseAccess as any).userId,
          hasAccess: (courseAccess as any).hasAccess,
          accessType: (courseAccess as any).accessType,
          status: (courseAccess as any).status
        } : null
      }
    }
    } catch (error) {
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
  const { course, subcourses, hasAccess, error, debug } = await getLearnPageData(courseId)
    
    return (
    <LearnPageClient 
      course={course}
      subcourses={subcourses}
      hasAccess={hasAccess}
      error={error}
      courseId={courseId}
      debug={debug}
    />
  )
}
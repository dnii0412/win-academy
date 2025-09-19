import { Course } from "@/types/course"
import dbConnect from "@/lib/mongoose"
import CourseModel from "@/lib/models/Course"
import Subcourse from "@/lib/models/Subcourse"
import Lesson from "@/lib/models/Lesson"
import { auth } from "@/auth"
import CourseAccess from "@/lib/models/CourseAccess"
import User from "@/lib/models/User"
import dynamicImport from "next/dynamic"
import type { Metadata } from 'next'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

const CourseOverviewClient = dynamicImport(() => import("@/app/courses/[courseId]/CourseOverviewClient"), {
  loading: () => <div>Loading...</div>
})

interface Lesson {
  _id: string
  title: string
  titleMn: string
  slug: string
  type: string
  duration: number
  videoUrl: string | null
  videoStatus: string
  status: string
  order: number
  description: string
  descriptionMn: string
}

interface Subcourse {
  _id: string
  title: string
  titleMn: string
  description: string
  descriptionMn: string
  order: number
  status: string
  thumbnailUrl?: string
  lessons: Lesson[]
}

async function getCourseData(courseId: string) {
  try {
    await dbConnect()

    // Fetch course data
    const course = await CourseModel.findById(courseId).lean()
    if (!course) {
      return { course: null, subcourses: [], hasAccess: false, error: "Course not found" }
    }

    // Fetch subcourses for this course
    const subcourses = await Subcourse.find({ courseId })
      .sort({ order: 1 })
      .lean()


    // Fetch lessons for each subcourse
    const subcoursesWithLessons = await Promise.all(
      subcourses.map(async (subcourse) => {
        const lessons = await Lesson.find({
          courseId,
          subcourseId: subcourse._id
        })
          .sort({ order: 1 })
          .lean()

        return {
          ...subcourse,
          lessons: lessons.map(lesson => ({
            ...lesson,
            _id: (lesson._id as any).toString(),
            subcourseId: (lesson.subcourseId as any).toString(),
            courseId: (lesson.courseId as any).toString(),
            videoUrl: lesson.videoUrl || (lesson.video?.videoId ? `https://iframe.mediadelivery.net/embed/486981/${lesson.video.videoId}` : null),
            videoStatus: lesson.videoUrl ? 'ready' : (lesson.video?.status || 'processing'),
            duration: lesson.video?.duration || lesson.durationSec || 0
          }))
        }
      })
    )

    // Get session to check access
    const session = await auth()
    let hasAccess = false

    if (session?.user?.email) {
      // Find user by email
      const user = await User.findOne({ email: session.user.email })
      if (user) {
        // Check if user has access to this course
        const courseAccess = await CourseAccess.findOne({
          userId: user._id.toString(),
          courseId: new mongoose.Types.ObjectId(courseId),
          hasAccess: true
        }).lean()

        hasAccess = !!courseAccess
      }
    }

    return {
      course: course ? {
        ...course,
        _id: (course as any)._id.toString()
      } as unknown as Course : null,
      subcourses: subcoursesWithLessons.map(subcourse => ({
        ...subcourse,
        _id: (subcourse._id as any).toString(),
        courseId: (subcourse as any).courseId.toString()
      })) as unknown as Subcourse[],
      hasAccess,
      error: null
    }
  } catch (error) {
    console.error('Error fetching course data:', error)
    return { course: null, subcourses: [], hasAccess: false, error: "Failed to load course information" }
  }
}

export async function generateMetadata({ params }: { params: Promise<{ courseId: string }> }): Promise<Metadata> {
  const { courseId } = await params
  const { course } = await getCourseData(courseId)

  if (!course) {
    return {
      title: 'Course Not Found',
      description: 'The requested course could not be found.',
    }
  }

  return {
    title: `${course.title} - Digital Skills Course`,
    description: course.description || `Learn ${course.title} with our comprehensive digital skills course. Expert instruction and practical projects.`,
    keywords: [
      course.title,
      course.category,
      'digital skills course',
      'online learning',
      'professional development',
      'WIN Academy',
      course.level,
      course.instructor
    ],
    openGraph: {
      title: `${course.title} - Digital Skills Course | WIN Academy`,
      description: course.description || `Learn ${course.title} with our comprehensive digital skills course.`,
      images: course.thumbnailUrl ? [
        {
          url: course.thumbnailUrl,
          width: 1200,
          height: 630,
          alt: course.title,
        },
      ] : [
        {
          url: '/images/win_logo_main.jpg',
          width: 1200,
          height: 630,
          alt: course.title,
        },
      ],
    },
    twitter: {
      title: `${course.title} - Digital Skills Course | WIN Academy`,
      description: course.description || `Learn ${course.title} with our comprehensive digital skills course.`,
      images: course.thumbnailUrl ? [course.thumbnailUrl] : ['/images/win_logo_main.jpg'],
    },
    alternates: {
      canonical: `/courses/${courseId}`,
    },
  }
}

export default async function CourseOverviewPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const { course, subcourses, hasAccess, error } = await getCourseData(courseId)

  return (
    <CourseOverviewClient
      course={course}
      subcourses={subcourses}
      hasAccess={hasAccess}
      error={error}
      courseId={courseId}
    />
  )
}
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import Course from '@/lib/models/Course'
import Lesson from '@/lib/models/Lesson'
import Subcourse from '@/lib/models/Subcourse'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    await dbConnect()

    const { courseId, lessonId } = await params

    // Validate parameters
    if (!courseId || !lessonId) {
      return NextResponse.json(
        { error: 'Course ID and lesson ID are required' },
        { status: 400 }
      )
    }

    // First find the course by ID
    const course = await Course.findById(courseId).lean()

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Find the lesson by ID and course ID
    const lesson = await Lesson.findOne({
      _id: lessonId,
      courseId: (course as any)._id
    }).lean()

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Find the subcourse for this lesson
    const subcourse = await Subcourse.findById((lesson as any).subcourseId).lean()

    // Get all lessons in the same subcourse for navigation
    const subcourseLessons = await Lesson.find({
      subcourseId: (lesson as any).subcourseId
    })
    .sort({ order: 1 })
    .select('_id title titleMn slug type durationSec video status order')
    .lean()

    // Get all subcourses for this course
    const courseSubcourses = await Subcourse.find({
      courseId: (course as any)._id
    })
    .sort({ order: 1 })
    .select('_id title titleMn order')
    .lean()

    // Generate video URL if video exists and is ready
    let videoUrl = null
    if ((lesson as any).video && (lesson as any).video.videoId && (lesson as any).video.status === 'ready') {
      // Use Bunny Stream embed URL
      videoUrl = `https://iframe.mediadelivery.net/embed/488255/${(lesson as any).video.videoId}`
    }

    // Format the response
    const formattedLesson = {
      id: (lesson as any)._id.toString(),
      title: (lesson as any).title,
      titleMn: (lesson as any).titleMn,
      slug: (lesson as any).slug,
      type: (lesson as any).type,
      duration: (lesson as any).durationSec,
      description: (lesson as any).description,
      descriptionMn: (lesson as any).descriptionMn,
      videoUrl: videoUrl,
      videoStatus: (lesson as any).video?.status || 'not_available',
      thumbnailUrl: (lesson as any).video?.thumbnailUrl,
      attachments: (lesson as any).attachments || [],
      order: (lesson as any).order
    }

    const formattedCourse = {
      id: (course as any)._id.toString(),
      title: (course as any).title,
      titleMn: (course as any).titleMn,
      slug: (course as any).slug,
      instructor: (course as any).instructor || 'Unknown',
      modules: courseSubcourses.map((sub: any) => ({
        id: sub._id.toString(),
        title: sub.title,
        titleMn: sub.titleMn,
        order: sub.order,
        lessons: subcourseLessons
          .filter((lesson: any) => lesson.subcourseId?.toString() === sub._id.toString())
          .map((lesson: any) => ({
            id: lesson._id.toString(),
            title: lesson.title,
            titleMn: lesson.titleMn,
            slug: lesson.slug,
            type: (lesson.type === "video" || lesson.type === "text" || lesson.type === "quiz" || lesson.type === "assignment") 
              ? lesson.type as "video" | "text" | "quiz" | "assignment"
              : "video",
            duration: lesson.durationSec,
            status: lesson.status,
            order: lesson.order,
            videoUrl: lesson.video && lesson.video.videoId && lesson.video.status === 'ready' 
              ? `https://iframe.mediadelivery.net/embed/488255/${lesson.video.videoId}`
              : null,
            videoStatus: lesson.video?.status || 'not_available',
            completed: false // Default to false, can be updated based on user progress
          }))
      }))
    }

    return NextResponse.json({
      course: formattedCourse,
      lesson: formattedLesson,
      subcourse: subcourse ? {
        id: (subcourse as any)._id.toString(),
        title: (subcourse as any).title,
        titleMn: (subcourse as any).titleMn
      } : null
    })

  } catch (error: any) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

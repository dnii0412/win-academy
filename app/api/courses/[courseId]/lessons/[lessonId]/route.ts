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
      courseId: course._id
    }).lean()

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Find the subcourse for this lesson
    const subcourse = await Subcourse.findById(lesson.subcourseId).lean()

    // Get all lessons in the same subcourse for navigation
    const subcourseLessons = await Lesson.find({
      subcourseId: lesson.subcourseId
    })
    .sort({ order: 1 })
    .select('_id title titleMn slug type durationSec video status order')
    .lean()

    // Get all subcourses for this course
    const courseSubcourses = await Subcourse.find({
      courseId: course._id
    })
    .sort({ order: 1 })
    .select('_id title titleMn order')
    .lean()

    // Generate video URL if video exists and is ready
    let videoUrl = null
    if (lesson.video && lesson.video.videoId && lesson.video.status === 'ready') {
      // Use Bunny Stream URL
      videoUrl = `https://iframe.mediadelivery.net/488255/${lesson.video.videoId}`
    }

    // Format the response
    const formattedLesson = {
      id: lesson._id.toString(),
      title: lesson.title,
      titleMn: lesson.titleMn,
      slug: lesson.slug,
      type: lesson.type,
      duration: lesson.durationSec,
      description: lesson.description,
      descriptionMn: lesson.descriptionMn,
      videoUrl: videoUrl,
      videoStatus: lesson.video?.status || 'not_available',
      thumbnailUrl: lesson.video?.thumbnailUrl,
      attachments: lesson.attachments || [],
      status: lesson.status,
      order: lesson.order
    }

    const formattedCourse = {
      id: course._id.toString(),
      title: course.title,
      titleMn: course.titleMn,
      slug: course.slug,
      instructor: course.instructor || 'Unknown',
      modules: courseSubcourses.map(sub => ({
        id: sub._id.toString(),
        title: sub.title,
        titleMn: sub.titleMn,
        order: sub.order,
        lessons: subcourseLessons
          .filter(lesson => lesson.subcourseId?.toString() === sub._id.toString())
          .map(lesson => ({
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
              ? `https://iframe.mediadelivery.net/488255/${lesson.video.videoId}`
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
        id: subcourse._id.toString(),
        title: subcourse.title,
        titleMn: subcourse.titleMn
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

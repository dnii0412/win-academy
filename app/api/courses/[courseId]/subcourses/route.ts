import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import Subcourse from '@/lib/models/Subcourse'
import Lesson from '@/lib/models/Lesson'
import Course from '@/lib/models/Course'

// GET /api/courses/[courseId]/subcourses - Get all subcourses with their lessons for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await dbConnect()

    const { courseId } = await params

    // Validate courseId
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Verify course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Get all subcourses for this course
    const subcourses = await Subcourse.find({ 
      courseId
    }).sort({ order: 1 })

    // Get all lessons for this course
    const lessons = await Lesson.find({ 
      courseId
    }).sort({ order: 1 })

    // Group lessons by subcourse
    const subcoursesWithLessons = subcourses.map(subcourse => ({
      _id: subcourse._id,
      title: subcourse.title,
      titleMn: subcourse.titleMn,
      description: subcourse.description,
      descriptionMn: subcourse.descriptionMn,
      order: subcourse.order,
      lessons: lessons.filter(lesson => 
        lesson.subcourseId && lesson.subcourseId.toString() === subcourse._id.toString()
      ).map(lesson => ({
        _id: lesson._id,
        title: lesson.title,
        titleMn: lesson.titleMn,
        slug: lesson.slug,
        type: lesson.type,
        duration: lesson.durationSec,
                videoUrl: lesson.video && lesson.video.videoId && lesson.video.status === 'ready'
          ? `https://iframe.mediadelivery.net/embed/488255/${lesson.video.videoId}`
          : null,
        videoStatus: lesson.video?.status || 'not_available',
        order: lesson.order,
        description: lesson.description,
        descriptionMn: lesson.descriptionMn
      }))
    }))

    return NextResponse.json({
      subcourses: subcoursesWithLessons
    })

  } catch (error: any) {
    console.error('Error fetching subcourses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
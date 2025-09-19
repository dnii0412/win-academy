import dbConnect from '@/lib/mongoose'
import CourseAccess from '@/lib/models/CourseAccess'

/**
 * Get enrollment count for a course from CourseAccess collection
 */
export async function getCourseEnrollmentCount(courseId: string): Promise<number> {
  try {
    await dbConnect()
    
    const count = await CourseAccess.countDocuments({
      courseId,
      hasAccess: true,
      status: { $ne: 'expired' }
    })
    
    return count
  } catch (error) {
    return 0
  }
}

/**
 * Get enrollment counts for multiple courses
 */
export async function getMultipleCourseEnrollmentCounts(courseIds: string[]): Promise<Map<string, number>> {
  try {
    await dbConnect()
    
    const counts = await CourseAccess.aggregate([
      {
        $match: {
          courseId: { $in: courseIds },
          hasAccess: true,
          status: { $ne: 'expired' }
        }
      },
      {
        $group: {
          _id: '$courseId',
          count: { $sum: 1 }
        }
      }
    ])
    
    const countMap = new Map<string, number>()
    counts.forEach(item => {
      countMap.set(item._id.toString(), item.count)
    })
    
    // Ensure all courseIds have a count (even if 0)
    courseIds.forEach(courseId => {
      if (!countMap.has(courseId)) {
        countMap.set(courseId, 0)
      }
    })
    
    return countMap
  } catch (error) {
    return new Map()
  }
}

/**
 * Check if user is enrolled in a course
 */
export async function isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
  try {
    await dbConnect()
    
    const access = await CourseAccess.findOne({
      userId,
      courseId,
      hasAccess: true,
      status: { $ne: 'expired' }
    })
    
    return !!access
  } catch (error) {
    return false
  }
}

/**
 * Get user's enrolled courses
 */
export async function getUserEnrolledCourses(userId: string): Promise<string[]> {
  try {
    await dbConnect()
    
    const accesses = await CourseAccess.find({
      userId,
      hasAccess: true,
      status: { $ne: 'expired' }
    }).select('courseId').lean()
    
    return accesses.map(access => access.courseId.toString())
  } catch (error) {
    return []
  }
}

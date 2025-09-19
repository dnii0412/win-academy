import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import CourseAccess from '@/lib/models/CourseAccess'

/**
 * Check if a user has access to a course
 */
export async function checkCourseAccess(courseId: string, userId?: string): Promise<boolean> {
  try {
    await dbConnect()

    // If no userId provided, try to get from session
    if (!userId) {
      const session = await auth()
      if (!session?.user?.email) return false
      userId = session.user.id || session.user.email
    }

    const access = await CourseAccess.findOne({
      userId,
      courseId
    })

    if (!access || !access.hasAccess) return false

    // Check if access has expired
    if (access.expiresAt && access.expiresAt < new Date()) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

/**
 * Grant access to a course for a user
 */
export async function grantCourseAccess(
  userId: string,
  courseId: string,
  orderId?: string,
  accessType: 'purchase' | 'enrollment' | 'admin_grant' | 'free' = 'purchase'
): Promise<boolean> {
  try {
    await dbConnect()

    await CourseAccess.grantAccess(userId, courseId, orderId, accessType)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Revoke access to a course for a user
 */
export async function revokeCourseAccess(userId: string, courseId: string): Promise<boolean> {
  try {
    await dbConnect()

    await CourseAccess.revokeAccess(userId, courseId)
    return true
  } catch (error) {
    return false
  }
}

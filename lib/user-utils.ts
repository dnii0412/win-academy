import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'

/**
 * Get a consistent user ID for a given email address
 * This ensures we always use the same format (ObjectId string) for user identification
 */
export async function getConsistentUserId(email: string): Promise<string | null> {
  try {
    await dbConnect()
    const user = await User.findOne({ email })
    return user ? user._id.toString() : null
  } catch (error) {
    console.error('Error getting consistent user ID:', error)
    return null
  }
}

/**
 * Get user ID from session, ensuring consistent format
 */
export function getUserIdFromSession(session: any): string | null {
  if (!session?.user?.email) return null
  
  // If session has an ID, use it (it should be the ObjectId string)
  if (session.user.id) {
    return session.user.id
  }
  
  // Fallback to email if no ID is available
  return session.user.email
}

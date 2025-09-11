import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function useExpiredCourses() {
  const router = useRouter()

  const checkExpiredCourses = useCallback(async () => {
    try {
      const response = await fetch('/api/courses/check-expired', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.expiredCount > 0) {
          console.log(`🕒 Found ${data.expiredCount} expired courses, refreshing dashboard`)
          // Refresh the dashboard to show updated course list
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Error checking expired courses:', error)
    }
  }, [router])

  useEffect(() => {
    // Check for expired courses on mount
    checkExpiredCourses()

    // Set up interval to check every 5 minutes
    const interval = setInterval(checkExpiredCourses, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [checkExpiredCourses])
}

"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone } from "lucide-react"
import ProfileEditButton from "./ProfileEditButton"

interface UserProfile {
  _id: string
  firstName: string
  lastName: string
  fullName?: string
  email: string
  phoneNumber: string
  avatar: string
  createdAt: string
  updatedAt: string
}

interface LessonStats {
  totalLessons: number
  completedLessons: number
  enrolledCourses: number
  completionRate: number
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<LessonStats>({
    totalLessons: 0,
    completedLessons: 0,
    enrolledCourses: 0,
    completionRate: 0
  })
  const [loading, setLoading] = useState(true)

  const refreshProfileData = async () => {
    console.log("Refreshing profile data...")
    try {
      const [profileRes, statsRes] = await Promise.all([
        fetch("/api/user/profile", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        }),
        fetch("/api/user/lesson-stats", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
      ])

      console.log("Profile refresh response status:", profileRes.status)
      console.log("Stats refresh response status:", statsRes.status)

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        console.log("Refreshed profile data:", profileData)
        setProfile(profileData)
      } else {
        console.error("Profile refresh failed:", await profileRes.text())
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        console.log("Refreshed stats data:", statsData)
        setStats(statsData)
      } else {
        console.error("Stats refresh failed:", await statsRes.text())
      }
    } catch (error) {
      console.error("Error refreshing profile data:", error)
    }
  }

  useEffect(() => {
    console.log("ProfilePage useEffect - status:", status, "session:", session?.user?.email)

    if (status === "loading") return

    if (!session?.user?.email) {
      console.log("No session, redirecting to login")
      router.push("/login")
      return
    }

    const fetchData = async () => {
      console.log("Fetching profile data...")
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch("/api/user/profile", {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          }),
          fetch("/api/user/lesson-stats", {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
        ])

        console.log("Profile response status:", profileRes.status)
        console.log("Stats response status:", statsRes.status)

        if (profileRes.ok) {
          const profileData = await profileRes.json()
          console.log("Profile data received:", profileData)
          setProfile(profileData)
        } else {
          console.error("Profile fetch failed:", await profileRes.text())
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          console.log("Stats data received:", statsData)
          setStats(statsData)
        } else {
          console.error("Stats fetch failed:", await statsRes.text())
        }
      } catch (error) {
        console.error("Error fetching profile data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session, status, router])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Профайл олдсонгүй
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Профайлын мэдээлэл олдсонгүй. Дахин нэвтэрнэ үү.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111111] dark:text-white mb-2">
            Миний профайл
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Профайлын мэдээллээ засварлах
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Card - User Summary */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-8">
              <div className="text-center">
                {/* Profile Picture Placeholder */}
                <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-3xl font-bold">
                      {profile.firstName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* User Name */}
                <h2 className="text-2xl font-bold text-[#111111] dark:text-white mb-2">
                  {profile.fullName || `${profile.firstName} ${profile.lastName}`.trim()}
                </h2>

                {/* Email */}
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {profile.email}
                </p>

                {/* Phone Number */}
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {profile.phoneNumber || "Утасны дугаар оруулаагүй"}
                  </span>
                </div>

                {/* Lesson Statistics */}
                <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      Нийт хичээл:
                    </span>
                    <span className="font-semibold text-[#111111] dark:text-white">
                      {stats.totalLessons}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      Дууссан хичээл:
                    </span>
                    <span className="font-semibold text-[#111111] dark:text-white">
                      {stats.completedLessons}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      Элссэн сургалт:
                    </span>
                    <span className="font-semibold text-[#111111] dark:text-white">
                      {stats.enrolledCourses}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      Дуусгах хувь:
                    </span>
                    <span className="font-semibold text-[#111111] dark:text-white">
                      {stats.completionRate}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Card - Profile Details Form */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[#111111] dark:text-white">
                Профайлын мэдээл
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <ProfileEditButton profile={profile} onProfileUpdated={refreshProfileData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
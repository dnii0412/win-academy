"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { User, Edit, Phone, BookOpen, CheckCircle, Save, X } from "lucide-react"

interface UserProfile {
  _id: string
  firstName: string
  lastName: string
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

interface ProfileClientProps {
  initialProfile: UserProfile
  initialStats: LessonStats
}

function ProfileClient({ initialProfile, initialStats }: ProfileClientProps) {
  const { data: session, update } = useSession()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile>(initialProfile)
  const [stats, setStats] = useState<LessonStats>(initialStats)

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveChanges = async () => {
    if (!session?.user?.email) {
      toast({
        title: "Алдаа",
        description: "Хэрэглэгчийн мэдээлэл олдсонгүй",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phoneNumber: profile.phoneNumber,
          avatar: profile.avatar
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const data = await response.json()

      // Update session with new name
      await update({
        ...session,
        user: {
          ...session.user,
          name: `${profile.firstName} ${profile.lastName}`.trim()
        }
      })

      toast({
        title: "Амжилттай",
        description: "Профайл амжилттай хадгалагдлаа"
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast({
        title: "Алдаа",
        description: "Профайл шинэчлэхэд алдаа гарлаа",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setProfile(initialProfile)
    setIsEditing(false)
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
                  {profile.firstName} {profile.lastName}
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-[#111111] dark:text-white">
                Профайлын мэдээл
              </CardTitle>
              {!isEditing && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Засварлах
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* First Name Field */}
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Нэр
                  </Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    disabled={!isEditing}
                    className="h-12 text-base"
                    placeholder="Нэрээ оруулна уу"
                  />
                </div>

                {/* Last Name Field */}
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Овог
                  </Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    disabled={!isEditing}
                    className="h-12 text-base"
                    placeholder="Овгоо оруулна уу"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    И-мэйл
                  </Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="h-12 text-base bg-gray-50 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 mt-1">И-мэйл хаягийг засварлах боломжгүй</p>
                </div>

                {/* Phone Number Field */}
                <div>
                  <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Утасны дугаар
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={profile.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    disabled={!isEditing}
                    placeholder="+976 9999 9999"
                    className="h-12 text-base"
                  />
                </div>

                {/* Avatar URL Field */}
                <div>
                  <Label htmlFor="avatar" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Профайлын зураг (URL)
                  </Label>
                  <Input
                    id="avatar"
                    value={profile.avatar}
                    onChange={(e) => handleInputChange("avatar", e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://example.com/avatar.jpg"
                    className="h-12 text-base"
                  />
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={handleSaveChanges}
                      disabled={isLoading}
                      className="bg-[#E10600] hover:bg-[#C70500] text-white px-6 py-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Хадгалж байна...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Хадгалах
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="px-6 py-2"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Цуцлах
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProfileClient

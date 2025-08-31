"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/hooks/use-toast"
import { User, Edit, Phone, BookOpen, CheckCircle } from "lucide-react"

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  avatar?: string
}

interface LessonStats {
  totalLessons: number
  completedLessons: number
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const { currentLanguage } = useLanguage()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    avatar: ""
  })

  // Mock lesson statistics - in real app, this would come from the database
  const [lessonStats] = useState<LessonStats>({
    totalLessons: 2,
    completedLessons: 0
  })



  // Initialize profile data from session
  useEffect(() => {
    if (session?.user) {
      const fullName = session.user.name || ""
      const nameParts = fullName.split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      setProfile({
        firstName,
        lastName,
        email: session.user.email || "",
        phoneNumber: "+976 88014891", // Mock phone number - in real app, load from database
        avatar: session.user.image || ""
      })
    }
  }, [session])

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveChanges = async () => {
    if (!session?.user?.email) {
      toast({
        title: currentLanguage === "mn" ? "Алдаа" : "Error",
        description: currentLanguage === "mn" ? "Хэрэглэгчийн мэдээлэл олдсонгүй" : "User information not found",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // In a real app, you would make an API call here
      // For now, we'll just simulate the update
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update session with new name
      await update({
        ...session,
        user: {
          ...session.user,
          name: `${profile.firstName} ${profile.lastName}`.trim()
        }
      })

      toast({
        title: currentLanguage === "mn" ? "Амжилттай" : "Success",
        description: currentLanguage === "mn" ? "Профайл амжилттай хадгалагдлаа" : "Profile updated successfully"
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast({
        title: currentLanguage === "mn" ? "Алдаа" : "Error",
        description: currentLanguage === "mn" ? "Профайл шинэчлэхэд алдаа гарлаа" : "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-4">
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#111111] dark:text-white mb-4">
            {currentLanguage === "mn" ? "Профайлд хандахын тулд нэвтэрнэ үү" : "Please log in to access your profile"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {currentLanguage === "mn"
              ? "Таны профайлыг харахын тулд нэвтэрсэн байх шаардлагатай."
              : "You need to be authenticated to view your profile."
            }
          </p>
          <a
            href="/login"
            className="inline-block bg-[#E10600] hover:bg-[#C70500] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {currentLanguage === "mn" ? "Нэвтрэх рүү оч" : "Go to Login"}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111111] dark:text-white mb-2">
            {currentLanguage === "mn" ? "Миний профайл" : "My Profile"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentLanguage === "mn" ? "Профайлын мэдээллээ засварлах" : "Edit your profile information"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Card - User Summary */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-8">
              <div className="text-center">
                {/* Profile Picture Placeholder */}
                <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-3xl font-bold">
                    {profile.firstName.charAt(0).toUpperCase()}
                  </span>
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
                    {profile.phoneNumber}
                  </span>
                </div>

                {/* Lesson Statistics */}
                <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      {currentLanguage === "mn" ? "Нийт хичээл:" : "Total lessons:"}
                    </span>
                    <span className="font-semibold text-[#111111] dark:text-white">
                      {lessonStats.totalLessons}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      {currentLanguage === "mn" ? "Дууссан хичээл:" : "Completed lessons:"}
                    </span>
                    <span className="font-semibold text-[#111111] dark:text-white">
                      {lessonStats.completedLessons}
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
                {currentLanguage === "mn" ? "Профайлын мэдээл" : "Profile Information"}
              </CardTitle>
              {!isEditing && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {currentLanguage === "mn" ? "Засварлах" : "Edit"}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Name Field */}
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {currentLanguage === "mn" ? "Нэр" : "Name"}
                  </Label>
                  <Input
                    id="firstName"
                    value={`${profile.firstName} ${profile.lastName}`}
                    onChange={(e) => {
                      const fullName = e.target.value
                      const nameParts = fullName.split(" ")
                      handleInputChange("firstName", nameParts[0] || "")
                      handleInputChange("lastName", nameParts.slice(1).join(" ") || "")
                    }}
                    disabled={!isEditing}
                    className="h-12 text-base"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {currentLanguage === "mn" ? "И-мэйл" : "Email"}
                  </Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="h-12 text-base bg-gray-50 dark:bg-gray-800"
                  />
                </div>

                {/* Phone Number Field */}
                <div>
                  <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {currentLanguage === "mn" ? "Утасны дугаар" : "Phone number"}
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={profile.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    disabled={!isEditing}
                    placeholder={currentLanguage === "mn" ? "+976 9999 9999" : "+976 9999 9999"}
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
                      {isLoading
                        ? (currentLanguage === "mn" ? "Хадгалж байна..." : "Saving...")
                        : (currentLanguage === "mn" ? "Хадгалах" : "Save")
                      }
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        // Reset to original values
                        if (session?.user) {
                          const fullName = session.user.name || ""
                          const nameParts = fullName.split(" ")
                          const firstName = nameParts[0] || ""
                          const lastName = nameParts.slice(1).join(" ") || ""
                          setProfile(prev => ({
                            ...prev,
                            firstName,
                            lastName,
                            phoneNumber: "+976 88014891" // Reset to original phone
                          }))
                        }
                      }}
                      className="px-6 py-2"
                    >
                      {currentLanguage === "mn" ? "Цуцлах" : "Cancel"}
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

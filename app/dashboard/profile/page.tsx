"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/hooks/use-toast"
import { User, Camera, Save } from "lucide-react"

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  avatar?: string
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
        phoneNumber: "", // Will be loaded from database if exists
        avatar: session.user.image || ""
      })
    }
  }, [session])

  // Load additional profile data from database
  useEffect(() => {
    if (session?.user?.email) {
      loadUserProfile()
    }
  }, [session?.user?.email])

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`/api/user/profile?email=${encodeURIComponent(session!.user!.email!)}`)
      if (response.ok) {
        const userData = await response.json()
        if (userData.profile) {
          setProfile(prev => ({
            ...prev,
            phoneNumber: userData.profile.phoneNumber || "",
            avatar: userData.profile.avatar || prev.avatar
          }))
        }
      }
    } catch (error) {
      console.error("Failed to load user profile:", error)
    }
  }

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
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: session.user.email,
          profile: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            phoneNumber: profile.phoneNumber,
            avatar: profile.avatar
          }
        })
      })

      if (response.ok) {
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
      } else {
        throw new Error("Failed to update profile")
      }
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

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // For now, we'll just update the local state
    // In a real implementation, you'd upload to Cloudinary or similar service
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      handleInputChange("avatar", result)
    }
    reader.readAsDataURL(file)
  }

  if (status === "loading") {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-8"></div>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
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
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#111111] dark:text-white mb-8">
          {currentLanguage === "mn" ? "Профайлын тохиргоо" : "Profile Settings"}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentLanguage === "mn" ? "Хувийн мэдээлэл" : "Personal Information"}
            </CardTitle>
            <CardDescription>
              {currentLanguage === "mn"
                ? "Таны хувийн мэдээллийг шинэчлэх"
                : "Update your personal information"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-20 h-20 bg-[#E10600] rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-white" />
                  </div>
                )}
                <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-[#E10600] text-white p-2 rounded-full cursor-pointer hover:bg-[#C70500] transition-colors">
                  <Camera className="h-4 w-4" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                  className="border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {currentLanguage === "mn" ? "Аватар солих" : "Change Avatar"}
                </Button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">
                  {currentLanguage === "mn" ? "Нэр" : "First Name"}
                </Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">
                  {currentLanguage === "mn" ? "Овог" : "Last Name"}
                </Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                {currentLanguage === "mn" ? "И-мэйл" : "Email"}
              </Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="mt-1 bg-gray-50 dark:bg-gray-800"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {currentLanguage === "mn"
                  ? "И-мэйл хаягийг өөрчлөх боломжгүй"
                  : "Email address cannot be changed"
                }
              </p>
            </div>

            <div>
              <Label htmlFor="phoneNumber" className="text-gray-700 dark:text-gray-300">
                {currentLanguage === "mn" ? "Утасны дугаар" : "Phone Number"}
              </Label>
              <Input
                id="phoneNumber"
                value={profile.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                disabled={!isEditing}
                placeholder={currentLanguage === "mn" ? "+976 9999 9999" : "+976 9999 9999"}
                className="mt-1"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-[#E10600] hover:bg-[#C70500] text-white"
                >
                  {currentLanguage === "mn" ? "Засах" : "Edit"}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isLoading}
                    className="bg-[#E10600] hover:bg-[#C70500] text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading
                      ? (currentLanguage === "mn" ? "Хадгалж байна..." : "Saving...")
                      : (currentLanguage === "mn" ? "Өөрчлөлтийг хадгалах" : "Save Changes")
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
                          lastName
                        }))
                      }
                    }}
                  >
                    {currentLanguage === "mn" ? "Цуцлах" : "Cancel"}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

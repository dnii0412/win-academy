"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Save, X, Edit } from "lucide-react"

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

interface ProfileEditButtonProps {
  profile: UserProfile
  onProfileUpdated?: () => void
}

export default function ProfileEditButton({ profile, onProfileUpdated }: ProfileEditButtonProps) {

  const { data: session, update } = useSession()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fullName, setFullName] = useState(profile?.fullName || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim())
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '')

  // If profile is not loaded yet, show loading state
  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Update local state when profile prop changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim())
      setPhoneNumber(profile.phoneNumber || '')
    }
  }, [profile])


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
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const updatedProfile = await response.json()

      // Update session data
      await update({
        name: updatedProfile.fullName || `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim()
      })

      // Refresh profile data
      if (onProfileUpdated) {
        onProfileUpdated()
      }

      toast({
        title: "Амжилттай",
        description: "Профайл амжилттай хадгалагдлаа"
      })
      setIsEditing(false)
    } catch (error: any) {
      toast({
        title: "Алдаа",
        description: error.message || "Профайл шинэчлэхэд алдаа гарлаа",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFullName(profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim())
      setPhoneNumber(profile.phoneNumber || '')
    }
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Full Name Display */}
        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Бүтэн нэр
          </Label>
          <div className="h-12 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md flex items-center text-gray-900 dark:text-white">
            {profile?.fullName || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Мэдээлэл олдсонгүй'}
          </div>
        </div>

        {/* Email Display */}
        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            И-мэйл
          </Label>
          <div className="h-12 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md flex items-center text-gray-900 dark:text-white">
            {profile?.email || 'Мэдээлэл олдсонгүй'}
          </div>
        </div>

        {/* Phone Number Display */}
        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Утасны дугаар
          </Label>
          <div className="h-12 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md flex items-center text-gray-900 dark:text-white">
            {profile?.phoneNumber || "Утасны дугаар оруулаагүй"}
          </div>
        </div>

        {/* Edit Button */}
        <div className="pt-4">
          <Button
            onClick={() => {
              setIsEditing(true)
            }}
            className="bg-[#E10600] hover:bg-[#C70500] text-white px-6 py-2"
          >
            <Edit className="h-4 w-4 mr-2" />
            Засварлах
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Full Name Field */}
      <div>
        <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Бүтэн нэр
        </Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="h-12 text-base"
          placeholder="Бүтэн нэрээ оруулна уу"
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
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+976 9999 9999"
          className="h-12 text-base"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <Button
          onClick={() => {
            handleSaveChanges()
          }}
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
    </div>
  )
}

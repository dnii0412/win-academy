"use client"

import { useState } from "react"
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
  email: string
  phoneNumber: string
  avatar: string
  createdAt: string
  updatedAt: string
}

interface ProfileEditFormProps {
  initialProfile: UserProfile
}

export default function ProfileEditForm({ initialProfile }: ProfileEditFormProps) {
  const { data: session, update } = useSession()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fullName, setFullName] = useState(`${initialProfile.firstName} ${initialProfile.lastName}`.trim())
  const [phoneNumber, setPhoneNumber] = useState(initialProfile.phoneNumber)

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
      const nameParts = fullName.trim().split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber: phoneNumber.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      // Update session with new name
      await update({
        ...session,
        user: {
          ...session.user,
          name: fullName.trim()
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
    setFullName(`${initialProfile.firstName} ${initialProfile.lastName}`.trim())
    setPhoneNumber(initialProfile.phoneNumber)
    setIsEditing(false)
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
          disabled={!isEditing}
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
          value={initialProfile.email}
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
          disabled={!isEditing}
          placeholder="+976 9999 9999"
          className="h-12 text-base"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-[#E10600] hover:bg-[#C70500] text-white px-6 py-2"
          >
            <Edit className="h-4 w-4 mr-2" />
            Засварлах
          </Button>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}

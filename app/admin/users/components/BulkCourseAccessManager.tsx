"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Plus, 
  Users, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen
} from "lucide-react"

interface Course {
  _id: string
  title: string
  titleMn: string
  description: string
  descriptionMn: string
  price: number
  status: string
}

interface User {
  _id: string
  fullName: string
  email: string
  role: "user" | "admin" | "instructor"
  status: "completed" | "suspended"
}

interface BulkCourseAccessManagerProps {
  selectedUsers: User[]
  onClose: () => void
  onSuccess: () => void
}

export default function BulkCourseAccessManager({ 
  selectedUsers, 
  onClose, 
  onSuccess 
}: BulkCourseAccessManagerProps) {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [bulkForm, setBulkForm] = useState({
    courseId: "",
    duration: "45", // 45, 90 days, or 5 minutes for testing
    notes: ""
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/courses", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableCourses(data.courses || [])
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateExpiryDate = (duration: string) => {
    const expiryDate = new Date()
    
    if (duration === "5min") {
      // 5 minutes for testing
      expiryDate.setMinutes(expiryDate.getMinutes() + 5)
    } else {
      // Days for production
      const days = parseInt(duration)
      expiryDate.setDate(expiryDate.getDate() + days)
    }
    
    return expiryDate.toISOString() // Return full ISO string for proper date handling
  }

  const handleBulkGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!bulkForm.courseId) {
      alert("Please select a course")
      return
    }

    if (selectedUsers.length === 0) {
      alert("Please select at least one user")
      return
    }

    setIsSubmitting(true)
    
    try {
      const adminToken = localStorage.getItem("adminToken")
      const expiryDate = calculateExpiryDate(bulkForm.duration)
      
      // Grant access to all selected users
      const promises = selectedUsers.map(user => 
        fetch(`/api/admin/users/${user._id}/course-access`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            courseId: bulkForm.courseId,
            accessType: "admin_grant",
            status: "completed",
            expiresAt: expiryDate,
            notes: bulkForm.notes
          }),
        })
      )

      const results = await Promise.allSettled(promises)
      
      // Check results
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.ok
      ).length
      
      const failed = results.length - successful

      if (successful > 0) {
        alert(`Successfully granted access to ${successful} user(s). ${failed > 0 ? `${failed} failed.` : ''}`)
        onSuccess()
        onClose()
      } else {
        alert("Failed to grant access to any users")
      }
    } catch (error) {
      console.error("Failed to grant bulk access:", error)
      alert("Failed to grant access")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDurationText = (duration: string) => {
    switch (duration) {
      case "5min":
        return "5 минут (туршилт)"
      case "45":
        return "45 хоног"
      case "90":
        return "90 хоног"
      default:
        return "45 хоног"
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {"Уншиж байна..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {"Олон хэрэглэгчид курс хандалт олгох"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {"Сонгосон хэрэглэгчид:"} {selectedUsers.length} хүн
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          {/* Selected Users List */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              {"Сонгосон хэрэглэгчид"}
            </h3>
            <div className="max-h-32 overflow-y-auto border rounded-lg p-3 space-y-2">
              {selectedUsers.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                  </div>
                  <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Bulk Access Form */}
          <form onSubmit={handleBulkGrantAccess} className="space-y-4">
            <div>
              <Label>Курс сонгох *</Label>
              <Select 
                value={bulkForm.courseId} 
                onValueChange={(value) => setBulkForm(prev => ({ ...prev, courseId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Курс сонгоно уу" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map((course) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.titleMn || course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div>
              <Label>Хугацаа *</Label>
              <Select 
                value={bulkForm.duration} 
                onValueChange={(value) => setBulkForm(prev => ({ ...prev, duration: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5min">5 минут (туршилт)</SelectItem>
                  <SelectItem value="45">45 хоног</SelectItem>
                  <SelectItem value="90">90 хоног</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Хандалт дуусах огноо: {new Date(calculateExpiryDate(bulkForm.duration)).toLocaleDateString('mn-MN')}
              </p>
            </div>

            <div>
              <Label>Тэмдэглэл (сонголттой)</Label>
              <Textarea
                value={bulkForm.notes}
                onChange={(e) => setBulkForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Нэмэлт тэмдэглэл оруулах..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                {"Цуцлах"}
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !bulkForm.courseId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {"Хандалт олгож байна..."}
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    {`${selectedUsers.length} хэрэглэгчид хандалт олгох`}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

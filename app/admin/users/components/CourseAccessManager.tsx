"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  User, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface Course {
  _id: string
  title: string
  titleMn: string
  description: string
  descriptionMn: string
  price: number
  status: string
}

interface CourseEnrollment {
  _id: string
  courseId: Course
  status: 'active' | 'completed' | 'suspended' | 'expired'
  enrolledAt: string
  expiresAt?: string
  progress: number
  lastAccessedAt: string
  accessGrantedBy: {
    firstName: string
    lastName: string
  }
  notes: string
}

interface CourseAccessManagerProps {
  userId: string
  userName: string
  onClose: () => void
}

export default function CourseAccessManager({ userId, userName, onClose }: CourseAccessManagerProps) {
  const { currentLanguage } = useLanguage()
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showGrantForm, setShowGrantForm] = useState(false)
  const [editingEnrollment, setEditingEnrollment] = useState<CourseEnrollment | null>(null)
  
  const [grantForm, setGrantForm] = useState({
    courseId: "",
    status: "active",
    expiresAt: "",
    notes: ""
  })

  const [editForm, setEditForm] = useState({
    status: "active",
    expiresAt: "",
    notes: ""
  })

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      
      // Fetch user's current enrollments
      const enrollmentsResponse = await fetch(`/api/admin/users/${userId}/course-access`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (enrollmentsResponse.ok) {
        const data = await enrollmentsResponse.json()
        setEnrollments(data.enrollments)
      }

      // Fetch available courses
      const coursesResponse = await fetch("/api/admin/courses", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (coursesResponse.ok) {
        const data = await coursesResponse.json()
        setAvailableCourses(data.courses)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/users/${userId}/course-access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(grantForm),
      })

      if (response.ok) {
        const data = await response.json()
        setEnrollments(prev => [data.enrollment, ...prev])
        setShowGrantForm(false)
        setGrantForm({ courseId: "", status: "active", expiresAt: "", notes: "" })
        alert(currentLanguage === "mn" ? "Курс хандалт амжилттай олгогдлоо!" : "Course access granted successfully!")
      } else {
        const errorData = await response.json()
        alert(currentLanguage === "mn" ? `Алдаа: ${errorData.error}` : `Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Failed to grant access:", error)
      alert(currentLanguage === "mn" ? "Курс хандалт олгоход алдаа гарлаа" : "Failed to grant course access")
    }
  }

  const handleUpdateAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingEnrollment) return

    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/users/${userId}/course-access`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          enrollmentId: editingEnrollment._id,
          ...editForm
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEnrollments(prev => prev.map(enrollment => 
          enrollment._id === editingEnrollment._id ? data.enrollment : enrollment
        ))
        setEditingEnrollment(null)
        setEditForm({ status: "active", expiresAt: "", notes: "" })
        alert(currentLanguage === "mn" ? "Курс хандалт амжилттай шинэчлэгдлээ!" : "Course access updated successfully!")
      } else {
        const errorData = await response.json()
        alert(currentLanguage === "mn" ? `Алдаа: ${errorData.error}` : `Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Failed to update access:", error)
      alert(currentLanguage === "mn" ? "Курс хандалт шинэчлэхэд алдаа гарлаа" : "Failed to update course access")
    }
  }

  const handleRevokeAccess = async (enrollmentId: string) => {
    if (!confirm(currentLanguage === "mn" ? "Курс хандалтыг цуцлахдаа итгэлтэй байна уу?" : "Are you sure you want to revoke this course access?")) {
      return
    }

    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/users/${userId}/course-access?enrollmentId=${enrollmentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (response.ok) {
        setEnrollments(prev => prev.filter(enrollment => enrollment._id !== enrollmentId))
        alert(currentLanguage === "mn" ? "Курс хандалт амжилттай цуцлагдлаа" : "Course access revoked successfully!")
      } else {
        const errorData = await response.json()
        alert(currentLanguage === "mn" ? `Алдаа: ${errorData.error}` : `Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Failed to revoke access:", error)
      alert(currentLanguage === "mn" ? "Курс хандалт цуцлахад алдаа гарлаа" : "Failed to revoke course access")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'completed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Completed</Badge>
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>
      case 'expired':
        return <Badge variant="outline">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {currentLanguage === "mn" ? "Уншиж байна..." : "Loading..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentLanguage === "mn" ? "Курс хандалтын удирдлага" : "Course Access Management"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {currentLanguage === "mn" ? "Хэрэглэгч:" : "User:"} {userName}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          {/* Grant Access Button */}
          <div className="mb-6">
            <Button onClick={() => setShowGrantForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {currentLanguage === "mn" ? "Курс хандалт олгох" : "Grant Course Access"}
            </Button>
          </div>

          {/* Current Enrollments */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {currentLanguage === "mn" ? "Одоогийн курс хандалтууд" : "Current Course Access"}
            </h3>
            
            {enrollments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {currentLanguage === "mn" 
                      ? "Энэ хэрэглэгчид одоогоор курс хандалт байхгүй байна"
                      : "This user doesn't have access to any courses yet"
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              enrollments.map((enrollment) => (
                <Card key={enrollment._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {currentLanguage === "mn" 
                            ? enrollment.courseId.titleMn || enrollment.courseId.title
                            : enrollment.courseId.title
                          }
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {currentLanguage === "mn" 
                            ? enrollment.courseId.descriptionMn || enrollment.courseId.description
                            : enrollment.courseId.description
                          }
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(enrollment.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEnrollment(enrollment)
                            setEditForm({
                              status: enrollment.status,
                              expiresAt: enrollment.expiresAt ? new Date(enrollment.expiresAt).toISOString().split('T')[0] : "",
                              notes: enrollment.notes
                            })
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleRevokeAccess(enrollment._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-600 dark:text-gray-400">
                          {currentLanguage === "mn" ? "Элссэн огноо" : "Enrolled"}
                        </Label>
                        <p>{formatDate(enrollment.enrolledAt)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600 dark:text-gray-400">
                          {currentLanguage === "mn" ? "Сүүлд хандалт" : "Last Access"}
                        </Label>
                        <p>{formatDate(enrollment.lastAccessedAt)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600 dark:text-gray-400">
                          {currentLanguage === "mn" ? "Явц" : "Progress"}
                        </Label>
                        <p>{enrollment.progress}%</p>
                      </div>
                      <div>
                        <Label className="text-gray-600 dark:text-gray-400">
                          {currentLanguage === "mn" ? "Олгосон" : "Granted By"}
                        </Label>
                        <p>{enrollment.accessGrantedBy.firstName} {enrollment.accessGrantedBy.lastName}</p>
                      </div>
                    </div>
                    {enrollment.notes && (
                      <div className="mt-4">
                        <Label className="text-gray-600 dark:text-gray-400">
                          {currentLanguage === "mn" ? "Тэмдэглэл" : "Notes"}
                        </Label>
                        <p className="text-sm mt-1">{enrollment.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grant Access Form */}
      {showGrantForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {currentLanguage === "mn" ? "Курс хандалт олгох" : "Grant Course Access"}
              </h3>
              
              <form onSubmit={handleGrantAccess} className="space-y-4">
                <div>
                  <Label>Course</Label>
                  <Select value={grantForm.courseId} onValueChange={(value) => setGrantForm(prev => ({ ...prev, courseId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCourses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {currentLanguage === "mn" ? course.titleMn || course.title : course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={grantForm.status} onValueChange={(value) => setGrantForm(prev => ({ ...prev, status: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Expires At (Optional)</Label>
                  <Input
                    type="date"
                    value={grantForm.expiresAt}
                    onChange={(e) => setGrantForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={grantForm.notes}
                    onChange={(e) => setGrantForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this access"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setShowGrantForm(false)}>
                    {currentLanguage === "mn" ? "Цуцлах" : "Cancel"}
                  </Button>
                  <Button type="submit">
                    {currentLanguage === "mn" ? "Хандалт олгох" : "Grant Access"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Access Form */}
      {editingEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {currentLanguage === "mn" ? "Курс хандалт засах" : "Edit Course Access"}
              </h3>
              
              <form onSubmit={handleUpdateAccess} className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Expires At (Optional)</Label>
                  <Input
                    type="date"
                    value={editForm.expiresAt}
                    onChange={(e) => setEditForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this access"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setEditingEnrollment(null)}>
                    {currentLanguage === "mn" ? "Цуцлах" : "Cancel"}
                  </Button>
                  <Button type="submit">
                    {currentLanguage === "mn" ? "Хадгалах" : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

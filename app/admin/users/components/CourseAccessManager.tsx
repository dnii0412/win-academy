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

interface Course {
  _id: string
  title: string
  titleMn: string
  description: string
  descriptionMn: string
  price: number
  status: string
}

interface CourseAccess {
  _id: string
  courseId: Course
  hasAccess: boolean
  accessType: 'purchase' | 'enrollment' | 'admin_grant' | 'free'
  status: 'active' | 'suspended' | 'expired' | 'completed'
  grantedAt: string
  expiresAt?: string
  progress: number
  lastAccessedAt: string
  accessGrantedBy?: {
    firstName: string
    lastName: string
  }
  notes: string
  orderId?: {
    orderNumber: string
    status: string
  }
}

interface CourseAccessManagerProps {
  userId: string
  userName: string
  onClose: () => void
}

export default function CourseAccessManager({ userId, userName, onClose }: CourseAccessManagerProps) {
  const [courseAccess, setCourseAccess] = useState<CourseAccess[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showGrantForm, setShowGrantForm] = useState(false)
  const [editingAccess, setEditingAccess] = useState<CourseAccess | null>(null)
  
  const [grantForm, setGrantForm] = useState({
    courseId: "",
    status: "completed",
    expiresAt: "",
    notes: ""
  })

  const [editForm, setEditForm] = useState({
    status: "completed",
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
        setCourseAccess(data.courseAccess || [])
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
    
    console.log('Grant form data:', grantForm)
    
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
        setCourseAccess(prev => [data.courseAccess, ...prev])
        setShowGrantForm(false)
        setGrantForm({ courseId: "", status: "completed", expiresAt: "", notes: "" })
        alert("Курс хандалт амжилттай олгогдлоо!")
      } else {
        const errorData = await response.json()
        alert(`Алдаа: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Failed to grant access:", error)
      alert("Курс хандалт олгоход алдаа гарлаа")
    }
  }

  const handleUpdateAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingAccess) return

    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/users/${userId}/course-access`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          accessId: editingAccess._id,
          ...editForm
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCourseAccess(prev => prev.map(access => 
          access._id === editingAccess._id ? data.courseAccess : access
        ))
        setEditingAccess(null)
        setEditForm({ status: "completed", expiresAt: "", notes: "" })
        alert("Курс хандалт амжилттай шинэчлэгдлээ!")
      } else {
        const errorData = await response.json()
        alert(`Алдаа: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Failed to update access:", error)
      alert("Курс хандалт шинэчлэхэд алдаа гарлаа")
    }
  }

  const handleRevokeAccess = async (accessId: string) => {
    if (!confirm("Курс хандалтыг цуцлахдаа итгэлтэй байна уу?")) {
      return
    }

    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/users/${userId}/course-access?accessId=${accessId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (response.ok) {
        setCourseAccess(prev => prev.filter(access => access._id !== accessId))
        alert("Курс хандалт амжилттай цуцлагдлаа")
      } else {
        const errorData = await response.json()
        alert(`Алдаа: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Failed to revoke access:", error)
      alert("Курс хандалт цуцлахад алдаа гарлаа")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>
      case 'expired':
        return <Badge variant="outline">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getAccessTypeBadge = (accessType: string) => {
    switch (accessType) {
      case 'admin_grant':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Admin Grant</Badge>
      case 'purchase':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Purchase</Badge>
      case 'enrollment':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Enrollment</Badge>
      case 'free':
        return <Badge variant="destructive" className="bg-orange-100 text-orange-800">Free</Badge>
      default:
        return <Badge variant="outline">{accessType}</Badge>
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
            {"Уншиж байна..."}
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
                {"Курс хандалтын удирдлага"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {"Хэрэглэгч:"} {userName}
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
              {"Курс хандалт олгох"}
            </Button>
          </div>

          {/* Current Course Access */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {"Одоогийн курс хандалтууд"}
            </h3>
            
            {courseAccess.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {"Энэ хэрэглэгчид одоогоор курс хандалт байхгүй байна"
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              courseAccess.map((access) => (
                <Card key={access._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {access.courseId.titleMn || access.courseId.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {access.courseId.descriptionMn || access.courseId.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(access.status)}
                        {getAccessTypeBadge(access.accessType)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingAccess(access)
                            setEditForm({
                              status: access.status,
                              expiresAt: access.expiresAt ? new Date(access.expiresAt).toISOString().split('T')[0] : "",
                              notes: access.notes
                            })
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleRevokeAccess(access._id)}
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
                          {"Олгосон огноо"}
                        </Label>
                        <p>{formatDate(access.grantedAt)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600 dark:text-gray-400">
                          {"Сүүлд хандалт"}
                        </Label>
                        <p>{formatDate(access.lastAccessedAt)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600 dark:text-gray-400">
                          {"Явц"}
                        </Label>
                        <p>{access.progress}%</p>
                      </div>
                      <div>
                        <Label className="text-gray-600 dark:text-gray-400">
                          {"Олгосон"}
                        </Label>
                        <p>{access.accessGrantedBy ? `${access.accessGrantedBy.firstName} ${access.accessGrantedBy.lastName}` : 'N/A'}</p>
                      </div>
                    </div>
                    {access.notes && (
                      <div className="mt-4">
                        <Label className="text-gray-600 dark:text-gray-400">
                          {"Тэмдэглэл"}
                        </Label>
                        <p className="text-sm mt-1">{access.notes}</p>
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
                {"Курс хандалт олгох"}
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
                          {course.titleMn || course.title}
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
                      <SelectItem value="completed">Completed</SelectItem>
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
                    {"Цуцлах"}
                  </Button>
                  <Button type="submit">
                    {"Хандалт олгох"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Access Form */}
      {editingAccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {"Курс хандалт засах"}
              </h3>
              
              <form onSubmit={handleUpdateAccess} className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
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
                  <Button type="button" variant="outline" onClick={() => setEditingAccess(null)}>
                    {"Цуцлах"}
                  </Button>
                  <Button type="submit">
                    {"Хадгалах"}
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

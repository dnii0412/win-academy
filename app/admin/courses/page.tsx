"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  BookOpen,
  Users,
  DollarSign,
  Calendar
} from "lucide-react"
import Link from "next/link"
import CourseForm from "./components/CourseForm"
import CourseImage from "@/components/course-image"
import { Toast, ToastContainer } from "@/components/admin/Toast"

interface Course {
  _id: string
  title: string
  titleMn?: string
  description: string
  descriptionMn?: string
  shortDescription?: string
  shortDescriptionMn?: string
  price: number
  price45Days: number
  price90Days: number
  originalPrice?: number
  originalPrice45Days?: number
  originalPrice90Days?: number
  instructor: string
  instructorMn?: string
  createdAt: string
  updatedAt?: string
  category?: string
  categoryMn?: string
  level?: "beginner" | "intermediate" | "advanced"
  levelMn?: "Эхлэгч" | "Дунд" | "Дээд"
  duration?: number
  totalLessons?: number
  tags?: string[]
  tagsMn?: string[]
  featured?: boolean
  certificate?: boolean
  language?: "en" | "mn" | "both"
  thumbnailUrl?: string
  modules?: any[]
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (type: Toast['type'], title: string, message?: string) => {
    const newToast: Toast = {
      id: Date.now().toString(),
      type,
      title,
      message,
      duration: 5000
    }
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

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
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCourse = async (courseData: any) => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(courseData),
      })

      if (response.ok) {
        const data = await response.json()
        setCourses(prev => [data.course, ...prev])
        setShowAddForm(false)
        addToast("success", "Success", "Сургалт амжилттай үүслээ!")
      } else {
        const errorData = await response.json()
        addToast("error", "Error", `Алдаа: ${errorData.message}`)
      }
    } catch (error) {
      console.error("Failed to create course:", error)
      addToast("error", "Error", "Сургалт үүсгэхэд алдаа гарлаа")
    }
  }

  const handleEditCourse = async (courseData: any) => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/courses/${editingCourse?._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(courseData),
      })

      if (response.ok) {
        const data = await response.json()
        setCourses(prev => prev.map(course =>
          course._id === editingCourse?._id ? data.course : course
        ))
        setEditingCourse(null)
        addToast("success", "Success", "Сургалт амжилттай шинэчлэгдлээ!")
      } else {
        const errorData = await response.json()
        addToast("error", "Error", `Алдаа: ${errorData.message}`)
      }
    } catch (error) {
      console.error("Failed to update course:", error)
      addToast("error", "Error", "Сургалт шинэчлэхэд алдаа гарлаа")
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Сургалтыг устгахдаа итгэлтэй байна уу?")) {
      return
    }

    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (response.ok) {
        setCourses(prev => prev.filter(course => course._id !== courseId))
        addToast("success", "Success", "Сургалт амжилттай устгагдлаа!")
      } else {
        const errorData = await response.json()
        addToast("error", "Error", `Алдаа: ${errorData.message}`)
      }
    } catch (error) {
      console.error("Failed to delete course:", error)
      addToast("error", "Error", "Сургалт устгахад алдаа гарлаа")
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.titleMn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Add Course Button */}
        <div className="mb-6 flex justify-between items-center">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Сургалт хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-gray-600 hover:bg-gray-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Сургалт нэмэх
          </Button>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              {/* Thumbnail */}
              <div className="relative">
                <CourseImage
                  thumbnailUrl={course.thumbnailUrl}
                  title={course.titleMn || course.title}
                  category={course.category}
                  size="medium"
                  className="w-full h-48"
                />
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-2">
                  {course.titleMn || course.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {course.descriptionMn || course.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span>45 хоног: ₮{course.price45Days?.toLocaleString() || course.price.toLocaleString()}</span>
                      <span>90 хоног: ₮{course.price90Days?.toLocaleString() || course.price.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/courses/${course._id}`} className="flex-1 min-w-0">
                    <Button variant="outline" size="sm" className="w-full">
                      <BookOpen className="h-4 w-4 mr-1" />
                      Удирдах
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCourse(course)}
                    className="flex-1 min-w-0"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Засах
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50 flex-1 min-w-0"
                    onClick={() => handleDeleteCourse(course._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Устгах
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Сургалт олдсонгүй
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm
                ? "Хайлтын үр дүнд тохирох сургалт байхгүй байна"
                : "Өгөгдлийн сан дээр сургалт байхгүй байна. Эхний сургалтаа үүсгэж эхлээрэй!"
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddForm(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Эхний сургалт үүсгэх
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Course Form Modal */}
      <CourseForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleCreateCourse}
        mode="create"
        addToast={addToast}
      />

      {/* Edit Course Form Modal */}
      <CourseForm
        isOpen={!!editingCourse}
        onClose={() => setEditingCourse(null)}
        onSubmit={handleEditCourse}
        course={editingCourse}
        mode="edit"
        addToast={addToast}
      />
    </div>
  )
}

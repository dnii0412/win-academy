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
import { useLanguage } from "@/contexts/language-context"
import Link from "next/link"
import CourseForm from "./components/CourseForm"

interface Course {
  _id: string
  title: string
  titleMn?: string
  description: string
  descriptionMn?: string
  shortDescription?: string
  shortDescriptionMn?: string
  price: number
  originalPrice?: number
  instructor: string
  instructorMn?: string
  enrolledUsers: number
  createdAt: string
  updatedAt?: string
  status: "active" | "inactive" | "draft" | "archived"
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
  const { currentLanguage } = useLanguage()

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
        // Show success message
        alert(currentLanguage === "mn" ? "Сургалт амжилттай үүслээ!" : "Course created successfully!")
      } else {
        const errorData = await response.json()
        alert(currentLanguage === "mn" ? `Алдаа: ${errorData.message}` : `Error: ${errorData.message}`)
      }
    } catch (error) {
      console.error("Failed to create course:", error)
      alert(currentLanguage === "mn" ? "Сургалт үүсгэхэд алдаа гарлаа" : "Failed to create course")
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
        // Show success message
        alert(currentLanguage === "mn" ? "Сургалт амжилттай шинэчлэгдлээ!" : "Course updated successfully!")
      } else {
        const errorData = await response.json()
        alert(currentLanguage === "mn" ? `Алдаа: ${errorData.message}` : `Error: ${errorData.message}`)
      }
    } catch (error) {
      console.error("Failed to update course:", error)
      alert(currentLanguage === "mn" ? "Сургалт шинэчлэхэд алдаа гарлаа" : "Failed to update course")
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm(currentLanguage === "mn" ? "Сургалтыг устгахдаа итгэлтэй байна уу?" : "Are you sure you want to delete this course?")) {
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
        // Show success message
        alert(currentLanguage === "mn" ? "Сургалт амжилттай устгагдлаа!" : "Course deleted successfully!")
      } else {
        const errorData = await response.json()
        alert(currentLanguage === "mn" ? `Алдаа: ${errorData.message}` : `Error: ${errorData.message}`)
      }
    } catch (error) {
      console.error("Failed to delete course:", error)
      alert(currentLanguage === "mn" ? "Сургалт устгахад алдаа гарлаа" : "Failed to delete course")
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
              placeholder={currentLanguage === "mn" ? "Сургалт хайх..." : "Search courses..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {currentLanguage === "mn" ? "Сургалт нэмэх" : "Add Course"}
          </Button>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Thumbnail */}
              <div className="relative">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={currentLanguage === "mn" ? course.titleMn || course.title : course.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-white opacity-80" />
                  </div>
                )}
                <Badge
                  variant={course.status === "active" ? "default" : "secondary"}
                  className="absolute top-3 right-3"
                >
                  {course.status}
                </Badge>
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-2">
                  {currentLanguage === "mn" ? course.titleMn || course.title : course.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {currentLanguage === "mn" ? course.descriptionMn || course.description : course.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{course.enrolledUsers} {currentLanguage === "mn" ? "хэрэглэгч" : "students"}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>₮{course.price.toLocaleString()}</span>
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
                      {currentLanguage === "mn" ? "Удирдах" : "Manage"}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCourse(course)}
                    className="flex-1 min-w-0"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {currentLanguage === "mn" ? "Засах" : "Edit"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50 flex-1 min-w-0"
                    onClick={() => handleDeleteCourse(course._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {currentLanguage === "mn" ? "Устгах" : "Delete"}
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
              {currentLanguage === "mn" ? "Сургалт олдсонгүй" : "No courses found"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm
                ? (currentLanguage === "mn"
                  ? "Хайлтын үр дүнд тохирох сургалт байхгүй байна"
                  : "No courses match your search criteria")
                : (currentLanguage === "mn"
                  ? "Өгөгдлийн сан дээр сургалт байхгүй байна. Эхний сургалтаа үүсгэж эхлээрэй!"
                  : "No courses in the database yet. Start by creating your first course!")
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddForm(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                {currentLanguage === "mn" ? "Эхний сургалт үүсгэх" : "Create First Course"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Course Form Modal */}
      <CourseForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleCreateCourse}
        mode="create"
      />

      {/* Edit Course Form Modal */}
      <CourseForm
        isOpen={!!editingCourse}
        onClose={() => setEditingCourse(null)}
        onSubmit={handleEditCourse}
        course={editingCourse}
        mode="edit"
      />
    </div>
  )
}

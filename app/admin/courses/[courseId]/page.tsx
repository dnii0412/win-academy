"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Search, 
  BookOpen, 
  Clock,
  Users,
  DollarSign,
  Eye,
  EyeOff,
  Trash2
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import SubcourseAccordion from "@/components/admin/SubcourseAccordion"
import BulkActionsBar from "@/components/admin/BulkActionsBar"
import ConfirmDialog from "@/components/admin/ConfirmDialog"
import { Toast, ToastContainer } from "@/components/admin/Toast"
import StatusChip from "@/components/admin/StatusChip"
import SubcourseForm from "../components/SubcourseForm"
import CourseForm from "../components/CourseForm"
import LessonForm from "../components/LessonForm"
import AuthDebugger from "@/components/admin/AuthDebugger"
import { Course, Lesson } from "@/types/course"

interface Subcourse {
  _id: string
  title: string
  titleMn: string
  description: string
  descriptionMn: string
  status: string
  order: number
  totalLessons: number
  duration: number
  thumbnailUrl?: string
}

export default function CourseTreePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentLanguage } = useLanguage()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [subcourses, setSubcourses] = useState<Subcourse[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSubcourses, setExpandedSubcourses] = useState<string[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete-subcourse' | 'delete-lesson'
    item: Subcourse | Lesson
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showSubcourseForm, setShowSubcourseForm] = useState(false)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [editingSubcourse, setEditingSubcourse] = useState<Subcourse | null>(null)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [selectedSubcourseForLesson, setSelectedSubcourseForLesson] = useState<string>("")

  const [courseId, setCourseId] = useState<string>("")

  // Get courseId from params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setCourseId(resolvedParams.courseId as string)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (courseId) {
      fetchCourseData()
      
      // Auto-expand subcourse if specified in URL
      const openSubcourse = searchParams.get('open')
      if (openSubcourse) {
        setExpandedSubcourses([openSubcourse])
      }
    }
  }, [courseId, searchParams])

  const fetchCourseData = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        router.push("/admin/login")
        return
      }

      // Fetch course details
      const courseResponse = await fetch(`/api/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })

      if (courseResponse.ok) {
        const courseData = await courseResponse.json()
        setCourse(courseData.course)
      }

      // Fetch subcourses
      const subcoursesResponse = await fetch(`/api/admin/courses/${courseId}/subcourses`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })

      if (subcoursesResponse.ok) {
        const subcoursesData = await subcoursesResponse.json()
        setSubcourses(subcoursesData.subcourses)
      }

      // Fetch lessons
      const lessonsResponse = await fetch(`/api/admin/courses/${courseId}/lessons`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })

      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json()
        setLessons(lessonsData.lessons)
      }
    } catch (error) {
      console.error("Failed to fetch course data:", error)
      addToast("error", "Failed to load course data", "Please try refreshing the page")
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const filteredSubcourses = subcourses.filter(subcourse => {
    const matchesSearch = 
      subcourse.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcourse.titleMn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcourse.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcourse.descriptionMn.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = 
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.titleMn.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const handleToggleExpanded = (subcourseId: string) => {
    setExpandedSubcourses(prev => 
      prev.includes(subcourseId) 
        ? prev.filter(id => id !== subcourseId)
        : [...prev, subcourseId]
    )
  }

  const handleSelectItem = (itemId: string, type: 'subcourse' | 'lesson') => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleClearSelection = () => {
    setSelectedItems([])
  }

  const handleAddSubcourse = () => {
    setEditingSubcourse(null)
    setShowSubcourseForm(true)
  }

  const handleEditCourse = () => {
    setEditingCourse(course)
    setShowCourseForm(true)
  }

  const handleAddLesson = (subcourseId: string) => {
    setSelectedSubcourseForLesson(subcourseId)
    setEditingLesson(null)
    setShowLessonForm(true)
  }

  const handleEditSubcourse = (subcourse: Subcourse) => {
    setEditingSubcourse(subcourse)
    setShowSubcourseForm(true)
  }

  const handleDuplicateSubcourse = (subcourse: Subcourse) => {
    // This would duplicate the subcourse
    addToast("info", "Duplicate Subcourse", `Duplicating: ${subcourse.title}`)
  }

  const handleDeleteSubcourse = (subcourse: Subcourse) => {
    console.log('Delete subcourse called:', subcourse)
    setConfirmAction({ type: 'delete-subcourse', item: subcourse })
    setShowConfirmDialog(true)
  }

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedSubcourseForLesson(lesson.subcourseId)
    setEditingLesson(lesson)
    setShowLessonForm(true)
  }

  const handleDuplicateLesson = (lesson: Lesson) => {
    // This would duplicate the lesson
    addToast("info", "Duplicate Lesson", `Duplicating: ${lesson.title}`)
  }

  const handleDeleteLesson = (lesson: Lesson) => {
    console.log('Delete lesson called:', lesson)
    setConfirmAction({ type: 'delete-lesson', item: lesson })
    setShowConfirmDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!confirmAction) return

    console.log('Confirm delete called:', confirmAction)
    setIsDeleting(true)
    
    try {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        router.push("/admin/login")
        return
      }

      if (confirmAction.type === 'delete-subcourse') {
        const subcourse = confirmAction.item as Subcourse
        console.log('Deleting subcourse:', subcourse._id)
        
        // Delete subcourse via API
        const response = await fetch(`/api/admin/courses/${courseId}/subcourses/${subcourse._id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        })

        if (response.ok) {
          addToast("success", "Subcourse deleted", `${subcourse.title} has been deleted successfully`)
          // Refresh data to update UI
          await fetchCourseData()
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to delete subcourse')
        }
      } else if (confirmAction.type === 'delete-lesson') {
        const lesson = confirmAction.item as Lesson
        console.log('Deleting lesson:', lesson._id)
        
        // Delete lesson via API
        const response = await fetch(`/api/admin/courses/${courseId}/lessons/${lesson._id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        })

        if (response.ok) {
          addToast("success", "Lesson deleted", `${lesson.title} has been deleted successfully`)
          // Refresh data to update UI
          await fetchCourseData()
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to delete lesson')
        }
      }
    } catch (error: any) {
      console.error("Delete failed:", error)
      addToast("error", "Delete failed", error.message || "An error occurred while deleting the item")
    } finally {
      setIsDeleting(false)
      setShowConfirmDialog(false)
      setConfirmAction(null)
    }
  }

  // Status toggle functions removed - all content is now published by default

  const handleReorderSubcourses = async (subcourseIds: string[]) => {
    try {
      // Update local state immediately for instant UI feedback
      const reorderedSubcourses = subcourseIds.map(id => 
        subcourses.find(s => s._id === id)
      ).filter(Boolean) as Subcourse[]
      
      setSubcourses(reorderedSubcourses)

      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        router.push("/admin/login")
        return
      }

      // Call API to reorder subcourses
      const response = await fetch(`/api/admin/courses/${courseId}/subcourses`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ subcourseIds }),
      })

      if (response.ok) {
        // Refresh the data to ensure consistency with database
        await fetchCourseData()
      } else {
        addToast("error", "Reorder failed", "Failed to update subcourse order")
        // Revert local state if API call failed
        await fetchCourseData()
      }
    } catch (error) {
      console.error("Failed to reorder subcourses:", error)
      addToast("error", "Reorder failed", "An error occurred while reordering subcourses")
      // Revert local state if API call failed
      await fetchCourseData()
    }
  }

  const handleReorderLessons = async (subcourseId: string, lessonIds: string[]) => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        router.push("/admin/login")
        return
      }

      // Call API to reorder lessons
      const response = await fetch(`/api/admin/courses/${courseId}/lessons`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ subcourseId, lessonIds }),
      })

      if (response.ok) {
        // Refresh the data to ensure consistency with database
        await fetchCourseData()
      } else {
        addToast("error", "Reorder failed", "Failed to update lesson order")
      }
    } catch (error) {
      console.error("Failed to reorder lessons:", error)
      addToast("error", "Reorder failed", "An error occurred while reordering lessons")
    }
  }

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleSubcourseSubmit = async (subcourseData: any) => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        router.push("/admin/login")
        return
      }

      if (editingSubcourse) {
        // Update existing subcourse
        const response = await fetch(`/api/admin/courses/${courseId}/subcourses/${editingSubcourse._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(subcourseData),
        })

        if (response.ok) {
          addToast("success", "Subcourse updated", "Subcourse has been updated successfully")
          await fetchCourseData()
        } else {
          addToast("error", "Update failed", "Failed to update subcourse")
        }
      } else {
        // Create new subcourse
        const response = await fetch(`/api/admin/courses/${courseId}/subcourses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(subcourseData),
        })

        if (response.ok) {
          addToast("success", "Subcourse created", "Subcourse has been created successfully")
          await fetchCourseData()
        } else {
          const errorData = await response.json()
          console.error("Subcourse creation failed:", errorData)
          addToast("error", "Creation failed", errorData.details || "Failed to create subcourse")
        }
      }

      setShowSubcourseForm(false)
      setEditingSubcourse(null)
    } catch (error) {
      console.error("Failed to submit subcourse:", error)
      addToast("error", "Submission failed", "An error occurred while submitting the subcourse")
    }
  }

  const handleCourseSubmit = async (courseData: any) => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        router.push("/admin/login")
        return
      }

      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(courseData),
      })

      if (response.ok) {
        addToast("success", "Course updated", "Course has been updated successfully")
        await fetchCourseData()
      } else {
        addToast("error", "Update failed", "Failed to update course")
      }

      setShowCourseForm(false)
      setEditingCourse(null)
    } catch (error) {
      console.error("Failed to submit course:", error)
      addToast("error", "Submission failed", "An error occurred while submitting the course")
    }
  }

  const handleLessonSubmit = async (lessonData: any) => {
    console.log('📚 handleLessonSubmit called with data:', lessonData)
    
    try {
      const adminToken = localStorage.getItem("adminToken")
      console.log('🔐 Admin token check in handleLessonSubmit:', {
        hasToken: !!adminToken,
        tokenLength: adminToken?.length
      })
      
      if (!adminToken) {
        console.log('❌ No admin token found, redirecting to login')
        router.push("/admin/login")
        return
      }

      if (editingLesson) {
        // Update existing lesson
        const response = await fetch(`/api/admin/courses/${courseId}/lessons/${editingLesson._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(lessonData),
        })

        if (response.ok) {
          addToast("success", "Lesson updated", "Lesson has been updated successfully")
          await fetchCourseData()
        } else {
          addToast("error", "Update failed", "Failed to update lesson")
        }
      } else {
        // Create new lesson
        const requestData = {
          ...lessonData,
          subcourseId: selectedSubcourseForLesson
        }
        
        console.log('🚀 Making lesson creation API call:', {
          url: `/api/admin/courses/${courseId}/lessons`,
          method: 'POST',
          requestData,
          hasToken: !!adminToken
        })
        
        const response = await fetch(`/api/admin/courses/${courseId}/lessons`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(requestData),
        })
        
        console.log('📡 Lesson creation API response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        })

        if (response.ok) {
          addToast("success", "Lesson created", "Lesson has been created successfully")
          await fetchCourseData()
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error("❌ Lesson creation failed:", {
            status: response.status,
            statusText: response.statusText,
            errorData
          })
          
          let errorMessage = "Failed to create lesson"
          if (response.status === 401) {
            errorMessage = "Authentication failed. Please log in again."
          } else if (response.status === 403) {
            errorMessage = "Access denied. You don't have admin privileges."
          } else if (errorData.error) {
            errorMessage = errorData.error
          }
          
          addToast("error", "Creation failed", errorMessage)
        }
      }

      setShowLessonForm(false)
      setEditingLesson(null)
      setSelectedSubcourseForLesson("")
    } catch (error) {
      console.error("Failed to submit lesson:", error)
      addToast("error", "Submission failed", "An error occurred while submitting the lesson")
    }
  }

  const bulkActions = [
    {
      id: "publish",
      label: "Publish Selected",
      icon: <Eye className="w-4 h-4" />,
      onClick: () => {
        addToast("info", "Bulk Publish", `${selectedItems.length} items will be published`)
        setSelectedItems([])
      }
    },
    {
      id: "unpublish",
      label: "Unpublish Selected",
      icon: <EyeOff className="w-4 h-4" />,
      onClick: () => {
        addToast("info", "Bulk Unpublish", `${selectedItems.length} items will be unpublished`)
        setSelectedItems([])
      }
    },
    {
      id: "delete",
      label: "Delete Selected",
      icon: <Trash2 className="w-4 h-4" />,
      variant: "destructive" as const,
      onClick: () => {
        addToast("warning", "Bulk Delete", `${selectedItems.length} items will be deleted`)
        setSelectedItems([])
      }
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {currentLanguage === "mn" ? "Сургалт олдсонгүй" : "Course not found"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {currentLanguage === "mn"
                ? "Энэ ID-тай сургалт байхгүй байна"
                : "No course found with this ID"
              }
            </p>
            <Button onClick={() => router.push("/admin/courses")}>
              {currentLanguage === "mn" ? "Сургалтын жагсаалт" : "Back to Courses"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/courses")}
              className="h-8 px-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {currentLanguage === "mn" ? "Сургалтууд" : "Courses"}
            </Button>
            <span>›</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {currentLanguage === "mn" ? course.titleMn : course.title}
            </span>
          </div>

          {/* Course Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {currentLanguage === "mn" ? course.titleMn : course.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-3xl">
                {currentLanguage === "mn" ? course.descriptionMn : course.description}
              </p>
              
              {/* Course Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.totalLessons} {currentLanguage === "mn" ? "хичээл" : "lessons"}</span>
                </div>
                {course.duration > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{Math.floor(course.duration / 60)}h {course.duration % 60}m</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{course.enrolledUsers} {currentLanguage === "mn" ? "сурагч" : "students"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>${course.price}</span>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Auth Debugger - Temporary for debugging */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AuthDebugger />
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={currentLanguage === "mn" ? "Хайх..." : "Search subcourses and lessons..."}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleAddSubcourse}>
              <Plus className="w-4 h-4 mr-2" />
              {currentLanguage === "mn" ? "Дэд сургалт нэмэх" : "Add Subcourse"}
            </Button>
          </div>
        </div>

        {/* Content */}
        <SubcourseAccordion
          subcourses={filteredSubcourses}
          lessons={filteredLessons}
          onAddLesson={handleAddLesson}
          onEditSubcourse={handleEditSubcourse}
          onDuplicateSubcourse={handleDuplicateSubcourse}
          onDeleteSubcourse={handleDeleteSubcourse}
          onReorderSubcourses={handleReorderSubcourses}
          onReorderLessons={handleReorderLessons}
          onEditLesson={handleEditLesson}
          onDuplicateLesson={handleDuplicateLesson}
          onDeleteLesson={handleDeleteLesson}
          expandedSubcourses={expandedSubcourses}
          onToggleExpanded={handleToggleExpanded}
          selectedItems={selectedItems}
          onSelectItem={handleSelectItem}
          isDragging={isDragging}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedItems.length}
        actions={bulkActions}
        onClearSelection={handleClearSelection}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false)
          setConfirmAction(null)
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={
          confirmAction?.type === 'delete-subcourse' 
            ? (currentLanguage === "mn" ? "Дэд сургалт устгах" : "Delete Subcourse")
            : (currentLanguage === "mn" ? "Хичээл устгах" : "Delete Lesson")
        }
        message={
          confirmAction && confirmAction.type === 'delete-subcourse'
            ? (currentLanguage === "mn" 
                ? `"${(confirmAction.item as Subcourse).titleMn || (confirmAction.item as Subcourse).title || 'Untitled'}" дэд сургалтыг устгахдаа итгэлтэй байна уу?`
                : `Are you sure you want to delete the subcourse "${(confirmAction.item as Subcourse).title || 'Untitled'}"?`
              )
            : confirmAction && confirmAction.type === 'delete-lesson'
            ? (currentLanguage === "mn"
                ? `"${(confirmAction.item as Lesson).titleMn || (confirmAction.item as Lesson).title || 'Untitled'}" хичээлийг устгахдаа итгэлтэй байна уу?`
                : `Are you sure you want to delete the lesson "${(confirmAction.item as Lesson).title || 'Untitled'}"?`
              )
            : "Are you sure you want to delete this item?"
        }
        variant="danger"
        confirmText={currentLanguage === "mn" ? "Устгах" : "Delete"}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Subcourse Form */}
      <SubcourseForm
        isOpen={showSubcourseForm}
        onClose={() => {
          setShowSubcourseForm(false)
          setEditingSubcourse(null)
        }}
        onSubmit={handleSubcourseSubmit}
        subcourse={editingSubcourse}
        mode={editingSubcourse ? "edit" : "create"}
        courseId={courseId}
      />

      {/* Course Form */}
      <CourseForm
        isOpen={showCourseForm}
        onClose={() => {
          setShowCourseForm(false)
          setEditingCourse(null)
        }}
        onSubmit={handleCourseSubmit}
        course={editingCourse}
        mode="edit"
      />

      {/* Lesson Form */}
      <LessonForm
        isOpen={showLessonForm}
        onClose={() => {
          setShowLessonForm(false)
          setEditingLesson(null)
          setSelectedSubcourseForLesson("")
        }}
        onSubmit={handleLessonSubmit}
        lesson={editingLesson}
        mode={editingLesson ? "edit" : "create"}
        courseId={courseId}
        subcourseId={selectedSubcourseForLesson}
      />
    </div>
  )
}

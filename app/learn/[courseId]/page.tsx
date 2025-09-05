"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, Play, BookOpen, Clock, CheckCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"

interface Course {
  _id: string
  title: string
  titleMn: string
  description: string
  descriptionMn: string
  thumbnailUrl?: string
  price: number
  modules: Array<{
    _id: string
    title: string
    titleMn: string
    order: number
    topics: Array<{
      _id: string
      title: string
      titleMn: string
      order: number
      videoUrl?: string
      videoDuration?: number
    }>
  }>
}

interface Lesson {
  _id: string
  title: string
  titleMn: string
  type: string
  duration: number
  videoUrl?: string
  videoStatus?: string
  description?: string
  descriptionMn?: string
  order: number
}

interface Subcourse {
  _id: string
  title: string
  titleMn: string
  description?: string
  descriptionMn?: string
  order: number
  status: string
  lessons: Lesson[]
}

export default function CourseAccessPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subcourses, setSubcourses] = useState<Subcourse[]>([])
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [isLearning, setIsLearning] = useState(false)
  const [expandedSubcourses, setExpandedSubcourses] = useState<Set<string>>(new Set())
  
  const courseId = params.courseId as string

  useEffect(() => {
    const checkAccess = async () => {
      // If session is still loading, don't do anything yet
      if (session === undefined) {
        return
      }
      
      if (!session?.user?.email) {
        setError("Please log in to access this course")
        setIsLoading(false)
        return
      }

      try {
        // Check if user has access to this course
        const enrollmentResponse = await fetch(`/api/user/enrolled-courses?email=${session.user.email}`)
        if (!enrollmentResponse.ok) {
          throw new Error("Failed to check enrollment status")
        }

        const enrollmentData = await enrollmentResponse.json()
        const hasEnrollment = enrollmentData.courses.some((c: any) => c._id === courseId)
        setHasAccess(hasEnrollment)

        // Fetch course details
        const courseResponse = await fetch(`/api/courses/${courseId}`)
        if (!courseResponse.ok) {
          throw new Error("Course not found")
        }

        const courseData = await courseResponse.json()
        setCourse(courseData.course)

        // If user has access, automatically load subcourses and lessons
        if (hasEnrollment) {
          try {
            const subcoursesResponse = await fetch(`/api/courses/${courseId}/subcourses`)
            if (subcoursesResponse.ok) {
              const subcoursesData = await subcoursesResponse.json()
              const fetchedSubcourses = subcoursesData.subcourses || []
              if (fetchedSubcourses.length > 0) {
                setSubcourses(fetchedSubcourses)
                
                // Flatten all lessons from all subcourses
                const allLessonsFromSubcourses = fetchedSubcourses.flatMap((subcourse: Subcourse) => subcourse.lessons)
                setAllLessons(allLessonsFromSubcourses)
                
                if (allLessonsFromSubcourses.length > 0) {
                  setCurrentLessonIndex(0)
                  setIsLearning(true)
                }
              }
            }
          } catch (subcourseError) {
            console.error('Error loading subcourses:', subcourseError)
            // Don't fail the whole page if subcourses fail to load
          }
        }

      } catch (err) {
        console.error('Error in checkAccess:', err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [courseId, session])

  const startCourse = async () => {
    if (!course) return
    
    try {
      // Fetch subcourses for this course
      const response = await fetch(`/api/courses/${courseId}/subcourses`)
      if (response.ok) {
        const data = await response.json()
        const fetchedSubcourses = data.subcourses || []
        
        if (fetchedSubcourses.length > 0) {
          setSubcourses(fetchedSubcourses)
          
          // Flatten all lessons from all subcourses
          const allLessonsFromSubcourses = fetchedSubcourses.flatMap((subcourse: Subcourse) => subcourse.lessons)
          setAllLessons(allLessonsFromSubcourses)
          
          if (allLessonsFromSubcourses.length > 0) {
            setCurrentLessonIndex(0)
            setIsLearning(true)
          } else {
            alert("Энэ сургалтад одоогоор хичээл байхгүй байна")
          }
        } else {
          alert("Энэ сургалтад одоогоор дэд сургалт байхгүй байна")
        }
      }
    } catch (error) {
      console.error('Error fetching subcourses:', error)
      alert("Дэд сургалт ачаалахад алдаа гарлаа")
    }
  }





  const toggleSubcourse = (subcourseId: string) => {
    setExpandedSubcourses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(subcourseId)) {
        newSet.delete(subcourseId)
      } else {
        newSet.add(subcourseId)
      }
      return newSet
    })
  }

  if (isLoading || session === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            Хандах эрх шалгаж байна...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Lock className="w-5 h-5" />
              Алдаа
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push("/login")} 
                className="w-full bg-[#E10600] hover:bg-[#C70500]"
              >
                Нэвтрэх
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/courses")} 
                className="w-full"
              >
                Сургалтууд руу буцах
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-yellow-600" />
              Хандах эрх хэрэгтэй
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                Энэ сургалтад хандахын тулд эхлээд худалдаж авах шаардлагатай.
              </AlertDescription>
            </Alert>
            
            {course && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">
                  {course.titleMn || course.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {course.descriptionMn || course.description}
                </p>
                <p className="text-2xl font-bold text-[#E10600]">
                  ₮{course.price.toLocaleString()} MNT
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Button 
                onClick={() => router.push(`/checkout/${courseId}`)} 
                className="w-full bg-[#E10600] hover:bg-[#C70500]"
              >
                Худалдаж авах
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/courses")} 
                className="w-full"
              >
                Сургалтууд руу буцах
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show lesson content if in learning mode
  if (isLearning && allLessons.length > 0) {
    const currentLesson = allLessons[currentLessonIndex]
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Буцах
              </Button>
              <div>
                <h1 className="text-xl font-semibold">
                  {course?.titleMn || course?.title}
                </h1>
              </div>
            </div>
            

          </div>
        </div>

        {/* Lesson Content */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video/Content Area */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  {currentLesson.videoUrl && currentLesson.videoStatus === 'ready' ? (
                    <div className="aspect-video">
                      <iframe
                        src={currentLesson.videoUrl}
                        className="w-full h-full rounded-lg"
                        allowFullScreen
                        title={currentLesson.titleMn || currentLesson.title}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 flex items-center justify-center rounded-lg">
                      <div className="text-center">
                        <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">
                          Видео бэлэн биш байна
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Lesson Description */}
              {(currentLesson.description || currentLesson.descriptionMn) && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Хичээлийн тайлбар
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">
                      {currentLesson.descriptionMn || currentLesson.description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Subcourses and Lessons List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Дэд сургалтууд
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {subcourses.map((subcourse) => {
                      const isExpanded = expandedSubcourses.has(subcourse._id)
                      return (
                        <div key={subcourse._id} className="border rounded-lg">
                          {/* Subcourse Header - Clickable to expand/collapse */}
                          <div
                            onClick={() => toggleSubcourse(subcourse._id)}
                            className="p-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                              <h4 className="font-semibold text-sm text-gray-700">
                                {subcourse.titleMn || subcourse.title}
                              </h4>
                            </div>
                            <span className="text-xs text-gray-500">
                              {subcourse.lessons.length} хичээл
                            </span>
                          </div>
                          
                          {/* Lessons - Only show when expanded */}
                          {isExpanded && (
                            <div className="px-3 pb-3 space-y-1">
                              {subcourse.lessons.map((lesson, lessonIndex) => {
                                const globalIndex = allLessons.findIndex(l => l._id === lesson._id)
                                return (
                                  <div
                                    key={lesson._id}
                                    onClick={() => setCurrentLessonIndex(globalIndex)}
                                    className={`p-2 rounded cursor-pointer transition-colors ${
                                      globalIndex === currentLessonIndex
                                        ? 'bg-[#E10600] text-white'
                                        : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                        globalIndex === currentLessonIndex
                                          ? 'bg-white text-[#E10600]'
                                          : 'bg-gray-200 text-gray-600'
                                      }`}>
                                        {globalIndex + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${
                                          globalIndex === currentLessonIndex ? 'text-white' : 'text-gray-900'
                                        }`}>
                                          {lesson.titleMn || lesson.title}
                                        </p>
                                        <p className={`text-xs ${
                                          globalIndex === currentLessonIndex ? 'text-gray-200' : 'text-gray-500'
                                        }`}>
                                          {lesson.duration > 0 ? `${Math.floor(lesson.duration / 60)}:${(lesson.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

      // User has access - show simple course overview (only if not in learning mode)
 
  // This should never be reached since we handle learning mode above
  return null
}

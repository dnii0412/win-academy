"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, Play, BookOpen, Clock, CheckCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import { Course } from "@/types/course"

// Helper functions for video URL handling
function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function convertYouTubeToEmbed(url: string): string {
  let videoId = ''
  
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0] || ''
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || ''
  }
  
  return `https://www.youtube.com/embed/${videoId}`
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

interface LearnPageClientProps {
  course: Course | null
  subcourses: Subcourse[]
  hasAccess: boolean
  error: string | null
  courseId: string
  debug?: any
}

export default function LearnPageClient({ 
  course, 
  subcourses, 
  hasAccess, 
  error, 
  courseId,
  debug
}: LearnPageClientProps) {
  const router = useRouter()
  const { data: session } = useSession()
  
  const [isCheckingAccess, setIsCheckingAccess] = useState(false)
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [isLearning, setIsLearning] = useState(false)
  const [expandedSubcourses, setExpandedSubcourses] = useState<Set<string>>(new Set())

  const recheckAccess = async () => {
    if (!session?.user?.email) return false
    
    setIsCheckingAccess(true)
    try {
      const accessResponse = await fetch(`/api/courses/${courseId}/access`)
      if (accessResponse.ok) {
        const accessData = await accessResponse.json()
        console.log('Access re-check result:', {
          courseId,
          hasAccess: accessData.hasAccess,
          accessSource: accessData.accessSource,
          accessDetails: accessData.accessDetails
        })
        return accessData.hasAccess
      }
    } catch (error) {
      console.error('Error re-checking access:', error)
    } finally {
      setIsCheckingAccess(false)
    }
    return false
  }

  const startCourse = async () => {
    if (!course) return
    
    try {
      // Fetch subcourses for this course
      const response = await fetch(`/api/courses/${courseId}/subcourses`)
      if (response.ok) {
        const data = await response.json()
        const fetchedSubcourses = data.subcourses || []
        
        if (fetchedSubcourses.length > 0) {
          // Flatten all lessons from all subcourses
          const allLessonsFromSubcourses = fetchedSubcourses.flatMap((subcourse: Subcourse) => subcourse.lessons)
          setAllLessons(allLessonsFromSubcourses)
          
          if (allLessonsFromSubcourses.length > 0) {
            // Only reset to lesson 0 if we haven't started learning yet
            if (!isLearning) {
              console.log('startCourse: Setting lesson index to 0 - starting fresh')
              setCurrentLessonIndex(0)
            } else {
              console.log('startCourse: Keeping current lesson index:', currentLessonIndex)
            }
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

  // Initialize lessons when subcourses are available
  useEffect(() => {
    if (hasAccess && subcourses.length > 0) {
      const allLessonsFromSubcourses = subcourses.flatMap((subcourse: Subcourse) => subcourse.lessons)
      setAllLessons(allLessonsFromSubcourses)
      
      if (allLessonsFromSubcourses.length > 0) {
        console.log('Auto-starting learning mode')
        setCurrentLessonIndex(0)
        setIsLearning(true)
      }
    }
  }, [hasAccess, subcourses])

  // Ensure currentLessonIndex is within bounds when allLessons changes
  useEffect(() => {
    if (allLessons.length > 0 && currentLessonIndex >= allLessons.length) {
      setCurrentLessonIndex(0)
    }
  }, [allLessons, currentLessonIndex])

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
            <p className="text-muted-foreground mb-4">{error}</p>
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

  if (hasAccess === false) {
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
                <p className="text-muted-foreground text-sm mb-3">
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
                onClick={recheckAccess}
                disabled={isCheckingAccess}
                variant="outline"
                className="w-full"
              >
                {isCheckingAccess ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Хандах эрх шалгаж байна...
                  </>
                ) : (
                  'Хандах эрх дахин шалгах'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/courses")} 
                className="w-full"
              >
                Сургалтууд руу буцах
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Хэрэв та төлбөр төлсөн бол "Хандах эрх дахин шалгах" товчийг дарж дахин шалгана уу.
            </p>
            
            {/* Debug information */}
            {debug && (
              <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
                <h4 className="font-bold mb-2">Debug Information:</h4>
                <p><strong>User ID:</strong> {debug.userId}</p>
                <p><strong>User Email:</strong> {debug.userEmail}</p>
                <p><strong>Course ID:</strong> {debug.courseId}</p>
                <p><strong>Course Access Exists:</strong> {debug.courseAccessExists ? 'Yes' : 'No'}</p>
                <p><strong>Any Access Exists:</strong> {debug.anyAccessExists ? 'Yes' : 'No'}</p>
                {debug.courseAccessData && (
                  <div className="mt-2">
                    <p><strong>Access Data:</strong></p>
                    <p>User ID in access: {debug.courseAccessData.userId}</p>
                    <p>Has Access: {debug.courseAccessData.hasAccess ? 'Yes' : 'No'}</p>
                    <p>Access Type: {debug.courseAccessData.accessType}</p>
                    <p>Status: {debug.courseAccessData.status}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show lesson content if in learning mode
  if (isLearning && allLessons.length > 0) {
    const currentLesson = allLessons[currentLessonIndex]
    
    // Check if currentLesson exists
    if (!currentLesson) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Хичээл олдсонгүй</h2>
            <p className="text-muted-foreground mb-4">Сонгосон хичээл байхгүй байна.</p>
            <Button onClick={() => setIsLearning(false)}>
              Буцах
            </Button>
          </div>
        </div>
      )
    }

    // Debug logging
    console.log('LearnPageClient render:', {
      isLearning,
      allLessonsLength: allLessons.length,
      currentLessonIndex,
      currentLesson: currentLesson ? 'exists' : 'undefined',
      currentLessonId: currentLesson?._id,
      videoUrl: currentLesson?.videoUrl,
      videoStatus: currentLesson?.videoStatus
    })

    // Create a safe reference to currentLesson
    const safeCurrentLesson = currentLesson
    
    // Final safety check
    if (!safeCurrentLesson) {
      console.error('safeCurrentLesson is undefined, returning error state')
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Хичээл олдсонгүй</h2>
            <p className="text-muted-foreground mb-4">Сонгосон хичээл байхгүй байна.</p>
            <Button onClick={() => setIsLearning(false)}>
              Буцах
            </Button>
          </div>
        </div>
      )
    }
    
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/courses")}
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
                  {safeCurrentLesson?.videoUrl ? (
                    <div className="aspect-video">
                      {(() => {
                        console.log('🎬 Rendering video:', {
                          videoUrl: safeCurrentLesson.videoUrl,
                          isYouTube: isYouTubeUrl(safeCurrentLesson.videoUrl),
                          embedUrl: isYouTubeUrl(safeCurrentLesson.videoUrl) ? convertYouTubeToEmbed(safeCurrentLesson.videoUrl) : safeCurrentLesson.videoUrl
                        })
                        return null
                      })()}
                      {isYouTubeUrl(safeCurrentLesson.videoUrl) ? (
                        <iframe
                          src={convertYouTubeToEmbed(safeCurrentLesson.videoUrl)}
                          className="w-full h-full rounded-lg"
                          allowFullScreen
                          title={safeCurrentLesson?.titleMn || safeCurrentLesson?.title}
                        />
                      ) : (
                        <iframe
                          src={safeCurrentLesson.videoUrl}
                          className="w-full h-full rounded-lg"
                          allowFullScreen
                          title={safeCurrentLesson?.titleMn || safeCurrentLesson?.title}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
                      <div className="text-center">
                        <Play className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          Видео бэлэн биш байна
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Video URL: {safeCurrentLesson?.videoUrl || 'None'}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Lesson Description */}
              {(safeCurrentLesson && (safeCurrentLesson.description || safeCurrentLesson.descriptionMn)) && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Хичээлийн тайлбар
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {safeCurrentLesson?.descriptionMn || safeCurrentLesson?.description}
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
                            className="p-3 cursor-pointer hover:bg-muted transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                              <h4 className="font-semibold text-sm text-foreground">
                                {subcourse.titleMn || subcourse.title}
                              </h4>
                            </div>
                            <span className="text-xs text-muted-foreground">
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
                                    onClick={() => {
                                      if (globalIndex >= 0 && globalIndex < allLessons.length) {
                                        setCurrentLessonIndex(globalIndex)
                                      }
                                    }}
                                    className={`p-2 rounded cursor-pointer transition-colors ${
                                      globalIndex === currentLessonIndex
                                        ? 'bg-[#E10600] text-white'
                                        : 'bg-card hover:bg-muted'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                        globalIndex === currentLessonIndex
                                          ? 'bg-white text-[#E10600]'
                                          : 'bg-muted-foreground/20 text-muted-foreground'
                                      }`}>
                                        {globalIndex + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${
                                          globalIndex === currentLessonIndex ? 'text-white' : 'text-foreground'
                                        }`}>
                                          {lesson.titleMn || lesson.title}
                                        </p>
                                        <p className={`text-xs ${
                                          globalIndex === currentLessonIndex ? 'text-gray-200' : 'text-muted-foreground'
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

  // If user has access but no lessons loaded yet, show loading
  if (hasAccess === true && allLessons.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Хичээл ачаалаж байна...
          </p>
        </div>
      </div>
    )
  }

  // This should never be reached since we handle all cases above
  return null
}

"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  Play, 
  ShoppingCart, 
  Star, 
  Users, 
  ChevronRight,
  Lock,
  BookOpen,
  User
} from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

interface Lesson {
  _id: string
  title: string
  titleMn: string
  slug: string
  type: string
  duration: number
  videoUrl: string | null
  videoStatus: string
  status: string
  order: number
  description: string
  descriptionMn: string
}

interface Subcourse {
  _id: string
  title: string
  titleMn: string
  description: string
  descriptionMn: string
  order: number
  status: string
  thumbnailUrl?: string
  lessons: Lesson[]
}

interface Course {
  _id: string
  title: string
  titleMn?: string
  description: string
  descriptionMn?: string
  shortDescription: string
  shortDescriptionMn?: string
  price: number
  originalPrice?: number
  status: string
  category: string
  categoryMn?: string
  level: string
  levelMn?: string
  duration: number
  totalLessons: number
  enrolledUsers: number
  instructor: string
  instructorMn?: string
  tags: string[]
  tagsMn: string[]
  featured: boolean
  certificate: boolean
  language: string
  thumbnailUrl?: string
  createdAt: string
}

export default function CourseOverviewPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [subcourses, setSubcourses] = useState<Subcourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (status === "loading") return // Wait for session to load
    
    fetchCourse()
  }, [courseId, status])

  const fetchCourse = async () => {
    try {
      // Fetch course data
      const courseResponse = await fetch(`/api/courses/${courseId}`)
      if (courseResponse.ok) {
        const courseData = await courseResponse.json()
        setCourse(courseData.course)
      } else {
        setError("Course not found")
        return
      }

      // Fetch subcourses for this course
      const subcoursesResponse = await fetch(`/api/courses/${courseId}/subcourses`)
      if (subcoursesResponse.ok) {
        const subcoursesData = await subcoursesResponse.json()
        setSubcourses(subcoursesData.subcourses)
      }

      // Check if user has access to this course using the new access API
      if (session?.user?.email) {
        try {
          const accessResponse = await fetch(`/api/courses/${courseId}/access`)
          if (accessResponse.ok) {
            const accessData = await accessResponse.json()
            setHasAccess(accessData.hasAccess)
            console.log('Course access check result:', accessData)
          }
        } catch (error) {
          console.error('Error checking course access:', error)
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error)
      setError("Failed to load course information")
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return `₮${price.toLocaleString()}`
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} мин`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}ч ${remainingMinutes}мин` : `${hours}ч`
  }

  const formatVideoDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#E10600] mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-foreground">Loading course...</h1>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {error || "Course not found"}
          </h1>
          <Button onClick={() => router.push("/courses")}>
            Back to Courses
          </Button>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push(`/login?callbackUrl=${encodeURIComponent(`/courses/${courseId}`)}`)
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/courses" className="hover:text-foreground transition-colors">Courses</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">
            {course.titleMn || course.title}
          </span>
        </nav>
      </div>

      {/* Top Section - Course Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-4">
          {/* Course Tag and ID */}
          <div className="flex items-start space-x-4">
            {/* Course Tag */}
            <div className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
              Хичээл
            </div>
            
            {/* Course ID/Number */}
            <div className="text-4xl font-bold text-foreground">
              {course._id.slice(-3)}
            </div>
          </div>
          
          {/* Course Title */}
          <h1 className="text-2xl font-normal text-foreground">
            {course.titleMn || course.title}
          </h1>
          
          {/* Course Metrics */}
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span>4.8 үнэлгээ</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>{course.enrolledUsers} суралцагч</span>
            </div>
            <div className="text-blue-600 font-semibold text-lg">
              {formatPrice(course.price)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Course Details */}
          <div className="space-y-8">
            {/* About the Course */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                Хичээлийн тухай
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {course.descriptionMn || course.description}
              </p>
            </div>

            {/* Course Content */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                Хичээлийн агуулга
              </h2>
              
              {subcourses && subcourses.length > 0 ? (
                <div className="space-y-4">
                  {subcourses
                    .sort((a, b) => a.order - b.order)
                    .map((subcourse, subcourseIndex) => (
                      <div key={subcourse._id} className="border border-border rounded-lg p-4 bg-card">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-sm font-semibold text-red-600 dark:text-red-200">
                            {subcourseIndex + 1}
                          </div>
                          <h3 className="font-semibold text-foreground">
                            {subcourse.titleMn || subcourse.title}
                          </h3>
                        </div>
                        {subcourse.description && (
                          <p className="text-muted-foreground text-sm mb-3">
                            {subcourse.descriptionMn || subcourse.description}
                          </p>
                        )}
                        
                        {subcourse.lessons && subcourse.lessons.length > 0 ? (
                          <div className="space-y-2">
                            {subcourse.lessons
                              .sort((a, b) => a.order - b.order)
                              .map((lesson, lessonIndex) => (
                                <div key={lesson._id} className="flex items-center space-x-3 p-2 bg-muted rounded">
                                  <div className="w-5 h-5 bg-muted-foreground/20 rounded-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                    {lessonIndex + 1}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm text-foreground">
                                      {lesson.titleMn || lesson.title}
                                    </h4>
                                    {lesson.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {lesson.descriptionMn || lesson.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    {lesson.duration > 0 && (
                                      <span>{formatVideoDuration(lesson.duration)}</span>
                                    )}
                                    <Play className="w-3 h-3" />
                                    {lesson.videoStatus === 'ready' && lesson.videoUrl && (
                                      <span className="text-green-600">✓</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">
                              Энэ дэд хэсэгт одоогоор хичээл байхгүй байна
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="border border-border rounded-lg p-12 text-center bg-card">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                                        Хичээлийн агуулга удахгүй нэмэгдэх болно
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Манай багш нар одоогоор хичээлийн агуулгыг бэлтгэж байна. Удахгүй шинэ хичээлүүд нэмэгдэх болно.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Video and Purchase */}
          <div className="space-y-6">
            {/* Course Video/Thumbnail */}
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              {course.thumbnailUrl ? (
                <div className="relative aspect-video">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.titleMn || course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-16 h-16 bg-background/90 rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-foreground ml-1" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="w-16 h-16 bg-background/90 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-foreground ml-1" />
                  </div>
                </div>
              )}
            </div>

            {/* Purchase/Access Section */}
            {hasAccess ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Play className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-700">
                    Хандалттай
                  </span>
                </div>
                <p className="text-sm text-green-600">
                  Та энэ хичээлийг үзэх эрхтэй
                </p>
              </div>
            ) : (
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <ShoppingCart className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-700">
                    Худалдаж авах шаардлагатай
                  </span>
                </div>
                <p className="text-sm text-red-600">
                  Энэ хичээлийг үзэхийн тулд худалдаж авна уу
                </p>
              </div>
            )}

            {/* Action Button */}
            {hasAccess ? (
              <Link href={`/learn/${course._id}`} className="block">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-4">
                  <Play className="w-5 h-5 mr-2" />
                  Хичээл үзэх
                </Button>
              </Link>
            ) : (
              <Link href={`/checkout/${course._id}`} className="block">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-4">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  ₮{course.price.toLocaleString()}-өөр худалдаж авах
                </Button>
              </Link>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
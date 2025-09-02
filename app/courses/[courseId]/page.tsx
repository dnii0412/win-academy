"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  Play, 
  ShoppingCart, 
  Star, 
  Users, 
  ChevronRight
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import Link from "next/link"
import { Course } from "@/types/course"

interface Subcourse {
  _id: string
  title: string
  titleMn: string
  description: string
  descriptionMn: string
  order: number
  status: string
  thumbnailUrl?: string
  totalLessons: number
  duration: number
}



export default function CourseOverviewPage() {
  const params = useParams()
  const router = useRouter()
  const { currentLanguage } = useLanguage()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [subcourses, setSubcourses] = useState<Subcourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCourse()
  }, [courseId])

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#E10600] mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900">Loading course...</h1>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || "Course not found"}
          </h1>
          <Button onClick={() => router.push("/courses")}>
            Back to Courses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/courses" className="hover:text-foreground transition-colors">Courses</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">
            {currentLanguage === "mn" ? course.titleMn || course.title : course.title}
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
              {currentLanguage === "mn" ? "Хичээл" : "Course"}
            </div>
            
            {/* Course ID/Number */}
            <div className="text-4xl font-bold text-gray-900">
              {course._id.slice(-3)}
            </div>
          </div>
          
          {/* Course Title */}
          <h1 className="text-2xl font-normal text-gray-900">
            {currentLanguage === "mn" ? course.titleMn || course.title : course.title}
          </h1>
          
          {/* Course Metrics */}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span>4.8 {currentLanguage === "mn" ? "үнэлгээ" : "rating"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>{course.enrolledUsers} {currentLanguage === "mn" ? "суралцагч" : "students"}</span>
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
              <h2 className="text-2xl font-bold text-gray-900">
                {currentLanguage === "mn" ? "Хичээлийн тухай" : "About the Course"}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {currentLanguage === "mn" ? course.descriptionMn || course.description : course.description}
              </p>
            </div>

            {/* Course Content */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentLanguage === "mn" ? "Хичээлийн агуулга" : "Course Content"}
              </h2>
              
              {subcourses && subcourses.length > 0 ? (
                <div className="space-y-4">
                  {subcourses
                    .sort((a, b) => a.order - b.order)
                    .map((subcourse, subcourseIndex) => (
                      <div key={subcourse._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-semibold text-red-600">
                            {subcourseIndex + 1}
                          </div>
                          <h3 className="font-semibold text-gray-900">
                            {currentLanguage === "mn" ? subcourse.titleMn || subcourse.title : subcourse.title}
                          </h3>
                        </div>
                        {subcourse.description && (
                          <p className="text-gray-600 text-sm mb-3">
                            {currentLanguage === "mn" ? subcourse.descriptionMn || subcourse.description : subcourse.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <Play className="w-4 h-4" />
                              <span>{subcourse.totalLessons} {currentLanguage === "mn" ? "хичээл" : "lessons"}</span>
                            </span>
                            {subcourse.duration > 0 && (
                              <span className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatDuration(subcourse.duration)}</span>
                              </span>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {subcourse.status === 'live' ? (currentLanguage === "mn" ? "Идэвхтэй" : "Active") : (currentLanguage === "mn" ? "Ноорог" : "Draft")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-12 text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">
                    {currentLanguage === "mn" 
                      ? "Хичээлийн агуулга удахгүй нэмэгдэх болно" 
                      : "Course content will be added soon"
                    }
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {currentLanguage === "mn"
                      ? "Манай багш нар одоогоор хичээлийн агуулгыг бэлтгэж байна. Удахгүй шинэ хичээлүүд нэмэгдэх болно."
                      : "Our instructors are currently preparing the course content. New lessons will be added soon!"
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Video and Purchase */}
          <div className="space-y-6">
            {/* Course Video/Thumbnail */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {course.thumbnailUrl ? (
                <div className="relative aspect-video">
                  <img
                    src={course.thumbnailUrl}
                    alt={currentLanguage === "mn" ? course.titleMn || course.title : course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-800 ml-1" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-gray-800 ml-1" />
                  </div>
                </div>
              )}
            </div>

            {/* Purchase Requirement Box */}
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-700">
                  {currentLanguage === "mn" ? "Худалдаж авах шаардлагатай" : "Purchase Required"}
                </span>
              </div>
              <p className="text-sm text-red-600">
                {currentLanguage === "mn" 
                  ? "Энэ хичээлийг үзэхийн тулд худалдаж авна уу" 
                  : "Please purchase this course to view it"
                }
              </p>
            </div>

            {/* Purchase Button */}
            <Link href={`/checkout/${course._id}`} className="block">
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-4">
                <ShoppingCart className="w-5 h-5 mr-2" />
                {currentLanguage === "mn" 
                  ? `₮${course.price.toLocaleString()}-өөр худалдаж авах` 
                  : `Purchase for ${formatPrice(course.price)}`
                }
              </Button>
            </Link>

            {/* Course Status */}
            {course.status === 'draft' && (
              <div className="text-center">
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {currentLanguage === "mn" ? "Ноорог хичээл - Удахгүй" : "Draft Course - Coming Soon"}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

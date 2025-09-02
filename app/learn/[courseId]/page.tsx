"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, Play, BookOpen, Clock } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

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
    }>
  }>
}

export default function CourseAccessPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { currentLanguage, t } = useLanguage()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const courseId = params.courseId as string

  useEffect(() => {
    const checkAccess = async () => {
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

      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [courseId, session])

  const startCourse = () => {
    if (!course || !course.modules.length) return
    
    // Find first topic with video
    const firstModule = course.modules.find(m => m.topics.length > 0)
    if (firstModule) {
      const firstTopic = firstModule.topics[0]
      router.push(`/learn/${courseId}/${firstTopic._id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {currentLanguage === "mn" ? "Хандах эрх шалгаж байна..." : "Checking access..."}
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
              {currentLanguage === "mn" ? "Алдаа" : "Error"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push("/login")} 
                className="w-full bg-[#E10600] hover:bg-[#C70500]"
              >
                {currentLanguage === "mn" ? "Нэвтрэх" : "Login"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/courses")} 
                className="w-full"
              >
                {currentLanguage === "mn" ? "Сургалтууд руу буцах" : "Back to Courses"}
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
              {currentLanguage === "mn" ? "Хандах эрх хэрэгтэй" : "Access Required"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                {currentLanguage === "mn" 
                  ? "Энэ сургалтад хандахын тулд эхлээд худалдаж авах шаардлагатай." 
                  : "You need to purchase this course to access the content."
                }
              </AlertDescription>
            </Alert>
            
            {course && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">
                  {currentLanguage === "mn" ? course.titleMn : course.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {currentLanguage === "mn" ? course.descriptionMn : course.description}
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
                {currentLanguage === "mn" ? "Худалдаж авах" : "Purchase Course"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/courses")} 
                className="w-full"
              >
                {currentLanguage === "mn" ? "Сургалтууд руу буцах" : "Back to Courses"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User has access - show course overview and start button
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              {course?.thumbnailUrl && (
                <img 
                  src={course.thumbnailUrl} 
                  alt={course.title}
                  className="w-32 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  {currentLanguage === "mn" ? course?.titleMn : course?.title}
                </CardTitle>
                <p className="text-gray-600">
                  {currentLanguage === "mn" ? course?.descriptionMn : course?.description}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="mb-6">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {currentLanguage === "mn" 
                    ? "Тантай энэ сургалтад хандах эрх байна. Суралцаж эхлээрэй!" 
                    : "You have access to this course. Start learning!"
                  }
                </AlertDescription>
              </Alert>
            </div>

            {course && course.modules.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {currentLanguage === "mn" ? "Сургалтын агуулга" : "Course Content"}
                </h3>
                <div className="space-y-3">
                  {course.modules.map((module, index) => (
                    <div key={module._id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">
                        {index + 1}. {currentLanguage === "mn" ? module.titleMn : module.title}
                      </h4>
                      <div className="text-sm text-gray-600 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Play className="w-4 h-4" />
                          {module.topics.length} {currentLanguage === "mn" ? "хичээл" : "lessons"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button 
                onClick={startCourse}
                className="bg-[#E10600] hover:bg-[#C70500] flex items-center gap-2"
                size="lg"
              >
                <Play className="w-5 h-5" />
                {currentLanguage === "mn" ? "Суралцаж эхлэх" : "Start Learning"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/dashboard")}
                size="lg"
              >
                {currentLanguage === "mn" ? "Удирдлага руу буцах" : "Back to Dashboard"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

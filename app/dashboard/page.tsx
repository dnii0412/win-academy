"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Award, TrendingUp, Play, Clock, User } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import CourseImage from "@/components/course-image"

interface EnrolledCourse {
  _id: string
  title: string
  titleMn?: string
  description: string
  descriptionMn?: string
  thumbnailUrl?: string
  progress?: number
  totalLessons?: number
  completedLessons?: number
  instructor: string
  instructorMn?: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)

  // Fetch user's enrolled courses
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (session?.user?.email) {
        try {
          setIsLoadingCourses(true)
          // Fetch actual enrolled courses from API
          const response = await fetch(`/api/user/enrolled-courses?email=${encodeURIComponent(session.user.email)}`)
          if (response.ok) {
            const data = await response.json()
            setEnrolledCourses(data.courses || [])
          } else {
            console.error("Failed to fetch enrolled courses")
            setEnrolledCourses([])
          }
        } catch (error) {
          console.error("Failed to fetch enrolled courses:", error)
          setEnrolledCourses([])
        } finally {
          setIsLoadingCourses(false)
        }
      }
    }

    fetchEnrolledCourses()
  }, [session?.user?.email])

  if (status === "loading") {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#111111] dark:text-white mb-4">
            Нэвтрэх шаардлагатай
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Хяналтын самбар руу хандахын тулд нэвтэрсэн байх шаардлагатай.
          </p>
          <a
            href="/login"
            className="inline-block bg-[#E10600] hover:bg-[#C70500] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Нэвтрэх хэсэг рүү очих
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111111] dark:text-white mb-2">
            Хянах самбар
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {`Сайн байна уу, ${session?.user?.name || session?.user?.email}!`}
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Нийт сургалт
              </CardTitle>
              <BookOpen className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#111111] dark:text-white">{enrolledCourses.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Худалдан авсан
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Нийт хичээл
              </CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#111111] dark:text-white">
                {enrolledCourses.reduce((total, course) => total + (course.totalLessons || 0), 0)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Нийт
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Дууссан хичээл
              </CardTitle>
              <Award className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#111111] dark:text-white">
                {enrolledCourses.reduce((total, course) => total + (course.completedLessons || 0), 0)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Дууссан
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Дундаж үйл явц
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#111111] dark:text-white">
                {enrolledCourses.length > 0
                  ? Math.round(enrolledCourses.reduce((total, course) => total + (course.progress || 0), 0) / enrolledCourses.length)
                  : 0}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Бүх хичээл
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Courses Container */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#111111] dark:text-white">
              Миний сургалтууд
            </h2>
          </div>

          {isLoadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="animate-pulse">
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        <div className="flex justify-between">
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Та одоогоор сургалт худалдаж аваагүй байна
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Танд одоогоор худалдаж авсан сургалт байхгүй байна. Манай сургалтуудас худалдаж авахыг хүсэвэл энд дарна уу.
              </p>
              <Link href="/courses">
                <span className="inline-block bg-[#E10600] hover:bg-[#C70500] text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer">
                  Сургалтуудыг харах
                </span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="relative">
                    <CourseImage
                      thumbnailUrl={course.thumbnailUrl}
                      title={course.titleMn || course.title}
                      size="medium"
                      className="w-full h-48"
                    />
                    <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600 z-10">
                      Худалдан авсан
                    </Badge>
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
                    <div className="space-y-3">
                      <div className="text-center">
                        <span className="text-2xl font-bold text-[#E10600]">
                          {course.progress || 0}%
                        </span>
                      </div>

                      <div className="flex space-x-2">
                        <Link href={`/learn/${course._id}`} className="flex-1">
                          <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                            <Play className="h-4 w-4 mr-2" />
                            Үргэлжлүүлэх
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

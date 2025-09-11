"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Award, TrendingUp, Play, Clock, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import CourseImage from "@/components/course-image"
import { useExpiredCourses } from "@/hooks/use-expired-courses"

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
  expiresAt?: string
  timeRemaining?: { expired: boolean; text: string } | null
  accessType?: string
  status?: string
}

interface DashboardClientProps {
  enrolledCourses: EnrolledCourse[]
  user: {
    name?: string | null
    email?: string | null
  }
}

export default function DashboardClient({ enrolledCourses, user }: DashboardClientProps) {
  // Check for expired courses periodically
  useExpiredCourses()
  

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#111111] dark:text-white mb-2">
          Хянах самбар
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {`Сайн байна уу, ${user?.name || user?.email}!`}
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

        {enrolledCourses.length === 0 ? (
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


                    {/* Time Remaining Display */}
                    <div className="text-center mb-3">
                      {course.timeRemaining ? (
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-base font-semibold border-2 ${
                          course.timeRemaining.expired 
                            ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700' 
                            : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
                        }`}>
                          <Clock className="h-5 w-5 mr-2" />
                          {course.timeRemaining.text}
                        </div>
                      ) : (
                        <div className="inline-flex items-center px-4 py-2 rounded-full text-base font-semibold bg-gray-100 text-gray-800 border-2 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                          <Clock className="h-5 w-5 mr-2" />
                          Хязгааргүй хандалт
                        </div>
                      )}
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
  )
}

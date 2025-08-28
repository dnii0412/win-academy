"use client"

import { useSession } from "next-auth/react"
import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Award, TrendingUp } from "lucide-react"
import Link from "next/link"

interface EnrolledCourse {
  title: string
  description: string
  price: string
  progress: number
  modality: "online" | "onsite" | "hybrid"
  duration: string
  startDate: string
  instructor: string
  courseId: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const { currentLanguage } = useLanguage()

  // Empty array since we haven't implemented the course enrollment system yet
  const enrolledCourses: EnrolledCourse[] = []

  if (status === "loading") {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
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
            {currentLanguage === "mn" ? "Нэвтрэх шаардлагатай" : "Authentication Required"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {currentLanguage === "mn"
              ? "Хяналтын самбар руу хандахын тулд нэвтэрсэн байх шаардлагатай."
              : "You need to be authenticated to access the dashboard."
            }
          </p>
          <a
            href="/login"
            className="inline-block bg-[#E10600] hover:bg-[#C70500] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {currentLanguage === "mn" ? "Нэвтрэх хэсэг рүү очих" : "Go to Login"}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111111] dark:text-white mb-2">
            {currentLanguage === "mn" ? "Хянах самбар" : "Dashboard"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentLanguage === "mn"
              ? `Сайн байна уу, ${session?.user?.name || session?.user?.email}!`
              : `Welcome back, ${session?.user?.name || session?.user?.email}!`
            }
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {currentLanguage === "mn" ? "Нийт сургалт" : "Total Courses"}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#111111] dark:text-white">0</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentLanguage === "mn" ? "Худалдан авсан" : "Enrolled"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {currentLanguage === "mn" ? "Нийт сурагчид" : "Total Students"}
              </CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#111111] dark:text-white">0</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentLanguage === "mn" ? "Бүртгэлтэй" : "Registered"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {currentLanguage === "mn" ? "Голч оноо" : "Average Score"}
              </CardTitle>
              <Award className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#111111] dark:text-white">0%</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentLanguage === "mn" ? "Нийт оноо" : "Overall"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {currentLanguage === "mn" ? "Дундаж үйл явц" : "Avg. Progress"}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#111111] dark:text-white">0%</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentLanguage === "mn" ? "Бүх сургалтууд" : "All Courses"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Courses Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#111111] dark:text-white">
              {currentLanguage === "mn" ? "Миний сургалтууд" : "My Enrolled Courses"}
            </h2>
            <Link href="/dashboard/courses">
              <span className="text-[#E10600] hover:text-[#C70500] font-medium cursor-pointer">
                {currentLanguage === "mn" ? "Бүгдийг харах" : "View All"}
              </span>
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                {currentLanguage === "mn"
                  ? "Та одоогоор сургалт худалдаж аваагүй байна"
                  : "You haven't enrolled in any courses yet"
                }
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {currentLanguage === "mn"
                  ? "Танд одоогоор худалдаж авсан сургалт байхгүй байна. Манай сургалтуудаас худалдаж авахыг хүсэвэл энд дарна уу."
                  : "Interested in our courses? Visit the courses page to see all available courses and start your learning journey."
                }
              </p>
              <Link href="/courses">
                <span className="inline-block bg-[#E10600] hover:bg-[#C70500] text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer">
                  {currentLanguage === "mn" ? "Сургалтуудыг харах" : "Browse Courses"}
                </span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Course cards will be rendered here when courses are available */}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-[#111111] dark:text-white mb-6">
            {currentLanguage === "mn" ? "Хурдан үйлдлүүд" : "Quick Actions"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/courses">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-8 w-8 text-[#E10600]" />
                    <div>
                      <h3 className="font-semibold text-[#111111] dark:text-white">
                        {currentLanguage === "mn" ? "Сургалтуудыг харах" : "Browse Courses"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentLanguage === "mn"
                          ? "Боломжтой сургалтуудыг харах"
                          : "Explore available courses"
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/profile">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-[#E10600]" />
                    <div>
                      <h3 className="font-semibold text-[#111111] dark:text-white">
                        {currentLanguage === "mn" ? "Хувийн мэдээлэл засах" : "Edit Profile"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentLanguage === "mn"
                          ? "Хувийн мэдээлэл шинэчлэх"
                          : "Update your personal information"
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/settings">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Award className="h-8 w-8 text-[#E10600]" />
                    <div>
                      <h3 className="font-semibold text-[#111111] dark:text-white">
                        {currentLanguage === "mn" ? "Тохиргоо" : "Settings"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentLanguage === "mn"
                          ? "Тохиргоо өөрчлөх"
                          : "Customize your preferences"
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

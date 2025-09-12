"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, BookOpen, Clock, User, ShoppingCart, Plus } from "lucide-react"
import Link from "next/link"
import { Course } from "@/types/course"
import CourseImage from "@/components/course-image"
import Breadcrumb from "@/components/breadcrumb"
import { useLanguage } from "@/contexts/language-context"
import { useState, useEffect } from "react"

interface CoursesPageClientProps {
  courses: Course[]
}

export default function CoursesPageClient({ courses }: CoursesPageClientProps) {
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const [isHydrated, setIsHydrated] = useState(false)

  // Ensure hydration is complete before rendering dynamic content
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const formatPrice = (price: number) => {
    return `₮${price.toLocaleString()}`
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

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb - only render after hydration to prevent mismatch */}
        {isHydrated && (
          <Breadcrumb
            items={[
              { label: 'Courses', href: '/courses' }
            ]}
            className="mb-6"
          />
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#111111] dark:text-white mb-4">
            {isHydrated ? t("courses.title") : "All Courses"}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {isHydrated ? t("courses.subtitle") : "Discover our comprehensive digital skills training programs"}
          </p>
        </div>


        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-8">
              <BookOpen className="h-16 w-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
              {isHydrated ? t("courses.noCourses") : "No Courses Available"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">
              {isHydrated ? t("courses.noCoursesDescription") : "We're working on adding new courses. Please check back soon!"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {session ? (
                // Logged in users - show Dashboard button only
                <Link href="/dashboard">
                  <Button className="bg-[#E10600] hover:bg-[#C70500] text-white">
                    {isHydrated ? t("nav.dashboard") : "Dashboard"}
                  </Button>
                </Link>
              ) : (
                // Not logged in users - show Home and Register buttons
                <>
                  <Link href="/">
                    <Button variant="outline" className="border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white">
                      {isHydrated ? t("nav.home") : "Home"}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-[#E10600] hover:bg-[#C70500] text-white">
                      {isHydrated ? t("nav.register") : "Register"}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="relative">
                  <CourseImage
                    thumbnailUrl={course.thumbnailUrl}
                    title={course.titleMn || course.title}
                    category={course.category}
                    size="medium"
                    className="w-full h-48"
                  />
                  {course.isEnrolled && (
                    <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600 z-10">
                      {isHydrated ? t("home.courses.enrolled") : "Enrolled"}
                    </Badge>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2">
                    {course.titleMn || course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {(course.descriptionMn || course.description || '').substring(0, 120) + '...'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{course.duration ? `${course.duration} мин` : (isHydrated ? t("courseCard.duration") : "Duration")}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <User className="h-4 w-4 mr-2" />
                      <span>{course.instructorMn || course.instructor}</span>
                    </div>
                    <div className="flex items-center justify-start">
                      <Badge variant="secondary">
                        {course.categoryMn || course.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-[#E10600]">
                        {formatPrice(course.price)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="w-full">
                        <Link href={`/courses/${course._id}`} className="block">
                          <Button variant="outline" className="w-full border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white whitespace-normal leading-tight">
                            <BookOpen className="h-4 w-4 mr-2" />
                            {isHydrated ? t("common.details") : "Details"}
                          </Button>
                        </Link>
                      </div>
                      <div className="w-full">
                        {course.isEnrolled ? (
                          <Link href={`/learn/${course._id}`} className="block">
                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white whitespace-normal leading-tight">
                              <Play className="h-4 w-4 mr-2" />
                              {isHydrated ? t("courseCard.continue") : "Continue"}
                            </Button>
                          </Link>
                        ) : session?.user ? (
                          <Link href={`/checkout/${course._id}`} className="block">
                            <Button className="w-full bg-[#E10600] hover:bg-[#C70500] text-white whitespace-normal leading-tight">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              {isHydrated ? t("courseCard.enrollNow") : "Enroll Now"}
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/login?callbackUrl=${encodeURIComponent(`/checkout/${course._id}`)}`} className="block">
                            <Button className="w-full bg-[#E10600] hover:bg-[#C70500] text-white whitespace-normal leading-tight">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              {isHydrated ? `${t("nav.login")} ${t("courseCard.enrollNow")}` : "Login to Enroll"}
                            </Button>
                          </Link>
                        )}
                      </div>
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

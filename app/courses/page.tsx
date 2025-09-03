"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, BookOpen, Clock, User, ShoppingCart, Search, Filter, Plus } from "lucide-react"
import Link from "next/link"
import { Course } from "@/types/course"
import CourseImage from "@/components/course-image"

export default function CoursesPage() {
  const { data: session, status } = useSession()
  const { currentLanguage } = useLanguage()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, selectedCategory, selectedLevel])

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        let coursesWithEnrollment = data.courses || []

        // If user is logged in, check enrollment status
        if (session?.user?.email) {
          coursesWithEnrollment = await checkEnrollmentStatus(coursesWithEnrollment)
        }

        setCourses(coursesWithEnrollment)
      } else {
        console.error('Failed to load courses')
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkEnrollmentStatus = async (courses: Course[]): Promise<Course[]> => {
    try {
      const response = await fetch(`/api/user/enrolled-courses?email=${encodeURIComponent(session!.user!.email!)}`)
      if (response.ok) {
        const data = await response.json()
        const enrolledCourseIds = (data.courses || []).map((course: any) => course._id)

        return courses.map(course => ({
          ...course,
          isEnrolled: enrolledCourseIds.includes(course._id)
        }))
      }
    } catch (error) {
      console.error('Error checking enrollment status:', error)
    }

    return courses.map(course => ({ ...course, isEnrolled: false }))
  }

  const filterCourses = () => {
    let filtered = courses

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course => {
        const title = currentLanguage === "mn" ? course.titleMn || course.title : course.title
        const description = currentLanguage === "mn" ? course.descriptionMn || course.description : course.description
        return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          description.toLowerCase().includes(searchTerm.toLowerCase())
      })
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(course => course.category === selectedCategory)
    }

    // Filter by level
    if (selectedLevel && selectedLevel !== "all") {
      filtered = filtered.filter(course => course.level === selectedLevel)
    }

    setFilteredCourses(filtered)
  }

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

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#111111] dark:text-white mb-4">
            {currentLanguage === "mn" ? "Бүх сургалтууд" : "All Courses"}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {currentLanguage === "mn"
              ? "Манай мэргэжлийн багшаас суралцаж, ур чадвараа сайжруулна уу"
              : "Learn from our professional instructors and improve your skills"
            }
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={currentLanguage === "mn" ? "Сургалт хайх..." : "Search courses..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={currentLanguage === "mn" ? "Бүх ангилал" : "All Categories"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{currentLanguage === "mn" ? "Бүх ангилал" : "All Categories"}</SelectItem>
                <SelectItem value="design">{currentLanguage === "mn" ? "Дизайн" : "Design"}</SelectItem>
                <SelectItem value="marketing">{currentLanguage === "mn" ? "Маркетинг" : "Marketing"}</SelectItem>
                <SelectItem value="programming">{currentLanguage === "mn" ? "Програмчлал" : "Programming"}</SelectItem>
                <SelectItem value="business">{currentLanguage === "mn" ? "Бизнес" : "Business"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={currentLanguage === "mn" ? "Бүх түвшин" : "All Levels"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{currentLanguage === "mn" ? "Бүх түвшин" : "All Levels"}</SelectItem>
                <SelectItem value="beginner">{currentLanguage === "mn" ? "Эхлэгч" : "Beginner"}</SelectItem>
                <SelectItem value="intermediate">{currentLanguage === "mn" ? "Дунд" : "Intermediate"}</SelectItem>
                <SelectItem value="advanced">{currentLanguage === "mn" ? "Дээд" : "Advanced"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-8">
              <BookOpen className="h-16 w-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
              {currentLanguage === "mn"
                ? "Одоогоор сургалт байхгүй байна"
                : "No courses available yet"
              }
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">
              {currentLanguage === "mn"
                ? "Манай багш нар одоогоор сургалтуудыг бэлтгэж байна. Удахгүй шинэ сургалтууд нэмэгдэх болно."
                : "Our instructors are currently preparing courses. New courses will be added soon."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {session ? (
                // Logged in users - show Dashboard button only
                <Link href="/dashboard">
                  <Button className="bg-[#E10600] hover:bg-[#C70500] text-white">
                    {currentLanguage === "mn" ? "Хяналтын самбар руу буцах" : "Back to Dashboard"}
                  </Button>
                </Link>
              ) : (
                // Not logged in users - show Home and Register buttons
                <>
                  <Link href="/">
                    <Button variant="outline" className="border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white">
                      {currentLanguage === "mn" ? "Нүүр хуудас руу буцах" : "Back to Home"}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-[#E10600] hover:bg-[#C70500] text-white">
                      {currentLanguage === "mn" ? "Бүртгүүлэх" : "Register"}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="relative">
                  <CourseImage
                    thumbnailUrl={course.thumbnailUrl}
                    title={currentLanguage === "mn" ? course.titleMn || course.title : course.title}
                    category={course.category}
                    size="medium"
                    className="w-full h-48"
                  />
                  {course.isEnrolled && (
                    <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600 z-10">
                      {currentLanguage === "mn" ? "Худалдан авсан" : "Enrolled"}
                    </Badge>
                  )}
                  {course.status === 'draft' && (
                    <Badge className="absolute top-3 left-3 bg-yellow-500 hover:bg-yellow-600 z-10">
                      {currentLanguage === "mn" ? "Ноорог" : "Draft"}
                    </Badge>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2">
                    {currentLanguage === "mn" ? course.titleMn || course.title : course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {currentLanguage === "mn"
                      ? (course.descriptionMn || course.description || '').substring(0, 120) + '...'
                      : (course.description || '').substring(0, 120) + '...'
                    }
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{course.duration ? `${course.duration} мин` : 'Duration TBD'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <User className="h-4 w-4 mr-2" />
                      <span>{currentLanguage === "mn" ? course.instructorMn || course.instructor : course.instructor}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {currentLanguage === "mn" ? course.categoryMn || course.category : course.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getLevelColor(course.level)}
                      >
                        {currentLanguage === "mn" ? course.levelMn || course.level : course.level}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-[#E10600]">
                        {formatPrice(course.price)}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      {course.isEnrolled ? (
                        <Link href={`/learn/${course._id}`} className="flex-1">
                          <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                            <Play className="h-4 w-4 mr-2" />
                            {currentLanguage === "mn" ? "Үргэлжлүүлэх" : "Continue Learning"}
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Link href={`/courses/${course._id}`} className="flex-1">
                            <Button variant="outline" className="w-full border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white">
                              <BookOpen className="h-4 w-4 mr-2" />
                              {currentLanguage === "mn" ? "дэлгэрэнгүй" : "View Course"}
                            </Button>
                          </Link>
                          {session?.user ? (
                            <Link href={`/checkout/${course._id}`} className="flex-1">
                              <Button className="w-full bg-[#E10600] hover:bg-[#C70500] text-white">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                {currentLanguage === "mn" ? "Худалдаж авах" : "Buy Course"}
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/login?callbackUrl=${encodeURIComponent(`/checkout/${course._id}`)}`} className="flex-1">
                              <Button className="w-full bg-[#E10600] hover:bg-[#C70500] text-white">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                {currentLanguage === "mn" ? "Нэвтэрч худалдаж авах" : "Login to Buy"}
                              </Button>
                            </Link>
                          )}
                        </>
                      )}
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

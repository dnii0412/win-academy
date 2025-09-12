"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, BookOpen, Clock, User, ShoppingCart, Plus, Search, Filter } from "lucide-react"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Ensure hydration is complete before rendering dynamic content
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(courses.map(course => course.category))).sort()
  
  // Filter courses based on search term and category
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.titleMn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.descriptionMn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.categoryMn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructorMn?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

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
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            {isHydrated ? t("courses.subtitle") : "Discover our comprehensive digital skills training programs"}
          </p>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-4xl mx-auto">
            {/* Search Bar */}
            <div className="relative w-full sm:flex-1 max-w-md sm:max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder={isHydrated ? t("courses.searchPlaceholder") || "Сургалт хайх..." : "Search courses..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-[#E10600] dark:focus:border-[#E10600] rounded-lg"
              />
            </div>
            
            {/* Category Filter */}
            <div className="w-full sm:w-auto min-w-[200px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-[#E10600] dark:focus:border-[#E10600] rounded-lg">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder={isHydrated ? t("courses.filterCategory") || "Ангилал" : "Category"} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {isHydrated ? t("courses.allCategories") || "Бүгд" : "All Categories"}
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>


        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-8">
              <BookOpen className="h-16 w-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
              {searchTerm ? 
                (isHydrated ? t("courses.noSearchResults") || "No courses found" : "No courses found") : 
                (isHydrated ? t("courses.noCourses") : "No Courses Available")
              }
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">
              {searchTerm ? 
                (isHydrated ? t("courses.noSearchResultsDescription") || "Try adjusting your search terms" : "Try adjusting your search terms") : 
                (isHydrated ? t("courses.noCoursesDescription") : "We're working on adding new courses. Please check back soon!")
              }
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
          <>
            {/* Search Results Info */}
            {(searchTerm || selectedCategory !== "all") && (
              <div className="mb-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  {isHydrated ? 
                    `${filteredCourses.length} ${t("courses.searchResults") || "courses found"}` : 
                    `${filteredCourses.length} courses found`
                  }
                  {searchTerm && ` for "${searchTerm}"`}
                  {selectedCategory !== "all" && ` in ${selectedCategory}`}
                </p>
                {(searchTerm || selectedCategory !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedCategory("all")
                    }}
                    className="mt-2 text-sm text-[#E10600] hover:underline"
                  >
                    {isHydrated ? t("courses.clearFilters") || "Clear filters" : "Clear filters"}
                  </button>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
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
          </>
        )}
      </div>
    </div>
  )
}

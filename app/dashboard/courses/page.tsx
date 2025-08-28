"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, BookOpen, Clock, User, ShoppingCart } from "lucide-react"
import Link from "next/link"

interface Course {
    _id: string
    title: string
    titleMn?: string
    description: string
    descriptionMn?: string
    price: number
    category: string
    categoryMn?: string
    difficulty: string
    difficultyMn?: string
    duration: string
    durationMn?: string
    instructor: string
    instructorMn?: string
    thumbnailUrl?: string
    videoId?: string
    status: string
    enrolledAt: Date
    progress?: number
}

export default function MyCoursesPage() {
    const { data: session, status } = useSession()
    const { currentLanguage } = useLanguage()
    const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (session?.user?.email) {
            loadEnrolledCourses()
        }
    }, [session?.user?.email])

    const loadEnrolledCourses = async () => {
        try {
            const response = await fetch(`/api/user/enrolled-courses?email=${encodeURIComponent(session!.user!.email!)}`)
            if (response.ok) {
                const data = await response.json()
                setEnrolledCourses(data.courses || [])
            } else {
                console.error('Failed to load enrolled courses')
            }
        } catch (error) {
            console.error('Error loading enrolled courses:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (status === "loading" || isLoading) {
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
                        {currentLanguage === "mn" ? "Миний сургалтуудад хандахын тулд нэвтэрнэ үү" : "Please log in to access your courses"}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {currentLanguage === "mn"
                            ? "Таны худалдан авсан сургалтуудыг харахын тулд нэвтэрсэн байх шаардлагатай."
                            : "You need to be authenticated to view your purchased courses."
                        }
                    </p>
                    <a
                        href="/login"
                        className="inline-block bg-[#E10600] hover:bg-[#C70500] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        {currentLanguage === "mn" ? "Нэвтрэх рүү оч" : "Go to Login"}
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold text-[#111111] dark:text-white mb-8">
                    {currentLanguage === "mn" ? "Миний сургалтууд" : "My Courses"}
                </h1>

                {enrolledCourses.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="h-12 w-12 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                            {currentLanguage === "mn"
                                ? "Та одоогоор сургалт худалдаж аваагүй байна"
                                : "You haven't purchased any courses yet"
                            }
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                            {currentLanguage === "mn"
                                ? "Манай сургалтуудыг үзэж, суралцах хүсэлтэй байна уу? Бүх сургалтуудыг харахын тулд сургалтын хуудас руу очно уу."
                                : "Interested in our courses? Visit the courses page to see all available courses and start your learning journey."
                            }
                        </p>
                        <Link href="/courses">
                            <Button className="bg-[#E10600] hover:bg-[#C70500] text-white px-8 py-3">
                                <ShoppingCart className="h-5 w-5 mr-2" />
                                {currentLanguage === "mn" ? "Бүх сургалтуудыг харах" : "Browse All Courses"}
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrolledCourses.map((course) => (
                            <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="relative">
                                    {course.thumbnailUrl ? (
                                        <img
                                            src={course.thumbnailUrl}
                                            alt={currentLanguage === "mn" ? course.titleMn || course.title : course.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <BookOpen className="h-16 w-16 text-white opacity-80" />
                                        </div>
                                    )}
                                    <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600">
                                        {currentLanguage === "mn" ? "Худалдан авсан" : "Enrolled"}
                                    </Badge>
                                </div>

                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg line-clamp-2">
                                        {currentLanguage === "mn" ? course.titleMn || course.title : course.title}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {currentLanguage === "mn" ? course.descriptionMn || course.description : course.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <Clock className="h-4 w-4 mr-2" />
                                            <span>{currentLanguage === "mn" ? course.durationMn || course.duration : course.duration}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <User className="h-4 w-4 mr-2" />
                                            <span>{currentLanguage === "mn" ? course.instructorMn || course.instructor : course.instructor}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Badge variant="secondary">
                                                {currentLanguage === "mn" ? course.categoryMn || course.category : course.category}
                                            </Badge>
                                            <Badge variant="outline">
                                                {currentLanguage === "mn" ? course.difficultyMn || course.difficulty : course.difficulty}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {course.progress !== undefined && (
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-[#E10600] h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${course.progress}%` }}
                                                ></div>
                                            </div>
                                        )}

                                        <div className="flex space-x-2">
                                            <Link href={`/learn/${course._id}`} className="flex-1">
                                                <Button className="w-full bg-[#E10600] hover:bg-[#C70500] text-white">
                                                    <Play className="h-4 w-4 mr-2" />
                                                    {currentLanguage === "mn" ? "Үргэлжлүүлэх" : "Continue"}
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

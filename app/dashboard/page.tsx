"use client"

import { useSession } from "next-auth/react"
import CourseCard from "@/components/course-card"
import { useLanguage } from "@/contexts/language-context"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const { currentLanguage, t } = useLanguage()

  const enrolledCourses = [
    {
      title: currentLanguage === "mn" ? "Дижитал маркетингийн мастер" : "Digital Marketing Mastery",
      description: currentLanguage === "mn"
        ? "Сошиал медиа маркетинг, SEO, контент бүтээх бүрэн заавар."
        : "Complete guide to social media marketing, SEO, and content creation.",
      price: "₮299,000",
      progress: 65,
      modality: "online" as const,
      duration: currentLanguage === "mn" ? "8 долоо хоног" : "8 weeks",
      startDate: currentLanguage === "mn" ? "Уян хатан" : "Flexible",
      instructor: currentLanguage === "mn" ? "Маркетингийн мэргэжилтэн" : "Marketing Expert",
      courseId: "digital-marketing-001"
    },
    {
      title: currentLanguage === "mn" ? "UI/UX дизайны үндэс" : "UI/UX Design Fundamentals",
      description: currentLanguage === "mn"
        ? "Дизайны зарчмууд, хэрэглэгчийн судалгаа, прототип бүтээх."
        : "Master design principles, user research, and prototyping.",
      price: "₮349,000",
      progress: 30,
      modality: "hybrid" as const,
      duration: currentLanguage === "mn" ? "10 долоо хоног" : "10 weeks",
      startDate: currentLanguage === "mn" ? "Дараагийн Даваа" : "Next Monday",
      instructor: currentLanguage === "mn" ? "Дизайны мэргэжилтэн" : "Design Specialist",
      courseId: "uiux-design-001"
    },
    {
      title: currentLanguage === "mn" ? "Бизнесийн AI хэрэгслүүд" : "AI Tools for Business",
      description: currentLanguage === "mn"
        ? "ChatGPT, Midjourney, автоматжуулалтын хэрэгслүүдийг ашиглах."
        : "Harness ChatGPT, Midjourney, and automation tools.",
      price: "₮199,000",
      progress: 85,
      modality: "online" as const,
      duration: currentLanguage === "mn" ? "6 долоо хоног" : "6 weeks",
      startDate: currentLanguage === "mn" ? "Өөрөө суралцах" : "Self-paced",
      instructor: currentLanguage === "mn" ? "AI зөвлөгч" : "AI Consultant",
      courseId: "ai-tools-001"
    },
  ]

  // Get user's name and initials
  const userName = session?.user?.name || "User"
  const userInitials = getUserInitials(userName)

  // Function to get initials from full name
  function getUserInitials(name: string): string {
    if (!name) return "U"
    return name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2)
  }

  if (status === "loading") {
    return (
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
            </div>
          </div>
        </div>
        {/* Rest of loading skeleton */}
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#111111] dark:text-white mb-4">
            {currentLanguage === "mn" ? "Таны хяналтын самбарт хандахын тулд нэвтэрнэ үү" : "Please log in to access your dashboard"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {currentLanguage === "mn"
              ? "Таны сургалтын явцыг харахын тулд нэвтэрсэн байх шаардлагатай."
              : "You need to be authenticated to view your learning progress."
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

  // Debug: Log session data
  console.log("Session data:", session)
  console.log("User name:", userName)
  console.log("User initials:", userInitials)

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-[#E10600] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{userInitials}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111111] dark:text-white">
              {currentLanguage === "mn" ? "Сайн байна уу," : "Welcome back,"} {userName}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {currentLanguage === "mn" ? "Суралцах аялалаа үргэлжлүүл" : "Continue your learning journey"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-[#111111] dark:text-white mb-2">
            {currentLanguage === "mn" ? "Бүртгүүлсэн сургалтууд" : "Courses Enrolled"}
          </h3>
          <p className="text-3xl font-bold text-[#E10600]">3</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-[#111111] dark:text-white mb-2">
            {currentLanguage === "mn" ? "Суралцсан цаг" : "Hours Learned"}
          </h3>
          <p className="text-3xl font-bold text-[#E10600]">47</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-[#111111] dark:text-white mb-2">
            {currentLanguage === "mn" ? "Гэрчилгээ" : "Certificates"}
          </h3>
          <p className="text-3xl font-bold text-[#E10600]">1</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#111111] dark:text-white mb-6">
          {currentLanguage === "mn" ? "Миний сургалтууд" : "My Courses"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course, index) => (
            <CourseCard key={index} {...course} />
          ))}
        </div>
      </div>
    </div>
  )
}

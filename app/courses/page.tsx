"use client"

import { useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import CourseCard from "@/components/course-card"
import { CourseModalityToggle } from "@/components/course-modality-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function CoursesPage() {
  const allCourses = [
    {
      title: "Graphic Design + AI",
      description:
        "Master graphic design fundamentals combined with AI tools. Learn Photoshop, Illustrator, and cutting-edge AI design workflows to create stunning visuals.",
      price: "₮349,000",
      image: "/images/graphic-design-ai.jpeg",
      modality: "hybrid" as const,
      duration: "8 weeks",
      startDate: "Feb 15, 2025",
      instructor: "Б.Болдбаатар",
      schedule: "Mon-Wed-Fri 18:30-21:00",
    },
    {
      title: "Social Media Marketing",
      description:
        "Complete guide to social media marketing, content creation, and analytics. Learn to create campaigns that convert and build your personal brand.",
      price: "₮299,000",
      image: "/images/social-media-marketing.jpeg",
      modality: "online" as const,
      duration: "6 weeks",
      startDate: "Feb 10, 2025",
      instructor: "Д.Оюунчимэг",
      schedule: "Self-paced + Live sessions",
    },
    {
      title: "Photoshop Master",
      description:
        "Become a Photoshop expert with advanced techniques, photo manipulation, digital art creation, and professional retouching skills.",
      price: "₮279,000",
      image: "/images/photoshop-master.jpeg",
      modality: "onsite" as const,
      duration: "10 weeks",
      startDate: "Feb 20, 2025",
      instructor: "Г.Энхбаяр",
      schedule: "Tue-Thu 18:30-21:00, Sat 10:00-17:00",
    },
    {
      title: "AI Image, Video & Prompt Engineering",
      description:
        "Harness AI tools for content creation. Master prompt engineering, AI image generation, video creation, and automation workflows.",
      price: "₮399,000",
      image: "/images/ai-course.jpeg",
      modality: "online" as const,
      duration: "12 weeks",
      startDate: "Feb 5, 2025",
      instructor: "Ц.Мөнхбат",
      schedule: "Flexible schedule + Weekly live Q&A",
    },
    {
      title: "Premiere Pro Video Editing",
      description:
        "Professional video editing with Adobe Premiere Pro. Learn advanced editing techniques, color grading, audio mixing, and motion graphics.",
      price: "₮329,000",
      image: "/images/premiere-pro.jpeg",
      modality: "hybrid" as const,
      duration: "8 weeks",
      startDate: "Feb 25, 2025",
      instructor: "Н.Батбаяр",
      schedule: "Mon-Wed 18:30-21:00 + Online practice",
    },
    {
      title: "Digital Content Marketing",
      description:
        "Create compelling digital content strategies, learn copywriting, content planning, and multi-platform marketing approaches.",
      price: "₮249,000",
      image: "/images/student-learning.jpeg",
      modality: "onsite" as const,
      duration: "6 weeks",
      startDate: "Mar 1, 2025",
      instructor: "С.Ариунаа",
      schedule: "Weekends: Sat-Sun 10:00-16:00",
    },
  ]

  const [selectedModality, setSelectedModality] = useState<"online" | "onsite" | "all">("all")
  const [filteredCourses, setFilteredCourses] = useState(allCourses)

  const handleModalityChange = (modality: "online" | "onsite" | "all") => {
    setSelectedModality(modality)
    if (modality === "all") {
      setFilteredCourses(allCourses)
    } else {
      setFilteredCourses(allCourses.filter((course) => course.modality === modality || course.modality === "hybrid"))
    }
  }

  const categories = ["All Courses", "Digital Marketing", "Design", "AI Skills", "Development", "Analytics"]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-[#F5F5F5] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#111111] mb-4">Бүх сургалтууд / All Courses</h1>
            <p className="text-xl text-gray-600 mb-8">
              Онлайн болон танхимын сургалтуудаас сонгоорой / Choose from online and on-site courses
            </p>

            <CourseModalityToggle onModalityChange={handleModalityChange} defaultModality="all" />

            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <Input
                type="search"
                placeholder="Сургалт хайх... / Search courses..."
                className="w-full px-4 py-3 text-lg border-gray-300 rounded-lg focus:border-[#E10600] focus:ring-[#E10600]"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category, index) => (
                <Button
                  key={index}
                  variant={index === 0 ? "default" : "outline"}
                  className={
                    index === 0
                      ? "bg-[#E10600] hover:bg-[#C70500] text-white"
                      : "border-gray-300 text-gray-700 hover:border-[#E10600] hover:text-[#E10600]"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <p className="text-gray-600">
              {filteredCourses.length} сургалт олдлоо / {filteredCourses.length} courses found
              {selectedModality !== "all" && (
                <span className="ml-2 text-[#E10600] font-medium">
                  ({selectedModality === "online" ? "Онлайн" : "Танхимын"} сургалтууд)
                </span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course, index) => (
              <CourseCard key={index} {...course} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-12 space-x-2">
            <Button variant="outline" disabled>
              Previous
            </Button>
            <Button className="bg-[#E10600] text-white">1</Button>
            <Button variant="outline">2</Button>
            <Button variant="outline">3</Button>
            <Button variant="outline">Next</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

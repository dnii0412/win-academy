"use client"

import { useState } from "react"
import CourseCard from "@/components/course-card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

export default function CoursesPage() {
  const { t } = useLanguage()

  const allCourses = [
    {
      courseId: "graphic-design-ai",
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
      courseId: "social-media-marketing",
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
      courseId: "photoshop-master",
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
      courseId: "ai-image-video-prompt",
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
      courseId: "premiere-pro-video",
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
      courseId: "digital-content-marketing",
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



  return (
    <div className="min-h-screen bg-background">



      {/* Courses Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


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

    </div>
  )
}

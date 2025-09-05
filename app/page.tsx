"use client"

import AnimatedCounter from "@/components/animated-counter"
import ScrollProgress from "@/components/scroll-progress"
import AnimatedSection from "@/components/animated-section"
import TestimonialCarousel from "@/components/testimonial-carousel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Course } from "@/types/course"
import CourseImage from "@/components/course-image"

export default function HomePage() {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)

  useEffect(() => {
    fetchFeaturedCourses()
  }, [])

  const fetchFeaturedCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        // Get all courses, limit to 6
        const allCourses = (data.courses || []).slice(0, 6)
        setFeaturedCourses(allCourses)
      }
    } catch (error) {
      console.error('Error fetching featured courses:', error)
    } finally {
      setIsLoadingCourses(false)
    }
  }

  const benefits = [
    {
      title: "Чухал ур чадварууд",
      description: "Монголын хөгжиж буй дижитал эдийн засгийн бодит ажлын байрны төлөө зориулсан сургалтууд.",
      icon: "🎯",
    },
    {
      title: "Хурдан хөгжил",
      description: "Манай хурдасгасан сургалтын аргаар суралцаж, дадлага хийж, хурдан ажилд орно уу.",
      icon: "⚡",
    },
    {
      title: "AI-аар хөгжсөн",
      description: "Бүх сургалтад нэгтгэгдсэн дэлгээний AI хэрэгслүүд, арга техникээр урьдчилж байна уу.",
      icon: "🤖",
    },
  ]

  const testimonials = [
    {
      name: "Batbayar S.",
      role: "Дижитал маркетингийн мэргэжилтэн",
      content: "WIN Academy надад дээд зэргийн маркетингийн агентлагт мөрөөдлийн ажлыг олход тусалсан. Би сурсан практик ур чадварууд нь ажил олгогчдын хайж байсан зүйл байсан.",
    },
    {
      name: "Oyunaa T.",
      role: "Чөлөөт дизайнер",
      content: "UI/UX сургалт нь миний карьерыг өөрчилсөн. Би тэг дизайн туршлагатай байснаас сая ₮2M+ сарын орлоготой чөлөөт дизайнер болсон.",
    },
    {
      name: "Munkh-Erdene B.",
      role: "AI зөвлөгч",
      content: "AI хэрэгслүүдийн сургалт надад шаардлагатай давуу талыг өгсөн. Одоо би бизнесүүдэд үйл явцыг автоматжуулж, үр ашгийг нэмэгдүүлэхэд тусалдаг.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />

      {/* Hero Section */}
      <section className="bg-background h-[90vh] flex items-center relative overflow-hidden pt-8">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-transparent animate-pulse dark:from-red-950/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <AnimatedSection animation="slideLeft">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
                Learn. Build. <span className="text-[#E10600]">Get Hired.</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Маркетинг, дизайн, AI-ийн практик ур чадвараар өөрийгөө хөгжүүл. Монголын тэргүүлэгч дижитал мэргэжлийн академид нэгдээрэй.
              </p>

              {/* Main Motto */}
              <div className="mb-4">
                <h2 className="text-lg font-medium text-muted-foreground leading-relaxed">
                  Дижитал маркетинг, борлуулалт, график дизайн, хиймэл оюуны хамгийн шинэлэг хөтөлбөрүүд
                </h2>
              </div>
              <div className="mb-6 p-3 bg-muted rounded-lg inline-block">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Ажилд орсон сурагчид:</span>
                  <AnimatedCounter end={120} suffix="+" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/courses">
                  <Button className="bg-[#E10600] hover:bg-[#C70500] text-white text-base px-6 py-3 transition-all duration-300 hover:shadow-lg hover:scale-105">
                    Start Learning Today
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    variant="outline"
                    className="border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white text-base px-6 py-3 bg-transparent transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    Register
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
            <AnimatedSection animation="slideRight">
              <div className="relative">
                <img
                  src="/images/student-learning.jpeg"
                  alt="Students learning digital skills"

                  className="w-full h-auto max-h-[60vh] object-cover rounded-lg shadow-2xl"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 bg-muted/50 relative">
        <div className="absolute top-0 left-0 w-full h-12 bg-background transform -skew-y-1 origin-top-left"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Боломжит сургалтууд</h2>
            <p className="text-xl text-muted-foreground">Манай мэргэжлийн сургалтуудаар сургалтын аялаа эхлээрэй</p>
          </AnimatedSection>
          {isLoadingCourses ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin">
                <span className="text-4xl">⚙️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Уншиж байна...
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Манай багш нар гайхалтай сургалтууд бэлтгэж байна. Шинэчлэлтүүдийг хүлээж байгаарай!
              </p>
            </div>
          ) : featuredCourses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Сургалтууд удахгүй ирнэ
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Манай багш нар гайхалтай сургалтууд бэлтгэж байна. Шинэчлэлтүүдийг хүлээж байгаарай!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.map((course, index) => (
                <AnimatedSection key={course._id} animation="fadeUp" className={`delay-${index * 100}`}>
                  <Link href={`/courses/${course._id}`}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                      <div className="mb-4">
                        <CourseImage
                          thumbnailUrl={course.thumbnailUrl}
                          title={course.title}
                          category={course.category}
                          size="small"
                          className="w-full h-32 rounded-lg"
                        />
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {course.title}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                          {course.description ? course.description.substring(0, 100) + '...' : 'No description available'}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <span>{course.level}</span>
                          <span>{course.duration ? `${course.duration} мин` : 'Duration TBD'}</span>
                        </div>
                        <div className="text-lg font-bold text-[#E10600]">
                          ₮{course.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          )}
          <AnimatedSection className="text-center mt-12">
            <Link href="/courses">
              <Button className="bg-[#E10600] hover:bg-[#C70500] text-white text-lg px-8 py-4 transition-all duration-300 hover:shadow-lg hover:scale-105">
                Бүх сургалтыг харах
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Why Win Academy */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Яагаад WIN Academy?</h2>
            <p className="text-xl text-muted-foreground">Монголын дижитал ирээдүйн төлөө бүтээгдсэн</p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <AnimatedSection key={index} animation="fadeUp" className={`delay-${index * 200}`}>
                <Card className="text-center p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group h-full flex flex-col">
                  <CardContent className="pt-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                        {benefit.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-4">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/50 relative">
        <div className="absolute top-0 left-0 w-full h-12 bg-background transform skew-y-1 origin-top-left"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Амжилтын түүхүүд</h2>
            <p className="text-xl text-muted-foreground">Карьераа өөрчилсөн төгсөгчдийнхээ түүхийг сонсоорой</p>
          </AnimatedSection>
          <AnimatedSection>
            <TestimonialCarousel testimonials={testimonials} />
          </AnimatedSection>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <AnimatedSection animation="slideLeft">
              <h2 className="text-4xl font-bold text-foreground mb-6">Холбоо барих</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Дижитал хувиргалтаа эхлүүлэхэд бэлэн үү? Өнөөдөр бидэнтэй холбогдоорой.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 group">
                  <span className="text-[#E10600] transition-transform duration-300 group-hover:scale-110 mt-1">📍</span>
                  <div className="text-foreground">
                    <div className="font-medium">Pearl Tower B Corpus</div>
                    <div className="text-sm text-muted-foreground">11 давхарт 1101 тоот</div>
                    <div className="text-sm text-muted-foreground">Улаанбаатар, Монгол</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 group">
                  <span className="text-[#E10600] transition-transform duration-300 group-hover:scale-110">📞</span>
                  <span className="text-foreground">9016-6060, 9668-0707</span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <span className="text-[#E10600] transition-transform duration-300 group-hover:scale-110">✉️</span>
                  <span className="text-foreground">hello@winacademy.mn</span>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection animation="slideRight">
              <div className="space-y-4">
                <div className="bg-gray-200 rounded-lg overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2673.878725907889!2d106.9034160764108!3d47.919383971220334!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5d9693a886ad7cad%3A0x124c9120b5666cdc!2sWin%20academy!5e1!3m2!1sen!2smn!4v1756355104950!5m2!1sen!2smn"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Win Academy Location"
                    className="w-full h-80 rounded-lg"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    <strong>Pearl Tower B Corpus</strong><br />
                    11 давхарт 1101 тоот / 11th Floor, Room 1101
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

    </div>
  )
}

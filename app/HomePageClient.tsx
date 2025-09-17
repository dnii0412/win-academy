"use client"

import AnimatedCounter from "@/components/animated-counter"
import ScrollProgress from "@/components/scroll-progress"
import AnimatedSection from "@/components/animated-section"
import TestimonialCarousel from "@/components/testimonial-carousel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { Course } from "@/types/course"
import CourseImage from "@/components/course-image"
import PerformanceOptimizer from "@/components/performance-optimizer"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Play, ShoppingCart, BookOpen } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface HomePageClientProps {
  featuredCourses: Course[]
  session: any
}

export default function HomePageClient({ featuredCourses, session }: HomePageClientProps) {
  const { data: clientSession } = useSession()
  const { t } = useLanguage()
  const [courseAccess, setCourseAccess] = useState<Record<string, boolean>>({})
  const [isCheckingAccess, setIsCheckingAccess] = useState(false)

  // Check course access for all featured courses
  const checkCourseAccess = async (courseId: string) => {
    if (!clientSession?.user?.email) return false

    try {
      const response = await fetch(`/api/courses/${courseId}/access`)
      if (response.ok) {
        const data = await response.json()
        return data.hasAccess
      }
    } catch (error) {
      console.error('Error checking course access:', error)
    }
    return false
  }

  // Check access for all courses when component mounts or session changes
  useEffect(() => {
    const checkAllCourseAccess = async () => {
      if (!clientSession?.user?.email) return

      setIsCheckingAccess(true)
      const accessPromises = featuredCourses.map(async (course) => {
        const hasAccess = await checkCourseAccess(course._id)
        return { courseId: course._id, hasAccess }
      })

      const results = await Promise.all(accessPromises)
      const accessMap = results.reduce((acc, { courseId, hasAccess }) => {
        acc[courseId] = hasAccess
        return acc
      }, {} as Record<string, boolean>)

      setCourseAccess(accessMap)
      setIsCheckingAccess(false)
    }

    checkAllCourseAccess()
  }, [clientSession?.user?.email, featuredCourses])

  // Handle structured data on client side to prevent hydration mismatch
  useEffect(() => {
    // Structured data for organization
    const organizationStructuredData = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "WIN Academy",
      "description": "Mongolia's premier academy for digital professionals offering practical digital skills training in marketing, design, and AI.",
      "url": "https://winacademy.mn",
      "logo": "https://winacademy.mn/images/win_logo_main.jpg",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Pearl Tower B Corpus, 11th Floor, Room 1101",
        "addressLocality": "Ulaanbaatar",
        "addressCountry": "Mongolia"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+976-11-123456",
        "contactType": "customer service",
        "email": "info@winacademy.mn"
      },
      "sameAs": [
        "https://facebook.com/winacademy",
        "https://twitter.com/winacademy",
        "https://linkedin.com/company/winacademy"
      ],
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "MNT",
        "lowPrice": "50000",
        "highPrice": "500000",
        "offerCount": featuredCourses.length
      }
    }

    // Structured data for courses
    const coursesStructuredData = featuredCourses.map(course => ({
      "@context": "https://schema.org",
      "@type": "Course",
      "name": course.title,
      "description": course.description,
      "provider": {
        "@type": "EducationalOrganization",
        "name": "WIN Academy",
        "url": "https://winacademy.mn"
      },
      "courseCode": course._id,
      "educationalLevel": course.level,
      "inLanguage": ["mn", "en"],
      "timeRequired": `PT${course.duration}M`,
      "offers": {
        "@type": "Offer",
        "price": course.price,
        "priceCurrency": "MNT",
        "availability": "https://schema.org/InStock"
      },
      "image": course.thumbnailUrl,
      "url": `https://winacademy.mn/courses/${course._id}`,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": 0
      }
    }))

    // Create and append organization script
    const orgScript = document.createElement('script')
    orgScript.type = 'application/ld+json'
    orgScript.textContent = JSON.stringify(organizationStructuredData)
    document.head.appendChild(orgScript)

    // Create and append course scripts
    const courseScripts = coursesStructuredData.map(courseData => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(courseData)
      document.head.appendChild(script)
      return script
    })

    // Cleanup function to remove scripts when component unmounts
    return () => {
      if (orgScript.parentNode) {
        orgScript.parentNode.removeChild(orgScript)
      }
      courseScripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      })
    }
  }, [featuredCourses])

  const benefits = [
    {
      title: "Чухал ур чадварууд",
      description: "Монголын хөгжиж буй дижитал эдийн засгийн бодит ажлын байрны төлөө зориулсан сургалтууд.",
      icon: "🎯",
    },
    {
      title: "Хурдан хөгжил",
      description: "Манай хурдасгасан сургалтын аргаар суралцаж, дадлага хийж, хурдан ажилд орох боломж.",
      icon: "⚡",
    },
    {
      title: "AI-хөгжүүлэлт",
      description: "Одоо үед хэрэгцээтэй AI чанартай хэрэглэх аргачлалууд.",
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
      role: "График дизайнер",
      content: "Энэ сургалт надад дизайны мэргэжлийн эхлэл болсон. Одоо би томоохон компанид ажиллаж байна.",
    },
    {
      name: "Munkh-Erdene B.",
      role: "AI хөгжүүлэгч",
      content: "AI-ийн сургалт миний карьераа бүрэн өөрчилсөн. Одоо би AI төслүүд дээр ажиллаж байна.",
    },
  ]

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PerformanceOptimizer />


      <ScrollProgress />

      {/* Hero Section */}
      <section className="bg-background min-h-[70vh] sm:min-h-[80vh] lg:h-[90vh] flex items-center relative overflow-hidden pt-8 pb-8">
        {/* Background image with blur effect for mobile and tablet */}
        <div className="absolute inset-0 lg:hidden">
          <img
            src="/images/student-learning.jpeg"
            alt="Students learning digital skills at WIN Academy"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        </div>

        {/* Original gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-transparent animate-pulse dark:from-red-950/20" />
        <div className="absolute inset-0 dark:bg-black/40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full overflow-x-hidden z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <AnimatedSection animation="slideLeft">
              {/* Text content with enhanced visibility on mobile/tablet */}
              <div className="lg:bg-transparent bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-xl p-6 lg:p-0 lg:backdrop-blur-none lg:bg-transparent">
                <h1
                  className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 leading-tight break-words"
                  dangerouslySetInnerHTML={{ __html: t("home.hero.title") }}
                />

                <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed break-words">
                  {t("home.hero.motto")}
                </p>

                <div className="mb-6 p-3 bg-muted rounded-lg inline-block">
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">{t("home.hero.studentsHired")}</span>
                    <AnimatedCounter end={120} suffix="+" />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Link href="/courses" className="flex-1">
                    <Button className="w-full bg-[#FF344A] hover:bg-[#E02A3C] text-white text-sm sm:text-base px-4 sm:px-6 py-3 transition-all duration-300 hover:shadow-lg hover:scale-105">
                      {t("home.hero.startLearning")}
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full border-[#FF344A] text-[#FF344A] hover:bg-[#FF344A] hover:text-white text-sm sm:text-base px-4 sm:px-6 py-3 bg-transparent transition-all duration-300 hover:shadow-lg hover:scale-105"
                    >
                      {t("nav.register")}
                    </Button>
                  </Link>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection animation="slideRight">
              <div className="relative mt-8 lg:mt-0">
                {/* Desktop image - hidden on mobile/tablet */}
                <img
                  src="/images/student-learning.jpeg"
                  alt="Students learning digital skills at WIN Academy - Digital marketing, web design, and AI programming courses"
                  title="WIN Academy Students Learning Digital Skills"
                  className="hidden lg:block w-full h-auto max-h-[60vh] object-cover rounded-lg shadow-2xl"
                  width="800"
                  height="600"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Боломжит сургалтууд</h2>
            <p className="text-xl text-muted-foreground">Манай мэргэжлийн сургалтуудаар сургалтын аялаа эхлээрэй</p>
          </AnimatedSection>
          {featuredCourses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Манай сургалтууд удахгүй байрших болно.
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Манай багш нар сургалтуудаа бэлтгэж байна. Шинэчлэлтүүдийг хүлээж байгаарай!
              </p>
            </div>
          ) : (
            <div className={`flex justify-center ${featuredCourses.length === 1 || featuredCourses.length === 2 ? 'w-full' : ''
              }`}>
              <div className={`grid gap-8 ${featuredCourses.length === 1
                ? 'grid-cols-1'
                : featuredCourses.length === 2
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}>
                {featuredCourses.slice(0, 3).map((course, index) => {
                  const hasAccess = courseAccess[course._id] || false
                  const isLoggedIn = !!clientSession?.user?.email

                  return (
                    <AnimatedSection key={course._id} animation="fadeUp" className={`delay-${index * 100}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full flex flex-col">
                        <div className="relative">
                          <CourseImage
                            thumbnailUrl={course.thumbnailUrl}
                            title={course.title}
                            category={course.category}
                            size="medium"
                            className="w-full h-48"
                          />
                          {hasAccess && (
                            <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600 z-10">
                              Худалдан авсан
                            </Badge>
                          )}
                        </div>

                        <CardHeader className="pb-3 flex-1 flex flex-col">
                          <CardTitle className="text-lg line-clamp-2">
                            {course.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2 flex-1">
                            {course.description ? course.description.substring(0, 120) + '...' : 'No description available'}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-0 flex flex-col flex-1">
                          <div className="text-center mb-4">
                            <span className="text-2xl font-bold text-[#FF344A]">
                              ₮{course.price.toLocaleString()}
                            </span>
                          </div>

                          <div className="space-y-3 mt-auto">
                            <div className="w-full">
                              <Link href={`/courses/${course._id}`} className="block">
                                <Button variant="outline" className="w-full border-[#FF344A] text-[#FF344A] hover:bg-[#FF344A] hover:text-white whitespace-normal leading-tight">
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Дэлгэрэнгүй
                                </Button>
                              </Link>
                            </div>
                            <div className="w-full">
                              {hasAccess ? (
                                <Link href={`/learn/${course._id}`} className="block">
                                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white whitespace-normal leading-tight">
                                    <Play className="h-4 w-4 mr-2" />
                                    Үргэлжлүүлэх
                                  </Button>
                                </Link>
                              ) : isLoggedIn ? (
                                <Link href={`/checkout/${course._id}`} className="block">
                                  <Button className="w-full bg-[#FF344A] hover:bg-[#E02A3C] text-white whitespace-normal leading-tight">
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Худалдаж авах
                                  </Button>
                                </Link>
                              ) : (
                                <Link href={`/login?callbackUrl=${encodeURIComponent(`/checkout/${course._id}`)}`} className="block">
                                  <Button className="w-full bg-[#FF344A] hover:bg-[#E02A3C] text-white whitespace-normal leading-tight">
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Нэвтрэх / Худалдаж авах
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </AnimatedSection>
                  )
                })}
              </div>
            </div>
          )}
          <AnimatedSection className="text-center mt-12">
            <Link href="/courses">
              <Button className="bg-[#FF344A] hover:bg-[#E02A3C] text-white text-lg px-8 py-4 transition-all duration-300 hover:shadow-lg hover:scale-105">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <h2 className="text-4xl font-bold text-foreground mb-6">Бидэнтэй холбогдоорой</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Сургалтын талаар дэлгэрэнгүй мэдээлэл авахыг хүсвэл бидэнтэй холбогдоно уу
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 group">
                  <span className="text-[#FF344A] transition-transform duration-300 group-hover:scale-110 mt-1">📍</span>
                  <div className="text-foreground">
                    <div className="font-medium">Хаяг</div>
                    <div className="text-sm text-muted-foreground">Pearl Tower B Corpus, 11-р давхар, 1101-р өрөө</div>
                    <div className="text-sm text-muted-foreground">Улаанбаатар хот</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 group">
                  <span className="text-[#FF344A] transition-transform duration-300 group-hover:scale-110">📞</span>
                  <span className="text-foreground">+976-9668-0707, +976-9016-6060</span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <span className="text-[#FF344A] transition-transform duration-300 group-hover:scale-110">✉️</span>
                  <span className="text-foreground">info@winacademy.mn</span>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection animation="slideRight">
              <div className="space-y-4">
                <div className="bg-gray-200 rounded-lg overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2673.878725907889!2d106.9034160764108!3d47.919383971220334!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5d9693a886ad7cad%3A0x124c9120b5666cdc!2sWin%20academy!5e1!3m2!1sen!2smn!4v1756355104950!5m2!1sen!2smn"
                    width="100%"
                    height="250"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Win Academy Location"
                    className="w-full h-48 sm:h-64 lg:h-80 rounded-lg"
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

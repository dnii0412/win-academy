"use client"

import AnimatedCounter from "@/components/animated-counter"
import ScrollProgress from "@/components/scroll-progress"
import AnimatedSection from "@/components/animated-section"
import TestimonialCarousel from "@/components/testimonial-carousel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Course } from "@/types/course"
import CourseImage from "@/components/course-image"
import PerformanceOptimizer from "@/components/performance-optimizer"

interface HomePageClientProps {
  featuredCourses: Course[]
}

export default function HomePageClient({ featuredCourses }: HomePageClientProps) {

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
      "ratingCount": course.enrolledUsers || 0
    }
  }))

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

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData),
        }}
      />
      {coursesStructuredData.map((courseData, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(courseData),
          }}
        />
      ))}

      <ScrollProgress />

      {/* Hero Section */}
      <section className="bg-background min-h-[70vh] sm:min-h-[80vh] lg:h-[90vh] flex items-center relative overflow-hidden pt-8 pb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-transparent animate-pulse dark:from-red-950/20" />
        <div className="absolute inset-0 dark:bg-black/40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full overflow-x-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <AnimatedSection animation="slideLeft">
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight break-words"
                dangerouslySetInnerHTML={{ __html: "Суралц. <span style='color: #E10600;'>Бүтээ.</span> Ажилд ор." }}
              />

              <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed break-words">
                Дижитал маркетинг, борлуулалт, график дизайн, хиймэл оюуны хамгийн шинэлэг хөтөлбөрүүд
              </p>

              <div className="mb-6 p-3 bg-muted rounded-lg inline-block">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Ажилд орсон сурагчид:</span>
                  <AnimatedCounter end={120} suffix="+" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Link href="/courses" className="flex-1">
                  <Button className="w-full bg-[#E10600] hover:bg-[#C70500] text-white text-sm sm:text-base px-4 sm:px-6 py-3 transition-all duration-300 hover:shadow-lg hover:scale-105">
                    Өнөөдөр суралцаж эхлээрэй
                  </Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white text-sm sm:text-base px-4 sm:px-6 py-3 bg-transparent transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    Бүртгүүлэх
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
            <AnimatedSection animation="slideRight">
              <div className="relative mt-8 lg:mt-0">
                <img
                  src="/images/student-learning.jpeg"
                  alt="Students learning digital skills at WIN Academy - Digital marketing, web design, and AI programming courses"
                  title="WIN Academy Students Learning Digital Skills"
                  className="w-full h-auto max-h-[40vh] sm:max-h-[50vh] lg:max-h-[60vh] object-cover rounded-lg shadow-2xl"
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
                        <div className="text-lg font-bold text-[#E10600] mb-3">
                          ₮{course.price.toLocaleString()}
                        </div>
                        <Button className="w-full bg-[#E10600] hover:bg-[#C70500] text-white whitespace-normal leading-tight">
                          төлбөр төлөх ₮{course.price.toLocaleString()}
                        </Button>
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
              <h2 className="text-4xl font-bold text-foreground mb-6">Бидэнтэй холбогдоорой</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Сургалтын талаар дэлгэрэнгүй мэдээлэл авахыг хүсвэл бидэнтэй холбогдоно уу
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 group">
                  <span className="text-[#E10600] transition-transform duration-300 group-hover:scale-110 mt-1">📍</span>
                  <div className="text-foreground">
                    <div className="font-medium">Хаяг</div>
                    <div className="text-sm text-muted-foreground">Pearl Tower B Corpus, 11-р давхар, 1101-р өрөө</div>
                    <div className="text-sm text-muted-foreground">Улаанбаатар хот</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 group">
                  <span className="text-[#E10600] transition-transform duration-300 group-hover:scale-110">📞</span>
                  <span className="text-foreground">+976-11-123456</span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <span className="text-[#E10600] transition-transform duration-300 group-hover:scale-110">✉️</span>
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

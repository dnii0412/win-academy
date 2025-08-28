"use client"

import AnimatedCounter from "@/components/animated-counter"
import ScrollProgress from "@/components/scroll-progress"
import AnimatedSection from "@/components/animated-section"
import TestimonialCarousel from "@/components/testimonial-carousel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"

export default function HomePage() {
  const { t } = useLanguage()

  // Empty array since we haven't implemented the course creation system yet
  const featuredCourses: any[] = []

  const benefits = [
    {
      title: t("home.benefits.skills.title"),
      description: t("home.benefits.skills.description"),
      icon: "🎯",
    },
    {
      title: t("home.benefits.growth.title"),
      description: t("home.benefits.growth.description"),
      icon: "⚡",
    },
    {
      title: t("home.benefits.ai.title"),
      description: t("home.benefits.ai.description"),
      icon: "🤖",
    },
  ]

  const testimonials = [
    {
      name: "Batbayar S.",
      role: t("home.testimonials.batbayar.role"),
      content: t("home.testimonials.batbayar.content"),
    },
    {
      name: "Oyunaa T.",
      role: t("home.testimonials.oyunaa.role"),
      content: t("home.testimonials.oyunaa.content"),
    },
    {
      name: "Munkh-Erdene B.",
      role: t("home.testimonials.munkh.role"),
      content: t("home.testimonials.munkh.content"),
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />

      {/* Hero Section */}
      <section className="bg-background h-[90vh] flex items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-transparent animate-pulse dark:from-red-950/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <AnimatedSection animation="slideLeft">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
                Learn. Create. <span className="text-[#E10600]">Get Hired.</span>
              </h1>

              {/* Main Motto */}
              <div className="mb-4">
                <h2 className="text-lg font-medium text-muted-foreground leading-relaxed">
                  {t("home.hero.motto")}
                </h2>
              </div>
              <div className="mb-6 p-3 bg-muted rounded-lg inline-block">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Students Hired:</span>
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
            <h2 className="text-4xl font-bold text-foreground mb-4">{t("home.courses.title")}</h2>
            <p className="text-xl text-muted-foreground">{t("home.courses.subtitle")}</p>
          </AnimatedSection>
          {featuredCourses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                {t("home.courses.comingSoon") || "Courses Coming Soon"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {t("home.courses.preparing") || "Our instructors are currently preparing amazing courses. Stay tuned for updates!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.map((course, index) => (
                <AnimatedSection key={index} animation="fadeUp" className={`delay-${index * 100}`}>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {course.title}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {course.description}
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          )}
          <AnimatedSection className="text-center mt-12">
            <Link href="/courses">
              <Button className="bg-[#E10600] hover:bg-[#C70500] text-white text-lg px-8 py-4 transition-all duration-300 hover:shadow-lg hover:scale-105">
                {t("home.courses.viewAll")}
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Why Win Academy */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">{t("home.benefits.title")}</h2>
            <p className="text-xl text-muted-foreground">{t("home.benefits.subtitle")}</p>
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
            <h2 className="text-4xl font-bold text-foreground mb-4">{t("home.testimonials.title")}</h2>
            <p className="text-xl text-muted-foreground">{t("home.testimonials.subtitle")}</p>
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
              <h2 className="text-4xl font-bold text-foreground mb-6">{t("home.contact.title")}</h2>
              <p className="text-xl text-muted-foreground mb-8">
                {t("home.contact.subtitle")}
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 group">
                  <span className="text-[#E10600] transition-transform duration-300 group-hover:scale-110 mt-1">📍</span>
                  <div className="text-foreground">
                    <div className="font-medium">{t("home.contact.location")}</div>
                    <div className="text-sm text-muted-foreground">{t("home.contact.floor")}</div>
                    <div className="text-sm text-muted-foreground">{t("home.contact.city")}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 group">
                  <span className="text-[#E10600] transition-transform duration-300 group-hover:scale-110">📞</span>
                  <span className="text-foreground">{t("home.contact.phone")}</span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <span className="text-[#E10600] transition-transform duration-300 group-hover:scale-110">✉️</span>
                  <span className="text-foreground">{t("home.contact.email")}</span>
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

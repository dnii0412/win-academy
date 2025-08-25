import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import CourseCard from "@/components/course-card"
import AnimatedCounter from "@/components/animated-counter"
import ScrollProgress from "@/components/scroll-progress"
import AnimatedSection from "@/components/animated-section"
import TestimonialCarousel from "@/components/testimonial-carousel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  const featuredCourses = [
    {
      title: "Graphic Design + AI",
      description: "Master graphic design fundamentals and AI-powered design tools to create stunning visuals.",
      price: "₮349,000",
      image: "/images/graphic-design-ai.jpeg",
    },
    {
      title: "Social Media Marketing",
      description: "Learn to create engaging content and grow your brand across all social platforms.",
      price: "₮299,000",
      image: "/images/social-media-marketing.jpeg",
    },
    {
      title: "Photoshop Master",
      description: "Become a Photoshop expert with advanced techniques for photo editing and digital art.",
      price: "₮399,000",
      image: "/images/photoshop-master.jpeg",
    },
  ]

  const benefits = [
    {
      title: "Skills that Matter",
      description: "Courses designed for real-world jobs in Mongolia's growing digital economy.",
      icon: "🎯",
    },
    {
      title: "Faster Growth",
      description: "Learn, practice, and get hired quickly with our accelerated learning approach.",
      icon: "⚡",
    },
    {
      title: "Powered by AI",
      description: "Stay ahead with cutting-edge AI tools and techniques integrated into every course.",
      icon: "🤖",
    },
  ]

  const testimonials = [
    {
      name: "Batbayar S.",
      role: "Digital Marketing Specialist",
      content:
        "Win Academy helped me land my dream job at a top marketing agency. The practical skills I learned were exactly what employers were looking for.",
    },
    {
      name: "Oyunaa T.",
      role: "Freelance Designer",
      content:
        "The UI/UX course transformed my career. I went from zero design experience to earning ₮2M+ monthly as a freelancer.",
    },
    {
      name: "Munkh-Erdene B.",
      role: "AI Consultant",
      content:
        "The AI tools course gave me the edge I needed. Now I help businesses automate their processes and increase efficiency.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />

      {/* Hero Section */}
      <section className="bg-background py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-transparent animate-pulse dark:from-red-950/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection animation="slideLeft">
              <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
                Learn. Create. <span className="text-[#E10600]">Get Hired.</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Empower yourself with practical digital skills in marketing, design, and AI. Join Mongolia's premier
                academy for digital professionals.
              </p>
              <div className="mb-8 p-4 bg-muted rounded-lg inline-block">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Students Hired:</span>
                  <AnimatedCounter end={120} suffix="+" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/courses">
                  <Button className="bg-[#E10600] hover:bg-[#C70500] text-white text-lg px-8 py-4 transition-all duration-300 hover:shadow-lg hover:scale-105">
                    Start Learning Today
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white text-lg px-8 py-4 bg-transparent transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  Watch Demo
                </Button>
              </div>
            </AnimatedSection>
            <AnimatedSection animation="slideRight">
              <div className="relative">
                <img
                  src="/images/student-learning.jpeg"
                  alt="Students learning digital skills"
                  className="w-full h-auto rounded-lg shadow-2xl"
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
            <h2 className="text-4xl font-bold text-foreground mb-4">Featured Courses</h2>
            <p className="text-xl text-muted-foreground">Start your journey with our most popular programs</p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course, index) => (
              <AnimatedSection key={index} animation="fadeUp" className={`delay-${index * 100}`}>
                <CourseCard {...course} />
              </AnimatedSection>
            ))}
          </div>
          <AnimatedSection className="text-center mt-12">
            <Link href="/courses">
              <Button className="bg-[#E10600] hover:bg-[#C70500] text-white text-lg px-8 py-4 transition-all duration-300 hover:shadow-lg hover:scale-105">
                View All Courses
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Why Win Academy */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why Win Academy?</h2>
            <p className="text-xl text-muted-foreground">Built for Mongolia's digital future</p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <AnimatedSection key={index} animation="fadeUp" className={`delay-${index * 200}`}>
                <Card className="text-center p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                      {benefit.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-4">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
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
            <h2 className="text-4xl font-bold text-foreground mb-4">Success Stories</h2>
            <p className="text-xl text-muted-foreground">Hear from our graduates who transformed their careers</p>
          </AnimatedSection>
          <AnimatedSection>
            <TestimonialCarousel testimonials={testimonials} />
          </AnimatedSection>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <AnimatedSection animation="slideLeft">
              <h2 className="text-4xl font-bold text-foreground mb-6">Get in Touch</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Ready to start your digital transformation? Contact us today.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 group">
                  <span className="text-[#E10600] transition-transform duration-300 group-hover:scale-110">📍</span>
                  <span className="text-foreground">Ulaanbaatar, Mongolia</span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <span className="text-[#E10600] transition-transform duration-300 group-hover:scale-110">📞</span>
                  <span className="text-foreground">+976 1234 5678</span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <span className="text-[#E10600] transition-transform duration-300 group-hover:scale-110">✉️</span>
                  <span className="text-foreground">hello@winacademy.mn</span>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection animation="slideRight">
              <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center overflow-hidden">
                <img
                  src="/win-academy-office-map.png"
                  alt="Win Academy Location"
                  className="w-full h-full object-cover rounded-lg transition-transform duration-300 hover:scale-110"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

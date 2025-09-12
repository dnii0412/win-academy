import { Course } from "@/types/course"
import dbConnect from "@/lib/mongoose"
import CourseModel from "@/lib/models/Course"
import dynamicImport from "next/dynamic"
import type { Metadata } from 'next'
import { auth } from "@/auth"

export const dynamic = 'force-dynamic'

const HomePageClient = dynamicImport(() => import("@/app/HomePageClient"), {
  loading: () => <div>Loading...</div>
})

export const metadata: Metadata = {
  title: 'WIN Academy - Digital Skills Training in Mongolia',
  description: 'Empower yourself with practical digital skills in marketing, design, and AI. Join Mongolia\'s premier academy for digital professionals. Learn from industry experts and advance your career.',
  keywords: [
    'digital marketing course Mongolia',
    'web design training Ulaanbaatar',
    'AI programming course',
    'digital skills academy',
    'professional development Mongolia',
    'online learning platform',
    'tech education Ulaanbaatar'
  ],
  openGraph: {
    title: 'WIN Academy - Digital Skills Training in Mongolia',
    description: 'Empower yourself with practical digital skills in marketing, design, and AI. Join Mongolia\'s premier academy for digital professionals.',
    images: [
      {
        url: '/images/student-learning.jpeg',
        width: 1200,
        height: 630,
        alt: 'Students learning digital skills at WIN Academy',
      },
    ],
  },
  twitter: {
    title: 'WIN Academy - Digital Skills Training in Mongolia',
    description: 'Empower yourself with practical digital skills in marketing, design, and AI. Join Mongolia\'s premier academy for digital professionals.',
    images: ['/images/student-learning.jpeg'],
  },
  alternates: {
    canonical: '/',
  },
}

async function getFeaturedCourses(): Promise<Course[]> {
  try {
    await dbConnect()
    
    // Fetch featured courses from database
    const courses = await CourseModel.find({ 
      status: { $ne: 'archived' }
    }).select({
      _id: 1,
      title: 1,
      titleMn: 1,
      description: 1,
      descriptionMn: 1,
      price: 1,
      category: 1,
      categoryMn: 1,
      level: 1,
      levelMn: 1,
      duration: 1,
      instructor: 1,
      instructorMn: 1,
      thumbnailUrl: 1,
      featured: 1,
      totalLessons: 1,
      createdAt: 1,
      status: 1
    }).sort({ featured: -1, createdAt: -1 }).limit(6).lean()

    return courses.map(course => ({
      ...course,
      _id: (course._id as any).toString()
    })) as unknown as Course[]
    } catch (error) {
      console.error('Error fetching featured courses:', error)
    return []
  }
}

export default async function HomePage() {
  const featuredCourses = await getFeaturedCourses()
  const session = await auth()

  return <HomePageClient featuredCourses={featuredCourses} session={session} />
}

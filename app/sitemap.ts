import { MetadataRoute } from 'next'
import dbConnect from '@/lib/mongoose'
import CourseModel from '@/lib/models/Course'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await dbConnect()
  
  // Get all published courses
  const courses = await CourseModel.find({ 
    status: { $ne: 'archived' } 
  }).select('_id updatedAt').lean()

  const courseUrls = courses.map((course) => ({
    url: `https://winacademy.mn/courses/${course._id}`,
    lastModified: course.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: 'https://winacademy.mn',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://winacademy.mn/courses',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://winacademy.mn/login',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://winacademy.mn/register',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://winacademy.mn/dashboard',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...courseUrls,
  ]
}

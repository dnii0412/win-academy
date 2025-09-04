export interface Lesson {
  id: string
  _id: string
  subcourseId: string
  title: string
  titleMn: string
  slug: string
  type: 'video' | 'text' | 'assignment' | 'quiz' | 'article'
  duration: number
  durationSec: number
  status: string
  order: number
  videoUrl: string | null
  videoStatus: string
  completed?: boolean
  video?: {
    status: 'processing' | 'ready' | 'error'
    videoId: string
  }
}

export interface Module {
  id: string
  title: string
  titleMn: string
  order: number
  lessons: Lesson[]
}

export interface Course {
  id: string
  _id: string
  title: string
  titleMn: string
  description: string
  descriptionMn: string
  shortDescription: string
  shortDescriptionMn?: string
  coverUrl?: string
  thumbnailUrl?: string
  price: number
  originalPrice?: number
  category: string
  categoryMn: string
  level: string
  levelMn: string
  enrolledUsers: number
  totalLessons: number
  duration: number
  instructor: string
  instructorMn: string
  tags: string[]
  tagsMn: string[]
  featured: boolean
  certificate: boolean
  language: string
  createdAt: string
  updatedAt: string
  modules: Module[]
  isEnrolled?: boolean
}

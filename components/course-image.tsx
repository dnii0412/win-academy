'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { getCourseThumbnailUrl, getCourseFallbackImage } from '@/lib/image-utils'

interface CourseImageProps {
  thumbnailUrl?: string
  title: string
  category?: string
  alt?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
  showFallbackIcon?: boolean
}

export default function CourseImage({
  thumbnailUrl,
  title,
  category,
  alt,
  size = 'medium',
  className = '',
  showFallbackIcon = true
}: CourseImageProps) {
  const [imageError, setImageError] = useState(false)


  // Get optimized image URL
  const optimizedUrl = thumbnailUrl ? getCourseThumbnailUrl(thumbnailUrl, size) : null

  // Handle image load error
  const handleImageError = () => {
    setImageError(true)
  }

  // If no thumbnail or error occurred, show fallback
  if (!optimizedUrl || imageError) {
    return (
      <div className={`relative bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-900 flex items-center justify-center ${className}`}>
        {showFallbackIcon && (
          <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-500 opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={optimizedUrl}
        alt={alt || `${title} - Digital Skills Course`}
        title={`${title} - WIN Academy Course`}
        className="w-full h-full object-cover transition-all duration-300"
        onError={handleImageError}
        loading="eager"
        width="400"
        height="300"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        fetchPriority="high"
      />
      {/* Optional overlay for hover effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  )
}

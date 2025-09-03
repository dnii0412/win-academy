/**
 * Image utilities for optimizing Cloudinary URLs and handling fallbacks
 */

interface ImageOptimizationOptions {
    width?: number
    height?: number
    quality?: 'auto' | 'best' | 'good' | 'eco' | number
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
    crop?: 'fill' | 'fit' | 'scale' | 'crop'
    gravity?: 'auto' | 'center' | 'face' | 'faces'
}

/**
 * Optimize a Cloudinary URL with transformations
 */
export function optimizeCloudinaryUrl(
    url: string,
    options: ImageOptimizationOptions = {}
): string {
    if (!url || !url.includes('cloudinary.com')) {
        return url
    }

    const {
        width,
        height,
        quality = 'auto',
        format = 'auto',
        crop = 'fill',
        gravity = 'auto'
    } = options

    // Extract the public ID and cloud name from the URL
    const urlParts = url.split('/')
    const uploadIndex = urlParts.findIndex(part => part === 'upload')

    if (uploadIndex === -1) {
        return url // Not a valid Cloudinary upload URL
    }

    const cloudName = urlParts[3] // cloudinary.com/[cloudname]
    const publicIdParts = urlParts.slice(uploadIndex + 1)
    const publicId = publicIdParts.join('/')

    // Build transformation string
    const transformations = []

    // Add format and quality first (order matters for Cloudinary)
    transformations.push(`f_${format}`)
    transformations.push(`q_${quality}`)

    // Add dimensions and cropping
    if (width) transformations.push(`w_${width}`)
    if (height) transformations.push(`h_${height}`)
    if (width || height) {
        transformations.push(`c_${crop}`)
        if (gravity !== 'auto') transformations.push(`g_${gravity}`)
    }

    const transformationString = transformations.join(',')

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}/${publicId}`
}

/**
 * Get optimized thumbnail URL for course cards
 */
export function getCourseThumbnailUrl(
    thumbnailUrl?: string,
    size: 'small' | 'medium' | 'large' = 'medium'
): string {
    if (!thumbnailUrl) {
        return '/images/course-placeholder.jpg' // We'll create this fallback
    }

    const sizeConfig = {
        small: { width: 400, height: 225 },   // 16:9 ratio
        medium: { width: 800, height: 450 },  // 16:9 ratio  
        large: { width: 1200, height: 675 }   // 16:9 ratio
    }

    const { width, height } = sizeConfig[size]

    return optimizeCloudinaryUrl(thumbnailUrl, {
        width,
        height,
        quality: 'auto',
        format: 'auto',
        crop: 'fill',
        gravity: 'auto'
    })
}

/**
 * Generate a placeholder image URL with text
 */
export function generatePlaceholderUrl(
    text: string,
    width: number = 800,
    height: number = 450,
    bgColor: string = 'e5e7eb',
    textColor: string = '6b7280'
): string {
    const encodedText = encodeURIComponent(text)
    return `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${encodedText}`
}

/**
 * Get fallback image for course based on category or title
 */
export function getCourseFallbackImage(title: string, category?: string): string {
    // You can customize this based on your course categories
    const categoryImages: Record<string, string> = {
        'programming': '/images/fallbacks/programming.jpg',
        'design': '/images/fallbacks/design.jpg',
        'business': '/images/fallbacks/business.jpg',
        'marketing': '/images/fallbacks/marketing.jpg',
        'data-science': '/images/fallbacks/data-science.jpg',
        'default': '/images/fallbacks/default-course.jpg'
    }

    const categoryKey = category?.toLowerCase().replace(/\s+/g, '-') || 'default'
    const fallbackImage = categoryImages[categoryKey] || categoryImages.default

    // If local fallback doesn't exist, generate a placeholder
    return fallbackImage || generatePlaceholderUrl(
        title.length > 30 ? title.substring(0, 30) + '...' : title,
        800,
        450,
        'f3f4f6',
        '374151'
    )
}

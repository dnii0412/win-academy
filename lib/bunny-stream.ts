interface BunnyVideo {
    id: string
    title: string
    description?: string
    thumbnailUrl?: string
    videoUrl: string
    duration: number
    size: number
    status: 'encoding' | 'ready' | 'error'
    createdAt: string
    updatedAt: string
}

interface UploadResponse {
    success: boolean
    videoId?: string
    error?: string
}

interface StreamResponse {
    success: boolean
    streamUrl?: string
    error?: string
}

export const BUNNY_STREAM_CONFIG = {
  libraryId: '488255',
  apiKey: '4c28cdf8-f836-423a-9cfee09414d0-1f41-4b3a',
  baseUrl: 'https://video.bunnycdn.com',
  streamUrl: 'https://iframe.mediadelivery.net',
  uploadUrl: 'https://video.bunnycdn.com',
  // Enhanced configuration for better TUS uploads
  maxChunkSize: 16 * 1024 * 1024, // 16MB chunks
  uploadTimeout: 1800000, // 30 minutes for large files
  retryAttempts: 3,
  retryDelay: 1000 // 1 second
}

// Enhanced TUS upload configuration
export const TUS_CONFIG = {
  version: '1.0.0',
  maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB max
  supportedExtensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
  supportedMimeTypes: [
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 
    'video/flv', 'video/webm', 'video/x-msvideo', 
    'video/quicktime', 'video/x-ms-wmv', 'video/x-flv'
  ]
}

export const getBunnyStreamUrl = (videoId: string) => {
  // Use the correct Bunny.net Stream embed URL format
  return `https://iframe.mediadelivery.net/embed/${BUNNY_STREAM_CONFIG.libraryId}/${videoId}`
}

export const getBunnyVideoUrl = (videoId: string) => {
  // Get the direct video file URL (not embed)
  return `https://iframe.mediadelivery.net/${BUNNY_STREAM_CONFIG.libraryId}/${videoId}/play_720p.mp4`
}

export const getBunnyThumbnailUrl = (videoId: string) => {
  return `${BUNNY_STREAM_CONFIG.baseUrl}/${BUNNY_STREAM_CONFIG.libraryId}/${videoId}/thumbnail.jpg`
}

export const getBunnyVideoInfo = async (videoId: string) => {
  try {
    const response = await fetch(`${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos/${videoId}`, {
      headers: {
        'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      return await response.json()
    }
    return null
  } catch (error) {
    console.error('Error fetching Bunny video info:', error)
    return null
  }
}

// Test function to check library access
export const testBunnyAccess = async () => {
  try {
    console.log('Testing Bunny library access...')
    
    // Try to list videos from the library
    const response = await fetch(`${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos`, {
      headers: {
        'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Library access test - Status:', response.status)
    if (response.ok) {
      const videos = await response.json()
      console.log('Library access successful, found videos:', videos)
      return { success: true, videos }
    } else {
      const errorText = await response.text()
      console.log('Library access failed:', errorText)
      return { success: false, error: errorText }
    }
  } catch (error) {
    console.error('Library access test error:', error)
    return { success: false, error: 'Network error' }
  }
}

export const createBunnyVideo = async (title: string, description?: string) => {
  try {
    console.log('Creating Bunny video with config:', {
      libraryId: BUNNY_STREAM_CONFIG.libraryId,
      apiKey: BUNNY_STREAM_CONFIG.apiKey.substring(0, 8) + '...',
      baseUrl: BUNNY_STREAM_CONFIG.baseUrl
    })

    // Try different endpoint formats
    const endpoints = [
      `${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos`,
      `${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/video`,
      `${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos/create`
    ]

    for (const endpoint of endpoints) {
      console.log('Trying endpoint:', endpoint)
      
      // Try with Authorization Bearer header
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description: description || ''
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Video created successfully at endpoint:', endpoint, result)
        return { success: true, videoId: result.guid }
      }
      
      console.log(`Endpoint ${endpoint} failed with status:`, response.status)
      const errorText = await response.text()
      console.log('Error response:', errorText)
    }
    
    // If all endpoints fail, try with AccessKey header on the first endpoint
    console.log('All endpoints failed, trying AccessKey header...')
    const response = await fetch(endpoints[0], {
      method: 'POST',
      headers: {
        'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        description: description || ''
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('Video created successfully with Authorization header:', result)
      return { success: true, videoId: result.guid }
    }
    
    const errorText = await response.text()
    console.error('All authentication methods failed. Final status:', response.status, 'Response:', errorText)
    return { success: false, error: `Failed to create video: ${response.status} - ${errorText}` }
  } catch (error) {
    console.error('Error creating Bunny video:', error)
    return { success: false, error: 'Network error' }
  }
}

export const getTusUploadUrl = (videoId: string) => {
  return `${BUNNY_STREAM_CONFIG.uploadUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos/${videoId}/tusupload`
}

export const getTusUploadHeaders = () => {
  return {
    'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
    'Tus-Resumable': '1.0.0',
    'Upload-Offset': '0'
  }
}

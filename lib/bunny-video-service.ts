/**
 * Centralized Bunny Video Service
 * Single source of truth for video creation and management
 */

import { BUNNY_STREAM_CONFIG } from './bunny-stream'
import crypto from 'crypto'

export interface VideoCreationResult {
  success: boolean
  videoId?: string
  uploadUrl?: string
  error?: string
  tusHeaders?: {
    authorizationSignature: string
    authorizationExpire: number
    libraryId: string
    videoId: string
  }
}

export interface VideoStatus {
  id: string
  status: 'created' | 'uploading' | 'processing' | 'ready' | 'error'
  progress: number
  error?: string
  urls?: {
    mp4?: string
    hls?: string
    thumbnail?: string
    embed?: string
  }
}

class BunnyVideoService {
  private static instance: BunnyVideoService
  private correlationId = 0

  static getInstance(): BunnyVideoService {
    if (!BunnyVideoService.instance) {
      BunnyVideoService.instance = new BunnyVideoService()
    }
    return BunnyVideoService.instance
  }

  private generateCorrelationId(): string {
    return `upload_${Date.now()}_${++this.correlationId}`
  }

  /**
   * Create a video entry in Bunny.net
   * This is the ONLY function that should create videos
   */
  async createVideo(
    filename: string, 
    description?: string,
    correlationId?: string
  ): Promise<VideoCreationResult> {
    const id = correlationId || this.generateCorrelationId()
    
    console.log(`🎬 [${id}] Creating Bunny video entry:`, {
      filename,
      description,
      libraryId: BUNNY_STREAM_CONFIG.libraryId,
      baseUrl: BUNNY_STREAM_CONFIG.baseUrl
    })

    try {
      const response = await fetch(
        `${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos`,
        {
          method: 'POST',
          headers: {
            'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: filename,
            description: description || `Uploaded: ${filename}`,
            metadata: {
              correlationId: id,
              uploadMethod: 'TUS',
              originalFilename: filename,
              uploadTimestamp: new Date().toISOString()
            }
          }),
          signal: AbortSignal.timeout(30000)
        }
      )

      console.log(`🎬 [${id}] Bunny API response:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [${id}] Bunny API error:`, {
          status: response.status,
          error: errorText
        })
        return {
          success: false,
          error: `Bunny API error: ${response.status} - ${errorText}`
        }
      }

      const videoData = await response.json()
      const videoId = videoData.guid

      if (!videoId) {
        console.error(`❌ [${id}] No video ID in response:`, videoData)
        return {
          success: false,
          error: 'No video ID returned from Bunny.net'
        }
      }

      console.log(`✅ [${id}] Video created successfully:`, {
        videoId,
        title: videoData.title,
        status: videoData.status
      })

      // Generate TUS headers for direct upload to Bunny
      const tusHeaders = this.generateTusHeaders(videoId)
      console.log(`🔐 [${id}] Generated TUS headers:`, {
        authorizationSignature: tusHeaders.authorizationSignature.substring(0, 16) + '...',
        authorizationExpire: tusHeaders.authorizationExpire,
        libraryId: tusHeaders.libraryId,
        videoId: tusHeaders.videoId
      })

      return {
        success: true,
        videoId,
        uploadUrl: this.getTusUploadUrl(),
        tusHeaders
      }

    } catch (error) {
      console.error(`❌ [${id}] Video creation failed:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate Bunny TUS presigned headers
   */
  generateTusHeaders(videoId: string): { authorizationSignature: string; authorizationExpire: number; libraryId: string; videoId: string } {
    const expiration = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    const signature = crypto
      .createHash('sha256')
      .update(BUNNY_STREAM_CONFIG.libraryId + BUNNY_STREAM_CONFIG.apiKey + expiration + videoId)
      .digest('hex')
    
    return {
      authorizationSignature: signature,
      authorizationExpire: expiration,
      libraryId: BUNNY_STREAM_CONFIG.libraryId,
      videoId: videoId
    }
  }

  /**
   * Get Bunny TUS upload endpoint
   */
  getTusUploadUrl(): string {
    return 'https://video.bunnycdn.com/tusupload'
  }

  /**
   * Get TUS upload headers
   */
  getTusHeaders(): Record<string, string> {
    return {
      'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
      'Tus-Resumable': '1.0.0',
      'Content-Type': 'application/octet-stream'
    }
  }

  /**
   * Check video processing status
   */
  async getVideoStatus(videoId: string): Promise<VideoStatus | null> {
    try {
      console.log(`📊 Checking video status: ${videoId}`)
      
      const response = await fetch(
        `${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos/${videoId}`,
        {
          method: 'GET',
          headers: {
            'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        console.error(`❌ Failed to get video status: ${response.status}`)
        return null
      }

      const video = await response.json()
      
      const status: VideoStatus = {
        id: videoId,
        status: this.mapBunnyStatus(video.status, video.transcodingStatus),
        progress: video.transcodingProgress || 0,
        error: video.transcodingError || video.errorMessage,
        urls: {
          mp4: video.mp4Url,
          hls: video.hlsUrl,
          thumbnail: video.thumbnailUrl,
          embed: `https://iframe.mediadelivery.net/embed/${BUNNY_STREAM_CONFIG.libraryId}/${videoId}`
        }
      }

      console.log(`📊 Video status:`, status)
      return status

    } catch (error) {
      console.error(`❌ Error checking video status:`, error)
      return null
    }
  }

  /**
   * Poll video status until ready or error
   */
  async pollVideoStatus(
    videoId: string, 
    maxAttempts: number = 60, 
    intervalMs: number = 5000
  ): Promise<VideoStatus | null> {
    console.log(`🔄 Starting status polling for video: ${videoId}`)
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const status = await this.getVideoStatus(videoId)
      
      if (!status) {
        console.log(`❌ [${attempt}/${maxAttempts}] Failed to get status`)
        continue
      }

      console.log(`📊 [${attempt}/${maxAttempts}] Status: ${status.status} (${status.progress}%)`)

      if (status.status === 'ready') {
        console.log(`✅ Video is ready!`)
        return status
      }

      if (status.status === 'error') {
        console.log(`❌ Video processing failed: ${status.error}`)
        return status
      }

      // Wait before next attempt
      if (attempt < maxAttempts) {
        console.log(`⏳ Waiting ${intervalMs}ms before next check...`)
        await new Promise(resolve => setTimeout(resolve, intervalMs))
      }
    }

    console.log(`⏰ Status polling timed out after ${maxAttempts} attempts`)
    return null
  }

  private mapBunnyStatus(bunnyStatus: number, transcodingStatus: number): VideoStatus['status'] {
    // Bunny status: 0=created, 1=uploading, 2-3=processing, 4=ready, 5=error
    // Transcoding status: 0=not started, 1=queued, 2-3=processing, 4=completed, 5=error
    
    if (bunnyStatus === 5 || transcodingStatus === 5) return 'error'
    if (bunnyStatus === 4 && transcodingStatus === 4) return 'ready'
    if (bunnyStatus >= 2 || transcodingStatus >= 2) return 'processing'
    if (bunnyStatus === 1) return 'uploading'
    return 'created'
  }
}

export const bunnyVideoService = BunnyVideoService.getInstance()

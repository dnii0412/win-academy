#!/usr/bin/env node

/**
 * Bunny Video Diagnostic Script
 * 
 * Usage: npx tsx scripts/check-bunny-video.ts <videoId>
 * 
 * This script checks the status of a video in Bunny.net and provides
 * detailed information about its processing state.
 * 
 * Checks if video actually received bytes from upload
 */

import { BUNNY_STREAM_CONFIG } from '../lib/bunny-stream'

interface BunnyVideoResponse {
  guid: string
  title: string
  status: number
  length: number
  storageSize: number
  dateCreated: string
  dateUploaded: string
  thumbnailCount: number
  thumbnailFileName: string
  thumbnailUrl: string
  videoLibraryId: number
  views: number
  isPublic: boolean
  mp4Support: number
  webmSupport: number
  aviSupport: number
  flvSupport: number
  thumbnailSpriteSupport: number
  thumbnailSpriteFileName: string
  thumbnailSpriteColumns: number
  thumbnailSpriteRows: number
  thumbnailSpriteMaxCount: number
  chapters: any[]
  moments: any[]
  metaTags: any[]
  transcodingMessages: any[]
  transcodingStatus: number
  transcodingProgress: number
  transcodingError: string
  availableResolutions: string
  mp4Url: string
  webmUrl: string
  ogvUrl: string
  hlsUrl: string
  dashUrl: string
  thumbnailSpriteUrl: string
  previewUrl: string
  previewGifUrl: string
  previewWebpUrl: string
  storyboard: any[]
  allowEarlyPlayback: boolean
  encodeProgress: number
  type: number
  errorMessage: string
}

async function checkBunnyVideo(videoId: string): Promise<void> {
  console.log('🐰 Bunny Video Diagnostic Tool')
  console.log('================================')
  console.log(`Video ID: ${videoId}`)
  console.log(`Library ID: ${BUNNY_STREAM_CONFIG.libraryId}`)
  console.log(`Base URL: ${BUNNY_STREAM_CONFIG.baseUrl}`)
  console.log('')

  try {
    // Check if environment variables are set
    if (!process.env.BUNNY_API_KEY && !BUNNY_STREAM_CONFIG.apiKey) {
      console.error('❌ Error: BUNNY_API_KEY environment variable not set')
      console.log('Please set BUNNY_API_KEY in your .env file or environment')
      process.exit(1)
    }

    const apiKey = process.env.BUNNY_API_KEY || BUNNY_STREAM_CONFIG.apiKey
    console.log(`API Key: ${apiKey.substring(0, 8)}...`)
    console.log('')

    // Fetch video information
    console.log('📡 Fetching video information...')
    const response = await fetch(
      `${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos/${videoId}`,
      {
        method: 'GET',
        headers: {
          'AccessKey': apiKey,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log(`Response Status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Failed to fetch video: ${response.status}`)
      console.error(`Error: ${errorText}`)
      process.exit(1)
    }

    const video: BunnyVideoResponse = await response.json()
    
    console.log('✅ Video found!')
    console.log('')

    // Display video information
    console.log('📊 Video Details:')
    console.log(`  Title: ${video.title}`)
    console.log(`  Status: ${video.status} (${getStatusText(video.status)})`)
    console.log(`  Length: ${video.length} seconds`)
    console.log(`  Storage Size: ${(video.storageSize / (1024 * 1024)).toFixed(2)} MB`)
    console.log(`  Created: ${new Date(video.dateCreated).toLocaleString()}`)
    console.log(`  Uploaded: ${video.dateUploaded ? new Date(video.dateUploaded).toLocaleString() : 'Not uploaded'}`)
    console.log('')

    // Display processing information
    console.log('🔄 Processing Status:')
    console.log(`  Transcoding Status: ${video.transcodingStatus} (${getTranscodingStatusText(video.transcodingStatus)})`)
    console.log(`  Transcoding Progress: ${video.transcodingProgress}%`)
    console.log(`  Encode Progress: ${video.encodeProgress}%`)
    if (video.transcodingError) {
      console.log(`  Transcoding Error: ${video.transcodingError}`)
    }
    if (video.errorMessage) {
      console.log(`  Error Message: ${video.errorMessage}`)
    }
    console.log('')

    // Display available formats
    console.log('🎬 Available Formats:')
    console.log(`  MP4 Support: ${video.mp4Support ? 'Yes' : 'No'}`)
    console.log(`  WebM Support: ${video.webmSupport ? 'Yes' : 'No'}`)
    console.log(`  AVI Support: ${video.aviSupport ? 'Yes' : 'No'}`)
    console.log(`  FLV Support: ${video.flvSupport ? 'Yes' : 'No'}`)
    console.log(`  Available Resolutions: ${video.availableResolutions || 'None'}`)
    console.log('')

    // Display URLs
    console.log('🔗 Video URLs:')
    if (video.mp4Url) console.log(`  MP4: ${video.mp4Url}`)
    if (video.webmUrl) console.log(`  WebM: ${video.webmUrl}`)
    if (video.hlsUrl) console.log(`  HLS: ${video.hlsUrl}`)
    if (video.dashUrl) console.log(`  DASH: ${video.dashUrl}`)
    if (video.thumbnailUrl) console.log(`  Thumbnail: ${video.thumbnailUrl}`)
    console.log('')

    // Display embed URL
    console.log('📺 Embed Information:')
    const embedUrl = `https://iframe.mediadelivery.net/embed/${BUNNY_STREAM_CONFIG.libraryId}/${videoId}`
    console.log(`  Embed URL: ${embedUrl}`)
    console.log('')

    // Check if video received bytes (critical for uploads)
    const hasBytes = video.length > 0 || video.storageSize > 0
    if (!hasBytes) {
      console.log('❌ CRITICAL: Video has no bytes! Upload failed.')
      console.log('   This means the file never reached Bunny.net')
      console.log('   Check that uploads go to the correct Bunny.net endpoint')
      console.log('   with proper AuthorizationSignature headers')
    } else {
      console.log('✅ Video received bytes from upload')
    }

    // Check if video is ready for playback
    const isReady = video.status === 4 && video.transcodingStatus === 4
    if (isReady) {
      console.log('✅ Video is ready for playback!')
    } else {
      console.log('⏳ Video is still processing...')
      if (video.transcodingProgress > 0) {
        console.log(`   Progress: ${video.transcodingProgress}%`)
      }
    }

    // Exit with appropriate code
    process.exit(isReady ? 0 : 1)

  } catch (error) {
    console.error('❌ Error checking video:', error)
    process.exit(1)
  }
}

function getStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    0: 'Created',
    1: 'Uploading',
    2: 'Processing',
    3: 'Processing',
    4: 'Ready',
    5: 'Error'
  }
  return statusMap[status] || 'Unknown'
}

function getTranscodingStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    0: 'Not started',
    1: 'Queued',
    2: 'Processing',
    3: 'Processing',
    4: 'Completed',
    5: 'Error'
  }
  return statusMap[status] || 'Unknown'
}

// Main execution
const videoId = process.argv[2]
if (!videoId) {
  console.error('❌ Error: Video ID required')
  console.log('Usage: npx tsx scripts/check-bunny-video.ts <videoId>')
  process.exit(1)
}

checkBunnyVideo(videoId)

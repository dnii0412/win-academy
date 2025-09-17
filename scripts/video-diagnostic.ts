#!/usr/bin/env tsx

import { BUNNY_STREAM_CONFIG } from '../lib/bunny-stream'
import { bunnyVideoService } from '../lib/bunny-video-service'

async function runVideoDiagnostic() {
  console.log('🔍 WIN Academy Video Playback Diagnostic')
  console.log('=' .repeat(50))
  
  // 1. Check Bunny Stream Configuration
  console.log('\n📋 1. Bunny Stream Configuration:')
  console.log(`   Library ID: ${BUNNY_STREAM_CONFIG.libraryId}`)
  console.log(`   API Key: ${BUNNY_STREAM_CONFIG.apiKey.substring(0, 8)}...`)
  console.log(`   Base URL: ${BUNNY_STREAM_CONFIG.baseUrl}`)
  console.log(`   Stream URL: ${BUNNY_STREAM_CONFIG.streamUrl}`)
  
  // 2. Test Bunny Stream API Access
  console.log('\n🌐 2. Testing Bunny Stream API Access:')
  try {
    const response = await fetch(`${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos`, {
      headers: {
        'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const videos = await response.json()
      console.log(`   ✅ API Access: SUCCESS`)
      console.log(`   📊 Total Videos: ${videos.length}`)
      
      if (videos.length > 0) {
        console.log(`   🎬 Sample Video: ${videos[0].title} (${videos[0].status})`)
      }
    } else {
      console.log(`   ❌ API Access: FAILED (${response.status})`)
      const errorText = await response.text()
      console.log(`   Error: ${errorText}`)
    }
  } catch (error) {
    console.log(`   ❌ API Access: ERROR`)
    console.log(`   Error: ${error}`)
  }
  
  // 3. Test Stream URL Generation
  console.log('\n🔗 3. Testing Stream URL Generation:')
  const testVideoId = 'test-video-123'
  const embedUrl = `https://iframe.mediadelivery.net/embed/${BUNNY_STREAM_CONFIG.libraryId}/${testVideoId}`
  console.log(`   Generated Embed URL: ${embedUrl}`)
  
  try {
    const streamResponse = await fetch(embedUrl, { method: 'HEAD' })
    console.log(`   Stream URL Status: ${streamResponse.status}`)
    if (streamResponse.status === 404) {
      console.log(`   ⚠️  Expected 404 for test video (video doesn't exist)`)
    }
  } catch (error) {
    console.log(`   ❌ Stream URL Test: ERROR`)
    console.log(`   Error: ${error}`)
  }
  
  // 4. Test Video Service
  console.log('\n🎥 4. Testing Video Service:')
  try {
    const testStatus = await bunnyVideoService.getVideoStatus('test-video-123')
    if (testStatus) {
      console.log(`   ✅ Video Service: WORKING`)
      console.log(`   Status: ${testStatus.status}`)
    } else {
      console.log(`   ⚠️  Video Service: No status for test video (expected)`)
    }
  } catch (error) {
    console.log(`   ❌ Video Service: ERROR`)
    console.log(`   Error: ${error}`)
  }
  
  // 5. Check Environment Variables
  console.log('\n🔧 5. Environment Variables:')
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`)
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Not Set'}`)
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not Set'}`)
  console.log(`   NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'Set' : 'Not Set'}`)
  
  // 6. Network Connectivity Test
  console.log('\n🌐 6. Network Connectivity:')
  const testUrls = [
    'https://iframe.mediadelivery.net',
    'https://video.bunnycdn.com',
    'https://www.youtube.com'
  ]
  
  for (const url of testUrls) {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      console.log(`   ${url}: ${response.status} ${response.statusText}`)
    } catch (error) {
      console.log(`   ${url}: ERROR - ${error}`)
    }
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('✅ Diagnostic Complete!')
}

// Run the diagnostic
runVideoDiagnostic().catch(console.error)

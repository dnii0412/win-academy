#!/usr/bin/env node

/**
 * TUS Flow Test Script
 * 
 * Usage: npx tsx scripts/test-tus-flow.ts
 * 
 * This script tests the complete TUS upload flow:
 * 1. Create video entry
 * 2. Generate TUS headers
 * 3. Create TUS upload session
 * 4. Upload a small test file
 */

import { BUNNY_STREAM_CONFIG } from '../lib/bunny-stream'
import crypto from 'crypto'

const BUNNY_API_KEY = BUNNY_STREAM_CONFIG.apiKey
const BUNNY_LIBRARY_ID = BUNNY_STREAM_CONFIG.libraryId

console.log('🔑 Using Bunny credentials:', {
  libraryId: BUNNY_LIBRARY_ID,
  apiKey: BUNNY_API_KEY.substring(0, 8) + '...'
})

async function testTusFlow() {
  try {
    console.log('🧪 Testing TUS upload flow...')
    
    // Step 1: Create video entry
    console.log('📹 Step 1: Creating video entry...')
    const videoResponse = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'TUS Test Video',
        collectionId: null
      })
    })

    if (!videoResponse.ok) {
      const errorText = await videoResponse.text()
      throw new Error(`Video creation failed: ${videoResponse.status} ${errorText}`)
    }

    const videoData = await videoResponse.json()
    const videoId = videoData.guid
    console.log('✅ Video created:', videoId)

    // Step 2: Generate TUS headers
    console.log('🔐 Step 2: Generating TUS headers...')
    const expiration = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    const signature = crypto
      .createHash('sha256')
      .update(BUNNY_LIBRARY_ID + BUNNY_API_KEY + expiration + videoId)
      .digest('hex')

    const tusHeaders = {
      authorizationSignature: signature,
      authorizationExpire: expiration,
      libraryId: BUNNY_LIBRARY_ID,
      videoId: videoId
    }

    console.log('✅ TUS headers generated:', {
      authorizationSignature: signature.substring(0, 16) + '...',
      authorizationExpire: expiration,
      libraryId: BUNNY_LIBRARY_ID,
      videoId: videoId
    })

    // Step 3: Create TUS upload session
    console.log('🔧 Step 3: Creating TUS upload session...')
    const tusCreateResponse = await fetch('https://video.bunnycdn.com/tusupload', {
      method: 'POST',
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Length': '1024',
        'Upload-Metadata': `filename ${Buffer.from('test.txt').toString('base64')},filetype ${Buffer.from('text/plain').toString('base64')}`,
        'AuthorizationSignature': tusHeaders.authorizationSignature,
        'AuthorizationExpire': tusHeaders.authorizationExpire.toString(),
        'LibraryId': tusHeaders.libraryId,
        'VideoId': tusHeaders.videoId,
        'Content-Type': 'application/octet-stream'
      }
    })

    console.log('📡 TUS creation response:', {
      status: tusCreateResponse.status,
      statusText: tusCreateResponse.statusText,
      location: tusCreateResponse.headers.get('Location'),
      tusResumable: tusCreateResponse.headers.get('Tus-Resumable')
    })

    if (tusCreateResponse.status !== 201) {
      const errorText = await tusCreateResponse.text()
      throw new Error(`TUS creation failed: ${tusCreateResponse.status} ${errorText}`)
    }

    const tusLocation = tusCreateResponse.headers.get('Location')
    if (!tusLocation) {
      throw new Error('No Location header in TUS creation response')
    }

    // Convert relative URL to absolute URL
    const fullTusLocation = tusLocation.startsWith('http') 
      ? tusLocation 
      : `https://video.bunnycdn.com${tusLocation}`

    console.log('✅ TUS session created:', fullTusLocation)

    // Step 4: Upload test data
    console.log('📤 Step 4: Uploading test data...')
    const testData = Buffer.from('Hello, TUS! This is a test upload.')
    
    const tusUploadResponse = await fetch(fullTusLocation, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/offset+octet-stream',
        'Upload-Offset': '0',
        'Tus-Resumable': '1.0.0',
        'AuthorizationSignature': tusHeaders.authorizationSignature,
        'AuthorizationExpire': tusHeaders.authorizationExpire.toString(),
        'LibraryId': tusHeaders.libraryId,
        'VideoId': tusHeaders.videoId
      },
      body: testData
    })

    console.log('📡 TUS upload response:', {
      status: tusUploadResponse.status,
      statusText: tusUploadResponse.statusText,
      uploadOffset: tusUploadResponse.headers.get('Upload-Offset')
    })

    if (tusUploadResponse.status !== 204) {
      const errorText = await tusUploadResponse.text()
      throw new Error(`TUS upload failed: ${tusUploadResponse.status} ${errorText}`)
    }

    console.log('✅ TUS upload completed!')

    // Step 4.5: Send HEAD request to complete the upload
    console.log('🔍 Step 4.5: Completing TUS upload...')
    const tusHeadResponse = await fetch(fullTusLocation, {
      method: 'HEAD',
      headers: {
        'Tus-Resumable': '1.0.0',
        'AuthorizationSignature': tusHeaders.authorizationSignature,
        'AuthorizationExpire': tusHeaders.authorizationExpire.toString(),
        'LibraryId': tusHeaders.libraryId,
        'VideoId': tusHeaders.videoId
      }
    })

    console.log('📡 TUS HEAD response:', {
      status: tusHeadResponse.status,
      statusText: tusHeadResponse.statusText,
      uploadOffset: tusHeadResponse.headers.get('Upload-Offset'),
      uploadLength: tusHeadResponse.headers.get('Upload-Length')
    })

    // Step 5: Check video status
    console.log('🔍 Step 5: Checking video status...')
    const statusResponse = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
      headers: {
        'AccessKey': BUNNY_API_KEY
      }
    })

    if (statusResponse.ok) {
      const statusData = await statusResponse.json()
      console.log('📊 Video status:', {
        id: statusData.guid,
        status: statusData.status,
        length: statusData.length,
        storageSize: statusData.storageSize,
        transcodingStatus: statusData.transcodingStatus
      })

      if (statusData.length > 0 || statusData.storageSize > 0) {
        console.log('✅ Video received bytes from TUS upload!')
      } else {
        console.log('❌ Video has no bytes - TUS upload may have failed')
      }
    }

    console.log('🎉 TUS flow test completed successfully!')
    console.log(`📹 Video ID: ${videoId}`)
    console.log(`🔗 Check in Bunny dashboard: https://dash.bunny.net/stream/videos/${videoId}`)

  } catch (error) {
    console.error('❌ TUS flow test failed:', error)
    process.exit(1)
  }
}

testTusFlow()

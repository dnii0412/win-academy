#!/usr/bin/env node

/**
 * Simple TUS Test Script
 * Tests the TUS upload endpoints
 */

const BASE_URL = 'http://localhost:3000'
const ADMIN_TOKEN = 'your-admin-token-here' // Replace with actual admin token

async function testTusEndpoints() {
  console.log('🧪 Testing TUS Endpoints...\n')

  try {
    // Test 1: Initialize TUS upload
    console.log('1️⃣ Testing TUS initialization...')
    const initResponse = await fetch(`${BASE_URL}/api/admin/upload/tus`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: 'test-video.mp4',
        contentType: 'video/mp4',
        fileSize: 1048576 // 1MB test file
      })
    })

    if (!initResponse.ok) {
      const errorText = await initResponse.text()
      console.log('❌ TUS initialization failed:', initResponse.status, errorText)
      return
    }

    const initResult = await initResponse.json()
    console.log('✅ TUS initialization successful:', initResult)

    const { uploadId, uploadUrl, videoId } = initResult

    // Test 2: Check upload status
    console.log('\n2️⃣ Testing upload status...')
    const statusResponse = await fetch(`${BASE_URL}/api/admin/upload/tus/${uploadId}`, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    })

    if (statusResponse.ok) {
      console.log('✅ Upload status check successful')
      console.log('Upload-Length:', statusResponse.headers.get('Upload-Length'))
      console.log('Upload-Offset:', statusResponse.headers.get('Upload-Offset'))
    } else {
      console.log('❌ Upload status check failed:', statusResponse.status)
    }

    // Test 3: Upload a small chunk
    console.log('\n3️⃣ Testing chunk upload...')
    const testChunk = Buffer.alloc(1024, 'A') // 1KB test chunk
    
    const chunkResponse = await fetch(`${BASE_URL}/api/admin/upload/tus/${uploadId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/octet-stream',
        'Upload-Offset': '0',
        'Tus-Resumable': '1.0.0'
      },
      body: testChunk
    })

    if (chunkResponse.ok) {
      const chunkResult = await chunkResponse.json()
      console.log('✅ Chunk upload successful:', chunkResult)
    } else {
      const errorText = await chunkResponse.text()
      console.log('❌ Chunk upload failed:', chunkResponse.status, errorText)
    }

    // Test 4: Check status after chunk
    console.log('\n4️⃣ Checking status after chunk...')
    const statusAfterResponse = await fetch(`${BASE_URL}/api/admin/upload/tus/${uploadId}`, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    })

    if (statusAfterResponse.ok) {
      console.log('✅ Status after chunk successful')
      console.log('Upload-Offset:', statusAfterResponse.headers.get('Upload-Offset'))
    } else {
      console.log('❌ Status after chunk failed:', statusAfterResponse.status)
    }

    // Test 5: Clean up
    console.log('\n5️⃣ Cleaning up test upload...')
    const deleteResponse = await fetch(`${BASE_URL}/api/admin/upload/tus/${uploadId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    })

    if (deleteResponse.ok) {
      console.log('✅ Test upload cleaned up successfully')
    } else {
      console.log('❌ Failed to clean up test upload:', deleteResponse.status)
    }

    console.log('\n🎉 TUS endpoint testing completed!')

  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testTusEndpoints()

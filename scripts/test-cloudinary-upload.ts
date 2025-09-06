#!/usr/bin/env tsx

/**
 * Test Cloudinary Upload Functionality
 * 
 * This script tests the Cloudinary upload API endpoint to ensure it's working correctly.
 */

import fs from 'fs'
import path from 'path'

async function testCloudinaryUpload() {
  console.log('🧪 Testing Cloudinary Upload API...\n')

  try {
    // Check if we have a test image
    const testImagePath = path.join(process.cwd(), 'public', 'images', 'test-image.jpg')
    
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ No test image found. Please add a test image at public/images/test-image.jpg')
      console.log('   Or create a simple test image for testing purposes.')
      return
    }

    console.log('1️⃣ Found test image:', testImagePath)
    
    // Read the test image
    const imageBuffer = fs.readFileSync(testImagePath)
    const file = new File([imageBuffer], 'test-image.jpg', { type: 'image/jpeg' })
    
    console.log('2️⃣ Test image loaded:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Test the API endpoint
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'test-uploads')
    formData.append('transformation', 'w_400,h_300,c_fill,q_auto,f_auto')

    console.log('3️⃣ Testing upload API...')
    
    const response = await fetch('http://localhost:3000/api/cloudinary/upload', {
      method: 'POST',
      body: formData,
    })

    console.log('4️⃣ Upload response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Upload successful!')
      console.log('   Secure URL:', result.data?.secure_url)
      console.log('   Public ID:', result.data?.public_id)
      console.log('   Dimensions:', `${result.data?.width}x${result.data?.height}`)
      console.log('   Format:', result.data?.format)
      console.log('   Size:', `${Math.round(result.data?.bytes / 1024)}KB`)
    } else {
      const error = await response.json()
      console.log('❌ Upload failed:')
      console.log('   Error:', error.error)
      console.log('   Details:', error.details)
      
      if (error.error?.includes('Unauthorized')) {
        console.log('\n💡 Tip: Make sure you are logged in as admin and have a valid admin token')
      }
      
      if (error.error?.includes('not configured')) {
        console.log('\n💡 Tip: Check your .env.local file for Cloudinary environment variables')
      }
    }

  } catch (error: any) {
    console.error('❌ Test failed:')
    console.error('Error:', error.message)
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Tip: Start your development server with: npm run dev')
    }
  }
}

// Run the test
testCloudinaryUpload()

import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import jwt from 'jsonwebtoken'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  console.log('=== Cloudinary Upload API Called ===')
  
  try {
    // Check Cloudinary configuration first
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME
    const configStatus = {
      hasCloudName: !!cloudName,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      cloudName: cloudName?.substring(0, 10) + '...'
    }
    
    console.log('Cloudinary config status:', configStatus)
    
    if (!cloudName || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary environment variables')
      return NextResponse.json({ 
        error: 'Cloudinary not configured. Please check environment variables.',
        details: 'Missing required environment variables: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET'
      }, { status: 500 })
    }

    // Check if user is authenticated (allow bypass in development)
    const authHeader = request.headers.get('authorization')
    console.log('Auth header present:', !!authHeader, 'starts with Bearer:', authHeader?.startsWith('Bearer '))
    
    // Allow bypass in development mode for testing
    const isDevelopment = process.env.NODE_ENV === 'development'
    const allowBypass = isDevelopment && !authHeader
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (allowBypass) {
        console.log('⚠️ Development mode: Bypassing authentication for testing')
      } else {
        console.log('Authentication failed - missing or invalid header')
        return NextResponse.json({ 
          error: 'Unauthorized - Missing or invalid authorization header',
          details: 'Please provide a valid Bearer token in the Authorization header'
        }, { status: 401 })
      }
    }

    let decoded: any
    
    if (allowBypass) {
      // Create a mock admin user for development
      decoded = {
        userId: 'dev-user',
        email: 'dev@example.com',
        role: 'admin'
      }
      console.log('⚠️ Development mode: Using mock admin user:', decoded)
    } else {
      const token = authHeader!.replace('Bearer ', '')
      
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
        console.log('✅ Cloudinary Upload - Token verified successfully:', {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        })
      } catch (jwtError) {
        console.log('❌ Invalid JWT token:', jwtError)
        return NextResponse.json({ 
          error: 'Unauthorized - Invalid or expired token',
          details: 'Please log in again'
        }, { status: 401 })
      }

      if (!decoded || decoded.role !== "admin") {
        console.log('❌ User is not admin:', decoded?.role)
        return NextResponse.json({ 
          error: 'Forbidden - Admin access required',
          details: 'Only administrators can upload images'
        }, { status: 403 })
      }
    }

    console.log('Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'course-thumbnails'

    console.log('Form data parsed:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      folder
    })

    if (!file) {
      console.log('No file provided in form data')
      return NextResponse.json({ 
        error: 'No file provided',
        details: 'The "file" field is missing from the form data'
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    console.log('Attempting Cloudinary upload:', {
      fileSize: file.size,
      fileType: file.type,
      fileName: file.name,
      folder: folder
    })

    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          width: 800,
          height: 600,
          crop: 'fill',
          quality: 'auto',
          fetch_format: 'auto'
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error details:', {
              message: error.message,
              http_code: error.http_code,
              name: error.name,
              fileSize: file.size,
              fileType: file.type,
              fileName: file.name,
              folder: folder
            })
            reject(error)
          } else {
            console.log('✅ Cloudinary upload successful:', {
              public_id: result?.public_id,
              secure_url: result?.secure_url,
              width: result?.width,
              height: result?.height,
              bytes: result?.bytes
            })
            resolve(result)
          }
        }
      ).end(buffer)
    })

    const result = uploadResponse as any

    return NextResponse.json({
      success: true,
      data: {
        secure_url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        resource_type: result.resource_type,
        folder: result.folder,
        original_filename: result.original_filename,
      }
    })

  } catch (error) {
    console.error('=== Cloudinary Upload API Error ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Full error:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown server error',
        type: error?.constructor?.name || 'Unknown'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve upload signature (for direct uploads)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || 'course-thumbnails'
    
    const timestamp = Math.round(new Date().getTime() / 1000)
    
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: folder,
        transformation: 'w_800,h_600,c_fill,q_auto,f_auto'
      },
      process.env.CLOUDINARY_API_SECRET!
    )

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder
    })

  } catch (error) {
    console.error('Signature generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    )
  }
}

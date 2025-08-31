import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { BUNNY_STREAM_CONFIG, TUS_CONFIG } from "@/lib/bunny-stream"
import { tusStorage } from "@/lib/tus-storage"

// Configure for large file uploads
export const config = {
  maxDuration: 300, // 5 minutes
}

// Enhanced file validation
function validateFile(filename: string, contentType: string, fileSize: number): { isValid: boolean; error?: string } {
  // Check file size
  if (fileSize > TUS_CONFIG.maxFileSize) {
    return {
      isValid: false,
      error: `File size ${(fileSize / (1024 * 1024 * 1024)).toFixed(2)}GB exceeds maximum allowed size of ${(TUS_CONFIG.maxFileSize / (1024 * 1024 * 1024)).toFixed(2)}GB`
    }
  }

  // Check file extension
  const fileExtension = filename.split('.').pop()?.toLowerCase()
  if (!fileExtension || !TUS_CONFIG.supportedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File extension .${fileExtension} is not supported. Supported extensions: ${TUS_CONFIG.supportedExtensions.join(', ')}`
    }
  }

  // Check MIME type
  if (!TUS_CONFIG.supportedMimeTypes.includes(contentType)) {
    return {
      isValid: false,
      error: `Content type ${contentType} is not supported. Supported types: ${TUS_CONFIG.supportedMimeTypes.join(', ')}`
    }
  }

  return { isValid: true }
}

// Enhanced Bunny.net video creation with retry logic
async function createBunnyVideoWithRetry(filename: string, description: string, retryCount = 0): Promise<{ success: boolean; videoId?: string; error?: string }> {
  try {
    console.log(`🔗 Creating Bunny.net video entry (attempt ${retryCount + 1})...`)
    
    const response = await fetch(`${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: filename,
        description: `Uploaded via TUS: ${description}`,
        metadata: {
          uploadMethod: 'TUS',
          originalFilename: filename,
          uploadTimestamp: new Date().toISOString()
        }
      }),
      signal: AbortSignal.timeout(30000) // 30 seconds timeout
    })

    if (response.ok) {
      const videoEntry = await response.json()
      const videoId = videoEntry.guid
      
      if (!videoId) {
        throw new Error('No video ID returned from Bunny.net')
      }

      console.log('✅ Video entry created in Bunny.net:', videoId)
      return { success: true, videoId }
    } else {
      const errorText = await response.text()
      throw new Error(`Bunny.net API error: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    console.error(`❌ Failed to create Bunny.net video (attempt ${retryCount + 1}):`, error)
    
    if (retryCount < BUNNY_STREAM_CONFIG.retryAttempts) {
      console.log(`🔄 Retrying in ${BUNNY_STREAM_CONFIG.retryDelay}ms...`)
      await new Promise(resolve => setTimeout(resolve, BUNNY_STREAM_CONFIG.retryDelay))
      return createBunnyVideoWithRetry(filename, description, retryCount + 1)
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during video creation'
    }
  }
}

// POST /api/admin/upload/tus - Initialize TUS upload
export async function POST(request: NextRequest) {
  try {
    console.log('🎥 TUS upload initialization request received')
    
    // Verify admin authentication from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No admin token found in Authorization header')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    let decoded: any
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    } catch (jwtError) {
      console.log('❌ Invalid JWT token:', jwtError)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!decoded || decoded.role !== "admin") {
      console.log('❌ Invalid admin token or user role')
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.log('✅ Admin authentication successful')

    // Get upload metadata from headers OR request body
    let uploadLength = request.headers.get('upload-length')
    let uploadMetadata = request.headers.get('upload-metadata')
    let tusResumable = request.headers.get('tus-resumable')
    let filename = 'unknown'
    let contentType = 'application/octet-stream'
    let fileSize = 0

    console.log('📋 Request headers received:', {
      uploadLength,
      uploadMetadata,
      tusResumable,
      contentType: request.headers.get('content-type')
    })

    // Check if this is a JSON request (frontend approach)
    const contentTypeHeader = request.headers.get('content-type')
    if (contentTypeHeader && contentTypeHeader.includes('application/json')) {
      console.log('📋 Detected JSON request, reading from body...')
      
      try {
        const body = await request.json()
        console.log('📋 Request body:', body)
        
        // Extract data from JSON body
        fileSize = body.fileSize || parseInt(uploadLength || '0')
        filename = body.filename || 'unknown'
        contentType = body.contentType || 'application/octet-stream'
        
        // Set TUS headers for compatibility
        uploadLength = fileSize.toString()
        uploadMetadata = `filename ${encodeURIComponent(filename)},contentType ${encodeURIComponent(contentType)}`
        tusResumable = '1.0.0'
        
        console.log('📋 Extracted from JSON body:', { fileSize, filename, contentType })
      } catch (bodyError) {
        console.log('⚠️ Failed to parse JSON body:', bodyError)
        // Fall back to header-based approach
      }
    }

    // If still no file size, try to get it from headers
    if (!fileSize && uploadLength) {
      fileSize = parseInt(uploadLength)
    }

    if (!fileSize || fileSize <= 0) {
      console.log('❌ No valid file size found in headers or body')
      return NextResponse.json({ 
        error: "Missing or invalid file size",
        details: "Please provide fileSize in request body or Upload-Length header"
      }, { status: 400 })
    }

    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2)
    console.log(`📊 File size: ${fileSizeMB} MB (${fileSize} bytes)`)

    // Parse metadata if provided in headers
    if (uploadMetadata && !filename) {
      try {
        const metadata = uploadMetadata.split(',').reduce((acc, item) => {
          const [key, value] = item.split(' ')
          if (key && value) {
            acc[key] = decodeURIComponent(value)
          }
          return acc
        }, {} as Record<string, string>)
        
        filename = metadata.filename || 'unknown'
        contentType = metadata.contentType || 'application/octet-stream'
        
        console.log('📋 Parsed metadata from headers:', metadata)
      } catch (metadataError) {
        console.log('⚠️ Failed to parse metadata from headers, using defaults:', metadataError)
      }
    }

    console.log(`📋 Final file info: ${filename} (${contentType})`)

    // Validate file type
    const allowedTypes = [
      "video/mp4", "video/avi", "video/mov", "video/wmv", "video/flv", "video/webm",
      "video/x-msvideo", "video/quicktime", "video/x-ms-wmv", "video/x-flv"
    ]
    
    const fileExtension = filename.split('.').pop()?.toLowerCase()
    const allowedExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm"]
    
    console.log('🔍 File type validation details:', {
      contentType,
      fileExtension,
      allowedTypes,
      allowedExtensions,
      contentTypeInAllowedTypes: allowedTypes.includes(contentType),
      fileExtensionInAllowedExtensions: fileExtension && allowedExtensions.includes(fileExtension)
    })
    
    const isValidType = allowedTypes.includes(contentType) || 
                       (fileExtension && allowedExtensions.includes(fileExtension))
    
    if (!isValidType) {
      console.log("❌ Invalid file type:", { contentType, fileExtension })
      console.log("❌ Validation failed - neither content type nor extension is allowed")
      return NextResponse.json({ 
        error: "Unsupported file type",
        details: { 
          contentType, 
          fileExtension, 
          allowedTypes, 
          allowedExtensions,
          reason: "File type not in allowed list and extension not recognized"
        }
      }, { status: 400 })
    }

    // Enhanced file validation
    const validation = validateFile(filename, contentType, fileSize)
    if (!validation.isValid) {
      console.log('❌ File validation failed:', validation.error)
      return NextResponse.json({ 
        error: "File validation failed",
        details: validation.error
      }, { status: 400 })
    }

    console.log('✅ File validation passed')

    // Create Bunny.net video entry with retry logic
    console.log('🔗 Creating Bunny.net video entry...')
    
    const videoCreation = await createBunnyVideoWithRetry(filename, `File: ${filename}, Size: ${(fileSize / (1024 * 1024)).toFixed(2)}MB`)
    
    if (!videoCreation.success || !videoCreation.videoId) {
      console.log('❌ Failed to create Bunny.net video entry:', videoCreation.error)
      return NextResponse.json({ 
        error: "Failed to create video entry in Bunny.net",
        details: videoCreation.error
      }, { status: 500 })
    }

    const videoId = videoCreation.videoId
    console.log('✅ Video entry created in Bunny.net:', videoId)

    // Generate unique upload ID
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create upload URL for TUS
    const uploadUrl = `${request.nextUrl.origin}/api/admin/upload/tus/${uploadId}`

    // Store upload information for chunk handling
    tusStorage.create({
      id: uploadId,
      videoId: videoId,
      filename: filename,
      contentType: contentType,
      fileSize: fileSize
    })

    console.log('✅ TUS Upload initialized:', { uploadId, uploadUrl, videoId })

    // Return TUS-compatible response with proper headers
    const response = NextResponse.json({
      success: true,
      uploadUrl: uploadUrl,
      uploadId,
      videoId: videoId,
      uploadHeaders: {
        'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
        'Content-Type': 'application/octet-stream'
      },
      message: "TUS upload initialized successfully. Use the uploadUrl for file uploads."
    })

    // Set TUS headers
    response.headers.set('Tus-Resumable', '1.0.0')
    response.headers.set('Location', uploadUrl)
    response.headers.set('Access-Control-Expose-Headers', 'Tus-Resumable, Location, Upload-Offset, Upload-Length')

    return response

  } catch (error) {
    console.error("❌ Failed to initialize TUS upload:", error)
    
    // Check if it's a file size error
    if (error instanceof Error && error.message.includes('413')) {
      return NextResponse.json({ 
        error: "File too large. Please check your server configuration for file size limits.",
        details: "The server is rejecting files larger than the configured limit. Contact your hosting provider to increase the limit."
      }, { status: 413 })
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error",
      details: "Check server logs for more information"
    }, { status: 500 })
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  
  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, HEAD, PATCH, OPTIONS, DELETE')
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Upload-Length, Upload-Metadata, Tus-Resumable, Upload-Offset')
  response.headers.set('Access-Control-Expose-Headers', 'Tus-Resumable, Upload-Offset, Location, Upload-Length')
  
  return response
}

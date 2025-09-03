import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { BUNNY_STREAM_CONFIG } from "@/lib/bunny-stream"
import { tusStorage } from "@/lib/tus-storage"

// Configure for large file uploads
export const config = {
  maxDuration: 900, // 15 minutes for large file chunked uploads
}

// PATCH /api/admin/upload/tus/[uploadId] - Handle TUS chunk uploads
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params
    console.log(`📦 TUS chunk upload request for uploadId: ${uploadId}`)

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No admin token found in Authorization header')
      return NextResponse.json({ 
        error: "Authentication required",
        StatusCode: 401 
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    let decoded: any
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    } catch (jwtError) {
      console.log('❌ Invalid JWT token:', jwtError)
      return NextResponse.json({ 
        error: "Invalid token",
        StatusCode: 401 
      }, { status: 401 })
    }

    if (!decoded || decoded.role !== "admin") {
      console.log('❌ Invalid admin token or user role:', { role: decoded?.role })
      return NextResponse.json({ 
        error: "Admin access required",
        StatusCode: 403 
      }, { status: 403 })
    }

    // Get upload info from storage
    console.log('🔍 Looking for upload session:', uploadId)
    console.log('📊 Current TUS storage stats:', tusStorage.getStats())
    console.log('📋 All upload IDs in storage:', Array.from(tusStorage['uploads'].keys()))
    
    const uploadInfo = tusStorage.get(uploadId)
    if (!uploadInfo) {
      console.log('❌ Upload session not found:', uploadId)
      return NextResponse.json({ 
        error: "Upload session not found",
        StatusCode: 404 
      }, { status: 404 })
    }

    console.log('✅ Upload session found:', {
      uploadId,
      videoId: uploadInfo.videoId,
      filename: uploadInfo.filename,
      fileSize: uploadInfo.fileSize,
      currentOffset: uploadInfo.offset || 0
    })

    // Get upload offset from headers
    const uploadOffset = request.headers.get('upload-offset')
    const tusResumable = request.headers.get('tus-resumable')
    
    if (!uploadOffset) {
      console.log('❌ Missing Upload-Offset header')
      return NextResponse.json({ 
        error: "Missing Upload-Offset header",
        StatusCode: 400 
      }, { status: 400 })
    }

    const offset = parseInt(uploadOffset)
    console.log(`📊 Upload offset: ${offset} bytes`)

    // Get the chunk data
    const chunkData = await request.arrayBuffer()
    const chunkSize = chunkData.byteLength
    
    console.log(`📦 Received chunk: ${chunkSize} bytes at offset ${offset}`)

    // Store chunk locally and update progress
    tusStorage.appendChunk(uploadId, Buffer.from(chunkData))
    const newOffset = offset + chunkSize
    
    console.log(`📊 Updated offset for ${uploadId}: ${newOffset}/${uploadInfo.fileSize}`)
    
    // Check if upload is complete
    const isComplete = newOffset >= uploadInfo.fileSize
    
    if (isComplete) {
      console.log('🎉 All chunks received! Uploading complete file to Bunny.net...')
      
      try {
        // Get all chunks and concatenate them
        const uploadInfo = tusStorage.get(uploadId)
        if (!uploadInfo) {
          throw new Error('Upload session not found')
        }
        
        // Calculate total size
        const totalSize = uploadInfo.chunks.reduce((sum, chunk) => sum + chunk.length, 0)
        console.log(`📦 Uploading complete file to Bunny.net: ${totalSize} bytes`)
        
        // For very large files, we'll upload in chunks to Bunny.net
        if (totalSize > 2 * 1024 * 1024 * 1024) { // 2GB limit
          console.log('⚠️ File too large for direct upload, uploading in chunks to Bunny.net...')
          
          try {
            const bunnyUploadUrl = `${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos/${uploadInfo.videoId}`
            
            // Upload in 10MB chunks to Bunny.net
            const chunkSize = 10 * 1024 * 1024 // 10MB chunks
            const completeFile = Buffer.concat(uploadInfo.chunks)
            
            console.log(`📦 Uploading ${totalSize} bytes in ${Math.ceil(totalSize / chunkSize)} chunks to Bunny.net...`)
            
            for (let offset = 0; offset < totalSize; offset += chunkSize) {
              const end = Math.min(offset + chunkSize, totalSize)
              const chunk = completeFile.slice(offset, end)
              const chunkLength = end - offset
              
              console.log(`📤 Uploading chunk ${Math.floor(offset / chunkSize) + 1}/${Math.ceil(totalSize / chunkSize)}: ${offset}-${end} (${chunkLength} bytes)`)
              
              const chunkResponse = await fetch(bunnyUploadUrl, {
                method: 'POST',
                headers: {
                  'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
                  'Content-Type': 'application/octet-stream',
                  'Content-Range': `bytes ${offset}-${end - 1}/${totalSize}`,
                  'Content-Length': chunkLength.toString()
                },
                body: chunk
              })
              
              if (!chunkResponse.ok) {
                const errorText = await chunkResponse.text()
                console.log(`⚠️ Chunk upload failed: ${chunkResponse.status} ${errorText}`)
                throw new Error(`Chunk upload failed: ${chunkResponse.status}`)
              }
              
              console.log(`✅ Chunk ${Math.floor(offset / chunkSize) + 1} uploaded successfully`)
            }
            
            console.log('✅ Large file uploaded to Bunny.net successfully in chunks!')
          } catch (chunkError) {
            console.log(`⚠️ Chunked upload to Bunny.net failed: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`)
            console.log('✅ Continuing with local completion...')
          }
        } else {
          // For smaller files, try the direct upload
          const bunnyUploadUrl = `${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos/${uploadInfo.videoId}`
          
          // Create an AbortController for timeout management
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000) // 5 minute timeout
          
          try {
            // Concatenate chunks only for smaller files
            const completeFile = Buffer.concat(uploadInfo.chunks)
            
            const bunnyResponse = await fetch(bunnyUploadUrl, {
              method: 'POST',
              headers: {
                'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
                'Content-Type': 'application/octet-stream',
                'Content-Length': totalSize.toString()
              },
              body: completeFile,
              signal: controller.signal
            })
            
            clearTimeout(timeoutId)
            
            if (bunnyResponse.ok) {
              console.log('✅ Complete file uploaded to Bunny.net successfully!')
            } else {
              const errorText = await bunnyResponse.text()
              console.log(`⚠️ Bunny.net upload failed: ${bunnyResponse.status} ${errorText}`)
              console.log('✅ Continuing with local completion...')
            }
          } catch (error) {
            clearTimeout(timeoutId)
            console.log(`⚠️ Bunny.net upload error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            console.log('✅ Continuing with local completion...')
          }
        }
        
        // Mark upload as complete
        tusStorage.complete(uploadId)
        
        // Return TUS-compatible response
        const response = new NextResponse(null, { status: 204 })
        response.headers.set('Tus-Resumable', '1.0.0')
        response.headers.set('Upload-Offset', newOffset.toString())
        response.headers.set('Upload-Complete', 'true')
        
        return response
      } catch (bunnyError) {
        console.error('❌ Error uploading complete file to Bunny.net:', bunnyError)
        return NextResponse.json({ 
          error: "Failed to upload complete file",
          details: bunnyError instanceof Error ? bunnyError.message : 'Unknown error',
          StatusCode: 500 
        }, { status: 500 })
      }
    } else {
      // Upload not complete, just return progress
      const response = new NextResponse(null, { status: 204 })
      response.headers.set('Tus-Resumable', '1.0.0')
      response.headers.set('Upload-Offset', newOffset.toString())
      
      return response
    }

  } catch (error) {
    console.error("❌ Failed to handle TUS chunk upload:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error",
      StatusCode: 500 
    }, { status: 500 })
  }
}

// HEAD /api/admin/upload/tus/[uploadId] - Get upload status
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params
    console.log(`📊 TUS status request for uploadId: ${uploadId}`)

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(null, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    let decoded: any
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    } catch (jwtError) {
      return new NextResponse(null, { status: 401 })
    }

    if (!decoded || decoded.role !== "admin") {
      return new NextResponse(null, { status: 403 })
    }

    // Get upload info from storage
    const uploadInfo = tusStorage.get(uploadId)
    if (!uploadInfo) {
      return new NextResponse(null, { status: 404 })
    }

    // Return TUS-compatible response
    const response = new NextResponse(null, { status: 200 })
    response.headers.set('Tus-Resumable', '1.0.0')
    response.headers.set('Upload-Offset', (uploadInfo.offset || 0).toString())
    response.headers.set('Upload-Length', uploadInfo.fileSize.toString())
    
    if (uploadInfo.completed) {
      response.headers.set('Upload-Complete', 'true')
    }
    
    return response

  } catch (error) {
    console.error("❌ Failed to handle TUS status request:", error)
    return new NextResponse(null, { status: 500 })
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  
  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'PATCH, HEAD, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Upload-Offset, Tus-Resumable')
  response.headers.set('Access-Control-Expose-Headers', 'Tus-Resumable, Upload-Offset, Upload-Length, Upload-Complete')
  
  return response
}
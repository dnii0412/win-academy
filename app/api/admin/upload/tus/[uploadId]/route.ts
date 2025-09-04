import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { BUNNY_STREAM_CONFIG } from "@/lib/bunny-stream"
import { tusStorage } from "@/lib/tus-storage"
import fs from "fs"
import path from "path"
import os from "os"

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
    console.log('🔐 TUS PATCH - Auth header received:', {
      hasHeader: !!authHeader,
      headerValue: authHeader ? `${authHeader.substring(0, 20)}...` : 'MISSING',
      startsWithBearer: authHeader?.startsWith('Bearer ')
    })
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No admin token found in Authorization header')
      return NextResponse.json({ 
        error: "Authentication required",
        StatusCode: 401 
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🔐 TUS PATCH - Token extracted:', {
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...',
      tokenEnd: '...' + token.substring(token.length - 10)
    })
    
    let decoded: any
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
      console.log('✅ TUS PATCH - Token verified successfully:', {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      })
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
        
        // Upload to Bunny.net using TUS protocol for better large file handling
        console.log('🚀 Starting TUS upload to Bunny.net...')
        
        try {
          console.log(`📤 Uploading ${totalSize} bytes (${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB) to Bunny.net using TUS...`)
          
          // Use Bunny.net's correct TUS endpoint for resumable uploads
          const tusUploadUrl = `${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos/${uploadInfo.videoId}`
          
          // Determine the correct content type based on the file
          const fileExtension = uploadInfo.filename.split('.').pop()?.toLowerCase()
          let contentType = 'video/mp4' // default
          
          if (fileExtension === 'mov') contentType = 'video/quicktime'
          else if (fileExtension === 'avi') contentType = 'video/x-msvideo'
          else if (fileExtension === 'webm') contentType = 'video/webm'
          else if (fileExtension === 'wmv') contentType = 'video/x-ms-wmv'
          else if (fileExtension === 'flv') contentType = 'video/x-flv'
          
          console.log(`📋 Using content type: ${contentType} for file: ${uploadInfo.filename}`)
          
          // Upload using TUS protocol - this is much better for large files
          const tusResponse = await fetch(tusUploadUrl, {
            method: 'POST',
            headers: {
              'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
              'Tus-Resumable': '1.0.0',
              'Upload-Length': totalSize.toString(),
              'Upload-Metadata': `filename ${encodeURIComponent(uploadInfo.filename)},contentType ${encodeURIComponent(contentType)}`,
              'Content-Type': 'application/octet-stream'
            }
          })
          
          if (!tusResponse.ok) {
            const errorText = await tusResponse.text()
            throw new Error(`TUS upload initialization failed: ${tusResponse.status} ${errorText}`)
          }
          
          // Get the upload URL from the response
          const uploadUrl = tusResponse.headers.get('Location')
          if (!uploadUrl) {
            throw new Error('No upload URL returned from TUS initialization')
          }
          
          console.log('✅ TUS upload initialized, uploading file chunks...')
          
          // Upload the file in chunks using TUS protocol
          let uploadedBytes = 0
          const chunkSize = 4 * 1024 * 1024 // 4MB chunks for TUS upload
          
          for (let i = 0; i < uploadInfo.chunks.length; i++) {
            const chunk = uploadInfo.chunks[i]
            const startByte = uploadedBytes
            const endByte = Math.min(startByte + chunk.length - 1, totalSize - 1)
            
            console.log(`📤 Uploading TUS chunk ${i + 1}/${uploadInfo.chunks.length}: ${chunk.length} bytes (${startByte}-${endByte})`)
            
            const chunkResponse = await fetch(uploadUrl, {
              method: 'PATCH',
              headers: {
                'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
                'Tus-Resumable': '1.0.0',
                'Upload-Offset': startByte.toString(),
                'Content-Type': 'application/octet-stream'
              },
              body: chunk
            })
            
            if (!chunkResponse.ok) {
              const errorText = await chunkResponse.text()
              throw new Error(`TUS chunk upload failed: ${chunkResponse.status} ${errorText}`)
            }
            
            uploadedBytes += chunk.length
            console.log(`✅ TUS chunk ${i + 1} uploaded successfully (${uploadedBytes}/${totalSize} bytes)`)
          }
          
          console.log('🎉 TUS upload to Bunny.net completed successfully!')
          
          // Wait a moment for Bunny.net to process the upload
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Check the video status
          const statusResponse = await fetch(`${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos/${uploadInfo.videoId}`, {
            method: 'GET',
            headers: {
              'AccessKey': BUNNY_STREAM_CONFIG.apiKey
            }
          })
          
          if (statusResponse.ok) {
            const videoData = await statusResponse.json()
            console.log('📊 Video status after TUS upload:', {
              status: videoData.status,
              length: videoData.length,
              storageSize: videoData.storageSize
            })
          }
          
        } catch (uploadError) {
          console.error('❌ Failed to upload to Bunny.net using TUS:', uploadError)
          
          // Fallback: Save file locally for manual upload
          try {
            console.log('📁 Fallback: Saving file locally for manual upload...')
            
            const uploadsDir = path.join(os.tmpdir(), 'bunny-uploads')
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true })
            }
            
            const fileName = `${uploadInfo.videoId}_${uploadInfo.filename}`
            const filePath = path.join(uploadsDir, fileName)
            
            // Use streaming to handle large files
            const writeStream = fs.createWriteStream(filePath)
            
            for (const chunk of uploadInfo.chunks) {
              writeStream.write(chunk)
            }
            
            writeStream.end()
            
            // Wait for the stream to finish
            await new Promise((resolve, reject) => {
              writeStream.on('finish', () => resolve(true))
              writeStream.on('error', reject)
            })
            
            console.log(`✅ File saved locally: ${filePath}`)
            console.log(`📋 File size: ${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`)
            console.log(`🔗 Video ID: ${uploadInfo.videoId}`)
            console.log(`📝 Manual upload instructions:`)
            console.log(`   1. Go to Bunny.net dashboard`)
            console.log(`   2. Find video ID: ${uploadInfo.videoId}`)
            console.log(`   3. Upload file: ${filePath}`)
            
          } catch (saveError) {
            console.error(`❌ Failed to save file locally: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`)
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
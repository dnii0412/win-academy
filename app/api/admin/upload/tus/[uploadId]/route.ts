import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { BUNNY_STREAM_CONFIG } from "@/lib/bunny-stream"
import { tusStorage } from "@/lib/tus-storage"

// Configure for large file uploads
export const config = {
  maxDuration: 300, // 5 minutes
}

// Enhanced Bunny.net upload with retry logic
async function uploadToBunnyWithRetry(videoId: string, fileBuffer: Buffer, filename: string, retryCount = 0): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🚀 Uploading to Bunny.net (attempt ${retryCount + 1})...`)
    
    const uploadUrl = `${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos/${videoId}`
    console.log('📤 Upload URL:', uploadUrl)
    console.log(`📊 File size: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB`)

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/json',
      },
      body: fileBuffer,
      signal: AbortSignal.timeout(BUNNY_STREAM_CONFIG.uploadTimeout)
    })

    if (response.ok) {
      console.log('✅ File successfully uploaded to Bunny.net')
      return { success: true }
    } else {
      const errorText = await response.text()
      throw new Error(`Bunny.net upload failed: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    console.error(`❌ Bunny.net upload failed (attempt ${retryCount + 1}):`, error)
    
    if (retryCount < BUNNY_STREAM_CONFIG.retryAttempts) {
      console.log(`🔄 Retrying in ${BUNNY_STREAM_CONFIG.retryDelay}ms...`)
      await new Promise(resolve => setTimeout(resolve, BUNNY_STREAM_CONFIG.retryDelay))
      return uploadToBunnyWithRetry(videoId, fileBuffer, filename, retryCount + 1)
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during upload'
    }
  }
}

// PATCH /api/admin/upload/tus/[uploadId] - Handle file chunks
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params
    console.log(`🎥 TUS chunk upload request for uploadId: ${uploadId}`)

    // Verify admin authentication
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

    // Get upload info
    const upload = tusStorage.get(uploadId)
    if (!upload) {
      console.log('❌ Upload not found:', uploadId)
      return NextResponse.json({ error: "Upload not found" }, { status: 404 })
    }

    // Get TUS headers
    const uploadOffset = parseInt(request.headers.get('upload-offset') || '0')
    const contentLength = parseInt(request.headers.get('content-length') || '0')
    const tusResumable = request.headers.get('tus-resumable')

    console.log('📋 TUS chunk headers:', { uploadOffset, contentLength, tusResumable })

    if (!tusResumable || tusResumable !== '1.0.0') {
      console.log('❌ Invalid TUS version:', tusResumable)
      return NextResponse.json({ error: "Invalid TUS version" }, { status: 400 })
    }

    if (contentLength <= 0) {
      console.log('❌ Invalid content length:', contentLength)
      return NextResponse.json({ error: "Invalid content length" }, { status: 400 })
    }

    // Validate offset
    if (uploadOffset !== upload.uploadedSize) {
      console.log('❌ Offset mismatch:', { expected: upload.uploadedSize, received: uploadOffset })
      return NextResponse.json({ error: "Offset mismatch" }, { status: 409 })
    }

    // Check if upload would exceed file size
    if (upload.uploadedSize + contentLength > upload.fileSize) {
      console.log('❌ Upload would exceed file size:', { 
        current: upload.uploadedSize, 
        chunk: contentLength, 
        max: upload.fileSize 
      })
      return NextResponse.json({ error: "Upload would exceed file size" }, { status: 400 })
    }

    // Read chunk data
    const chunkData = await request.arrayBuffer()
    const chunkBuffer = Buffer.from(chunkData)

    if (chunkBuffer.length !== contentLength) {
      console.log('❌ Chunk size mismatch:', { expected: contentLength, actual: chunkBuffer.length })
      return NextResponse.json({ error: "Chunk size mismatch" }, { status: 400 })
    }

    // Store chunk
    tusStorage.appendChunk(uploadId, chunkBuffer)
    const updatedUpload = tusStorage.update(uploadId, { 
      uploadedSize: upload.uploadedSize + chunkBuffer.length 
    })

    if (!updatedUpload) {
      console.log('❌ Failed to update upload')
      return NextResponse.json({ error: "Failed to update upload" }, { status: 500 })
    }

    console.log(`✅ Chunk stored: ${chunkBuffer.length} bytes, total uploaded: ${updatedUpload.uploadedSize}/${updatedUpload.fileSize}`)

    // Check if upload is complete
    if (updatedUpload.uploadedSize === updatedUpload.fileSize) {
      console.log('🎉 Upload complete! Assembling file and uploading to Bunny.net...')
      
      try {
        // Assemble complete file
        const completeFile = Buffer.concat(updatedUpload.chunks)
        console.log(`📦 File assembled: ${completeFile.length} bytes`)

        // Mark upload as processing
        tusStorage.markAsProcessing(uploadId)
        
        // Upload to Bunny.net with retry logic
        const uploadResult = await uploadToBunnyWithRetry(
          updatedUpload.videoId, 
          completeFile, 
          updatedUpload.filename
        )

        if (uploadResult.success) {
          console.log('✅ File successfully uploaded to Bunny.net')
          
          // Mark as completed and clean up
          tusStorage.markAsCompleted(uploadId)
          tusStorage.delete(uploadId)
          
          return NextResponse.json({
            success: true,
            message: "File uploaded successfully to Bunny.net",
            videoId: updatedUpload.videoId,
            fileSize: updatedUpload.fileSize
          })
        } else {
          console.error('❌ Bunny.net upload failed after retries:', uploadResult.error)
          
          // Mark as error
          tusStorage.markAsError(uploadId, uploadResult.error || 'Upload failed')
          
          return NextResponse.json({ 
            error: "Failed to upload file to Bunny.net after retries",
            details: uploadResult.error
          }, { status: 500 })
        }

      } catch (uploadError) {
        console.error('❌ Error during file assembly or upload:', uploadError)
        return NextResponse.json({ 
          error: "Failed to process complete file",
          details: uploadError instanceof Error ? uploadError.message : "Unknown error"
        }, { status: 500 })
      }
    }

    // Return success with updated offset
    const response = NextResponse.json({
      success: true,
      message: "Chunk uploaded successfully",
      uploadOffset: updatedUpload.uploadedSize
    })

    // Set TUS headers
    response.headers.set('Tus-Resumable', '1.0.0')
    response.headers.set('Upload-Offset', updatedUpload.uploadedSize.toString())
    response.headers.set('Access-Control-Expose-Headers', 'Tus-Resumable, Upload-Offset')

    return response

  } catch (error) {
    console.error("❌ Failed to process TUS chunk:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error",
      details: "Check server logs for more information"
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    let decoded: any
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    } catch (jwtError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get upload info
    const upload = tusStorage.get(uploadId)
    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 })
    }

    // Return upload status
    const response = new NextResponse(null, { status: 200 })
    
    // Set TUS headers
    response.headers.set('Tus-Resumable', '1.0.0')
    response.headers.set('Upload-Offset', upload.uploadedSize.toString())
    response.headers.set('Upload-Length', upload.fileSize.toString())
    response.headers.set('Access-Control-Expose-Headers', 'Tus-Resumable, Upload-Offset, Upload-Length')

    return response

  } catch (error) {
    console.error("❌ Failed to get TUS status:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 })
  }
}

// DELETE /api/admin/upload/tus/[uploadId] - Remove upload
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params
    console.log(`🗑️ TUS delete request for uploadId: ${uploadId}`)

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    let decoded: any
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    } catch (jwtError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Remove upload
    const upload = tusStorage.get(uploadId)
    if (upload) {
      tusStorage.delete(uploadId)
      console.log(`✅ Upload ${uploadId} removed`)
    }

    return NextResponse.json({
      success: true,
      message: "Upload removed successfully"
    })

  } catch (error) {
    console.error("❌ Failed to delete TUS upload:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 })
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  
  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'PATCH, HEAD, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Upload-Offset, Tus-Resumable')
  response.headers.set('Access-Control-Expose-Headers', 'Tus-Resumable, Upload-Offset, Upload-Length')
  
  return response
}

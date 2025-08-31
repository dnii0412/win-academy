import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { BUNNY_STREAM_CONFIG } from "@/lib/bunny-stream"

// Configure for large file uploads with extended timeout
export const config = {
  maxDuration: 900, // 15 minutes for large file uploads
}

// In-memory storage for video chunks (in production, use Redis or similar)
interface VideoChunks {
  chunks: Buffer[]
  totalChunks: number
  fileName: string
}

const chunkStore = new Map<string, VideoChunks>()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { videoId } = await params
    console.log("Processing videoId:", videoId)
    
    const formData = await request.formData()
    const chunk = formData.get('chunk') as File
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)
    const totalChunks = parseInt(formData.get('totalChunks') as string)
    const fileName = formData.get('fileName') as string

    console.log("Chunk data:", { chunkIndex, totalChunks, fileName, chunkSize: chunk?.size })

    if (!chunk || chunkIndex === undefined || totalChunks === undefined || !fileName) {
      console.log("Missing chunk data")
      return NextResponse.json({ error: "Missing chunk data" }, { status: 400 })
    }

    // Check chunk size (should be under 4MB for Vercel serverless function limits)
    if (chunk.size > 4 * 1024 * 1024) {
      console.log("Chunk too large:", chunk.size)
      return NextResponse.json({ error: "Chunk too large for Vercel limits" }, { status: 400 })
    }

    // Convert chunk to Buffer
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer())
    console.log("Chunk converted to buffer, size:", chunkBuffer.length)
    
    // Store chunk
    if (!chunkStore.has(videoId)) {
      const newChunks = new Array(totalChunks)
      chunkStore.set(videoId, { chunks: newChunks, totalChunks, fileName })
      console.log("Created new chunk store for videoId:", videoId, "with", totalChunks, "slots")
    }
    
    const videoChunks = chunkStore.get(videoId)!
    console.log("Current chunks state:", {
      chunksLength: videoChunks.chunks.length,
      totalChunks: videoChunks.totalChunks,
      chunkIndex,
      chunksArray: videoChunks.chunks
    })
    
    videoChunks.chunks[chunkIndex] = chunkBuffer
    console.log("Stored chunk", chunkIndex, "of", totalChunks, "for videoId:", videoId)

    // Check if all chunks are received (all slots filled)
    const receivedChunks = videoChunks.chunks.filter(chunk => chunk !== undefined)
    const allChunksReceived = receivedChunks.length === totalChunks
    
    console.log("Chunk status check:", {
      chunksLength: videoChunks.chunks.length,
      totalChunks,
      receivedChunksCount: receivedChunks.length,
      allChunksReceived,
      undefinedChunks: videoChunks.chunks.filter(chunk => chunk === undefined).length,
      receivedChunkIndices: videoChunks.chunks
        .map((chunk, index) => chunk ? index : null)
        .filter(index => index !== null)
    })
    
    if (allChunksReceived) {
      console.log("All chunks received, reassembling file")
      try {
        // EXTRA DEFENSIVE CHECKS
        console.log("=== REASSEMBLY DEBUG ===")
        console.log("videoChunks object:", videoChunks)
        console.log("videoChunks type:", typeof videoChunks)
        console.log("videoChunks.chunks:", videoChunks.chunks)
        console.log("videoChunks.chunks type:", typeof videoChunks.chunks)
        console.log("videoChunks.chunks length:", videoChunks.chunks?.length)
        console.log("chunkStore has videoId:", chunkStore.has(videoId))
        console.log("chunkStore size:", chunkStore.size)
        console.log("chunkStore keys:", Array.from(chunkStore.keys()))
        console.log("========================")
        
        // Reassemble file with multiple safety checks
        if (!videoChunks) {
          throw new Error('videoChunks is null/undefined')
        }
        
        if (!videoChunks.chunks) {
          throw new Error('videoChunks.chunks is null/undefined')
        }
        
        if (!Array.isArray(videoChunks.chunks)) {
          throw new Error('videoChunks.chunks is not an array')
        }
        
        if (videoChunks.chunks.length === 0) {
          throw new Error('videoChunks.chunks array is empty')
        }
        
        // Check for any undefined chunks
        const undefinedChunks = videoChunks.chunks.filter(chunk => chunk === undefined)
        if (undefinedChunks.length > 0) {
          throw new Error(`Found ${undefinedChunks.length} undefined chunks out of ${videoChunks.chunks.length} total`)
        }
        
        console.log("All safety checks passed, proceeding with reassembly...")
        const completeFile = Buffer.concat(videoChunks.chunks)
        console.log("File reassembled, total size:", completeFile.length, "bytes")
        
        // First, create video entry in Bunny.net if it doesn't exist
        console.log("Creating video entry in Bunny.net...")
        
        // Test Bunny.net connection first
        console.log("Testing Bunny.net connection...")
        const testResponse = await fetch(`${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos`, {
          method: 'GET',
          headers: {
            'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
            'Content-Type': 'application/json'
          }
        })
        
        if (!testResponse.ok) {
          const testError = await testResponse.text()
          console.error('Bunny.net connection test failed:', testResponse.status, testError)
          throw new Error(`Bunny.net connection failed: ${testResponse.status} - ${testError}`)
        }
        
        console.log("Bunny.net connection test successful")
        
        const createVideoResponse = await fetch(`${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos`, {
          method: 'POST',
          headers: {
            'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: videoChunks.fileName || 'Uploaded Video',
            description: `Uploaded via chunked upload: ${videoChunks.fileName}`
          })
        })

        let bunnyVideoId = videoId

        if (createVideoResponse.ok) {
          const videoEntry = await createVideoResponse.json()
          bunnyVideoId = videoEntry.guid
          console.log("Video entry created in Bunny.net:", bunnyVideoId)
        } else {
          console.log("Failed to create video entry, using provided videoId:", videoId)
          // Try to use the provided videoId if creation fails
        }
        
        // Upload complete file to Bunny using the correct Stream API
        const uploadUrl = `${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos/${bunnyVideoId}`
        console.log("Uploading to Bunny URL:", uploadUrl)
        console.log("File size:", completeFile.length, "bytes")

        // For large files, we need to handle the upload more carefully
        console.log("Starting Bunny.net upload...")
        console.log("Upload details:", {
          url: uploadUrl,
          fileSize: completeFile.length,
          videoId: bunnyVideoId,
          libraryId: BUNNY_STREAM_CONFIG.libraryId
        })
        
        try {
          const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
              'Content-Type': 'application/octet-stream',
              'Accept': 'application/json',
            },
            body: completeFile
            // Remove timeout for large files - let it take as long as needed
          })

          console.log("Bunny upload response status:", response.status)

          if (response.ok) {
            console.log("Bunny upload successful")
            // Clean up
            chunkStore.delete(videoId)
            
            return NextResponse.json({
              message: "File uploaded successfully",
              videoId: bunnyVideoId,
              fileName: videoChunks.fileName
            })
          } else {
            const errorText = await response.text()
            console.error('Bunny upload failed:', response.status, errorText)
            console.error('Bunny upload details:', {
              url: uploadUrl,
              fileSize: completeFile.length,
              videoId: bunnyVideoId,
              apiKey: BUNNY_STREAM_CONFIG.apiKey.substring(0, 8) + '...'
            })
            return NextResponse.json({ 
              error: "Failed to upload file to Bunny",
              details: errorText
            }, { status: 500 })
          }
        } catch (uploadError) {
          console.error('Bunny upload error:', uploadError)
          return NextResponse.json({ 
            error: "Upload failed due to network error",
            details: uploadError instanceof Error ? uploadError.message : "Unknown error"
          }, { status: 500 })
        }

      } catch (error) {
        console.error("Error reassembling file:", error)
        return NextResponse.json({ error: "Failed to reassemble file" }, { status: 500 })
      }
    } else {
      const receivedCount = videoChunks.chunks.filter(chunk => chunk !== undefined).length
      console.log("Chunk stored, waiting for more chunks. Received:", receivedCount, "of", totalChunks)
      // Return success for chunk upload
      return NextResponse.json({
        message: `Chunk ${chunkIndex + 1}/${totalChunks} received`,
        chunkIndex,
        totalChunks,
        videoId
      })
    }

  } catch (error: any) {
    console.error("Error uploading video chunk:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

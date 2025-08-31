import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { BUNNY_STREAM_CONFIG } from "@/lib/bunny-stream"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    console.log("Regular upload API called")
    
    // Verify admin token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No auth header or invalid format")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log("Token received, length:", token.length)
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
    console.log("Token decoded, role:", decoded.role)

    if (decoded.role !== "admin") {
      console.log("User is not admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { videoId } = await params
    console.log("Processing videoId:", videoId)
    
    const formData = await request.formData()
    const videoFile = formData.get('video') as File

    if (!videoFile) {
      console.log("No video file provided")
      return NextResponse.json({ error: "No video file provided" }, { status: 400 })
    }

    console.log("Video file received:", { name: videoFile.name, size: videoFile.size, type: videoFile.type })

    // Upload to Bunny using PUT method with raw file content
    const uploadUrl = `${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos/${videoId}`
    console.log("Uploading to Bunny URL:", uploadUrl)
    
    // Convert File to Buffer for raw upload
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer())
    console.log(`Video buffer created: ${videoBuffer.length} bytes`)

    // Determine the correct content type
    let contentType = videoFile.type
    if (!contentType || contentType === 'application/octet-stream') {
      // Fallback content type detection based on file extension
      const fileExtension = videoFile.name.split('.').pop()?.toLowerCase()
      switch (fileExtension) {
        case 'mp4':
          contentType = 'video/mp4'
          break
        case 'avi':
          contentType = 'video/avi'
          break
        case 'mov':
          contentType = 'video/quicktime'
          break
        case 'wmv':
          contentType = 'video/x-ms-wmv'
          break
        case 'flv':
          contentType = 'video/x-flv'
          break
        case 'webm':
          contentType = 'video/webm'
          break
        default:
          contentType = 'application/octet-stream'
      }
    }
    
    console.log(`Using content type: ${contentType}`)

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
        'Content-Type': contentType,
        'Accept': 'application/json',
      },
      body: videoBuffer,
      signal: AbortSignal.timeout(300000) // 5 minutes timeout
    })

    console.log("Bunny upload response status:", response.status)

    if (response.ok) {
      console.log("Bunny upload successful")
      return NextResponse.json({
        message: "Video uploaded successfully",
        videoId
      })
    } else {
      const errorText = await response.text()
      console.error('Bunny upload failed:', response.status, errorText)
      
      // Provide more specific error messages based on status codes
      let errorMessage = "Failed to upload video to Bunny"
      if (response.status === 415) {
        errorMessage = "Unsupported media type - please check file format"
      } else if (response.status === 401) {
        errorMessage = "Authentication failed - check API key"
      } else if (response.status === 413) {
        errorMessage = "File too large for upload"
      } else if (response.status === 404) {
        errorMessage = "Video ID not found in Bunny library"
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: errorText,
        statusCode: response.status
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error("Error uploading video:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

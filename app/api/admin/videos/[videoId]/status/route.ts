import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { bunnyVideoService } from "@/lib/bunny-video-service"

// GET /api/admin/videos/[videoId]/status - Get video processing status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params
    console.log(`📊 Status check request for video: ${videoId}`)

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
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get video status
    const status = await bunnyVideoService.getVideoStatus(videoId)
    
    if (!status) {
      return NextResponse.json({ 
        error: "Video not found or failed to get status" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      videoId,
      status: status.status,
      progress: status.progress,
      error: status.error,
      urls: status.urls,
      isReady: status.status === 'ready',
      isError: status.status === 'error'
    })

  } catch (error) {
    console.error("❌ Failed to get video status:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/admin/videos/[videoId]/status - Start status polling
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params
    const body = await request.json()
    const { maxAttempts = 60, intervalMs = 5000 } = body

    console.log(`🔄 Starting status polling for video: ${videoId}`)

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
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Start polling (this will run in background)
    const pollResult = await bunnyVideoService.pollVideoStatus(videoId, maxAttempts, intervalMs)
    
    return NextResponse.json({
      success: true,
      videoId,
      finalStatus: pollResult,
      completed: pollResult?.status === 'ready' || pollResult?.status === 'error'
    })

  } catch (error) {
    console.error("❌ Failed to start status polling:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

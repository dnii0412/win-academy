import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { tusStorage } from "@/lib/tus-storage"

// GET /api/admin/upload/tus/status - Get TUS upload statistics
export async function GET(request: NextRequest) {
  try {
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

    // Get upload statistics
    const stats = tusStorage.getStats()
    
    // Get active uploads for monitoring
    const activeUploads = Array.from(tusStorage['uploads'].values())
      .filter(upload => upload.status === 'uploading' || upload.status === 'processing')
      .map(upload => ({
        id: upload.id,
        filename: upload.filename,
        status: upload.status,
        progress: Math.round((upload.uploadedSize / upload.fileSize) * 100),
        uploadedSize: upload.uploadedSize,
        fileSize: upload.fileSize,
        createdAt: upload.createdAt,
        updatedAt: upload.updatedAt,
        retryCount: upload.retryCount
      }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    return NextResponse.json({
      success: true,
      stats,
      activeUploads,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Failed to get TUS status:", error)
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
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  
  return response
}

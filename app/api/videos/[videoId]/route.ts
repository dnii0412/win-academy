import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { bunnyStream } from '@/lib/bunny-stream'

// GET /api/videos/[videoId] - Get a specific video
export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const video = await bunnyStream.getVideo(params.videoId)
    
    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      video
    })
  } catch (error: any) {
    console.error('Failed to fetch video:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch video',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/videos/[videoId] - Delete a video
export async function DELETE(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const success = await bunnyStream.deleteVideo(params.videoId)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Video deleted successfully'
      })
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to delete video'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Failed to delete video:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete video',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

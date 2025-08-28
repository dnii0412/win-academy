import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { bunnyStream } from '@/lib/bunny-stream'

// GET /api/videos - List all videos
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const videos = await bunnyStream.getVideos()

        return NextResponse.json({
            success: true,
            videos,
            count: videos.length
        })
    } catch (error: any) {
        console.error('Failed to fetch videos:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch videos',
                details: error.message
            },
            { status: 500 }
        )
    }
}

// POST /api/videos - Create a new video entry
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { title, description } = body

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            )
        }

        const result = await bunnyStream.createVideo(title, description)

        if (result.success) {
            return NextResponse.json({
                success: true,
                videoId: result.videoId,
                message: 'Video created successfully'
            })
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error
                },
                { status: 400 }
            )
        }
    } catch (error: any) {
        console.error('Failed to create video:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create video',
                details: error.message
            },
            { status: 500 }
        )
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { bunnyStream } from '@/lib/bunny-stream'

// GET /api/videos/[videoId]/stream - Get streaming URL for a video
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

        const result = await bunnyStream.getStreamUrl(params.videoId)

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error
                },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            streamUrl: result.streamUrl,
            videoId: params.videoId
        })
    } catch (error: any) {
        console.error('Failed to get stream URL:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to get stream URL',
                details: error.message
            },
            { status: 500 }
        )
    }
}

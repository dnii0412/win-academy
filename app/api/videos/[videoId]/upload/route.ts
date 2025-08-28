import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { bunnyStream } from '@/lib/bunny-stream'

// GET /api/videos/[videoId]/upload - Get upload URL for a video
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

        const uploadUrl = await bunnyStream.getUploadUrl(params.videoId)

        if (!uploadUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to get upload URL'
                },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            uploadUrl,
            videoId: params.videoId
        })
    } catch (error: any) {
        console.error('Failed to get upload URL:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to get upload URL',
                details: error.message
            },
            { status: 500 }
        )
    }
}

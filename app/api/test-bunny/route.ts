import { NextRequest, NextResponse } from 'next/server'
import { bunnyStream } from '@/lib/bunny-stream'

export async function GET(request: NextRequest) {
    try {
        // Test library info
        const libraryInfo = await bunnyStream.getLibraryInfo()

        // Test getting videos
        const videos = await bunnyStream.getVideos()

        return NextResponse.json({
            status: 'success',
            message: 'Bunny.net integration working',
            libraryInfo: {
                id: libraryInfo.id,
                name: libraryInfo.name,
                videoCount: libraryInfo.videoCount,
                totalStorage: libraryInfo.totalStorage,
            },
            videoCount: videos.length,
            timestamp: new Date().toISOString()
        })
    } catch (error: any) {
        console.error('Bunny.net test failed:', error)

        return NextResponse.json(
            {
                status: 'error',
                message: 'Bunny.net integration failed',
                error: error.message,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        )
    }
}

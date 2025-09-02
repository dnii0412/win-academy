import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated (you can add admin check here)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { publicId } = body

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 })
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result === 'ok') {
      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully',
        publicId
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete image',
        details: result
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Cloudinary delete error:', error)
    return NextResponse.json(
      { 
        error: 'Delete failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check if image exists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('publicId')

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 })
    }

    // Check if resource exists
    const result = await cloudinary.api.resource(publicId)

    return NextResponse.json({
      exists: true,
      data: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        created_at: result.created_at,
      }
    })

  } catch (error: any) {
    if (error.http_code === 404) {
      return NextResponse.json({ exists: false })
    }

    console.error('Cloudinary check error:', error)
    return NextResponse.json(
      { error: 'Failed to check image' },
      { status: 500 }
    )
  }
}

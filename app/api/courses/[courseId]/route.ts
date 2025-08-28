import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'

// GET /api/courses/[courseId] - Get a specific course by ID
export async function GET(
    request: NextRequest,
    { params }: { params: { courseId: string } }
) {
    try {
        await dbConnect()

        const { courseId } = params

        // For now, return a 404 since we haven't implemented the course creation system yet
        // This will be replaced with actual database queries when courses are created by admins
        return NextResponse.json(
            { error: 'Course not found' },
            { status: 404 }
        )

    } catch (error: any) {
        console.error('Error fetching course:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

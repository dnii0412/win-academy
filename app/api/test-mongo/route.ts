import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'MongoDB connection successful',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('MongoDB connection test failed:', error)
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'MongoDB connection failed',
        error: error.message 
      },
      { status: 500 }
    )
  }
}

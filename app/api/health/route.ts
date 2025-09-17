import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Test database connection
    await dbConnect()
    
    // Test Bunny Stream connectivity
    let bunnyStatus = 'unknown'
    try {
      const bunnyResponse = await fetch('https://iframe.mediadelivery.net', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
      bunnyStatus = bunnyResponse.ok ? 'connected' : 'error'
    } catch (error) {
      bunnyStatus = 'error'
    }
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        database: 'connected',
        bunnyStream: bunnyStatus,
        api: 'operational'
      },
      version: '1.0.0'
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: 'error',
        bunnyStream: 'unknown',
        api: 'error'
      }
    }, { status: 500 })
  }
}

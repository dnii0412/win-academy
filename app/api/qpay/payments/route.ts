import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import QPayInvoice from '@/lib/models/QPayInvoice'

export async function GET(request: NextRequest) {
  const correlationId = `payments_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    console.log(`=== QPay Payments List Started ===`, { correlationId })
    
    // Get user session
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({
        error: 'Unauthorized',
        details: 'User session required'
      }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Connect to database
    await dbConnect()

    // Build query
    const query: any = { userId }
    if (courseId) query.courseId = courseId
    if (status) query.status = status

    // Get invoices with pagination
    const invoices = await QPayInvoice.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('courseId', 'title titleMn price')

    console.log('Found invoices:', {
      correlationId,
      count: invoices.length,
      userId,
      courseId,
      status
    })

    // Format response
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice._id,
      qpayInvoiceId: invoice.qpayInvoiceId,
      senderInvoiceNo: invoice.senderInvoiceNo,
      amount: invoice.amount,
      status: invoice.status,
      courseId: invoice.courseId,
      courseTitle: invoice.courseId?.title || invoice.courseId?.titleMn,
      createdAt: invoice.createdAt,
      paidAt: invoice.paidAt,
      expiresAt: invoice.expiresAt,
      paymentId: invoice.paymentId,
      qrText: invoice.qrText,
      urls: invoice.urls
    }))

    return NextResponse.json({
      success: true,
      invoices: formattedInvoices,
      count: formattedInvoices.length,
      query: {
        userId,
        courseId,
        status,
        limit
      }
    })

  } catch (error) {
    console.error('Payments list failed:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json({
      error: 'Failed to fetch payments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

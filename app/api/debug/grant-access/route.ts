import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/mongoose'
import CourseAccess from '@/lib/models/CourseAccess'
import QPayInvoice from '@/lib/models/QPayInvoice'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId, invoiceId } = await request.json()
    const userId = session.user.id || session.user.email

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 })
    }

    await dbConnect()

    // Find the invoice
    const invoice = invoiceId 
      ? await QPayInvoice.findOne({ qpayInvoiceId: invoiceId })
      : await QPayInvoice.findOne({ userId, courseId, status: 'PAID' })

    if (!invoice) {
      return NextResponse.json({ 
        error: 'No paid invoice found',
        details: 'No paid invoice found for this user and course'
      }, { status: 404 })
    }

    console.log('Found invoice:', {
      invoiceId: invoice._id,
      qpayInvoiceId: invoice.qpayInvoiceId,
      status: invoice.status,
      userId: invoice.userId,
      courseId: invoice.courseId
    })

    // Grant course access
    const accessResult = await CourseAccess.grantAccess(
      userId,
      courseId,
      invoice._id.toString(),
      'qpay_purchase'
    )

    console.log('Course access granted:', {
      userId,
      courseId,
      accessResult: accessResult?._id,
      hasAccess: accessResult?.hasAccess
    })

    return NextResponse.json({
      success: true,
      message: 'Course access granted successfully',
      access: {
        userId,
        courseId,
        accessId: accessResult?._id,
        hasAccess: accessResult?.hasAccess,
        accessType: accessResult?.accessType,
        grantedAt: accessResult?.grantedAt
      },
      invoice: {
        id: invoice._id,
        qpayInvoiceId: invoice.qpayInvoiceId,
        status: invoice.status,
        amount: invoice.amount
      }
    })

  } catch (error: any) {
    console.error('Grant access error:', error)
    return NextResponse.json({ 
      error: 'Failed to grant access',
      details: error.message 
    }, { status: 500 })
  }
}

"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, RefreshCw, CheckCircle, XCircle, Clock, QrCode, ExternalLink } from 'lucide-react'

interface QPayPaymentProps {
  courseId: string
  amount: number
  description: string
  onPaymentSuccess?: (invoiceId: string) => void
  onPaymentError?: (error: string) => void
}

interface PaymentStatus {
  invoice_id: string
  status: 'NEW' | 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED'
  amount: number
  paid_amount: number
  payment_id?: string
  paid_at?: string
  expires_at: string
  qr_text: string
  qr_image?: string
  urls: {
    deeplink: string
    qr: string
  }
  note?: string
}

export default function QPayPayment({ 
  courseId, 
  amount, 
  description, 
  onPaymentSuccess, 
  onPaymentError 
}: QPayPaymentProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autoCheckInterval, setAutoCheckInterval] = useState<NodeJS.Timeout | null>(null)

  // Create invoice
  const createInvoice = async () => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/qpay/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          amount,
          description
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to create invoice')
      }

      if (data.success && data.invoice) {
        setPaymentStatus({
          invoice_id: data.invoice.invoice_id,
          status: data.invoice.status,
          amount: data.invoice.amount,
          paid_amount: 0,
          expires_at: data.invoice.expires_at,
          qr_text: data.invoice.qr_text,
          qr_image: data.invoice.qr_image,
          urls: data.invoice.urls || { deeplink: '', qr: '' }
        })

        // Start auto-checking for payment
        startAutoCheck(data.invoice.invoice_id)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice'
      setError(errorMessage)
      onPaymentError?.(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  // Check payment status
  const checkPaymentStatus = async (invoiceId: string) => {
    setIsChecking(true)

    try {
      const response = await fetch('/api/qpay/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice_id: invoiceId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to check payment status')
      }

      if (data.success && data.status) {
        setPaymentStatus(data.status)

        // If payment is successful, stop auto-checking and notify parent
        if (data.status.status === 'PAID') {
          stopAutoCheck()
          onPaymentSuccess?.(invoiceId)
        }
      }

    } catch (err) {
      console.error('Payment check failed:', err)
      // Don't show error for status checks, just log it
    } finally {
      setIsChecking(false)
    }
  }

  // Start auto-checking payment status
  const startAutoCheck = (invoiceId: string) => {
    // Check immediately
    checkPaymentStatus(invoiceId)

    // Then check every 5 seconds
    const interval = setInterval(() => {
      checkPaymentStatus(invoiceId)
    }, 5000)

    setAutoCheckInterval(interval)
  }

  // Stop auto-checking
  const stopAutoCheck = () => {
    if (autoCheckInterval) {
      clearInterval(autoCheckInterval)
      setAutoCheckInterval(null)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoCheck()
    }
  }, [])

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>
      case 'PENDING':
      case 'NEW':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
      case 'EXPIRED':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Format amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency: 'MNT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!paymentStatus ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QPay Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-primary">
                {formatAmount(amount)}
              </p>
              <p className="text-muted-foreground">{description}</p>
            </div>
            
            <Button 
              onClick={createInvoice} 
              disabled={isCreating}
              className="w-full"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Invoice...
                </>
              ) : (
                'Pay with QPay'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QPay Payment
              </CardTitle>
              {getStatusBadge(paymentStatus.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-primary">
                {formatAmount(paymentStatus.amount)}
              </p>
              <p className="text-muted-foreground">{description}</p>
            </div>

            {/* QR Code */}
            {paymentStatus.qr_text && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border">
                  <img 
                    src={`data:image/png;base64,${paymentStatus.qr_image || paymentStatus.qr_text}`}
                    alt="QPay QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}

            {/* Payment Links */}
            {paymentStatus.urls && (paymentStatus.urls.deeplink || paymentStatus.urls.qr) && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-center">Or pay with:</p>
                <div className="flex gap-2 justify-center">
                  {paymentStatus.urls.deeplink && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(paymentStatus.urls.deeplink, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      QPay App
                    </Button>
                  )}
                  {paymentStatus.urls.qr && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(paymentStatus.urls.qr, '_blank')}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      QR Link
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Payment Status Info */}
            {paymentStatus.status === 'PAID' && paymentStatus.paid_at && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Payment completed successfully! Paid {formatAmount(paymentStatus.paid_amount)} on{' '}
                  {new Date(paymentStatus.paid_at).toLocaleString()}
                </AlertDescription>
              </Alert>
            )}

            {paymentStatus.status === 'PENDING' && (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Payment is being processed. This page will update automatically.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => checkPaymentStatus(paymentStatus.invoice_id)}
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh Status
                </Button>
              </div>
            )}

            {paymentStatus.note && (
              <Alert>
                <AlertDescription className="text-sm">
                  {paymentStatus.note}
                </AlertDescription>
              </Alert>
            )}

            {/* Expiration Info */}
            <div className="text-center text-xs text-muted-foreground">
              Expires: {new Date(paymentStatus.expires_at).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

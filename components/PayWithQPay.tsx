'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, QrCode, Smartphone, CheckCircle, AlertCircle } from 'lucide-react'
import { QRCodeDisplay } from '@/components/QRCodeDisplay'

interface PayWithQPayProps {
  courseId: string
  priceMnt: number
  courseTitle?: string
  customerData?: {
    name?: string
    email?: string
    phone?: string
  }
  onPaymentSuccess?: () => void
}

interface PaymentData {
  orderId: string
  invoiceId: string
  qr_text: string
  qr_image: string // base64
  urls: { name: string; description?: string; link: string }[]
}

export function PayWithQPay({ courseId, priceMnt, courseTitle, customerData, onPaymentSuccess }: PayWithQPayProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PaymentData | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'paid' | 'failed'>('idle')

  async function startPayment() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/pay/qpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, priceMnt, customerData }),
      })
      const json = await res.json()
      console.log('Payment response:', json)
      console.log('QR Text:', json.qr_text)
      console.log('QR Image:', json.qr_image ? 'Present' : 'Missing')
      console.log('URLs:', json.urls?.length || 0)
      if (!res.ok) throw new Error(json.error || 'Failed to create invoice')
      setData(json)
      setPaymentStatus('pending')
    } catch (e: any) {
      setError(e.message)
      setPaymentStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  // Polling for payment status
  useEffect(() => {
    if (!data?.orderId || paymentStatus !== 'pending') return

    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/pay/qpay/status?orderId=${data.orderId}`)
        const json = await res.json()
        if (json.status === 'PAID' && json.access) {
          clearInterval(iv)
          setPaymentStatus('paid')
          onPaymentSuccess?.()
          // Small delay then refresh to show unlocked content
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }
      } catch (e) {
        console.error('Status check failed:', e)
      }
    }, 3000) // Check every 3 seconds

    return () => clearInterval(iv)
  }, [data?.orderId, paymentStatus, onPaymentSuccess])

  if (paymentStatus === 'paid') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground">
                Access granted. Refreshing page...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Pay with QPay
          </CardTitle>
          <CardDescription>
            {courseTitle && `Purchase: ${courseTitle}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#E10600]">
              ₮{priceMnt.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Mongolian Tugrik</p>
          </div>
          
          <Button 
            disabled={loading} 
            onClick={startPayment} 
            className="w-full bg-[#E10600] hover:bg-[#C70500] text-white"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Invoice...
              </>
            ) : (
              `Pay ₮${priceMnt.toLocaleString()} with QPay`
            )}
          </Button>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg mx-auto bg-card border-2 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Scan QR Code to Pay
        </CardTitle>
        <CardDescription>
          Use your bank app to scan the QR code or click a bank link below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code */}
        <div className="text-center">
          <QRCodeDisplay 
            qrText={data.qr_text || ''}
            qrImage={data.qr_image}
            size={200}
            className="mx-auto"
          />
          <Badge variant="outline" className="mt-2">
            ₮{priceMnt.toLocaleString()}
          </Badge>
        </div>

        {/* Bank App Links */}
        {data.urls && data.urls.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Or open your bank app:
            </p>
            <div className="grid gap-2">
              {data.urls.map((url, i) => (
                <Button
                  key={i}
                  variant="outline"
                  asChild
                  className="justify-start"
                >
                  <a 
                    href={url.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block"
                  >
                    {url.name}
                    {url.description && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {url.description}
                      </span>
                    )}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-sm font-medium text-blue-700">
              Waiting for payment...
            </span>
          </div>
          <p className="text-xs text-blue-600">
            This page will automatically refresh once payment is confirmed
          </p>
        </div>

        {/* Test Payment Button (Mock Mode Only) */}
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const res = await fetch('/api/pay/qpay/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ courseId, priceMnt, markAsPaid: true, customerData }),
                })
                const json = await res.json()
                if (res.ok) {
                  setPaymentStatus('paid')
                  onPaymentSuccess?.()
                  // Redirect to course page after successful payment
                  setTimeout(() => {
                    window.location.href = `/courses/${courseId}`
                  }, 1000)
                } else {
                  setError(json.error || 'Failed to mark as paid')
                }
              } catch (e: any) {
                setError(e.message)
              }
            }}
            className="text-xs"
          >
            🧪 Test: Mark as Paid (Mock Mode)
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

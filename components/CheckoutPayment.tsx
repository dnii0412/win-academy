"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, RefreshCw, CreditCard } from "lucide-react"
import { MobilePaymentDisplay } from "@/components/MobilePaymentDisplay"

interface CheckoutPaymentProps {
  courseId: string
  amount: number
  description: string
  accessDuration?: '45' | '90'
  onPaymentSuccess?: (invoiceId: string) => void
  onPaymentError?: (error: string) => void
}

interface PaymentStatus {
  invoice_id: string
  qr_image: string
  qr_text?: string
  amount: number
  status: 'NEW' | 'PAID' | 'EXPIRED' | 'CANCELLED'
  expires_at?: string
  urls?: Array<{
    name?: string
    description?: string
    link?: string
  }>
}

export default function CheckoutPayment({
  courseId,
  amount,
  description,
  accessDuration = '45',
  onPaymentSuccess,
  onPaymentError
}: CheckoutPaymentProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createInvoice = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/qpay/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          amount,
          description,
          accessDuration
        })
      })

      if (!response.ok) {
        throw new Error('Төлбөрийн баримт үүсгэхэд алдаа гарлаа')
      }

      const data = await response.json()
      setPaymentStatus(data.invoice)
      console.log('Invoice created successfully - Manual checking only')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Төлбөрийн баримт үүсгэхэд алдаа гарлаа'
      setError(errorMessage)
      onPaymentError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (!paymentStatus) return

    setIsChecking(true)
    setError(null)

    try {
      const response = await fetch('/api/qpay/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: paymentStatus.invoice_id })
      })

      if (!response.ok) {
        throw new Error('Төлбөрийн төлөв шалгахад алдаа гарлаа')
      }

      const data = await response.json()
      console.log('Payment check response:', data)
      
      if (data.isPaid) {
        setPaymentStatus(prev => prev ? { ...prev, status: 'PAID' } : null)
        console.log('Payment confirmed! Granting course access...')
        onPaymentSuccess?.(paymentStatus.invoice_id)
      } else {
        console.log('Payment not yet completed:', {
          isPaid: data.isPaid,
          count: data.count,
          paidAmount: data.paid_amount,
          invoiceStatus: data.invoice_status
        })
        if (data.invoice_status === 'CANCELLED') {
          setError('Төлбөрийн баримт хугацаа дууссан. Шинэ төлбөр үүсгэнэ үү.')
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Төлбөрийн төлөв шалгахад алдаа гарлаа'
      setError(errorMessage)
      onPaymentError?.(errorMessage)
    } finally {
      setIsChecking(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Төлсөн</span>
      case 'EXPIRED':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">Хугацаа дууссан</span>
      case 'CANCELLED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Цуцлагдсан</span>
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Хүлээгдэж байна</span>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Төлбөр
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!paymentStatus ? (
          <div className="text-center space-y-4">
            <p className="text-gray-600">Төлбөр үүсгэхэд доорх товчийг дарна уу</p>
            <Button 
              onClick={createInvoice} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Төлбөр үүсгэж байна...
                </>
              ) : (
                'Төлбөр үүсгэх'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <CardTitle>Төлбөрийн төлөв</CardTitle>
              {getStatusBadge(paymentStatus.status)}
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold">₮{paymentStatus.amount?.toLocaleString() || '0'}</p>
              <p className="text-sm text-gray-600">{description}</p>
            </div>

            {paymentStatus.status === 'PAID' && (
              <div className="text-center text-green-600">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="font-semibold">Төлбөр амжилттай!</p>
              </div>
            )}

                      {paymentStatus.status !== 'PAID' && (
                        <div className="space-y-4">
                          <div className="text-center">
                            <MobilePaymentDisplay 
                              qrText={paymentStatus.qr_text || paymentStatus.qr_image}
                              qrImage={paymentStatus.qr_image}
                              urls={paymentStatus.urls || []}
                              amount={paymentStatus.amount || 0}
                              description={description}
                              size={200}
                            />
                          </div>

                <Button
                  onClick={checkPaymentStatus}
                  disabled={isChecking}
                  variant="outline"
                  className="w-full"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Шалгаж байна...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Төлбөрийн төлөв шалгах
                    </>
                  )}
                </Button>

                {paymentStatus.expires_at && (
                  <p className="text-xs text-gray-500 text-center">
                    Хугацаа дуусах: {new Date(paymentStatus.expires_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {(paymentStatus.status === 'EXPIRED' || paymentStatus.status === 'CANCELLED') && (
              <div className="text-center text-red-600">
                <XCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="font-semibold">Төлбөр {paymentStatus.status === 'EXPIRED' ? 'хугацаа дууссан' : 'цуцлагдсан'}</p>
                <Button 
                  onClick={createInvoice} 
                  className="mt-2"
                  variant="outline"
                >
                  Шинэ төлбөр үүсгэх
                </Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

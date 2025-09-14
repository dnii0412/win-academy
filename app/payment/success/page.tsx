"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import type { PaymentStatus } from "@/lib/payment-config"

function PaymentSuccessContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const orderId = searchParams.get("orderId")
    const paymentId = searchParams.get("paymentId")
    const provider = searchParams.get("provider")
    const courseId = searchParams.get("courseId")

    useEffect(() => {
        const checkPaymentStatus = async () => {
            if (!paymentId || !provider) {
                setError("Missing payment information")
                setIsLoading(false)
                return
            }

            try {
                const response = await fetch(
                    `/api/payments/status?paymentId=${paymentId}&provider=${provider}`
                )

                if (!response.ok) {
                    throw new Error("Failed to check payment status")
                }

                const status: PaymentStatus = await response.json()
                setPaymentStatus(status)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to check payment status")
            } finally {
                setIsLoading(false)
            }
        }

        checkPaymentStatus()

        // Poll for status updates if payment is still pending
        const interval = setInterval(() => {
            if (paymentStatus?.status === "pending") {
                checkPaymentStatus()
            } else {
                clearInterval(interval)
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [paymentId, provider, paymentStatus?.status])

    const getStatusIcon = () => {
        if (isLoading) {
            return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        }

        switch (paymentStatus?.status) {
            case "completed":
                return <CheckCircle className="w-16 h-16 text-green-500" />
            case "failed":
                return <XCircle className="w-16 h-16 text-red-500" />
            case "pending":
                return <Clock className="w-16 h-16 text-yellow-500" />
            default:
                return <XCircle className="w-16 h-16 text-gray-500" />
        }
    }

    const getStatusMessage = () => {
        if (isLoading) {
            return {
                title: "Checking Payment Status...",
                description: "Please wait while we verify your payment.",
            }
        }

        if (error) {
            return {
                title: "Error",
                description: error,
            }
        }

        switch (paymentStatus?.status) {
            case "completed":
                return {
                    title: "Payment Successful!",
                    description: "Your enrollment has been confirmed. You can now access your course.",
                }
            case "failed":
                return {
                    title: "Payment Failed",
                    description: "Your payment could not be processed. Please try again or contact support.",
                }
            case "pending":
                return {
                    title: "Payment Pending",
                    description: "Your payment is being processed. This may take a few minutes.",
                }
            case "cancelled":
                return {
                    title: "Payment Cancelled",
                    description: "Your payment was cancelled. You can try again or choose a different payment method.",
                }
            default:
                return {
                    title: "Unknown Status",
                    description: "We could not determine your payment status. Please contact support.",
                }
        }
    }

    const statusMessage = getStatusMessage()

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
            <div className="max-w-md w-full mx-4">
                <Card>
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            {getStatusIcon()}
                        </div>
                        <CardTitle className="text-2xl">{statusMessage.title}</CardTitle>
                    </CardHeader>

                    <CardContent className="text-center space-y-6">
                        <p className="text-gray-600">{statusMessage.description}</p>

                        {paymentStatus && (
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-medium">Order ID:</span>
                                    <span className="text-gray-600">{paymentStatus.orderId}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="font-medium">Amount:</span>
                                    <span className="text-gray-600">
                                        ₮{paymentStatus.amount.toLocaleString()} {paymentStatus.currency}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="font-medium">Payment Method:</span>
                                    <span className="text-gray-600 uppercase">{paymentStatus.provider}</span>
                                </div>

                                {paymentStatus.transactionId && (
                                    <div className="flex justify-between">
                                        <span className="font-medium">Transaction ID:</span>
                                        <span className="text-gray-600">{paymentStatus.transactionId}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3">
                            {paymentStatus?.status === "completed" && (
                                <>
                                    {courseId && (
                                        <Button
                                            onClick={() => router.push(`/learn/${courseId}`)}
                                            className="w-full bg-[#FF344A] hover:bg-[#E02A3C]"
                                        >
                                            Start Learning Now
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => router.push("/dashboard")}
                                        variant={courseId ? "outline" : "default"}
                                        className={courseId ? "w-full" : "w-full bg-[#FF344A] hover:bg-[#E02A3C]"}
                                    >
                                        Go to Dashboard
                                    </Button>
                                </>
                            )}

                            {(paymentStatus?.status === "failed" || paymentStatus?.status === "cancelled") && (
                                <Button
                                    onClick={() => router.push("/courses")}
                                    className="w-full bg-[#FF344A] hover:bg-[#E02A3C]"
                                >
                                    Try Again
                                </Button>
                                )}

                            <Button
                                variant="outline"
                                onClick={() => router.push("/")}
                                className="w-full"
                            >
                                Back to Home
                            </Button>
                        </div>

                        {paymentStatus?.status === "pending" && (
                            <p className="text-sm text-gray-500">
                                This page will automatically update when your payment is processed.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
                <div className="max-w-md w-full mx-4">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                            </div>
                            <CardTitle className="text-2xl">Loading...</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-gray-600">Please wait while we load your payment information.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    )
}

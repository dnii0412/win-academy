"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, Smartphone, BookOpen } from "lucide-react"
import CheckoutPayment from "@/components/CheckoutPayment"
import CourseImage from "@/components/course-image"
import type { CheckoutFormData } from "@/types/payment"
import type { Course } from "@/types/course"

export default function CheckoutPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session, status } = useSession()
    const courseId = params.courseId as string

    const [course, setCourse] = useState<Course | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isRedirecting, setIsRedirecting] = useState(false)
    const [formData, setFormData] = useState<CheckoutFormData>({
        email: "",
        phone: "",
        firstName: "",
        lastName: "",
        paymentMethod: "qpay",
        agreeToTerms: false,
    })

    useEffect(() => {
        // Check authentication first
        if (status === "loading") return // Still loading

        if (status === "unauthenticated") {
            // Redirect to login with return URL
            router.push(`/login?callbackUrl=${encodeURIComponent(`/checkout/${courseId}`)}`)
            return
        }

        // If authenticated, fetch course and populate user info
        const fetchCourse = async () => {
            try {
                const response = await fetch(`/api/courses/${courseId}`)
                if (response.ok) {
                    const courseData = await response.json()
                    setCourse(courseData.course)
                } else {
                    setError("Course not found")
                }
            } catch (error) {
                console.error('Error fetching course:', error)
                setError("Failed to load course information")
            }
        }

        if (courseId && session?.user) {
            fetchCourse()

            // Auto-populate form with user information
            if (session.user) {
                setFormData(prev => ({
                    ...prev,
                    email: session.user.email || "",
                    firstName: session.user.name?.split(' ')[0] || "",
                    lastName: session.user.name?.split(' ').slice(1).join(' ') || "",
                }))
                console.log('User info populated:', {
                    email: session.user.email,
                    name: session.user.name
                })
            }
        }
    }, [courseId, session, status, router])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handlePaymentMethodChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            paymentMethod: value as "byl" | "qpay",
        }))
    }

    const handleTermsChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            agreeToTerms: checked,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!course || !formData.agreeToTerms) {
            setError("Please agree to the terms and conditions")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // For QPay, we don't need to create a separate order
            // The PayWithQPay component handles the order creation and payment flow
            console.log('Checkout form submitted, QPay component will handle the payment')
            
            // The actual payment is handled by the PayWithQPay component
            // This form is mainly for collecting customer information and terms agreement
            
        } catch (err) {
            console.error('Checkout error:', err)
            const errorMessage = err instanceof Error ? err.message : "Payment failed"
            setError(`Payment Error: ${errorMessage}`)
        } finally {
            setIsLoading(false)
        }
    }

    // Show loading while checking authentication
    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <h1 className="text-xl font-medium text-gray-900">
                        Checking authentication...
                    </h1>
                </div>
            </div>
        )
    }

    // Show loading while fetching course or if there's an error
    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        {error || "Loading course..."}
                    </h1>
                    {error && (
                        <Button onClick={() => router.push("/courses")}>
                            Back to Courses
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/30 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Course Summary */}
                    <Card className="bg-card border-2 border-border/50">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start space-x-4">
                                <CourseImage
                                    thumbnailUrl={course.thumbnailUrl}
                                    title={course.title}
                                    category={course.category}
                                    size="small"
                                    className="w-20 h-20 rounded-lg"
                                />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{course.title}</h3>
                                    <p className="text-gray-600 text-sm mt-1">{course.description}</p>
                                    <div className="mt-2 space-y-1 text-sm text-gray-500">
                                        <p>Duration: {course.duration}</p>
                                        <p>Instructor: {course.instructor}</p>
                                        <p>Level: {course.level}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold">Total</span>
                                    <span className="text-2xl font-bold text-[#E10600]">
                                        ₮{course.price.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Section - Manual checking only */}
                    <div>
                        <CheckoutPayment
                            courseId={courseId}
                            amount={course.price}
                            description={course.titleMn || course.title}
                            onPaymentSuccess={async (invoiceId) => {
                                if (isRedirecting) {
                                    console.log('Already redirecting, ignoring duplicate payment success')
                                    return
                                }
                                
                                console.log('Payment successful!', { invoiceId })
                                setIsRedirecting(true)
                                
                                // Wait a moment for course access to be granted
                                await new Promise(resolve => setTimeout(resolve, 2000))
                                
                                // Check if user has access to the course
                                try {
                                    const accessResponse = await fetch(`/api/courses/${courseId}/access`)
                                    if (accessResponse.ok) {
                                        const accessData = await accessResponse.json()
                                        console.log('Course access status:', accessData)
                                    }
                                } catch (error) {
                                    console.error('Error checking course access:', error)
                                }
                            }}
                            onPaymentError={(error) => {
                                console.error('Payment error:', error)
                                setError(`Payment Error: ${error}`)
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

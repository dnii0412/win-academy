"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, Smartphone } from "lucide-react"
import type { CheckoutFormData, Course } from "@/types/payment"

export default function CheckoutPage() {
    const params = useParams()
    const router = useRouter()
    const courseId = params.courseId as string

    const [course, setCourse] = useState<Course | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<CheckoutFormData>({
        email: "",
        phone: "",
        firstName: "",
        lastName: "",
        paymentMethod: "qpay",
        agreeToTerms: false,
    })

    useEffect(() => {
        // Fetch course information from API
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

        if (courseId) {
            fetchCourse()
        }
    }, [courseId])

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
            const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            const paymentRequest = {
                provider: formData.paymentMethod,
                amount: course.price,
                currency: course.currency,
                description: `Enrollment for ${course.title}`,
                orderId,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                returnUrl: `${window.location.origin}/payment/success?orderId=${orderId}`,
                callbackUrl: `${window.location.origin}/api/payments/callback`,
            }

            const response = await fetch("/api/payments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(paymentRequest),
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Payment creation failed")
            }

            // Redirect to payment URL
            if (result.paymentUrl) {
                window.location.href = result.paymentUrl
            } else {
                throw new Error("No payment URL received")
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Payment failed")
        } finally {
            setIsLoading(false)
        }
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        {error || "Loading..."}
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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Course Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start space-x-4">
                                <img
                                    src={course.image}
                                    alt={course.title}
                                    className="w-20 h-20 object-cover rounded-lg"
                                />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{course.title}</h3>
                                    <p className="text-gray-600 text-sm mt-1">{course.description}</p>
                                    <div className="mt-2 space-y-1 text-sm text-gray-500">
                                        <p>Duration: {course.duration}</p>
                                        <p>Instructor: {course.instructor}</p>
                                        <p>Modality: {course.modality}</p>
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

                    {/* Checkout Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Checkout Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Customer Information */}
                                <div className="space-y-4">
                                    <h3 className="font-medium">Contact Information</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-4">
                                    <h3 className="font-medium">Payment Method</h3>

                                    <RadioGroup
                                        value={formData.paymentMethod}
                                        onValueChange={handlePaymentMethodChange}
                                    >
                                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                                            <RadioGroupItem value="qpay" id="qpay" />
                                            <Label htmlFor="qpay" className="flex items-center space-x-2 cursor-pointer">
                                                <Smartphone className="w-5 h-5" />
                                                <span>QPay (Mobile Payment)</span>
                                            </Label>
                                        </div>

                                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                                            <RadioGroupItem value="byl" id="byl" />
                                            <Label htmlFor="byl" className="flex items-center space-x-2 cursor-pointer">
                                                <CreditCard className="w-5 h-5" />
                                                <span>BYL (Bank Transfer)</span>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Terms and Conditions */}
                                <div className="flex items-start space-x-2">
                                    <Checkbox
                                        id="terms"
                                        checked={formData.agreeToTerms}
                                        onCheckedChange={handleTermsChange}
                                    />
                                    <Label htmlFor="terms" className="text-sm leading-relaxed">
                                        I agree to the{" "}
                                        <a href="/terms" className="text-[#E10600] hover:underline">
                                            Terms and Conditions
                                        </a>{" "}
                                        and{" "}
                                        <a href="/privacy" className="text-[#E10600] hover:underline">
                                            Privacy Policy
                                        </a>
                                    </Label>
                                </div>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-[#E10600] hover:bg-[#C70500]"
                                    disabled={isLoading || !formData.agreeToTerms}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        `Pay ₮${course.price.toLocaleString()}`
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

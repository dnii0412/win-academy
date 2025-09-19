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
        accessDuration: "45", // Default to 45 days
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
                    setError("Сургалт олдсонгүй")
                }
            } catch (error) {
                setError("Сургалтын мэдээлэл ачаалахад алдаа гарлаа")
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

    const handleAccessDurationChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            accessDuration: value as "45" | "90",
        }))
    }

    // Calculate the current price based on selected duration
    const getCurrentPrice = () => {
        if (!course) return 0
        return formData.accessDuration === "90"
            ? (course.price90Days || course.price || 0)
            : (course.price45Days || course.price || 0)
    }

    // Calculate the original price based on selected duration
    const getOriginalPrice = () => {
        if (!course) return 0
        return formData.accessDuration === "90"
            ? (course.originalPrice90Days || course.originalPrice || 0)
            : (course.originalPrice45Days || course.originalPrice || 0)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!course || !formData.agreeToTerms) {
            setError("Үйлчилгээний нөхцөлтэй санал нийлэх шаардлагатай")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // For QPay, we don't need to create a separate order
            // The PayWithQPay component handles the order creation and payment flow

            // The actual payment is handled by the PayWithQPay component
            // This form is mainly for collecting customer information and terms agreement

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Төлбөр амжилтгүй боллоо"
            setError(`Төлбөрийн алдаа: ${errorMessage}`)
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
                        Нэвтрэх эрх шалгаж байна...
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
                        {error || "Сургалт ачаалж байна..."}
                    </h1>
                    {error && (
                        <Button onClick={() => router.push("/courses")}>
                            Сургалтууд руу буцах
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
                            <CardTitle>Захиалгын дэлгэрэнгүй</CardTitle>
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
                                    <h3 className="font-semibold text-lg">{course.titleMn || course.title}</h3>
                                    <p className="text-gray-600 text-sm mt-1">{course.descriptionMn || course.description}</p>

                                </div>
                            </div>

                            {/* Access Duration Selection */}
                            <div className="border-t pt-4 mt-6">
                                <h4 className="text-lg font-semibold mb-3">Хандалтын хугацаа сонгох</h4>
                                <RadioGroup
                                    value={formData.accessDuration}
                                    onValueChange={handleAccessDurationChange}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                        <RadioGroupItem value="45" id="45" />
                                        <Label htmlFor="45" className="flex-1 cursor-pointer">
                                            <div className="flex justify-between items-center w-full">
                                                <div className="flex-1">
                                                    <span className="font-medium">45 хоног</span>
                                                </div>
                                                <div className="ml-auto">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-lg font-bold text-[#FF344A]">
                                                            ₮{(course.price45Days || course.price).toLocaleString()}
                                                        </span>
                                                        {course.originalPrice45Days && course.originalPrice45Days > (course.price45Days || course.price) && (
                                                            <span className="text-sm text-gray-500 line-through">
                                                                ₮{course.originalPrice45Days.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                        <RadioGroupItem value="90" id="90" />
                                        <Label htmlFor="90" className="flex-1 cursor-pointer">
                                            <div className="flex justify-between items-center w-full">
                                                <div className="flex-1">
                                                    <span className="font-medium">90 хоног</span>
                                                </div>
                                                <div className="ml-auto">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-lg font-bold text-[#FF344A]">
                                                            ₮{(course.price90Days || course.price).toLocaleString()}
                                                        </span>
                                                        {course.originalPrice90Days && course.originalPrice90Days > (course.price90Days || course.price) && (
                                                            <span className="text-sm text-gray-500 line-through">
                                                                ₮{course.originalPrice90Days.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="border-t pt-4 mt-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold">Нийт дүн</span>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-[#FF344A]">
                                            ₮{getCurrentPrice().toLocaleString()}
                                        </span>
                                        {getOriginalPrice() > 0 && getOriginalPrice() > getCurrentPrice() && (
                                            <p className="text-sm text-gray-500 line-through">
                                                ₮{getOriginalPrice().toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Section - Manual checking only */}
                    <div>
                        <CheckoutPayment
                            courseId={courseId}
                            amount={getCurrentPrice()}
                            description={`${course.titleMn || course.title} - ${formData.accessDuration} хоног`}
                            accessDuration={formData.accessDuration}
                            onPaymentSuccess={async (invoiceId) => {
                                if (isRedirecting) {
                                    return
                                }

                                setIsRedirecting(true)

                                // Wait a moment for course access to be granted
                                await new Promise(resolve => setTimeout(resolve, 2000))

                                // Check if user has access to the course
                                try {
                                    const accessResponse = await fetch(`/api/courses/${courseId}/access`)
                                    if (accessResponse.ok) {
                                        const accessData = await accessResponse.json()

                                        // Redirect to course learning page
                                        router.push(`/learn/${courseId}`)
                                    } else {
                                        // Redirect anyway as payment was successful
                                        router.push(`/learn/${courseId}`)
                                    }
                                } catch (error) {
                                    // Redirect anyway as payment was successful
                                    router.push(`/learn/${courseId}`)
                                }
                            }}
                            onPaymentError={(error) => {
                                setError(`Payment Error: ${error}`)
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

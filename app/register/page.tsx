"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Logo from "@/components/logo"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!/^\d{8,}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid phone number"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Registration successful, sign in the user
        const result = await signIn('credentials', {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          redirect: false,
        })

        if (result?.error) {
          setErrors({ general: "Registration successful but login failed. Please try logging in." })
        } else {
          router.push('/dashboard')
        }
      } else {
        setErrors({ general: data.message || "Registration failed. Please try again." })
      }
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({ general: "An unexpected error occurred. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      await signIn("google", {
        callbackUrl: "/dashboard",
      })
    } catch (error) {
      console.error("Google sign-up error:", error)
      setErrors({ general: "Google sign-up failed. Please try again." })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 pb-16">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={false} />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Create Account</CardTitle>
          <p className="text-muted-foreground">Start your learning journey today</p>
        </CardHeader>
        <CardContent className="space-y-6">

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1">
                Full Name
              </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                className="w-full bg-background border-border text-foreground placeholder:text-muted-foreground"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                className="w-full bg-background border-border text-foreground placeholder:text-muted-foreground"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                Phone Number
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                className="w-full bg-background border-border text-foreground placeholder:text-muted-foreground"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="w-full bg-background border-border text-foreground placeholder:text-muted-foreground pr-10"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="w-full bg-background border-border text-foreground placeholder:text-muted-foreground pr-10"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                name="agreeToTerms"
                className="rounded border-border text-[#E10600] focus:ring-[#E10600] mt-1 bg-background"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                required
              />
              <span className="ml-2 text-sm text-muted-foreground">
                I agree to the{" "}
                <Link href="/terms" className="text-[#E10600] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#E10600] hover:underline">
                  Privacy Policy
                </Link>
              </span>
              {errors.agreeToTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms}</p>}
            </div>

            <Button type="submit" className="w-full bg-[#E10600] hover:bg-[#C70500] text-white" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
            {errors.general && <p className="text-red-500 text-center text-sm">{errors.general}</p>}
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignUp}
            className="w-full bg-background border border-border text-foreground hover:bg-accent flex items-center justify-center space-x-2"
            variant="outline"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Sign up with Google</span>
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-[#E10600] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

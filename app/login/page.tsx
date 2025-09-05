"use client"

import type React from "react"
import { Suspense } from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Logo from "@/components/logo"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail")
    const rememberMe = localStorage.getItem("rememberMe") === "true"

    if (savedEmail && rememberMe) {
      setFormData((prev) => ({
        ...prev,
        email: savedEmail,
        rememberMe: true,
      }))
    }
  }, [])

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = "И-мэйл хаяг оруулах шаардлагатай"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Зөв и-мэйл хаяг оруулна уу"
    }

    if (!formData.password) {
      newErrors.password = "Нууц үг оруулах шаардлагатай"
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
      const result = await signIn("credentials", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setErrors({ general: "И-мэйл эсвэл нууц үг буруу байна. Дахин оролдоно уу." })
      } else {
        // Handle remember me
        if (formData.rememberMe) {
          localStorage.setItem("rememberedEmail", formData.email.trim())
          localStorage.setItem("rememberMe", "true")
        } else {
          localStorage.removeItem("rememberedEmail")
          localStorage.removeItem("rememberMe")
        }

        // Redirect to callback URL or dashboard
        router.push(callbackUrl)
      }
    } catch (error) {
      console.error("Login error:", error)
      setErrors({ general: "Санаандгүй алдаа гарлаа. Дахин оролдоно уу." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("google", {
        callbackUrl: callbackUrl,
      })
    } catch (error) {
      console.error("Google sign-in error:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={false} />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Сайн байна уу</CardTitle>
          <p className="text-muted-foreground">Үргэлжлүүлэн суралцахын тулд бүртгэлдээ нэвтэрнэ үү</p>
        </CardHeader>
        <CardContent className="space-y-6">

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                И-мэйл хаяг
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="И-мэйл хаягаа оруулна уу"
                className="w-full bg-background border-border text-foreground placeholder:text-muted-foreground"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                Нууц үг
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Нууц үгээ оруулна уу"
                  className="w-full bg-background border-border text-foreground placeholder:text-muted-foreground pr-10"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  className="rounded border-border text-[#E10600] focus:ring-[#E10600] bg-background"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                />
                <span className="ml-2 text-sm text-muted-foreground">Намайг сана</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-[#E10600] hover:underline">
                Нууц үгээ мартсан уу?
              </Link>
            </div>

            {errors.general && <p className="text-sm text-red-500 text-center">{errors.general}</p>}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#E10600] hover:bg-[#C70500] text-white"
            >
              {isLoading ? "Уншиж байна..." : "Нэвтрэх"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">эсвэл</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-background border border-border text-foreground hover:bg-accent flex items-center justify-center space-x-2"
            variant="outline"
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
            <span>Google-аар үргэлжлүүлэх</span>
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Бүртгэл байхгүй юу?{" "}
            <Link href="/register" className="text-[#E10600] hover:underline font-medium">
              Бүртгүүлэх
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}

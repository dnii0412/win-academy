"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Eye, EyeOff } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const { currentLanguage } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        // Store admin token or session
        localStorage.setItem("adminToken", data.token)
        console.log("Login successful, setting success message")
        setSuccess("Login successful! Redirecting...")
        // Redirect to admin dashboard after successful login
        setTimeout(() => {
          console.log("Redirecting to admin dashboard")
          window.location.href = "/admin"
        }, 1000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Login failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentLanguage === "mn" ? "Админ нэвтрэх" : "Admin Login"}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {currentLanguage === "mn" 
                  ? "Админ хэрэглэгчийн эрхээр нэвтэрнэ үү" 
                  : "Sign in with your admin credentials"
                }
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            {/* Debug info */}
            <div className="text-xs text-gray-500">
              Success state: "{success}" | Error state: "{error}"
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {currentLanguage === "mn" ? "Имэйл" : "Email"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={currentLanguage === "mn" ? "admin@example.com" : "admin@example.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {currentLanguage === "mn" ? "Нууц үг" : "Password"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={currentLanguage === "mn" ? "Нууц үгээ оруулна уу" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>
                      {currentLanguage === "mn" ? "Нэвтэрч байна..." : "Signing in..."}
                    </span>
                  </div>
                ) : (
                  <span>
                    {currentLanguage === "mn" ? "Нэвтрэх" : "Sign In"}
                  </span>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentLanguage === "mn" 
                  ? "Админ эрх байгаа эсэхээ шалгана уу" 
                  : "Contact system administrator for access"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

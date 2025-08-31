"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, User, Mail, Shield } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface UserFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: any) => void
  user?: any
  mode: "create" | "edit"
}

export default function UserForm({ isOpen, onClose, onSubmit, user, mode }: UserFormProps) {
  const { currentLanguage } = useLanguage()
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    password: "",
    role: user?.role || "user",
    status: user?.status || "active"
  })

  // Update form data when user prop changes (for editing)
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        password: "", // Don't populate password for security
        role: user.role || "user",
        status: user.status || "active"
      })
    }
  }, [user])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Client-side validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.password.trim()) {
      alert(currentLanguage === "mn" 
        ? "Бүх талбарыг бөглөнө үү!" 
        : "Please fill in all required fields!"
      )
      return
    }
    
    if (formData.password.length < 6) {
      alert(currentLanguage === "mn" 
        ? "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой!" 
        : "Password must be at least 6 characters long!"
      )
      return
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert(currentLanguage === "mn" 
        ? "Зөв имэйл хаяг оруулна уу!" 
        : "Please enter a valid email address!"
      )
      return
    }
    
    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === "create" 
                ? (currentLanguage === "mn" ? "Хэрэглэгч үүсгэх" : "Create User")
                : (currentLanguage === "mn" ? "Хэрэглэгч засах" : "Edit User")
              }
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {currentLanguage === "mn" ? "Үндсэн мэдээлэл" : "Basic Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    placeholder="Phone number"
                  />
                </div>

                {mode === "create" && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Password"
                      required
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {currentLanguage === "mn" ? "Хэрэглэгчийн тохиргоо" : "User Settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                {currentLanguage === "mn" ? "Цуцлах" : "Cancel"}
              </Button>
              <Button type="submit">
                {mode === "create" 
                  ? (currentLanguage === "mn" ? "Үүсгэх" : "Create User")
                  : (currentLanguage === "mn" ? "Хадгалах" : "Save Changes")
                }
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  User,
  Mail,
  Calendar,
  Shield,
  Users,
  BookOpen
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import Link from "next/link"
import UserForm from "./components/UserForm"
import CourseAccessManager from "./components/CourseAccessManager"

interface AdminUser {
  _id: string
  firstName: string
  lastName: string
  fullName?: string
  email: string
  role: "user" | "admin" | "instructor"
  createdAt: string
  lastLogin?: string
  status: "completed" | "suspended"
  phoneNumber?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showCourseAccess, setShowCourseAccess] = useState(false)
  const [selectedUserForAccess, setSelectedUserForAccess] = useState<AdminUser | null>(null)
  const { currentLanguage } = useLanguage()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (userData: any) => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(prev => [data.user, ...prev])
        setShowAddForm(false)
        // Show success message
        alert(currentLanguage === "mn" ? "Хэрэглэгч амжилттай үүслээ!" : "User created successfully!")
      } else {
        const errorData = await response.json()
        alert(currentLanguage === "mn" ? `Алдаа: ${errorData.message}` : `Error: ${errorData.message}`)
      }
    } catch (error) {
      console.error("Failed to create user:", error)
      alert(currentLanguage === "mn" ? "Хэрэглэгч үүсгэхэд алдаа гарлаа" : "Failed to create user")
    }
  }

  const handleEditUser = async (userData: any) => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/users/${editingUser?._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(prev => prev.map(user => 
          user._id === editingUser?._id ? data.user : user
        ))
        setShowEditForm(false)
        setEditingUser(null)
        alert(currentLanguage === "mn" ? "Хэрэглэгч амжилттай шинэчлэгдлээ!" : "User updated successfully!")
      } else {
        const errorData = await response.json()
        alert(currentLanguage === "mn" ? `Алдаа: ${errorData.message}` : `Error: ${errorData.message}`)
      }
    } catch (error) {
      console.error("Failed to update user:", error)
      alert(currentLanguage === "mn" ? "Хэрэглэгч шинэчлэхэд алдаа гарлаа" : "Failed to update user")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    // Prevent deleting the current admin user
    const currentUserEmail = localStorage.getItem("adminEmail")
    const userToDelete = users.find(user => user._id === userId)
    
    if (userToDelete?.email === currentUserEmail) {
      alert(currentLanguage === "mn" 
        ? "Та өөрийгөө устгах боломжгүй!" 
        : "You cannot delete yourself!"
      )
      return
    }

    // Confirm deletion
    if (!confirm(currentLanguage === "mn" 
      ? "Хэрэглэгчийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй." 
      : "Are you sure you want to delete this user? This action cannot be undone."
    )) {
      return
    }

    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (response.ok) {
        // Remove user from local state
        setUsers(prev => prev.filter(user => user._id !== userId))
        alert(currentLanguage === "mn" 
          ? "Хэрэглэгч амжилттай устгагдлаа!" 
          : "User deleted successfully!"
        )
      } else {
        const errorData = await response.json()
        alert(currentLanguage === "mn" 
          ? `Алдаа: ${errorData.message}` 
          : `Error: ${errorData.message}`
        )
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
      alert(currentLanguage === "mn" 
        ? "Хэрэглэгч устгахад алдаа гарлаа" 
        : "Failed to delete user"
      )
    }
  }

  const handleEditClick = (user: AdminUser) => {
    setEditingUser(user)
    setShowEditForm(true)
  }

  const handleCourseAccessClick = (user: AdminUser) => {
    setSelectedUserForAccess(user)
    setShowCourseAccess(true)
  }

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "instructor":
        return "default"
      default:
        return "secondary"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    return status === "completed" ? "default" : "secondary"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Add User Button */}
        <div className="mb-6 flex justify-between items-center">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={currentLanguage === "mn" ? "Хэрэглэгч хайх..." : "Search users..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {currentLanguage === "mn" ? "Хэрэглэгч нэмэх" : "Add User"}
          </Button>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {user.fullName || `${user.firstName} ${user.lastName}`.trim()}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-2">
                      {user.email}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4 mr-2" />
                    <span>{user.fullName || `${user.firstName} ${user.lastName}`.trim()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  {user.lastLogin && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Shield className="h-4 w-4 mr-2" />
                      <span>Last: {new Date(user.lastLogin).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditClick(user)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {currentLanguage === "mn" ? "Засах" : "Edit"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCourseAccessClick(user)}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {currentLanguage === "mn" ? "Курс" : "Courses"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteUser(user._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {currentLanguage === "mn" ? "Устгах" : "Delete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {currentLanguage === "mn" ? "Хэрэглэгч олдсонгүй" : "No users found"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {currentLanguage === "mn" 
                ? "Хайлтын үр дүнд тохирох хэрэглэгч байхгүй байна" 
                : "No users match your search criteria"
              }
            </p>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      <UserForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleCreateUser}
        mode="create"
      />

      {/* Edit User Form Modal */}
      <UserForm
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false)
          setEditingUser(null)
        }}
        onSubmit={handleEditUser}
        user={editingUser}
        mode="edit"
      />

      {/* Course Access Manager Modal */}
      {showCourseAccess && selectedUserForAccess && (
        <CourseAccessManager
          userId={selectedUserForAccess._id}
          userName={selectedUserForAccess.fullName || `${selectedUserForAccess.firstName} ${selectedUserForAccess.lastName}`.trim()}
          onClose={() => {
            setShowCourseAccess(false)
            setSelectedUserForAccess(null)
          }}
        />
      )}
    </div>
  )
}

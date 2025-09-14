"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
  BookOpen,
  CheckSquare,
  Square
} from "lucide-react"
import Link from "next/link"
import UserForm from "./components/UserForm"
import CourseAccessManager from "./components/CourseAccessManager"
import BulkCourseAccessManager from "./components/BulkCourseAccessManager"

interface AdminUser {
  _id: string
  fullName: string
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showBulkAccess, setShowBulkAccess] = useState(false)

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
        alert("User created successfully!")
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.message}`)
      }
    } catch (error) {
      console.error("Failed to create user:", error)
      alert("Failed to create user")
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
        alert("User updated successfully!")
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.message}`)
      }
    } catch (error) {
      console.error("Failed to update user:", error)
      alert("Failed to update user")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    // Prevent deleting the current admin user
    const currentUserEmail = localStorage.getItem("adminEmail")
    const userToDelete = users.find(user => user._id === userId)
    
    if (userToDelete?.email === currentUserEmail) {
      alert("You cannot delete yourself!")
      return
    }

    // Confirm deletion
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
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
        alert("User deleted successfully!")
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.message}`)
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
      alert("Failed to delete user")
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

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user._id))
    }
  }

  const handleBulkAccessClick = () => {
    if (selectedUsers.length === 0) {
      alert("Please select at least one user")
      return
    }
    setShowBulkAccess(true)
  }

  const handleBulkAccessSuccess = () => {
    setSelectedUsers([])
    fetchUsers() // Refresh users to show updated access
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      alert("Please select at least one user")
      return
    }

    // Prevent deleting the current admin user
    const currentUserEmail = localStorage.getItem("adminEmail")
    const usersToDelete = users.filter(user => selectedUsers.includes(user._id))
    const currentUserInSelection = usersToDelete.find(user => user.email === currentUserEmail)
    
    if (currentUserInSelection) {
      alert("You cannot delete yourself!")
      return
    }

    // Check if any admin users are selected
    const adminUsersInSelection = usersToDelete.filter(user => user.role === "admin")
    if (adminUsersInSelection.length > 0) {
      alert("Cannot delete admin users. Please change their role first.")
      return
    }

    // Confirm deletion
    const confirmMessage = `Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/users/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      })

      if (response.ok) {
        const data = await response.json()
        // Remove deleted users from local state
        setUsers(prev => prev.filter(user => !selectedUsers.includes(user._id)))
        setSelectedUsers([])
        alert(`${data.deletedCount} user(s) deleted successfully!`)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.message}`)
      }
    } catch (error) {
      console.error("Failed to delete users:", error)
      alert("Failed to delete users")
    }
  }

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        {/* Search and Action Buttons */}
        <div className="mb-6 flex justify-between items-center">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {selectedUsers.length > 0 && (
              <>
                <Button
                  onClick={handleBulkAccessClick}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Give Course Access ({selectedUsers.length})
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Users ({selectedUsers.length})
                </Button>
              </>
            )}
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={selectedUsers.includes(user._id)}
                          onCheckedChange={() => handleSelectUser(user._id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(user)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCourseAccessClick(user)}
                          >
                            <BookOpen className="h-4 w-4 mr-1" />
                            Courses
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No users found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No users match your search criteria
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
          userName={selectedUserForAccess.fullName}
          onClose={() => {
            setShowCourseAccess(false)
            setSelectedUserForAccess(null)
          }}
        />
      )}

      {/* Bulk Course Access Manager Modal */}
      {showBulkAccess && (
        <BulkCourseAccessManager
          selectedUsers={filteredUsers.filter(user => selectedUsers.includes(user._id))}
          onClose={() => setShowBulkAccess(false)}
          onSuccess={handleBulkAccessSuccess}
        />
      )}
    </div>
  )
}

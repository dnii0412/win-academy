"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Search,
  Edit,
  Eye,
  Lock,
  Unlock,
  BookOpen,
  Mail,
  Calendar,
  Filter
} from "lucide-react"
import Link from "next/link"

interface User {
  _id: string
  name: string
  email: string
  role: string
  status: string
  enrolledCourses: string[]
  totalCourses: number
  lastLogin: string
  createdAt: string
  phone?: string
  avatar?: string
}

interface Course {
  _id: string
  title: string
  titleMn?: string
}

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    if (session?.user?.role === "admin") {
      loadUsers()
      loadCourses()
    }
  }, [session])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, selectedRole, selectedStatus])

  const loadUsers = async () => {
    try {
      // Mock data for demonstration
      const mockUsers: User[] = [
        {
          _id: "1",
          name: "Batbayar S.",
          email: "batbayar@email.com",
          role: "user",
          status: "active",
          enrolledCourses: ["1", "2"],
          totalCourses: 2,
          lastLogin: "2024-01-20",
          createdAt: "2024-01-01",
          phone: "9016-6060"
        },
        {
          _id: "2",
          name: "Oyunaa T.",
          email: "oyunaa@email.com",
          role: "user",
          status: "active",
          enrolledCourses: ["2"],
          totalCourses: 1,
          lastLogin: "2024-01-19",
          createdAt: "2024-01-02",
          phone: "9668-0707"
        },
        {
          _id: "3",
          name: "Munkh-Erdene B.",
          email: "munkh@email.com",
          role: "user",
          status: "active",
          enrolledCourses: ["1"],
          totalCourses: 1,
          lastLogin: "2024-01-18",
          createdAt: "2024-01-03"
        },
        {
          _id: "4",
          name: "John Smith",
          email: "john@email.com",
          role: "instructor",
          status: "active",
          enrolledCourses: [],
          totalCourses: 0,
          lastLogin: "2024-01-20",
          createdAt: "2024-01-01"
        }
      ]

      setUsers(mockUsers)
      setFilteredUsers(mockUsers)
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      // Mock courses data
      const mockCourses: Course[] = [
        { _id: "1", title: "Digital Marketing Mastery", titleMn: "Дижитал маркетингийн мастер" },
        { _id: "2", title: "UI/UX Design Fundamentals", titleMn: "UI/UX дизайны үндэс" }
      ]
      setCourses(mockCourses)
    } catch (error) {
      console.error("Error loading courses:", error)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm))
      )
    }

    if (selectedRole) {
      filtered = filtered.filter(user => user.role === selectedRole)
    }

    if (selectedStatus) {
      filtered = filtered.filter(user => user.status === selectedStatus)
    }

    setFilteredUsers(filtered)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "instructor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "user":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "suspended":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      // In a real app, you'd make an API call here
      const newStatus = currentStatus === "active" ? "inactive" : "active"

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === userId ? { ...user, status: newStatus } : user
        )
      )

      console.log(`User ${userId} status changed to ${newStatus}`)
    } catch (error) {
      console.error("Error updating user status:", error)
    }
  }

  const getCourseTitle = (courseId: string) => {
    const course = courses.find(c => c._id === courseId)
    return course ? course.title : "Unknown Course"
  }

  if (!session || session.user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts, permissions, and course access</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Users</CardTitle>
          <CardDescription>Find specific users quickly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="instructor">Instructor</option>
              <option value="user">User</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user._id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user.email}</span>
                </div>

                {user.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">📱</span>
                    <span>{user.phone}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Enrolled in {user.totalCourses} courses</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>

                {user.enrolledCourses.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Enrolled Courses:</span>
                    <div className="space-y-1">
                      {user.enrolledCourses.slice(0, 2).map((courseId) => (
                        <div key={courseId} className="text-xs bg-muted px-2 py-1 rounded">
                          {getCourseTitle(courseId)}
                        </div>
                      ))}
                      {user.enrolledCourses.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{user.enrolledCourses.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Link href={`/admin/users/${user._id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </Link>
                <Link href={`/admin/users/${user._id}/edit`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleUserStatus(user._id, user.status)}
                  className={user.status === "active" ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                >
                  {user.status === "active" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedRole || selectedStatus
                ? "Try adjusting your search or filter criteria"
                : "No users have registered yet"
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common user management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Send Bulk Email
            </Button>
            <Button variant="outline">
              <BookOpen className="h-4 w-4 mr-2" />
              Manage Course Access
            </Button>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Export User List
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

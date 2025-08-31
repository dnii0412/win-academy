"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  BookOpen, 
  CreditCard, 
  TrendingUp, 
  Plus,
  LogOut,
  Settings,
  UserPlus,
  FileText
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import Link from "next/link"

interface AdminStats {
  totalUsers: number
  totalCourses: number
  totalOrders: number
  totalRevenue: number
  recentUsers: Array<{
    id: string
    name: string
    email: string
    createdAt: string
  }>
  recentOrders: Array<{
    id: string
    courseTitle: string
    amount: number
    status: string
    createdAt: string
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { currentLanguage } = useLanguage()

  useEffect(() => {
    // Check if admin is authenticated
    const adminToken = localStorage.getItem("adminToken")
    if (!adminToken) {
      router.push("/admin/login")
      return
    }

    fetchAdminStats()
  }, [router])

  const fetchAdminStats = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("adminToken")
        router.push("/admin/login")
      }
    } catch (error) {
      console.error("Failed to fetch admin stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    router.push("/admin/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
        {/* Quick Actions */}
        <div className="mb-8">
         
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/courses">
              <Button className="w-full h-20 flex-col space-y-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-6 w-6" />
                <span className="text-sm">
                  {currentLanguage === "mn" ? "Сургалт нэмэх" : "Add Course"}
                </span>
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button className="w-full h-20 flex-col space-y-2 bg-green-600 hover:bg-green-700">
                <UserPlus className="h-6 w-6" />
                <span className="text-sm">
                  {currentLanguage === "mn" ? "Хэрэглэгч нэмэх" : "Add User"}
                </span>
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button className="w-full h-20 flex-col space-y-2 bg-purple-600 hover:bg-purple-700">
                <FileText className="h-6 w-6" />
                <span className="text-sm">
                  {currentLanguage === "mn" ? "Захиалга харах" : "View Orders"}
                </span>
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button className="w-full h-20 flex-col space-y-2 bg-gray-600 hover:bg-gray-700">
                <Settings className="h-6 w-6" />
                <span className="text-sm">
                  {currentLanguage === "mn" ? "Тохиргоо" : "Settings"}
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {currentLanguage === "mn" ? "Нийт хэрэглэгчид" : "Total Users"}
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentLanguage === "mn" ? "Бүртгэлтэй хэрэглэгчид" : "Registered users"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {currentLanguage === "mn" ? "Нийт сургалтууд" : "Total Courses"}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalCourses || 0}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentLanguage === "mn" ? "Боломжит сургалтууд" : "Available courses"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {currentLanguage === "mn" ? "Нийт захиалга" : "Total Orders"}
              </CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalOrders || 0}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentLanguage === "mn" ? "Хийгдсэн захиалгууд" : "Completed orders"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {currentLanguage === "mn" ? "Нийт орлого" : "Total Revenue"}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats?.totalRevenue || 0}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentLanguage === "mn" ? "Нийт орлого" : "Total revenue"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {currentLanguage === "mn" ? "Сүүлийн хэрэглэгчид" : "Recent Users"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentUsers?.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    {currentLanguage === "mn" ? "Хэрэглэгч байхгүй" : "No users yet"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {currentLanguage === "mn" ? "Сүүлийн захиалгууд" : "Recent Orders"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentOrders?.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{order.courseTitle}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">${order.amount}</p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={order.status === "completed" ? "default" : "secondary"}
                        className="text-xs mb-1"
                      >
                        {order.status}
                      </Badge>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    {currentLanguage === "mn" ? "Захиалга байхгүй" : "No orders yet"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search,
  FileText,
  DollarSign,
  Calendar,
  User,
  BookOpen,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import Link from "next/link"

interface Order {
  _id: string
  courseTitle: string
  courseTitleMn?: string
  userName: string
  userEmail: string
  amount: number
  status: "pending" | "completed" | "failed" | "cancelled"
  paymentMethod: string
  createdAt: string
  updatedAt: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { currentLanguage } = useLanguage()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/orders", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOrders = orders.filter(order =>
    order.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.courseTitleMn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      case "cancelled":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getTotalRevenue = () => {
    return orders
      .filter(order => order.status === "completed")
      .reduce((total, order) => total + order.amount, 0)
  }

  const getTotalOrders = () => orders.length

  const getCompletedOrders = () => orders.filter(order => order.status === "completed").length

  const createSampleOrder = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          courseId: "sample-course-id", // You'll need to replace this with a real course ID
          userId: "sample-user-id",     // You'll need to replace this with a real user ID
          amount: Math.floor(Math.random() * 200) + 50, // Random amount between 50-250
          paymentMethod: "credit_card",
          status: "pending"
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(prev => [data.order, ...prev])
        alert(currentLanguage === "mn" 
          ? "Жишээ захиалга үүслээ!" 
          : "Sample order created!"
        )
      } else {
        const errorData = await response.json()
        alert(currentLanguage === "mn" 
          ? `Алдаа: ${errorData.message}` 
          : `Error: ${errorData.message}`
        )
      }
    } catch (error) {
      console.error("Failed to create sample order:", error)
      alert(currentLanguage === "mn" 
        ? "Жишээ захиалга үүсгэхэд алдаа гарлаа" 
        : "Failed to create sample order"
      )
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: newStatus
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(prev => prev.map(order => 
          order._id === orderId ? data.order : order
        ))
        alert(currentLanguage === "mn" 
          ? "Захиалгын төлөв шинэчлэгдлээ!" 
          : "Order status updated!"
        )
      } else {
        const errorData = await response.json()
        alert(currentLanguage === "mn" 
          ? `Алдаа: ${errorData.message}` 
          : `Error: ${errorData.message}`
        )
      }
    } catch (error) {
      console.error("Failed to update order status:", error)
      alert(currentLanguage === "mn" 
        ? "Захиалгын төлөв шинэчлэхэд алдаа гарлаа" 
        : "Failed to update order status"
      )
    }
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
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {currentLanguage === "mn" ? "Нийт захиалга" : "Total Orders"}
              </CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {getTotalOrders()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentLanguage === "mn" ? "Бүх захиалгууд" : "All orders"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {currentLanguage === "mn" ? "Дууссан захиалга" : "Completed Orders"}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {getCompletedOrders()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentLanguage === "mn" ? "Амжилттай" : "Successful"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {currentLanguage === "mn" ? "Нийт орлого" : "Total Revenue"}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ${getTotalRevenue()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentLanguage === "mn" ? "Нийт орлого" : "Total revenue"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6 flex justify-between items-center">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={currentLanguage === "mn" ? "Захиалга хайх..." : "Search orders..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={createSampleOrder}
            variant="outline"
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
          >
            <FileText className="h-4 w-4 mr-2" />
            {currentLanguage === "mn" ? "Жишээ захиалга" : "Sample Order"}
          </Button>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <Card key={order._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {currentLanguage === "mn" ? order.courseTitleMn || order.courseTitle : order.courseTitle}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-2">
                      {order.userName} ({order.userEmail})
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4 mr-2" />
                    <span>{order.userName}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span>{currentLanguage === "mn" ? order.courseTitleMn || order.courseTitle : order.courseTitle}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span>${order.amount}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {currentLanguage === "mn" ? "Дэлгэрэнгүй" : "Details"}
                  </Button>
                  {order.status === "pending" && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateOrderStatus(order._id, "completed")}
                    >
                      {currentLanguage === "mn" ? "Зөвшөөрөх" : "Approve"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {currentLanguage === "mn" ? "Захиалга олдсонгүй" : "No orders found"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {currentLanguage === "mn" 
                ? "Хайлтын үр дүнд тохирох захиалга байхгүй байна" 
                : "No orders match your search criteria"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

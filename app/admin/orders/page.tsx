"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  ShoppingCart, 
  Search, 
  Eye, 
  Download,
  Filter,
  DollarSign,
  Calendar,
  User,
  BookOpen,
  TrendingUp,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

interface Order {
  _id: string
  orderNumber: string
  studentName: string
  studentEmail: string
  courseTitle: string
  courseTitleMn?: string
  amount: number
  currency: string
  status: string
  paymentMethod: string
  paymentProvider: string
  transactionId: string
  createdAt: string
  paidAt?: string
  refundedAt?: string
  refundAmount?: number
}

interface PaymentStats {
  totalRevenue: number
  totalOrders: number
  pendingPayments: number
  successfulPayments: number
  failedPayments: number
  monthlyRevenue: number
}

export default function AdminOrdersPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")
  const [dateRange, setDateRange] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    totalOrders: 0,
    pendingPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
    monthlyRevenue: 0
  })

  useEffect(() => {
    if (session?.user?.role === "admin") {
      loadOrders()
      loadStats()
    }
  }, [session])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, selectedStatus, selectedPaymentMethod, dateRange])

  const loadOrders = async () => {
    try {
      // Mock data for demonstration
      const mockOrders: Order[] = [
        {
          _id: "1",
          orderNumber: "ORD-2024-001",
          studentName: "Batbayar S.",
          studentEmail: "batbayar@email.com",
          courseTitle: "Digital Marketing Mastery",
          courseTitleMn: "Дижитал маркетингийн мастер",
          amount: 250000,
          currency: "MNT",
          status: "completed",
          paymentMethod: "card",
          paymentProvider: "QPay",
          transactionId: "TXN-001-2024",
          createdAt: "2024-01-20T10:30:00Z",
          paidAt: "2024-01-20T10:32:00Z"
        },
        {
          _id: "2",
          orderNumber: "ORD-2024-002",
          studentName: "Oyunaa T.",
          studentEmail: "oyunaa@email.com",
          courseTitle: "UI/UX Design Fundamentals",
          courseTitleMn: "UI/UX дизайны үндэс",
          amount: 300000,
          currency: "MNT",
          status: "completed",
          paymentMethod: "card",
          paymentProvider: "BYL",
          transactionId: "TXN-002-2024",
          createdAt: "2024-01-19T14:15:00Z",
          paidAt: "2024-01-19T14:17:00Z"
        },
        {
          _id: "3",
          orderNumber: "ORD-2024-003",
          studentName: "Munkh-Erdene B.",
          studentEmail: "munkh@email.com",
          courseTitle: "Digital Marketing Mastery",
          courseTitleMn: "Дижитал маркетингийн мастер",
          amount: 250000,
          currency: "MNT",
          status: "pending",
          paymentMethod: "card",
          paymentProvider: "QPay",
          transactionId: "TXN-003-2024",
          createdAt: "2024-01-18T09:45:00Z"
        },
        {
          _id: "4",
          orderNumber: "ORD-2024-004",
          studentName: "Tserendorj M.",
          studentEmail: "tseren@email.com",
          courseTitle: "AI Tools for Business",
          courseTitleMn: "Бизнесийн AI хэрэгслүүд",
          amount: 350000,
          currency: "MNT",
          status: "failed",
          paymentMethod: "card",
          paymentProvider: "BYL",
          transactionId: "TXN-004-2024",
          createdAt: "2024-01-17T16:20:00Z"
        },
        {
          _id: "5",
          orderNumber: "ORD-2024-005",
          studentName: "Ganbaatar N.",
          studentEmail: "ganbaatar@email.com",
          courseTitle: "UI/UX Design Fundamentals",
          courseTitleMn: "UI/UX дизайны үндэс",
          amount: 300000,
          currency: "MNT",
          status: "refunded",
          paymentMethod: "card",
          paymentProvider: "QPay",
          transactionId: "TXN-005-2024",
          createdAt: "2024-01-16T11:10:00Z",
          paidAt: "2024-01-16T11:12:00Z",
          refundedAt: "2024-01-20T15:30:00Z",
          refundAmount: 300000
        }
      ]
      
      setOrders(mockOrders)
      setFilteredOrders(mockOrders)
    } catch (error) {
      console.error("Error loading orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Calculate stats from orders
      const totalRevenue = orders.reduce((sum, order) => 
        order.status === "completed" ? sum + order.amount : sum, 0
      )
      
      const totalOrders = orders.length
      const pendingPayments = orders.filter(order => order.status === "pending").length
      const successfulPayments = orders.filter(order => order.status === "completed").length
      const failedPayments = orders.filter(order => order.status === "failed").length
      
      setStats({
        totalRevenue,
        totalOrders,
        pendingPayments,
        successfulPayments,
        failedPayments,
        monthlyRevenue: totalRevenue * 0.8 // Mock monthly calculation
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedStatus) {
      filtered = filtered.filter(order => order.status === selectedStatus)
    }

    if (selectedPaymentMethod) {
      filtered = filtered.filter(order => order.paymentMethod === selectedPaymentMethod)
    }

    if (dateRange) {
      const today = new Date()
      const filterDate = new Date()
      
      switch (dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(today.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(today.getMonth() - 1)
          break
        case "year":
          filterDate.setFullYear(today.getFullYear() - 1)
          break
      }
      
      filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate)
    }

    setFilteredOrders(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "refunded":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "card":
        return "💳"
      case "bank":
        return "🏦"
      case "mobile":
        return "📱"
      default:
        return "💰"
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
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
        <h1 className="text-3xl font-bold text-foreground">Payment & Orders</h1>
        <p className="text-muted-foreground">Track student payments, enrollments, and financial data</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₮{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+23% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successfulPayments}</div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedPayments}</div>
            <p className="text-xs text-muted-foreground">-5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₮{stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Orders</CardTitle>
          <CardDescription>Find specific orders and payments quickly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by student name, email, course, or order number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="">All Methods</option>
              <option value="card">Card</option>
              <option value="bank">Bank Transfer</option>
              <option value="mobile">Mobile Payment</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>Complete list of all student orders and payments</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Order</th>
                  <th className="text-left py-3 px-4 font-medium">Student</th>
                  <th className="text-left py-3 px-4 font-medium">Course</th>
                  <th className="text-left py-3 px-4 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Payment</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-xs text-muted-foreground">{order.transactionId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{order.studentName}</div>
                      <div className="text-xs text-muted-foreground">{order.studentEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{order.courseTitle}</div>
                      {order.courseTitleMn && (
                        <div className="text-xs text-muted-foreground">{order.courseTitleMn}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#E10600]">
                        {formatAmount(order.amount, order.currency)}
                      </div>
                      {order.refundAmount && (
                        <div className="text-xs text-red-600">
                          Refunded: {formatAmount(order.refundAmount, order.currency)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPaymentMethodIcon(order.paymentMethod)}</span>
                        <div>
                          <div className="text-sm font-medium">{order.paymentProvider}</div>
                          <div className="text-xs text-muted-foreground capitalize">{order.paymentMethod}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">{formatDate(order.createdAt)}</div>
                      {order.paidAt && (
                        <div className="text-xs text-muted-foreground">
                          Paid: {formatDate(order.paidAt)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Link href={`/admin/orders/${order._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        {order.status === "pending" && (
                          <Button variant="outline" size="sm" className="text-green-600">
                            Approve
                          </Button>
                        )}
                        {order.status === "completed" && (
                          <Button variant="outline" size="sm" className="text-red-600">
                            Refund
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedStatus || selectedPaymentMethod || dateRange
                ? "Try adjusting your search or filter criteria"
                : "No orders have been placed yet"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  BookOpen,
  PlayCircle,
  Users,
  GraduationCap,
  ShoppingCart,
  Ticket,
  BarChart3,
  Megaphone,
  HeadphonesIcon,
  Settings,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Courses", href: "/admin/courses", icon: BookOpen },
  { name: "Lessons", href: "/admin/lessons", icon: PlayCircle },
  { name: "Cohorts", href: "/admin/cohorts", icon: Users },
  { name: "Instructors", href: "/admin/instructors", icon: GraduationCap },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Coupons", href: "/admin/coupons", icon: Ticket },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { name: "Support", href: "/admin/support", icon: HeadphonesIcon },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#E10600] rounded flex items-center justify-center">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <span className="text-xl font-bold text-[#111111]">Win Academy</span>
        </Link>
        <p className="text-sm text-gray-600 mt-1">Admin Panel</p>
      </div>

      <nav className="px-4 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === item.href ? "bg-[#E10600] text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <Button variant="outline" className="w-full text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent">
          Back to Site
        </Button>
      </div>
    </div>
  )
}

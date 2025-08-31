"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { useLanguage } from "@/contexts/language-context"
import Logo from "./logo"

const navigation = [
  { name: "Dashboard", nameMn: "Хяналтын самбар", href: "/dashboard", icon: "📊" },
  { name: "My Courses", nameMn: "Миний сургалтууд", href: "/dashboard/courses", icon: "📚" },
  { name: "Videos", nameMn: "Видеонууд", href: "/dashboard/videos", icon: "🎥" },
  { name: "Profile", nameMn: "Профайл", href: "/dashboard/profile", icon: "👤" },
  { name: "Settings", nameMn: "Тохиргоо", href: "/dashboard/settings", icon: "⚙️" },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const { currentLanguage } = useLanguage()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
  }

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 min-h-screen flex flex-col transition-colors duration-200 shadow-sm dark:shadow-gray-900/50">
      <div className="p-6">
        <Logo size="md" />
      </div>

      <nav className="px-4 space-y-2 flex-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname === item.href
                ? "bg-[#E10600] text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{currentLanguage === "mn" ? item.nameMn : item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-4">
        <Button
          variant="outline"
          className="w-full text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent dark:bg-transparent"
          onClick={handleLogout}
        >
          {currentLanguage === "mn" ? "Гарах" : "Logout"}
        </Button>
      </div>
    </div>
  )
}

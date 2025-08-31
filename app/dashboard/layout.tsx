"use client"

import { useSession } from "next-auth/react"
import { useLanguage } from "@/contexts/language-context"
import { signOut } from "next-auth/react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const { currentLanguage } = useLanguage()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#E10600]"></div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#111111] dark:text-white mb-4">
            {currentLanguage === "mn" ? "Нэвтрэх шаардлагатай" : "Authentication Required"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {currentLanguage === "mn"
              ? "Хяналтын самбар руу хандахын тулд нэвтэрсэн байх шаардлагатай."
              : "You need to be authenticated to access the dashboard."
            }
          </p>
          <a
            href="/login"
            className="inline-block bg-[#E10600] hover:bg-[#C70500] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {currentLanguage === "mn" ? "Нэвтрэх" : "Login"}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}

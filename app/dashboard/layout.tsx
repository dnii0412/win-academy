"use client"

import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FF344A]"></div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#111111] dark:text-white mb-4">
            Нэвтрэх шаардлагатай
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Хяналтын самбар руу хандахын тулд нэвтэрсэн байх шаардлагатай.
          </p>
          <a
            href="/login"
            className="inline-block bg-[#FF344A] hover:bg-[#E02A3C] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Нэвтрэх
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}

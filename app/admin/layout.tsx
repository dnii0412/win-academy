"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { currentLanguage } = useLanguage()

  useEffect(() => {
    // Add a small delay to ensure token is properly stored
    const timer = setTimeout(() => {
      checkAuth()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [pathname])

  // Handle redirect when authentication fails
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== "/admin/login") {
      console.log("Admin layout - redirecting to login")
      router.push("/admin/login")
    }
  }, [isLoading, isAuthenticated, pathname, router])

  // Add admin-page class to body when component mounts
  useEffect(() => {
    document.body.classList.add('admin-page')
    
    // Remove class when component unmounts
    return () => {
      document.body.classList.remove('admin-page')
    }
  }, [])

  const checkAuth = async () => {
    const adminToken = localStorage.getItem("adminToken")
    console.log("Admin layout - checking auth:", { 
      pathname, 
      hasToken: !!adminToken, 
      tokenLength: adminToken?.length,
      tokenStart: adminToken?.substring(0, 20) + "..." 
    })
    
    if (!adminToken) {
      console.log("Admin layout - no token, setting unauthenticated")
      setIsAuthenticated(false)
      setIsLoading(false)
      return
    }

    // If we have a token, assume we're authenticated initially
    setIsAuthenticated(true)
    setIsLoading(false)

    try {
      // Verify token in background (don't block UI)
      console.log("Admin layout - verifying token in background...")
      fetch("/api/admin/verify", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }).then(response => {
        if (!response.ok) {
          console.log("Admin layout - token invalid, setting unauthenticated")
          localStorage.removeItem("adminToken")
          setIsAuthenticated(false)
        }
      }).catch(error => {
        console.error("Token verification failed:", error)
        localStorage.removeItem("adminToken")
        setIsAuthenticated(false)
      })
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("adminToken")
      setIsAuthenticated(false)
    }
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {currentLanguage === "mn" ? "Шалгаж байна..." : "Checking authentication..."}
          </p>
        </div>
      </div>
    )
  }

  // If on login page, don't show layout
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  // If not authenticated, show loading or return null (redirect handled in useEffect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {currentLanguage === "mn" ? "Шилжүүлж байна..." : "Redirecting..."}
          </p>
        </div>
      </div>
    )
  }

  // Show admin layout for authenticated users
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 admin-page">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Side - Mongolian Title and Navigation */}
            <div className="flex items-center space-x-8">
              {/* Admin Title */}
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentLanguage === "mn" ? "Админ удирдлага" : "Admin Management"}
                </h1>
              </div>
              
              {/* Admin Navigation */}
                                   <nav className="flex space-x-6">
                       <a 
                         href="/admin" 
                         className={`px-3 py-2 rounded-md text-sm font-medium ${
                           pathname === "/admin" 
                             ? "text-red-600 bg-red-50 dark:bg-red-900/20" 
                             : "text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                         }`}
                       >
                         {currentLanguage === "mn" ? "Удирдлага" : "Dashboard"}
                       </a>
                       <a 
                         href="/admin/courses" 
                         className={`px-3 py-2 rounded-md text-sm font-medium ${
                           pathname === "/admin/courses" 
                             ? "text-red-600 bg-red-50 dark:bg-red-900/20" 
                             : "text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                         }`}
                       >
                         {currentLanguage === "mn" ? "Сургалтууд" : "Courses"}
                       </a>

                       <a 
                         href="/admin/users" 
                         className={`px-3 py-2 rounded-md text-sm font-medium ${
                           pathname === "/admin/users" 
                             ? "text-red-600 bg-red-50 dark:bg-red-900/20" 
                             : "text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                         }`}
                       >
                         {currentLanguage === "mn" ? "Хэрэглэгчид" : "Users"}
                       </a>
                       <a 
                         href="/admin/orders" 
                         className={`px-3 py-2 rounded-md text-sm font-medium ${
                           pathname === "/admin/orders" 
                             ? "text-red-600 bg-red-50 dark:bg-red-900/20" 
                             : "text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                         }`}
                       >
                         {currentLanguage === "mn" ? "Захиалгууд" : "Orders"}
                       </a>

                     </nav>
            </div>
            
            {/* Right Side - Logout Button */}
            <div className="flex items-center">
              <button
                onClick={() => {
                  localStorage.removeItem("adminToken")
                  router.push("/admin/login")
                }}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                {currentLanguage === "mn" ? "Гарах" : "Logout"}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Admin Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

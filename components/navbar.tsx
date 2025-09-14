"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Menu, X, User, LogOut, Settings } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Logo from "./logo"
import { useLanguage } from "@/contexts/language-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [navbarHeight, setNavbarHeight] = useState(64) // Default height
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { t } = useLanguage()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    const updateNavbarHeight = () => {
      const navbar = document.querySelector('nav')
      if (navbar) {
        setNavbarHeight(navbar.offsetHeight)
      }
    }

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("resize", updateNavbarHeight)
    updateNavbarHeight() // Initial measurement
    
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", updateNavbarHeight)
    }
  }, [])

  // Track mobile menu state changes
  useEffect(() => {
    // Mobile menu state tracking
  }, [isMobileMenuOpen, navbarHeight])

  // Close mobile menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen) {
        const target = event.target as Element
        const navbar = document.querySelector('nav')
        if (navbar && !navbar.contains(target)) {
          setIsMobileMenuOpen(false)
        }
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isMobileMenuOpen])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  // Don't hide navbar on dashboard pages anymore - let them have their own navigation
  // if (pathname?.startsWith('/dashboard')) {
  //   return null
  // }

  if (!mounted) {
    return null
  }

  return (
    <nav
      className="border-b border-gray-200 dark:!border-gray-800 sticky top-0 z-[70] transition-all duration-300 relative bg-white dark:!bg-black shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div
          className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? "h-14" : "h-16"
            }`}
        >
          {/* Left - Logo and Navigation Links */}
          <div className="flex items-center space-x-8">
            <Logo size="lg" showText={false} />

            {/* Navigation Links - closer to logo */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="text-gray-900 dark:text-white hover:text-[#FF344A] transition-colors duration-200 font-medium"
              >
                {t("nav.home")}
              </Link>
              <Link
                href="/courses"
                className="text-gray-900 dark:text-white hover:text-[#FF344A] transition-colors duration-200 font-medium"
              >
                {t("nav.courses")}
              </Link>
            </div>
          </div>

          {/* Right - User Controls - more gathered and left-sided */}
          <div className="hidden md:flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-gray-900 dark:text-white"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-gray-900 dark:text-white">
                    <User className="h-4 w-4 mr-2" />
                    {session.user?.name || t("nav.dashboard")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <Settings className="mr-2 h-4 w-4" />
                      {t("nav.dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
                      <User className="mr-2 h-4 w-4" />
                      {t("nav.profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="outline" className="border-[#FF344A] text-[#FF344A] hover:bg-[#FF344A] hover:text-white transition-colors duration-200">
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-[#FF344A] hover:bg-[#E02A3C] text-white transition-colors duration-200">
                    {t("nav.register")}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center relative z-[80]">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 transform hover:scale-110 rounded-xl text-gray-900 dark:text-white"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
            >
              <div className="relative">
                <Menu className={`h-6 w-6 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 rotate-180' : 'opacity-100 rotate-0'}`} />
                <X className={`h-6 w-6 absolute top-0 left-0 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-180'}`} />
              </div>
            </Button>
          </div>
        </div>

        {/* Mobile Menu Backdrop */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-[45] md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu Dropdown */}
        <div 
          className={`block md:hidden fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 max-w-[85vw] z-[50] bg-white dark:!bg-black border-l border-gray-200 dark:!border-gray-800 shadow-2xl transition-all duration-300 ease-in-out transform ${
            isMobileMenuOpen 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 translate-x-full pointer-events-none'
          }`}
        >
            <div className="px-6 py-8 h-full flex flex-col">
            {/* Mobile Menu Header */}
            
            {/* Mobile Menu Content */}
            <div className="flex-1 space-y-6">
              {/* Navigation Links */}
              <div className="space-y-2">
                <Link
                  href="/"
                  className={`group flex items-center text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-[#FF344A] transition-all duration-300 py-3 px-4 rounded-xl hover:bg-gradient-to-r hover:from-[#FF344A]/5 hover:to-[#FF344A]/10 transform hover:scale-[1.02] ${
                    isMobileMenuOpen ? 'animate-in slide-in-from-right-2 duration-300' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-2 h-2 bg-[#FF344A] rounded-full mr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {t("nav.home")}
                </Link>
                <Link
                  href="/courses"
                  className={`group flex items-center text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-[#FF344A] transition-all duration-300 py-3 px-4 rounded-xl hover:bg-gradient-to-r hover:from-[#FF344A]/5 hover:to-[#FF344A]/10 transform hover:scale-[1.02] ${
                    isMobileMenuOpen ? 'animate-in slide-in-from-right-2 duration-300 delay-100' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-2 h-2 bg-[#FF344A] rounded-full mr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {t("nav.courses")}
                </Link>
              </div>

              {/* Separator Line */}
              <div className={`border-t border-gray-200 dark:!border-gray-800 ${
                isMobileMenuOpen ? 'animate-in slide-in-from-right-2 duration-300 delay-200' : ''
              }`}></div>

              {/* User Section */}
              {session ? (
                <div className={`space-y-4 ${
                  isMobileMenuOpen ? 'animate-in slide-in-from-right-2 duration-300 delay-300' : ''
                }`}>
                  {/* User Name */}
                  <div className="px-4 py-4 bg-gradient-to-r from-[#FF344A]/10 to-[#FF344A]/5 dark:from-[#FF344A]/20 dark:to-[#FF344A]/10 rounded-xl border border-[#FF344A]/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#FF344A] rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white block">
                          {session.user?.name || t("nav.dashboard")}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Online</span>
                      </div>
                    </div>
                  </div>

                  {/* User Action Buttons */}
                  <div className="space-y-2">
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-300 transform hover:scale-[1.02] rounded-xl py-3 px-4 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        <Settings className="h-5 w-5 mr-3 text-gray-500" />
                        <span className="text-base font-medium">{t("nav.dashboard")}</span>
                      </Button>
                    </Link>
                    <Link href="/dashboard/profile" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-300 transform hover:scale-[1.02] rounded-xl py-3 px-4 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        <User className="h-5 w-5 mr-3 text-gray-500" />
                        <span className="text-base font-medium">{t("nav.profile")}</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleSignOut()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full justify-start hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 transition-all duration-300 transform hover:scale-[1.02] rounded-xl py-3 px-4 text-red-600 hover:text-red-700"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      <span className="text-base font-medium">{t("nav.logout")}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={`space-y-4 ${
                  isMobileMenuOpen ? 'animate-in slide-in-from-right-2 duration-300 delay-300' : ''
                }`}>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full border-2 border-[#FF344A] text-[#FF344A] hover:bg-[#FF344A] hover:text-white bg-transparent transition-all duration-300 transform hover:scale-105 rounded-xl py-4 text-lg font-semibold"
                    >
                      {t("nav.login")}
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      className="w-full bg-[#FF344A] hover:bg-[#E02A3C] text-white transition-all duration-300 transform hover:scale-105 rounded-xl py-4 text-lg font-semibold shadow-lg"
                    >
                      {t("nav.register")}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Theme Button - Bottom */}
              <div className={`pt-6 border-t border-gray-200 dark:!border-gray-800 ${
                isMobileMenuOpen ? 'animate-in slide-in-from-right-2 duration-300 delay-400' : ''
              }`}>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="w-full justify-center hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-300 transform hover:scale-[1.02] rounded-xl py-4 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <div className="flex items-center space-x-3">
                    {theme === "light" ? (
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                        <Moon className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Sun className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <span className="text-base font-medium">
                      {theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                    </span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

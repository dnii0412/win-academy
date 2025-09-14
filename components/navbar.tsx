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
      className="border-b border-border/50 sticky top-0 z-50 transition-all duration-300 overflow-x-hidden relative bg-background/95 backdrop-blur-md shadow-sm"
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
                className="text-foreground hover:text-[#FF344A] transition-colors duration-200 font-medium"
              >
                {t("nav.home")}
              </Link>
              <Link
                href="/courses"
                className="text-foreground hover:text-[#FF344A] transition-colors duration-200 font-medium"
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
              className="hover:bg-accent transition-colors duration-200"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hover:bg-accent transition-colors duration-200">
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
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="hover:bg-accent transition-colors duration-200 relative z-50"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div 
            className="block md:hidden fixed top-20 left-4 right-4 z-[9999] bg-red-500 border-4 border-yellow-400 shadow-2xl min-h-[300px] rounded-lg"
          >
            <div className="px-4 py-6">
            {/* Mobile Menu Content */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Link
                  href="/"
                  className="block text-lg font-medium text-foreground hover:text-[#FF344A] transition-colors duration-200 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t("nav.home")}
                </Link>
                <Link
                  href="/courses"
                  className="block text-lg font-medium text-foreground hover:text-[#FF344A] transition-colors duration-200 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t("nav.courses")}
                </Link>
              </div>

              <div className="space-y-4 pt-6 border-t border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="w-full justify-center hover:bg-accent transition-colors duration-200"
                >
                  {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <span className="sr-only">Toggle theme</span>
                </Button>

                {/* Language Switcher - positioned after theme button */}
               

                {/* Mobile menu authentication buttons */}
                {session ? (
                  <div className="space-y-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-center hover:bg-accent transition-colors duration-200"
                        >
                          <User className="h-4 w-4 mr-2" />
                          {session.user?.name || t("nav.dashboard")}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-full">
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                            <Settings className="mr-2 h-4 w-4" />
                            {t("nav.dashboard")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/profile" onClick={() => setIsMobileMenuOpen(false)}>
                            <User className="mr-2 h-4 w-4" />
                            {t("nav.profile")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          handleSignOut()
                          setIsMobileMenuOpen(false)
                        }}>
                          <LogOut className="mr-2 h-4 w-4" />
                          {t("nav.logout")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link href="/login" className="block">
                      <Button
                        variant="outline"
                        className="w-full border-[#FF344A] text-[#FF344A] hover:bg-[#FF344A] hover:text-white bg-transparent transition-colors duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t("nav.login")}
                      </Button>
                    </Link>

                    <Link href="/register" className="block">
                      <Button
                        className="w-full bg-[#FF344A] hover:bg-[#E02A3C] text-white transition-colors duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t("nav.register")}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

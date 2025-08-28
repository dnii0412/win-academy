"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Menu, X, User, LogOut } from "lucide-react"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useLanguage } from "@/contexts/language-context"
import Logo from "./logo"
import LanguageSwitcher from "./language-switcher"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { currentLanguage, setLanguage, t } = useLanguage()
  const pathname = usePathname()
  const { data: session, status } = useSession()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Debug mobile menu state changes
  useEffect(() => {
    console.log("Mobile menu state changed to:", isMobileMenuOpen)
  }, [isMobileMenuOpen])

  const toggleMobileMenu = () => {
    console.log("Toggle mobile menu clicked, current state:", isMobileMenuOpen)
    setIsMobileMenuOpen(!isMobileMenuOpen)
    console.log("New state will be:", !isMobileMenuOpen)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  // Hide navbar on dashboard pages - moved after all hooks
  if (pathname?.startsWith('/dashboard')) {
    return null
  }

  if (!mounted) {
    return null
  }

  return (
    <nav
      className={`bg-background border-b border-border sticky top-0 z-50 transition-all duration-300 ${isScrolled ? "backdrop-blur-md bg-background/90 shadow-md" : ""}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? "h-14" : "h-16"}`}
        >
          {/* Left - Logo */}
          <div className="flex items-center">
            <Logo size="md" showText={false} />
          </div>

          {/* Center - Navigation Links (hidden on mobile) */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-muted-foreground hover:text-[#E10600] font-medium transition-colors">
              {currentLanguage === "mn" ? "Нүүр" : "Home"}
            </Link>
            <Link href="/courses" className="text-muted-foreground hover:text-[#E10600] font-medium transition-colors">
              {currentLanguage === "mn" ? "Сургалтууд" : "Courses"}
            </Link>
          </div>

          {/* Right - Desktop Icons and Mobile Burger Menu */}
          <div className="flex items-center space-x-4">
            {/* Desktop Icons - hidden on mobile/tablet */}
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSwitcher
                currentLanguage={currentLanguage}
                onLanguageChange={setLanguage}
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="hover:bg-accent"
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Show different content based on authentication status */}
              {status === "loading" ? (
                <div className="w-20 h-9 bg-muted animate-pulse rounded-md" />
              ) : session ? (
                <div className="flex items-center space-x-3">
                  <Link href="/dashboard">
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{session.user?.name || session.user?.email}</span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {currentLanguage === "mn" ? "Гарах" : "Logout"}
                    </span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white bg-transparent"
                    >
                      {currentLanguage === "mn" ? "Нэвтрэх" : "Login"}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-[#E10600] hover:bg-[#C70500] text-white">
                      {currentLanguage === "mn" ? "Бүртгүүлэх" : "Register"}
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Burger Menu Button - visible only on mobile/tablet */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="hover:bg-accent"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Toggle mobile menu</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`md:hidden fixed inset-0 z-[999999] transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Slide-out Menu from Right */}
        <div className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-background border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Logo size="md" showText={false} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:bg-accent transition-colors duration-200"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close mobile menu</span>
              </Button>
            </div>

            {/* Mobile Menu Content */}
            <div className="flex-1 flex flex-col p-4 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <Link
                  href="/"
                  className="block text-lg font-medium text-foreground hover:text-[#E10600] transition-colors duration-200 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {currentLanguage === "mn" ? "Нүүр" : "Home"}
                </Link>
                <Link
                  href="/courses"
                  className="block text-lg font-medium text-foreground hover:text-[#E10600] transition-colors duration-200 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {currentLanguage === "mn" ? "Сургалтууд" : "Courses"}
                </Link>
              </div>

              <div className="space-y-4 pt-6 border-t border-border">
                <div className="flex items-center justify-center">
                  <LanguageSwitcher
                    currentLanguage={currentLanguage}
                    onLanguageChange={setLanguage}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="w-full justify-center hover:bg-accent transition-colors duration-200"
                >
                  {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <span className="sr-only">Toggle theme</span>
                </Button>

                {/* Mobile menu authentication buttons */}
                {session ? (
                  <div className="space-y-3">
                    <Link href="/dashboard" className="block">
                      <Button
                        variant="ghost"
                        className="w-full justify-center hover:bg-accent transition-colors duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        {currentLanguage === "mn" ? "Хяналтын самбар" : "Dashboard"}
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white transition-all duration-200"
                      onClick={() => {
                        handleSignOut()
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {currentLanguage === "mn" ? "Гарах" : "Logout"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link href="/login" className="block">
                      <Button
                        variant="outline"
                        className="w-full border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white bg-transparent transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {currentLanguage === "mn" ? "Нэвтрэх" : "Login"}
                      </Button>
                    </Link>

                    <Link href="/register" className="block">
                      <Button
                        className="w-full bg-[#E10600] hover:bg-[#C70500] text-white transition-colors duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {currentLanguage === "mn" ? "Бүртгүүлэх" : "Register"}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

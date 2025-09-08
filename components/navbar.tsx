"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Menu, X, User, LogOut, Settings } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Logo from "./logo"
import LanguageSwitcher from "./language-switcher"
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

  // Don't hide navbar on dashboard pages anymore - let them have their own navigation
  // if (pathname?.startsWith('/dashboard')) {
  //   return null
  // }

  if (!mounted) {
    return null
  }

  return (
    <nav
      className={`border-b border-border sticky top-0 z-50 transition-all duration-300 overflow-x-hidden relative ${isScrolled
        ? "bg-background/80 backdrop-blur-md shadow-lg border-border/50"
        : "bg-background"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div
          className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? "h-14" : "h-16"
            }`}
        >
          {/* Left - Logo and Navigation Links */}
          <div className="flex items-center space-x-8">
            <Logo size="md" showText={false} />

            {/* Navigation Links - closer to logo */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="text-foreground hover:text-[#E10600] transition-colors duration-200 font-medium"
              >
                {t("nav.home")}
              </Link>
              <Link
                href="/courses"
                className="text-foreground hover:text-[#E10600] transition-colors duration-200 font-medium"
              >
                {t("nav.courses")}
              </Link>
            </div>
          </div>

          {/* Right - User Controls - more gathered and left-sided */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Language Switcher */}
            <LanguageSwitcher />

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
                  <Button variant="outline" className="border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white transition-colors duration-200">
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-[#E10600] hover:bg-[#C70500] text-white transition-colors duration-200">
                    {t("nav.register")}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="hover:bg-accent transition-colors duration-200"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open mobile menu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="block lg:hidden fixed top-16 left-0 right-0 z-[9999] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="px-4 py-6">
            {/* Mobile Menu Content */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Link
                  href="/"
                  className="block text-lg font-medium text-foreground hover:text-[#E10600] transition-colors duration-200 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t("nav.home")}
                </Link>
                <Link
                  href="/courses"
                  className="block text-lg font-medium text-foreground hover:text-[#E10600] transition-colors duration-200 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t("nav.courses")}
                </Link>
              </div>

              <div className="space-y-4 pt-6 border-t border-border">
                {/* Language Switcher */}
                <div className="flex justify-center">
                  <LanguageSwitcher className="w-full justify-center" />
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
                        className="w-full border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white bg-transparent transition-colors duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t("nav.login")}
                      </Button>
                    </Link>

                    <Link href="/register" className="block">
                      <Button
                        className="w-full bg-[#E10600] hover:bg-[#C70500] text-white transition-colors duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t("nav.register")}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>``
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

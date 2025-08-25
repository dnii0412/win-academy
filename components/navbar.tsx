"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <nav
      className={`bg-background border-b border-border sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "backdrop-blur-md bg-background/90 shadow-md" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex justify-between items-center transition-all duration-300 ${isScrolled ? "h-14" : "h-16"}`}
        >
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#E10600] rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="text-xl font-bold text-foreground">Win Academy</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/courses" className="text-muted-foreground hover:text-[#E10600] font-medium transition-colors">
              Courses
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-[#E10600] font-medium transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-[#E10600] font-medium transition-colors">
              Contact
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="hover:bg-accent"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>

            <Link href="/login">
              <Button
                variant="outline"
                className="border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white bg-transparent"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-[#E10600] hover:bg-[#C70500] text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

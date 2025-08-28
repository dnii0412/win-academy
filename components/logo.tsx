"use client"

import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export default function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use a default logo until the component is mounted to prevent hydration mismatch
  const logoSrc = mounted && (resolvedTheme === "dark" || theme === "dark")
    ? "/images/win_logo_dark_default.jpg"
    : "/images/win_logo_white.jpg"

  const logoAlt = "WIN Academy Logo"

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  }

  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl"
  }

  return (
    <Link href="/" className={`flex items-center space-x-2 ${className}`}>
      <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
        <Image
          src={logoSrc}
          alt={logoAlt}
          fill
          className="object-contain rounded-lg"
          priority
        />
      </div>
      {showText && (
        <span className={`font-bold text-foreground ${textSizes[size]}`}>
          WIN Academy
        </span>
      )}
    </Link>
  )
}

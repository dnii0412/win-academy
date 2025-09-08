"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, ChevronDown, Check } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { type Language } from "@/lib/languages"
import { useRouter, useSearchParams } from "next/navigation"

interface LanguageSwitcherProps {
  className?: string
}

export default function LanguageSwitcher({
  className = ""
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { currentLanguage, setLanguage, languages } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Set cookie helper
  const setCookie = (name: string, value: string, days: number = 365) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
  }

  // Get cookie helper
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
  }

  // Initialize language from URL or cookie on mount
  useEffect(() => {
    const urlLang = searchParams.get('lang') as Language
    const cookieLang = getCookie('language') as Language
    
    if (urlLang && languages[urlLang]) {
      setLanguage(urlLang)
      setCookie('language', urlLang)
    } else if (cookieLang && languages[cookieLang]) {
      setLanguage(cookieLang)
    }
  }, [searchParams, setLanguage, languages])

  const handleLanguageSelect = (language: Language) => {
    setLanguage(language)
    setCookie('language', language)
    setIsOpen(false)
    
    // Update URL with language parameter
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('lang', language)
    router.replace(`?${newSearchParams.toString()}`, { scroll: false })
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`hover:bg-accent flex items-center space-x-2 px-3 ${className}`}
          aria-label="Switch language"
        >
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {Object.entries(languages).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageSelect(code as Language)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{name}</span>
            {currentLanguage === code && (
              <Check className="h-4 w-4 text-[#E10600]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, ChevronDown, Check } from "lucide-react"
import { languages, type Language } from "@/lib/languages"

interface LanguageSwitcherProps {
  currentLanguage: Language
  onLanguageChange: (language: Language) => void
  className?: string
}

export default function LanguageSwitcher({
  currentLanguage,
  onLanguageChange,
  className = ""
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageSelect = (language: Language) => {
    onLanguageChange(language)
    setIsOpen(false)
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

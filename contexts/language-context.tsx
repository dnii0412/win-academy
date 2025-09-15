"use client"

import { createContext, useContext, ReactNode } from "react"
import { Language, translations, languages } from "@/lib/languages"

interface LanguageContextType {
  currentLanguage: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
  languages: typeof languages
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always use Mongolian - no language switching
  const currentLanguage: Language = "mn"

  const setLanguage = (language: Language) => {
    // No-op since we always use Mongolian
    console.log("Language switching is disabled - always using Mongolian")
  }

  const t = (key: string): string => {
    // Always use Mongolian translations
    const keys = key.split(".")
    let value: any = translations["mn"]

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }

    return typeof value === "string" ? value : key
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

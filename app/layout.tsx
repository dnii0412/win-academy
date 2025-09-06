import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import AuthSessionProvider from "@/components/session-provider"
import { LanguageProvider } from "@/contexts/language-context"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import "./globals.css"
import "./admin-hide.css"

// Add custom CSS for rounded favicon
const roundedFaviconCSS = `
  <style>
    link[rel="icon"], link[rel="shortcut icon"] {
      border-radius: 50% !important;
    }
  </style>
`

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="mn" className={`${inter.variable} antialiased`} suppressHydrationWarning>

      <body className="font-sans">
        <AuthSessionProvider>
          <LanguageProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
            </ThemeProvider>
          </LanguageProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}

export const metadata = {
  title: 'WIN Academy',
  description: 'Empower yourself with practical digital skills in marketing, design, and AI. Join Mongolia\'s premier academy for digital professionals.',
  generator: 'v0.app',
  icons: {
    icon: '/images/win_logo_main.jpg',
    shortcut: '/images/win_logo_main.jpg',
    apple: '/images/win_logo_main.jpg',
  },
};

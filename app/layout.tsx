import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import AuthSessionProvider from "@/components/session-provider"
import { LanguageProvider } from "@/contexts/language-context"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import "./globals.css"
import "./admin-hide.css"
import type { Metadata } from 'next'

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: 'WIN Academy - Digital Skills Training in Mongolia',
    template: '%s | WIN Academy'
  },
  description: 'Empower yourself with practical digital skills in marketing, design, and AI. Join Mongolia\'s premier academy for digital professionals. Learn from industry experts and advance your career.',
  keywords: [
    'digital marketing',
    'web design',
    'artificial intelligence',
    'programming',
    'Mongolia',
    'online courses',
    'professional development',
    'digital skills',
    'WIN Academy',
    'tech education'
  ],
  authors: [{ name: 'WIN Academy' }],
  creator: 'WIN Academy',
  publisher: 'WIN Academy',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://winacademy.mn'),
  alternates: {
    canonical: '/',
    languages: {
      'mn-MN': '/mn',
      'en-US': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'mn_MN',
    url: 'https://winacademy.mn',
    siteName: 'WIN Academy',
    title: 'WIN Academy - Digital Skills Training in Mongolia',
    description: 'Empower yourself with practical digital skills in marketing, design, and AI. Join Mongolia\'s premier academy for digital professionals.',
    images: [
      {
        url: '/images/win_logo_main.jpg',
        width: 1200,
        height: 630,
        alt: 'WIN Academy - Digital Skills Training',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WIN Academy - Digital Skills Training in Mongolia',
    description: 'Empower yourself with practical digital skills in marketing, design, and AI. Join Mongolia\'s premier academy for digital professionals.',
    images: ['/images/win_logo_main.jpg'],
    creator: '@winacademy',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/images/win_logo_main.jpg', sizes: '32x32', type: 'image/jpeg' },
      { url: '/images/win_logo_main.jpg', sizes: '16x16', type: 'image/jpeg' },
    ],
    shortcut: '/images/win_logo_main.jpg',
    apple: [
      { url: '/images/win_logo_main.jpg', sizes: '180x180', type: 'image/jpeg' },
    ],
  },
  manifest: '/manifest.json',
  category: 'education',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <meta name="theme-color" content="#E10600" />
        <meta name="msapplication-TileColor" content="#E10600" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="font-sans overflow-x-hidden">
        <LanguageProvider>
          <AuthSessionProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
              <div className="min-h-screen flex flex-col overflow-x-hidden">
                <Navbar />
                <main className="flex-1 overflow-x-hidden">
                  {children}
                </main>
                <Footer />
              </div>
            </ThemeProvider>
          </AuthSessionProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}

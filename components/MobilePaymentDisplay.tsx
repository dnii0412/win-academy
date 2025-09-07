'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  CreditCard, 
  ExternalLink, 
  Copy, 
  CheckCircle,
  Banknote,
  Wallet
} from "lucide-react"
import { QRCodeDisplay } from "./QRCodeDisplay"

interface MobilePaymentDisplayProps {
  qrText: string
  qrImage?: string
  urls?: Array<{
    name?: string
    description?: string
    link?: string
  }>
  amount: number
  description: string
  size?: number
  className?: string
}

// Bank app configurations with logos and colors
const BANK_APPS = [
  {
    name: 'QPay Wallet',
    description: 'QPay Wallet',
    identifier: 'qpaywallet://',
    color: 'bg-blue-500',
    icon: Wallet,
    logo: 'https://qpay.mn/q/logo/qpay.png'
  },
  {
    name: 'Most Money',
    description: 'МОСТ мони',
    identifier: 'most://',
    color: 'bg-green-500',
    icon: Banknote,
    logo: 'https://qpay.mn/q/logo/most.png'
  },
  {
    name: 'National Investment Bank',
    description: 'Үндэсний хөрөнгө оруулалтын банк',
    identifier: 'nibank://',
    color: 'bg-red-500',
    icon: CreditCard,
    logo: 'https://qpay.mn/q/logo/nibank.jpeg'
  },
  {
    name: 'Chinggis Khaan Bank',
    description: 'Чингис Хаан банк',
    identifier: 'ckbank://',
    color: 'bg-purple-500',
    icon: CreditCard,
    logo: 'https://qpay.mn/q/logo/ckbank.png'
  },
  {
    name: 'Capitron Bank',
    description: 'Капитрон банк',
    identifier: 'capitronbank://',
    color: 'bg-orange-500',
    icon: CreditCard,
    logo: 'https://qpay.mn/q/logo/capitronbank.png'
  },
  {
    name: 'Bogd Bank',
    description: 'Богд банк',
    identifier: 'bogdbank://',
    color: 'bg-indigo-500',
    icon: CreditCard,
    logo: 'https://qpay.mn/q/logo/bogdbank.png'
  },
  {
    name: 'Trans Bank',
    description: 'Тээвэр хөгжлийн банк',
    identifier: 'transbank://',
    color: 'bg-teal-500',
    icon: CreditCard,
    logo: 'https://qpay.mn/q/logo/transbank.png'
  },
  {
    name: 'M Bank',
    description: 'М банк',
    identifier: 'mbank://',
    color: 'bg-pink-500',
    icon: CreditCard,
    logo: 'https://qpay.mn/q/logo/mbank.png'
  },
  {
    name: 'Ard App',
    description: 'Ард Апп',
    identifier: 'ard://',
    color: 'bg-cyan-500',
    icon: Smartphone,
    logo: 'https://qpay.mn/q/logo/ardapp.png'
  },
  {
    name: 'Toki App',
    description: 'Toki App',
    identifier: 'toki://',
    color: 'bg-yellow-500',
    icon: Smartphone,
    logo: 'https://qpay.mn/q/logo/toki.png'
  },
  {
    name: 'Arig Bank',
    description: 'Ариг банк',
    identifier: 'arig://',
    color: 'bg-emerald-500',
    icon: CreditCard,
    logo: 'https://qpay.mn/q/logo/arig.png'
  },
  {
    name: 'Monpay',
    description: 'Мон Пэй',
    identifier: 'Monpay://',
    color: 'bg-lime-500',
    icon: Wallet,
    logo: 'https://qpay.mn/q/logo/monpay.png'
  }
]

export function MobilePaymentDisplay({ 
  qrText, 
  qrImage, 
  urls = [], 
  amount, 
  description, 
  size = 200, 
  className = '' 
}: MobilePaymentDisplayProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleBankAppClick = (url: string, appName: string) => {
    console.log(`Opening ${appName} with URL:`, url)
    window.location.href = url
  }

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  // Get all bank apps from QPay URLs
  const availableBankApps = urls
    .filter(url => url.link && url.link.includes('://'))
    .map(url => {
      const bankApp = BANK_APPS.find(app => url.link?.startsWith(app.identifier))
      return bankApp ? { 
        ...bankApp, 
        url: url.link,
        logo: url.name ? `https://qpay.mn/q/logo/${url.name.toLowerCase().replace(/\s+/g, '')}.png` : bankApp.logo
      } : null
    })
    .filter((app): app is NonNullable<typeof app> => app !== null)

  // Get bank apps from qrText as fallback
  const qrBankApps = qrText ? BANK_APPS.filter(app => qrText.includes(app.identifier)) : []

  // Combine both sources and remove duplicates
  const allBankApps = [
    ...availableBankApps,
    ...qrBankApps.map(app => ({ ...app, url: qrText }))
  ].filter((app, index, self) => 
    index === self.findIndex(a => a.identifier === app.identifier)
  )

  // If no bank apps found from QPay, show all available bank apps
  const displayBankApps = allBankApps.length > 0 ? allBankApps : BANK_APPS.map(app => ({ ...app, url: qrText }))

  if (isMobile && displayBankApps.length > 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Smartphone className="w-5 h-5" />
              Pay with Bank App
            </CardTitle>
            <p className="text-sm text-gray-600">
              Tap on your bank app to pay directly
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center mb-4">
              <p className="text-2xl font-bold">₮{amount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {displayBankApps.map((app, index) => {
                const IconComponent = app.icon
                return (
                  <Button
                    key={`${app.identifier}-${index}`}
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-gray-50"
                    onClick={() => handleBankAppClick(app.url || '', app.name)}
                  >
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                      <img 
                        src={app.logo} 
                        alt={app.name}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          // Fallback to icon if logo fails to load
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            const icon = document.createElement('div')
                            icon.className = `w-6 h-6 rounded-full ${app.color} flex items-center justify-center`
                            const iconComponent = document.createElement('div')
                            iconComponent.className = 'w-4 h-4 text-white'
                            icon.appendChild(iconComponent)
                            parent.appendChild(icon)
                          }
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium leading-tight">{app.name}</p>
                      <p className="text-xs text-gray-500 leading-tight">{app.description}</p>
                    </div>
                  </Button>
                )
              })}
            </div>


            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 text-center mb-2">
                Don't have these apps? Use QR code below
              </p>
              <details className="text-center">
                <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                  Show QR Code
                </summary>
                <div className="mt-2">
                  <QRCodeDisplay 
                    qrText={qrText}
                    qrImage={qrImage}
                    size={150}
                  />
                </div>
              </details>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Desktop view - show QR code
  return (
    <div className={className}>
      <QRCodeDisplay 
        qrText={qrText}
        qrImage={qrImage}
        size={size}
      />
    </div>
  )
}

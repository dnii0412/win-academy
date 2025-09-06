'use client'
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface QRCodeDisplayProps {
  qrText: string
  qrImage?: string
  size?: number
  className?: string
}

export function QRCodeDisplay({ qrText, qrImage, size = 200, className = '' }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!qrText || !canvasRef.current) return

    const generateQR = async () => {
      try {
        setError(null)
        await QRCode.toCanvas(canvasRef.current, qrText, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        })
      } catch (err) {
        console.error('Failed to generate QR code:', err)
        setError('Failed to generate QR code')
      }
    }

    generateQR()
  }, [qrText, size])

  // If we have a QPay-provided QR image, try to use that first
  if (qrImage && !error) {
    return (
      <div className={`inline-block p-4 bg-white rounded-lg border-2 border-gray-200 ${className}`}>
        <img 
          src={qrImage.startsWith('data:') ? qrImage : `data:image/png;base64,${qrImage}`} 
          alt="QPay QR Code" 
          className="mx-auto"
          style={{ width: size, height: size }}
          onError={(e) => {
            console.error('QPay QR image failed to load, falling back to generated QR:', e)
            setError('QPay QR image failed to load')
          }}
        />
      </div>
    )
  }

  // Fallback to generated QR code
  return (
    <div className={`inline-block p-4 bg-white rounded-lg border-2 border-gray-200 ${className}`}>
      {error ? (
        <div className="flex items-center justify-center" style={{ width: size, height: size }}>
          <div className="text-center">
            <p className="text-sm text-red-600 mb-2">QR Code Error</p>
            <p className="text-xs text-gray-500 mb-2">QR Text: {qrText.substring(0, 50)}...</p>
            <div className="p-2 bg-gray-100 rounded text-xs font-mono break-all">
              {qrText}
            </div>
          </div>
        </div>
      ) : (
        <canvas 
          ref={canvasRef}
          style={{ width: size, height: size }}
          className="mx-auto"
        />
      )}
    </div>
  )
}

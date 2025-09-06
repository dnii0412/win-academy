"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2
} from "lucide-react"

interface ImageUploadProps {
  onUploadSuccess: (url: string, publicId: string) => void
  onUploadError?: (error: string) => void
  onDelete?: (publicId: string) => void
  currentImageUrl?: string
  currentPublicId?: string
  folder?: string
  maxSizeInMB?: number
  acceptedFormats?: string[]
  className?: string
  disabled?: boolean
}

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export default function ImageUpload({
  onUploadSuccess,
  onUploadError,
  onDelete,
  currentImageUrl,
  currentPublicId,
  folder = "course-thumbnails",
  maxSizeInMB = 10,
  acceptedFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
  className = "",
  disabled = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return "Зөвшөөрөгдсөн файлын төрөл: JPEG, PNG, WebP, GIF"
    }

    // Check file size
    const maxSizeBytes = maxSizeInMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `Файлын хэмжээ ${maxSizeInMB}MB-аас их байж болохгүй`
    }

    return null
  }

  const uploadViaServerAPI = async (file: File, folder: string, adminToken: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (!prev) return null
        const newPercentage = Math.min(prev.percentage + 10, 90)
        return { ...prev, percentage: newPercentage }
      })
    }, 200)

    try {
      const headers: HeadersInit = {}
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`
      }

      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        headers,
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Upload failed (${response.status})`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      setPreviewUrl(result.data.secure_url)
      onUploadSuccess(result.data.secure_url, result.data.public_id)
      setUploadProgress({ loaded: file.size, total: file.size, percentage: 100 })
    } catch (error) {
      clearInterval(progressInterval)
      throw error
    }
  }

  const uploadDirectToCloudinary = async (file: File, folder: string) => {
    // For client-side, we need NEXT_PUBLIC_ prefix, but let's check what's available
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    if (!cloudName) {
      throw new Error('Cloudinary cloud name not configured. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to .env.local')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'win-academy-uploads') // Use our custom preset
    formData.append('folder', folder)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // If preset not found, try with a different approach
      if (response.status === 400 && errorData.error?.message?.includes('preset')) {
        console.log('Upload preset not found, trying alternative method...')
        throw new Error('Upload preset not configured. Please check Cloudinary setup or contact admin.')
      }
      
      throw new Error(errorData.error?.message || `Direct upload failed (${response.status})`)
    }

    const result = await response.json()

    setPreviewUrl(result.secure_url)
    onUploadSuccess(result.secure_url, result.public_id)
    setUploadProgress({ loaded: file.size, total: file.size, percentage: 100 })
  }

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      onUploadError?.(validationError)
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0 })

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Get admin token for authentication
      const adminToken = localStorage.getItem("adminToken")
      const isDevelopment = process.env.NODE_ENV === 'development'
      
      if (!adminToken && !isDevelopment) {
        throw new Error("Admin authentication required. Please log in as admin first.")
      }

      // Use server-side upload API (more reliable)
      console.log('Using server-side upload API...')
      if (adminToken) {
        await uploadViaServerAPI(file, folder, adminToken)
      } else {
        // Try without token in development mode
        console.log('⚠️ Development mode: Attempting upload without admin token')
        await uploadViaServerAPI(file, folder, '')
      }

    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Upload failed'

      // Provide helpful error messages
      if (errorMessage.includes('not configured')) {
        errorMessage = "Cloudinary тохиргоо дутуу байна. .env.local файлд CLOUDINARY хувьсагчдыг нэмнэ үү"
      } else if (errorMessage.includes('Authentication required') || errorMessage.includes('Unauthorized')) {
        errorMessage = "Админ эрхээр нэвтэрч орно уу"
      }

      setError(errorMessage)
      onUploadError?.(errorMessage)
      setPreviewUrl(currentImageUrl || null)
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(null), 2000)
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    uploadFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    if (disabled) return

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [disabled])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setDragActive(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleDelete = async () => {
    if (!currentPublicId || !onDelete) return

    try {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("Нэвтэрч орох шаардлагатай")
      }

      const response = await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ publicId: currentPublicId }),
      })

      const result = await response.json()

      if (result.success) {
        setPreviewUrl(null)
        onDelete(currentPublicId)
      } else {
        throw new Error(result.error || 'Delete failed')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed'
      setError(errorMessage)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card className={`
        border-2 border-dashed transition-colors duration-200
        ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
      `}>
        <CardContent
          className="p-6"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />

          <div className="text-center">
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Илгээж байна...
                  </p>
                  {uploadProgress && (
                    <div className="space-y-1">
                      <Progress value={uploadProgress.percentage} className="w-full" />
                      <p className="text-xs text-gray-500">
                        {Math.round(uploadProgress.percentage)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : previewUrl ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-48 rounded-lg shadow-md"
                  />
                  <div className="absolute -top-2 -right-2 flex gap-1">
                    {onDelete && currentPublicId && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-8 h-8 rounded-full p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete()
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-8 h-8 rounded-full p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Шинэ зураг илгээхийн тулд дээр дарна уу
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-700">
                    Зураг илгээх
                  </p>
                  <p className="text-sm text-gray-500">
                    Файл сонгоно уу эсвэл энд чирэн оруулна уу
                  </p>
                  <p className="text-xs text-gray-400">
                    JPEG, PNG, WebP, GIF (хамгийн ихдээ ${maxSizeInMB}MB)
                  </p>
                </div>
                <Button type="button" variant="outline" disabled={disabled}>
                  <Upload className="w-4 h-4 mr-2" />
                  Файл сонгох
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {error.includes('not configured') && (
              <div className="mt-2 text-sm">
                <p className="font-medium">Quick Fix:</p>
                <ol className="list-decimal list-inside space-y-1 mt-1">
                  <li>Get free Cloudinary account at cloudinary.com</li>
                  <li>Copy your Cloud Name, API Key, and API Secret</li>
                  <li>Add them to your .env.local file</li>
                  <li>Restart the server (npm run dev)</li>
                </ol>
                <p className="mt-2 text-xs opacity-75">
                  See CLOUDINARY_QUICK_SETUP.md for detailed instructions
                </p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {uploadProgress?.percentage === 100 && !error && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Зураг амжилттай илгээлээ!
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

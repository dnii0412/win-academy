"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Video, X, CheckCircle, AlertCircle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { BUNNY_STREAM_CONFIG } from "@/lib/bunny-stream"

interface TUSUploaderProps {
  onUploadComplete: (videoId: string, videoUrl: string) => void
  onClose: () => void
}

interface UploadProgress {
  bytesUploaded: number
  bytesTotal: number
  percentage: number
}

export default function TUSUploader({ onUploadComplete, onClose }: TUSUploaderProps) {
  const { currentLanguage } = useLanguage()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    bytesUploaded: 0,
    bytesTotal: 0,
    percentage: 0
  })
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [videoDescription, setVideoDescription] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<any>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('video/')) {
        setErrorMessage(currentLanguage === "mn" ? "Зөвхөн видео файл сонгоно уу" : "Please select a video file")
        return
      }
      
      if (file.size > 2 * 1024 * 1024 * 1024) { // 2GB limit
        setErrorMessage(currentLanguage === "mn" ? "Файлын хэмжээ 2GB-аас бага байх ёстой" : "File size must be less than 2GB")
        return
      }
      
      setErrorMessage('')
      setUploadProgress({
        bytesUploaded: 0,
        bytesTotal: file.size,
        percentage: 0
      })
    }
  }, [currentLanguage])

  const createVideoEntry = async (title: string, description: string) => {
    try {
      const response = await fetch(`${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos`, {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.guid
      } else {
        throw new Error('Failed to create video entry')
      }
    } catch (error) {
      console.error('Error creating video entry:', error)
      throw error
    }
  }

  const startUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file || !videoTitle.trim()) {
      setErrorMessage(currentLanguage === "mn" ? "Файл болон нэр оруулна уу" : "Please select a file and enter a title")
      return
    }

    try {
      setIsUploading(true)
      setUploadStatus('uploading')
      setErrorMessage('')

      // Create video entry first
      const videoId = await createVideoEntry(videoTitle, videoDescription)
      
      // Initialize TUS upload
      const tus = (window as any).tus
      if (!tus) {
        throw new Error('TUS library not loaded')
      }

      const upload = new tus.Upload(file, {
        endpoint: BUNNY_STREAM_CONFIG.uploadUrl,
        retryDelays: [0, 1000, 3000, 5000],
        metadata: {
          filename: file.name,
          filetype: file.type,
          videoid: videoId
        },
        headers: {
          'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
          'LibraryId': BUNNY_STREAM_CONFIG.libraryId
        },
        onError: (error: any) => {
          console.error('Upload error:', error)
          setUploadStatus('error')
          setErrorMessage(error.message || 'Upload failed')
          setIsUploading(false)
        },
        onProgress: (bytesUploaded: number, bytesTotal: number) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100)
          setUploadProgress({
            bytesUploaded,
            bytesTotal,
            percentage
          })
        },
        onSuccess: () => {
          setUploadStatus('success')
          setIsUploading(false)
          
          // Get the video URL
          const videoUrl = getBunnyStreamUrl(videoId)
          onUploadComplete(videoId, videoUrl)
          
          // Close after a short delay
          setTimeout(() => {
            onClose()
          }, 2000)
        }
      })

      uploadRef.current = upload
      upload.start()
    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      setErrorMessage(error.message || 'Upload failed')
      setIsUploading(false)
    }
  }

  const cancelUpload = () => {
    if (uploadRef.current) {
      uploadRef.current.abort()
      setIsUploading(false)
      setUploadStatus('idle')
    }
  }

  const getBunnyStreamUrl = (videoId: string) => {
    return `${BUNNY_STREAM_CONFIG.streamUrl}/${BUNNY_STREAM_CONFIG.libraryId}/${videoId}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentLanguage === "mn" ? "Видео байршуулах" : "Upload Video"}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Video Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  {currentLanguage === "mn" ? "Видео мэдээлэл" : "Video Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="videoTitle">
                    {currentLanguage === "mn" ? "Видео нэр" : "Video Title"}
                  </Label>
                  <Input
                    id="videoTitle"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder={currentLanguage === "mn" ? "Видео нэр оруулна уу" : "Enter video title"}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="videoDescription">
                    {currentLanguage === "mn" ? "Тайлбар" : "Description"}
                  </Label>
                  <Input
                    id="videoDescription"
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    placeholder={currentLanguage === "mn" ? "Видео тайлбар (сонгох)" : "Video description (optional)"}
                  />
                </div>
              </CardContent>
            </Card>

            {/* File Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  {currentLanguage === "mn" ? "Файл сонгох" : "Select File"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentLanguage === "mn" 
                      ? "Дэмжигдэх формат: MP4, MOV, AVI, MKV. Хамгийн их хэмжээ: 2GB"
                      : "Supported formats: MP4, MOV, AVI, MKV. Maximum size: 2GB"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Upload Progress */}
            {uploadStatus === 'uploading' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 animate-pulse" />
                    {currentLanguage === "mn" ? "Байршуулж байна..." : "Uploading..."}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={uploadProgress.percentage} className="w-full" />
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{formatFileSize(uploadProgress.bytesUploaded)}</span>
                    <span>{uploadProgress.percentage}%</span>
                    <span>{formatFileSize(uploadProgress.bytesTotal)}</span>
                  </div>
                  <Button onClick={cancelUpload} variant="outline" className="w-full">
                    {currentLanguage === "mn" ? "Цуцлах" : "Cancel Upload"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Success Message */}
            {uploadStatus === 'success' && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-green-800 dark:text-green-200">
                    <CheckCircle className="h-6 w-6" />
                    <span className="font-medium">
                      {currentLanguage === "mn" ? "Видео амжилттай байршигдлаа!" : "Video uploaded successfully!"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Message */}
            {errorMessage && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
                    <AlertCircle className="h-6 w-6" />
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                {currentLanguage === "mn" ? "Цуцлах" : "Cancel"}
              </Button>
              <Button
                onClick={startUpload}
                disabled={isUploading || !fileInputRef.current?.files?.[0] || !videoTitle.trim()}
                className="min-w-[120px]"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    {currentLanguage === "mn" ? "Байршуулж байна..." : "Uploading..."}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {currentLanguage === "mn" ? "Байршуулах" : "Upload"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

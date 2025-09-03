"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Video, X, CheckCircle, AlertCircle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"



import { BUNNY_STREAM_CONFIG, getBunnyVideoUrl } from "@/lib/bunny-stream"


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
      
      if (file.size > 10 * 1024 * 1024 * 1024) { // 2GB limit
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
      // Get admin token for authentication
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error('No admin token found. Please log in again.')
      }

      console.log('Creating video entry with config:', {
        libraryId: BUNNY_STREAM_CONFIG.libraryId,
        apiKey: BUNNY_STREAM_CONFIG.apiKey.substring(0, 8) + '...',
        baseUrl: BUNNY_STREAM_CONFIG.baseUrl
      })

      const response = await fetch(`${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos`, {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title,
          description
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Video entry created:', data)
        return data.guid
      } else {
        const errorText = await response.text()
        console.error('Failed to create video entry:', response.status, errorText)
        throw new Error(`Failed to create video entry: ${response.status} ${errorText}`)
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
      
      // Use TUS upload through our API with proper JSON format
      const uploadData = {
        fileSize: file.size,
        filename: file.name,
        contentType: file.type,
        title: videoTitle,
        description: videoDescription
      }
      
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100)
          setUploadProgress({
            bytesUploaded: event.loaded,
            bytesTotal: event.total,
            percentage
          })
        }
      })
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.success && response.uploadUrl && response.videoId) {
              console.log('✅ TUS initialized, starting file upload...', response)
              
              // Now upload the actual file using TUS protocol
              uploadFileWithTUS(file, response.uploadUrl, response.videoId)
            } else {
              setUploadStatus('error')
              setErrorMessage(response.error || 'TUS initialization failed')
              setIsUploading(false)
            }
          } catch (e) {
            setUploadStatus('error')
            setErrorMessage('Invalid response from server')
            setIsUploading(false)
          }
        } else {
          setUploadStatus('error')
          setErrorMessage(`TUS initialization failed: ${xhr.status} ${xhr.statusText}`)
          setIsUploading(false)
        }
      })
      
      xhr.addEventListener('error', () => {
        setUploadStatus('error')
        setErrorMessage('Upload failed due to network error')
        setIsUploading(false)
      })
      
      xhr.addEventListener('abort', () => {
        setUploadStatus('idle')
        setIsUploading(false)
      })
      
      // Get admin token for authentication
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        setUploadStatus('error')
        setErrorMessage('No admin token found. Please log in again.')
        setIsUploading(false)
        return
      }

      xhr.open('POST', '/api/admin/upload/tus')
      xhr.setRequestHeader('Authorization', `Bearer ${adminToken}`)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.send(JSON.stringify(uploadData))
      
      uploadRef.current = xhr
    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      setErrorMessage(error.message || 'Upload failed')
      setIsUploading(false)
    }
  }

  const uploadFileWithTUS = async (file: File, uploadUrl: string, videoId: string) => {
    try {
      console.log('🚀 Starting TUS file upload...', { fileSize: file.size, uploadUrl })
      
      const chunkSize = 4 * 1024 * 1024 // 4MB chunks
      let offset = 0
      
      while (offset < file.size) {
        const chunk = file.slice(offset, offset + chunkSize)
        const chunkBuffer = await chunk.arrayBuffer()
        
        console.log(`📦 Uploading chunk: ${offset}-${offset + chunk.size} (${chunk.size} bytes)`)
        
        const xhr = new XMLHttpRequest()
        
        // Set up progress tracking for this chunk
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const chunkProgress = (event.loaded / event.total) * 100
            const totalProgress = ((offset + (event.loaded / event.total) * chunk.size) / file.size) * 100
            
            setUploadProgress({
              bytesUploaded: offset + (event.loaded / event.total) * chunk.size,
              bytesTotal: file.size,
              percentage: Math.round(totalProgress)
            })
          }
        })
        
        // Wait for chunk upload to complete
        await new Promise((resolve, reject) => {
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              console.log(`✅ Chunk uploaded successfully: ${offset}-${offset + chunk.size}`)
              resolve(true)
            } else {
              console.error(`❌ Chunk upload failed: ${xhr.status} ${xhr.statusText}`)
              reject(new Error(`Chunk upload failed: ${xhr.status}`))
            }
          })
          
          xhr.addEventListener('error', () => {
            console.error('❌ Chunk upload error')
            reject(new Error('Chunk upload error'))
          })
          
          // Send chunk
          xhr.open('PATCH', uploadUrl)
          xhr.setRequestHeader('Content-Type', 'application/octet-stream')
          xhr.setRequestHeader('Upload-Offset', offset.toString())
          xhr.setRequestHeader('Tus-Resumable', '1.0.0')
          
          const adminToken = localStorage.getItem("adminToken")
          if (adminToken) {
            xhr.setRequestHeader('Authorization', `Bearer ${adminToken}`)
          }
          
          xhr.send(chunkBuffer)
        })
        
        offset += chunk.size
      }
      
      console.log('🎉 File upload completed!')
      setUploadStatus('success')
      setIsUploading(false)
      
      // Get the video URL
      const videoUrl = getBunnyVideoUrl(videoId)
      onUploadComplete(videoId, videoUrl)
      
      // Close after a short delay
      setTimeout(() => {
        onClose()
      }, 2000)
      
    } catch (error) {
      console.error('❌ TUS file upload failed:', error)
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'File upload failed')
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



  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const testBunnyAPI = async () => {
    try {
      setErrorMessage('')
      
      // Get admin token for authentication
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        alert(currentLanguage === "mn" ? "Админ токен олдсонгүй. Дахин нэвтэрнэ үү." : "No admin token found. Please log in again.")
        return
      }

      const response = await fetch(`${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos`, {
        headers: {
          'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Bunny API test successful:', data)
        alert(currentLanguage === "mn" ? "Bunny API холболт амжилттай!" : "Bunny API connection successful!")
      } else {
        const errorText = await response.text()
        console.error('Bunny API test failed:', response.status, errorText)
        alert(currentLanguage === "mn" ? `Bunny API алдаа: ${response.status}` : `Bunny API error: ${response.status}`)
      }
    } catch (error) {
      console.error('Bunny API test error:', error)
      alert(currentLanguage === "mn" ? "Bunny API холболтод алдаа гарлаа" : "Bunny API connection error")
    }
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
            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={testBunnyAPI}>
                {currentLanguage === "mn" ? "API Тест" : "Test API"}
              </Button>
              <div className="flex space-x-3">
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
    </div>
  )
}

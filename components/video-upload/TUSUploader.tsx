"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Video, X, CheckCircle, AlertCircle } from "lucide-react"



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

  // REMOVED: Duplicate video creation - now handled by TUS API

  const createTusUpload = async (file: File, tusHeaders: any): Promise<string | null> => {
    try {
      console.log('🔧 Creating TUS upload session with Bunny...', {
        fileSize: file.size,
        fileName: file.name,
        tusHeaders: {
          ...tusHeaders,
          authorizationSignature: tusHeaders?.authorizationSignature?.substring(0, 16) + '...'
        }
      })

      const response = await fetch('https://video.bunnycdn.com/tusupload', {
        method: 'POST',
        headers: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': file.size.toString(),
          'Upload-Metadata': `filename ${btoa(file.name)},filetype ${btoa(file.type)}`,
          'AuthorizationSignature': tusHeaders.authorizationSignature,
          'AuthorizationExpire': tusHeaders.authorizationExpire.toString(),
          'LibraryId': tusHeaders.libraryId,
          'VideoId': tusHeaders.videoId,
          'Content-Type': 'application/octet-stream'
        }
      })

      console.log('📡 TUS creation response:', {
        status: response.status,
        statusText: response.statusText,
        location: response.headers.get('Location'),
        tusResumable: response.headers.get('Tus-Resumable')
      })

      if (response.status === 201) {
        const location = response.headers.get('Location')
        if (location) {
          // Convert relative URL to absolute URL
          const fullLocation = location.startsWith('http') 
            ? location 
            : `https://video.bunnycdn.com${location}`
          
          console.log('✅ TUS session created successfully:', fullLocation)
          return fullLocation
        } else {
          console.error('❌ No Location header in TUS creation response')
          return null
        }
      } else {
        const errorText = await response.text()
        console.error('❌ TUS creation failed:', response.status, errorText)
        throw new Error(`TUS creation failed: ${response.status} ${errorText}`)
      }
    } catch (error) {
      console.error('❌ TUS creation error:', error)
      throw error
    }
  }

  const pollVideoStatus = async (videoId: string) => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) return

      console.log(`🔄 Polling video status: ${videoId}`)
      
      const maxAttempts = 60 // 5 minutes with 5-second intervals
      let attempts = 0
      
      const pollInterval = setInterval(async () => {
        attempts++
        
        try {
          const response = await fetch(`/api/admin/videos/${videoId}/status`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          })

          if (response.ok) {
            const status = await response.json()
            console.log(`📊 Video status (${attempts}/${maxAttempts}):`, status)
            
            if (status.isReady) {
              clearInterval(pollInterval)
              setUploadStatus('success')
              setIsUploading(false)
              onUploadComplete(videoId, status.urls?.embed || '')
              
              // Close after a short delay
              setTimeout(() => {
                onClose()
              }, 2000)
            } else if (status.isError) {
              clearInterval(pollInterval)
              setUploadStatus('error')
              setErrorMessage(status.error || 'Video processing failed')
              setIsUploading(false)
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval)
              setUploadStatus('error')
              setErrorMessage('Video processing timed out')
              setIsUploading(false)
            }
          } else {
            console.error(`❌ Status check failed: ${response.status}`)
            if (attempts >= maxAttempts) {
              clearInterval(pollInterval)
              setUploadStatus('error')
              setErrorMessage('Failed to check video status')
              setIsUploading(false)
            }
          }
        } catch (error) {
          console.error('❌ Status polling error:', error)
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            setUploadStatus('error')
            setErrorMessage('Status polling failed')
            setIsUploading(false)
          }
        }
      }, 5000) // Poll every 5 seconds
      
    } catch (error) {
      console.error('❌ Failed to start status polling:', error)
      setUploadStatus('error')
      setErrorMessage('Failed to start status monitoring')
      setIsUploading(false)
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

      // Get admin token for authentication
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        setUploadStatus('error')
        setErrorMessage('No admin token found. Please log in again.')
        setIsUploading(false)
        return
      }

      // Initialize TUS upload (this will create video entry)
      const tusInitResponse = await fetch('/api/admin/upload/tus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          fileSize: file.size,
          filename: file.name,
          contentType: file.type
        })
      })

      if (!tusInitResponse.ok) {
        const errorData = await tusInitResponse.json()
        throw new Error(errorData.error || 'Failed to initialize upload')
      }

      const tusInitResult = await tusInitResponse.json()
      const videoId = tusInitResult.videoId
      const uploadUrl = tusInitResult.uploadUrl
      const tusHeaders = tusInitResult.tusHeaders
      
      console.log('✅ TUS initialized, starting direct upload to Bunny...', {
        videoId,
        uploadUrl,
        tusHeaders: {
          ...tusHeaders,
          authorizationSignature: tusHeaders?.authorizationSignature?.substring(0, 16) + '...'
        }
      })
      
      // Upload directly to Bunny TUS endpoint
      await uploadFileWithTUS(file, uploadUrl, videoId, tusHeaders)
    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      setErrorMessage(error.message || 'Upload failed')
      setIsUploading(false)
    }
  }

  const uploadFileWithTUS = async (file: File, uploadUrl: string, videoId: string, tusHeaders: any) => {
    try {
      console.log('🚀 Starting TUS file upload...', { fileSize: file.size, uploadUrl })
      
      // Step 1: Create TUS upload session with Bunny
      const tusLocation = await createTusUpload(file, tusHeaders)
      if (!tusLocation) {
        throw new Error('Failed to create TUS upload session')
      }
      
      console.log('✅ TUS session created:', tusLocation)
      
      const chunkSize = 4 * 1024 * 1024 // 4MB chunks
      let offset = 0
      
      while (offset < file.size) {
        const chunk = file.slice(offset, offset + chunkSize)
        const chunkBuffer = await chunk.arrayBuffer()
        
        console.log(`📦 Uploading chunk: ${offset}-${offset + chunk.size} (${chunk.size} bytes) to ${tusLocation}`)
        
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
          
          // Send chunk to the TUS location URL (not the base URL)
          xhr.open('PATCH', tusLocation)
          xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream')
          xhr.setRequestHeader('Upload-Offset', offset.toString())
          xhr.setRequestHeader('Tus-Resumable', '1.0.0')
          
          // Bunny TUS requires these specific headers
          if (tusHeaders) {
            xhr.setRequestHeader('AuthorizationSignature', tusHeaders.authorizationSignature)
            xhr.setRequestHeader('AuthorizationExpire', tusHeaders.authorizationExpire.toString())
            xhr.setRequestHeader('LibraryId', tusHeaders.libraryId)
            xhr.setRequestHeader('VideoId', tusHeaders.videoId)
          }
          
          xhr.send(chunkBuffer)
        })
        
        offset += chunk.size
      }
      
      console.log('🎉 File upload completed! Starting status polling...')
      
      // Start polling for video processing status
      await pollVideoStatus(videoId)
      
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

  const testTusHeaders = async () => {
    try {
      setErrorMessage('')
      
      // Get admin token for authentication
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        alert(currentLanguage === "mn" ? "Админ токен олдсонгүй. Дахин нэвтэрнэ үү." : "No admin token found. Please log in again.")
        return
      }

      // Test TUS header generation
      const response = await fetch('/api/admin/upload/tus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          fileSize: 1024,
          filename: 'test.txt',
          contentType: 'text/plain'
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('TUS headers test successful:', {
          videoId: data.videoId,
          uploadUrl: data.uploadUrl,
          tusHeaders: data.tusHeaders
        })
        alert(currentLanguage === "mn" ? "TUS загварууд амжилттай!" : "TUS headers generated successfully!")
      } else {
        const errorText = await response.text()
        console.error('TUS headers test failed:', response.status, errorText)
        alert(currentLanguage === "mn" ? `TUS загварууд алдаа: ${response.status}` : `TUS headers error: ${response.status}`)
      }
    } catch (error) {
      console.error('TUS headers test error:', error)
      alert(currentLanguage === "mn" ? "TUS загварууд тест алдаа" : "TUS headers test error")
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
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={testBunnyAPI}>
                  {currentLanguage === "mn" ? "API Тест" : "Test API"}
                </Button>
                <Button type="button" variant="outline" onClick={testTusHeaders}>
                  {currentLanguage === "mn" ? "TUS Тест" : "Test TUS"}
                </Button>
              </div>
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

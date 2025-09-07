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
        setErrorMessage("Please select a video file")
        return
      }
      
      if (file.size > 10 * 1024 * 1024 * 1024) { // 2GB limit
        setErrorMessage("File size must be less than 2GB")
        return
      }
      
      setErrorMessage('')
      setUploadProgress({
        bytesUploaded: 0,
        bytesTotal: file.size,
        percentage: 0
      })
    }
  }, [])

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
      } else if (response.status === 409) {
        const errorText = await response.text()
        console.error('❌ TUS creation failed: Conflict (409)', errorText)
        throw new Error(`Upload conflict: Another upload session may be active for this video. Please wait a moment and try again.`)
      } else if (response.status === 423) {
        const errorText = await response.text()
        console.error('❌ TUS creation failed: Locked (423)', errorText)
        throw new Error(`Upload locked: The video file is currently being processed. Please wait a moment and try again.`)
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

  const checkForExistingUploads = async (videoId: string): Promise<boolean> => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) return false

      // Check if there are any existing upload sessions for this video
      const response = await fetch(`/api/admin/videos/${videoId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      if (response.ok) {
        const status = await response.json()
        // If video is in uploading or processing state, there might be a conflict
        return status.status === 'uploading' || status.status === 'processing'
      }
    } catch (error) {
      console.warn('Could not check for existing uploads:', error)
    }
    return false
  }

  const startUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file || !videoTitle.trim()) {
      setErrorMessage("Please select a file and enter a title")
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

      // Check for existing uploads to prevent conflicts
      const hasExistingUpload = await checkForExistingUploads(videoId)
      if (hasExistingUpload) {
        console.warn('⚠️ Existing upload detected, waiting before proceeding...')
        setErrorMessage('Another upload may be in progress. Please wait a moment...')
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
        setErrorMessage('')
      }
      
      // Upload directly to Bunny TUS endpoint
      await uploadFileWithTUS(file, uploadUrl, videoId, tusHeaders)
    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      setErrorMessage(error.message || 'Upload failed')
      setIsUploading(false)
    }
  }

  const uploadChunkWithRetry = async (
    tusLocation: string, 
    chunkBuffer: ArrayBuffer, 
    offset: number, 
    tusHeaders: any, 
    maxRetries: number = 5
  ): Promise<void> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📦 Uploading chunk: ${offset}-${offset + chunkBuffer.byteLength} (attempt ${attempt}/${maxRetries})`)
        
        const xhr = new XMLHttpRequest()
        
        await new Promise<void>((resolve, reject) => {
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              console.log(`✅ Chunk uploaded successfully: ${offset}-${offset + chunkBuffer.byteLength}`)
              resolve()
            } else if (xhr.status === 423) {
              console.warn(`⚠️ Chunk upload attempt ${attempt} failed: File is locked (423)`)
              reject(new Error(`423 File is currently being updated. Please try again later`))
            } else if (xhr.status === 409) {
              console.warn(`⚠️ Chunk upload attempt ${attempt} failed: Conflict (409)`)
              reject(new Error(`409 Upload conflict detected`))
            } else if (xhr.status === 410) {
              console.warn(`⚠️ Chunk upload attempt ${attempt} failed: Gone (410)`)
              reject(new Error(`410 Upload session expired`))
            } else {
              console.error(`❌ Chunk upload failed: ${xhr.status} ${xhr.statusText}`)
              reject(new Error(`Chunk upload failed: ${xhr.status}`))
            }
          })
          
          xhr.addEventListener('error', () => {
            console.error('❌ Chunk upload error')
            reject(new Error('Chunk upload error'))
          })
          
          xhr.addEventListener('timeout', () => {
            console.warn(`⚠️ Chunk upload attempt ${attempt} failed: signal timed out`)
            reject(new Error('Chunk upload timeout'))
          })
          
          // Set timeout to 60 seconds per chunk for large files
          xhr.timeout = 60000
          
          // Send chunk to the TUS location URL
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
        
        // If we get here, the upload was successful
        return
        
      } catch (error: any) {
        console.error(`❌ Chunk upload attempt ${attempt} failed:`, error.message)
        
        if (attempt === maxRetries) {
          throw error // Re-throw on final attempt
        }
        
        // Special handling for 423 errors - wait longer
        let delay = 1000 * Math.pow(2, attempt - 1) // Exponential backoff
        
        if (error.message.includes('423')) {
          // For 423 errors, wait longer and add jitter
          delay = Math.min(5000 + (Math.random() * 5000), 30000) // 5-10 seconds with jitter
          console.log(`⏳ File is locked, waiting ${delay}ms before retry...`)
        } else if (error.message.includes('409')) {
          // For 409 conflicts, wait a bit longer
          delay = Math.min(3000 + (Math.random() * 2000), 15000) // 3-5 seconds
          console.log(`⏳ Upload conflict detected, waiting ${delay}ms before retry...`)
        } else if (error.message.includes('410')) {
          // For 410 errors, session expired - this might need a new session
          console.log(`⏳ Upload session expired, waiting ${delay}ms before retry...`)
        } else {
          console.log(`⏳ Retrying in ${delay}ms...`)
        }
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  const uploadFileWithTUS = async (file: File, uploadUrl: string, videoId: string, tusHeaders: any) => {
    let tusLocation: string | null = null
    
    try {
      console.log('🚀 Starting TUS file upload...', { fileSize: file.size, uploadUrl })
      
      // Step 1: Create TUS upload session with Bunny
      tusLocation = await createTusUpload(file, tusHeaders)
      if (!tusLocation) {
        throw new Error('Failed to create TUS upload session')
      }
      
      console.log('✅ TUS session created:', tusLocation)
      
      // Check if TUS headers are still valid (not expired)
      const now = Math.floor(Date.now() / 1000)
      if (tusHeaders.authorizationExpire <= now) {
        throw new Error('TUS authorization expired. Please try again.')
      }
      
      const chunkSize = 16 * 1024 * 1024 // 16MB chunks
      let offset = 0
      
      while (offset < file.size) {
        const chunk = file.slice(offset, offset + chunkSize)
        const chunkBuffer = await chunk.arrayBuffer()
        
        console.log(`📦 Uploading chunk: ${offset}-${offset + chunk.size} (${chunk.size} bytes) to ${tusLocation}`)
        
        // Wait for chunk upload to complete with retry logic
        await uploadChunkWithRetry(tusLocation, chunkBuffer, offset, tusHeaders, 5)
        
        offset += chunk.size
        
        // Update progress
        setUploadProgress({
          bytesUploaded: offset,
          bytesTotal: file.size,
          percentage: Math.round((offset / file.size) * 100)
        })
        
        // Small delay between chunks to avoid overwhelming the server
        if (offset < file.size) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      console.log('🎉 File upload completed! Starting status polling...')
      
      // Start polling for video processing status
      await pollVideoStatus(videoId)
      
    } catch (error) {
      console.error('❌ TUS file upload failed:', error)
      
      // Clean up failed upload session if possible
      if (tusLocation) {
        try {
          console.log('🧹 Attempting to clean up failed upload session...')
          // Note: TUS doesn't have a standard cleanup endpoint, but we can try to abort
          // This is more of a best-effort cleanup
        } catch (cleanupError) {
          console.warn('⚠️ Failed to clean up upload session:', cleanupError)
        }
      }
      
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

  const resetUpload = () => {
    setIsUploading(false)
    setUploadStatus('idle')
    setErrorMessage('')
    setUploadProgress({
      bytesUploaded: 0,
      bytesTotal: 0,
      percentage: 0
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setVideoTitle('')
    setVideoDescription('')
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
        alert("No admin token found. Please log in again.")
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
        alert("Bunny API connection successful!")
      } else {
        const errorText = await response.text()
        console.error('Bunny API test failed:', response.status, errorText)
        alert(`Bunny API error: ${response.status}`)
      }
    } catch (error) {
      console.error('Bunny API test error:', error)
      alert("Bunny API connection error")
    }
  }

  const testTusHeaders = async () => {
    try {
      setErrorMessage('')
      
      // Get admin token for authentication
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        alert("No admin token found. Please log in again.")
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
        alert("TUS headers generated successfully!")
      } else {
        const errorText = await response.text()
        console.error('TUS headers test failed:', response.status, errorText)
        alert(`TUS headers error: ${response.status}`)
      }
    } catch (error) {
      console.error('TUS headers test error:', error)
      alert("TUS headers test error")
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Upload Video
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
                  Video Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="videoTitle">
                    Video Title
                  </Label>
                  <Input
                    id="videoTitle"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Enter video title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="videoDescription">
                    Description
                  </Label>
                  <Input
                    id="videoDescription"
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    placeholder="Video description (optional)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* File Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Select File
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
                    Supported formats: MP4, MOV, AVI, MKV. Maximum size: 2GB
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
                    Uploading...
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
                    Cancel Upload
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
                      Video uploaded successfully!
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
                  {uploadStatus === 'error' && (
                    <div className="mt-4 flex gap-2">
                      <Button 
                        onClick={startUpload} 
                        variant="outline" 
                        size="sm"
                        disabled={isUploading}
                      >
                        Retry Upload
                      </Button>
                      <Button 
                        onClick={resetUpload} 
                        variant="ghost" 
                        size="sm"
                      >
                        Start Over
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={testBunnyAPI}>
                  Test API
                </Button>
                <Button type="button" variant="outline" onClick={testTusHeaders}>
                  Test TUS
                </Button>
              </div>
              <div className="flex space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={startUpload}
                  disabled={isUploading || !fileInputRef.current?.files?.[0] || !videoTitle.trim()}
                  className="min-w-[120px]"
                >
                  {isUploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
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

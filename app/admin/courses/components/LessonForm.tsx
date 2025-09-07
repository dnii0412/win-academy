
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Play, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface LessonFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (lessonData: any) => void
  lesson?: any
  mode: "create" | "edit"
  courseId: string
  subcourseId: string
}

export default function LessonForm({ isOpen, onClose, onSubmit, lesson, mode, courseId, subcourseId }: LessonFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    titleMn: "",
    description: "",
    descriptionMn: "",
    video: {
      status: "processing",
      videoId: "",
      thumbnailUrl: "",
      duration: 0
    }
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || "",
        titleMn: lesson.titleMn || "",
        description: lesson.description || "",
        descriptionMn: lesson.descriptionMn || "",
        video: lesson.video || {
          status: "processing",
          videoId: "",
          thumbnailUrl: "",
          duration: 0
        }
      })
    } else {
      setFormData({
        title: "",
        titleMn: "",
        description: "",
        descriptionMn: "",
        video: {
          status: "processing",
          videoId: "",
          thumbnailUrl: "",
          duration: 0
        }
      })
    }
  }, [lesson])

  const handleInputChange = (field: string, value: any) => {
    if (field === 'video') {
      setFormData(prev => ({
        ...prev,
        video: { ...prev.video, ...value }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime']
      if (!validTypes.includes(file.type)) {
        setUploadError(`Unsupported file type: ${file.type}. Please use MP4, MOV, AVI, or WebM.`)
        setUploadStatus('error')
        return
      }

      setSelectedFile(file)
      setUploadStatus('idle')
      setUploadError('')
      setUploadProgress(0)
      
      // Store filename temporarily
      handleInputChange("video", { 
        videoId: file.name,
        status: "processing"
      })
    }
  }

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

  const uploadVideoWithTUS = async (): Promise<{ success: boolean; videoId?: string; error?: string }> => {
    if (!selectedFile) {
      return { success: false, error: 'No file selected' }
    }

    try {
      setUploadStatus('uploading')
      setUploadProgress(0)

      const adminToken = localStorage.getItem("adminToken")
      console.log('🔐 Client - Admin token retrieved:', {
        hasToken: !!adminToken,
        tokenLength: adminToken?.length,
        tokenStart: adminToken ? adminToken.substring(0, 20) + '...' : 'MISSING',
        tokenEnd: adminToken ? '...' + adminToken.substring(adminToken.length - 10) : 'MISSING'
      })
      
      if (!adminToken) {
        throw new Error("No admin token found. Please log in again.")
      }

      // Check if token is expired by trying to decode it (without verification)
      try {
        const tokenPayload = JSON.parse(atob(adminToken.split('.')[1]))
        const currentTime = Math.floor(Date.now() / 1000)
        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
          console.log('⚠️ Token is expired, clearing localStorage and redirecting to login')
          localStorage.removeItem("adminToken")
          window.location.href = "/admin/login"
          return { success: false, error: "Session expired. Please log in again." }
        }
      } catch (tokenError) {
        console.log('⚠️ Could not decode token, proceeding with upload attempt')
      }

      console.log('🚀 Starting TUS upload for:', selectedFile.name, 'Size:', Math.round(selectedFile.size / 1024 / 1024), 'MB')
      
      // Show initial progress
      setUploadStatus('uploading')
      setUploadProgress(0)

      // Step 1: Initialize TUS upload
      const tusInitResponse = await fetch('/api/admin/upload/tus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'Upload-Length': selectedFile.size.toString(),
          'Upload-Metadata': `filename ${encodeURIComponent(selectedFile.name)},contentType ${encodeURIComponent(selectedFile.type)}`,
          'Tus-Resumable': '1.0.0'
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          fileSize: selectedFile.size,
          contentType: selectedFile.type
        })
      })

      if (!tusInitResponse.ok) {
        const errorData = await tusInitResponse.json()
        
        // Handle expired token specifically
        if (tusInitResponse.status === 401) {
          console.log('⚠️ 401 Unauthorized - likely expired token, clearing localStorage')
          localStorage.removeItem("adminToken")
          window.location.href = "/admin/login"
          return { success: false, error: "Session expired. Please log in again." }
        }
        
        throw new Error(`Failed to initialize TUS upload: ${errorData.error || tusInitResponse.statusText}`)
      }

      const tusInitResult = await tusInitResponse.json()

      if (!tusInitResult.success || !tusInitResult.uploadUrl || !tusInitResult.videoId) {
        throw new Error('TUS upload initialization failed')
      }

      console.log('✅ TUS upload initialized:', tusInitResult.uploadId)
      console.log('🔗 Upload URL:', tusInitResult.uploadUrl)

      // Step 2: Create TUS upload session with Bunny
      const tusLocation = await createTusUpload(selectedFile, tusInitResult.tusHeaders)
      if (!tusLocation) {
        throw new Error('Failed to create TUS upload session')
      }

      console.log('✅ TUS session created:', tusLocation)

      // Step 3: Upload the file using TUS protocol
      // Use 16MB chunks for optimal performance
      const chunkSize = 16 * 1024 * 1024 // 16MB chunks
      let offset = 0
      
      while (offset < selectedFile.size) {
        const chunk = selectedFile.slice(offset, offset + chunkSize)
        
        console.log(`📦 Uploading chunk: ${offset}-${offset + chunk.size} (${chunk.size} bytes) to ${tusLocation}`)
        
        // Enhanced retry logic with 423 error handling
        let retryCount = 0
        const maxRetries = 5
        let chunkResponse: Response | null = null
        
        while (retryCount < maxRetries) {
          try {
            chunkResponse = await fetch(tusLocation, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/offset+octet-stream',
                'Upload-Offset': offset.toString(),
                'Tus-Resumable': '1.0.0',
                'AuthorizationSignature': tusInitResult.tusHeaders.authorizationSignature,
                'AuthorizationExpire': tusInitResult.tusHeaders.authorizationExpire.toString(),
                'LibraryId': tusInitResult.tusHeaders.libraryId,
                'VideoId': tusInitResult.tusHeaders.videoId
              },
              body: chunk,
              // Extended timeout for large chunks
              signal: AbortSignal.timeout(60000) // 60 second timeout per chunk
            })

            if (chunkResponse.ok) {
              break // Success, exit retry loop
            } else if (chunkResponse.status === 423) {
              console.warn(`⚠️ Chunk upload attempt ${retryCount + 1} failed: File is locked (423)`)
              throw new Error(`423 File is currently being updated. Please try again later`)
            } else if (chunkResponse.status === 409) {
              console.warn(`⚠️ Chunk upload attempt ${retryCount + 1} failed: Conflict (409)`)
              throw new Error(`409 Upload conflict detected`)
            } else if (chunkResponse.status === 410) {
              console.warn(`⚠️ Chunk upload attempt ${retryCount + 1} failed: Gone (410)`)
              throw new Error(`410 Upload session expired`)
            } else {
              const errorText = await chunkResponse.text()
              throw new Error(`Chunk upload failed: ${chunkResponse.status} ${errorText}`)
            }
          } catch (error: any) {
            retryCount++
            console.warn(`⚠️ Chunk upload attempt ${retryCount} failed:`, error.message)
            
            if (retryCount >= maxRetries) {
              throw new Error(`Failed to upload chunk after ${maxRetries} attempts: ${error.message}`)
            }
            
            // Special handling for different error types
            let delay = 1000 * Math.pow(2, retryCount - 1) // Exponential backoff
            
            if (error.message.includes('423')) {
              // For 423 errors, wait longer and add jitter
              delay = Math.min(5000 + (Math.random() * 5000), 30000) // 5-10 seconds with jitter
              console.log(`⏳ File is locked, waiting ${delay}ms before retry...`)
            } else if (error.message.includes('409')) {
              // For 409 conflicts, wait a bit longer
              delay = Math.min(3000 + (Math.random() * 2000), 15000) // 3-5 seconds
              console.log(`⏳ Upload conflict detected, waiting ${delay}ms before retry...`)
            } else if (error.message.includes('410')) {
              // For 410 errors, session expired
              console.log(`⏳ Upload session expired, waiting ${delay}ms before retry...`)
            } else {
              console.log(`⏳ Retrying in ${delay}ms...`)
            }
            
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }

        if (!chunkResponse || !chunkResponse.ok) {
          const errorText = chunkResponse ? await chunkResponse.text() : 'No response'
          
          // Handle expired token during chunk upload
          if (chunkResponse?.status === 401) {
            console.log('⚠️ 401 Unauthorized during chunk upload - likely expired token')
            localStorage.removeItem("adminToken")
            window.location.href = "/admin/login"
            return { success: false, error: "Session expired during upload. Please log in again." }
          }
          
          throw new Error(`Failed to upload chunk: ${chunkResponse?.status || 'Network Error'} ${errorText}`)
        }

        offset += chunk.size
        const progress = (offset / selectedFile.size) * 100
        setUploadProgress(Math.round(progress))
        
        // Log progress for large files
        if (selectedFile.size > 100 * 1024 * 1024) { // > 100MB
          console.log(`📊 Upload progress: ${Math.round(progress)}% (${Math.round(offset / 1024 / 1024)}MB / ${Math.round(selectedFile.size / 1024 / 1024)}MB)`)
        }
        
        // Small delay between chunks to prevent overwhelming the server
        if (offset < selectedFile.size) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      console.log('🎉 File upload completed!')

      // Step 4: Send HEAD request to complete the upload
      console.log('🔍 Completing TUS upload...')
      const tusHeadResponse = await fetch(tusLocation, {
        method: 'HEAD',
        headers: {
          'Tus-Resumable': '1.0.0',
          'AuthorizationSignature': tusInitResult.tusHeaders.authorizationSignature,
          'AuthorizationExpire': tusInitResult.tusHeaders.authorizationExpire.toString(),
          'LibraryId': tusInitResult.tusHeaders.libraryId,
          'VideoId': tusInitResult.tusHeaders.videoId
        }
      })

      console.log('📡 TUS HEAD response:', {
        status: tusHeadResponse.status,
        statusText: tusHeadResponse.statusText,
        uploadOffset: tusHeadResponse.headers.get('Upload-Offset'),
        uploadLength: tusHeadResponse.headers.get('Upload-Length')
      })

      setUploadStatus('success')
      setUploadProgress(100)

      return { success: true, videoId: tusInitResult.videoId }

    } catch (error: any) {
      console.error('❌ TUS upload failed:', error)
      setUploadStatus('error')
      
      // Provide user-friendly error messages
      let errorMessage = 'Upload failed'
      if (error.message.includes('ERR_NETWORK_IO_SUSPENDED')) {
        errorMessage = 'Upload was suspended due to network issues. Please try again with a smaller file or check your internet connection.'
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error occurred during upload. Please check your internet connection and try again.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Upload timed out. Please try again with a smaller file or better internet connection.'
      } else {
        errorMessage = error.message || 'Upload failed'
      }
      
      setUploadError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      // Prepare lesson data - auto-fill English fields with Mongolian content
      const lessonData = {
        ...formData,
        title: formData.titleMn, // Use Mongolian title as English title
        description: formData.descriptionMn, // Use Mongolian description as English description
        type: "video",
        durationSec: 0,
        content: "",
        contentMn: ""
      }
      
      if (selectedFile) {
        console.log('🎬 Starting video upload process...')
        const uploadResult = await uploadVideoWithTUS()
        console.log('🎬 Upload result:', uploadResult)
        
        if (uploadResult.success && uploadResult.videoId) {
          console.log('✅ Video upload successful, updating form data with videoId:', uploadResult.videoId)
          
          // Update form data with actual Bunny video ID
          const updatedLessonData = {
            ...lessonData,
            video: {
              ...lessonData.video,
              videoId: uploadResult.videoId,
              status: 'ready'
            }
          }
          
          console.log('📝 Submitting lesson data:', updatedLessonData)
          onSubmit(updatedLessonData)
          onClose()
        } else {
          console.log('❌ Upload failed, not submitting lesson')
          return
        }
      } else {
        console.log('📝 No file selected, submitting lesson data directly:', lessonData)
        onSubmit(lessonData)
        onClose()
      }
    } catch (error) {
      console.error('❌ Submit failed:', error)
      setUploadError('Failed to submit lesson')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === "create" ? "Хичээл үүсгэх" : "Хичээл засах"}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="titleMn">Нэр (Mongolian)</Label>
              <Input
                id="titleMn"
                value={formData.titleMn}
                onChange={(e) => handleInputChange("titleMn", e.target.value)}
                placeholder="Монгол хэл дээр нэр оруулна уу"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="descriptionMn">Тайлбар (Mongolian)</Label>
              <Textarea
                id="descriptionMn"
                value={formData.descriptionMn}
                onChange={(e) => handleInputChange("descriptionMn", e.target.value)}
                placeholder="Монгол хэл дээр тайлбар оруулна уу"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Video Upload */}
            <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-medium">Video Upload</h3>
              
              <div>
                <Label htmlFor="videoFile">Upload Video File</Label>
                <div className="mt-2">
                  <Input
                    id="videoFile"
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                    disabled={uploadStatus === 'uploading' || isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: MP4, MOV, AVI, WebM (No size limit - will be chunked automatically)
                  </p>
                </div>
              </div>

              {/* Upload Progress */}
              {uploadStatus === 'uploading' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading to Bunny.net (TUS Uploader)...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Status */}
              {uploadStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Video uploaded successfully!</span>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{uploadError}</span>
                </div>
              )}

              {/* Video Preview */}
              {formData.video.videoId && (
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <Play className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{formData.video.videoId}</p>
                      <p className="text-xs text-gray-500">
                        {uploadStatus === 'success' ? 'Ready to submit' : 'Ready to upload'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Цуцлах
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting || uploadStatus === 'uploading'}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Creating...'}
                  </>
                ) : (
                  mode === "create" ? "Үүсгэх" : "Хадгалах"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Play, Upload, CheckCircle, AlertCircle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { createBunnyVideo, testBunnyAccess, BUNNY_STREAM_CONFIG } from "@/lib/bunny-stream"
import TUSUploader from "@/components/video-upload/TUSUploader"


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
  const { currentLanguage } = useLanguage()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showTusUploader, setShowTusUploader] = useState(false)
  const [useTusForAllFiles, setUseTusForAllFiles] = useState(false)


  
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
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

      // No size limit - all files will use TUS or chunked upload as needed
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

  const uploadVideoToBunny = async (): Promise<{ success: boolean; videoId?: string; error?: string }> => {
    if (!selectedFile) {
      return { success: false, error: 'No file selected' }
    }

    try {
      setUploadStatus('uploading')
      setUploadProgress(0)

      // Step 1: Create video in Bunny
      const createResult = await createBunnyVideo(formData.title || selectedFile.name, formData.description)
      if (!createResult.success || !createResult.videoId) {
        throw new Error(createResult.error || 'Failed to create video in Bunny')
      }

      const videoId = createResult.videoId

      // Step 2: Use regular upload for better Bunny compatibility
      console.log('Using regular upload for Bunny compatibility')
      return await performUnifiedUpload(videoId, selectedFile)

    } catch (error: any) {
      setUploadStatus('error')
      setUploadError(error.message || 'Upload failed')
      return { success: false, error: error.message }
    }
  }

  const performUnifiedUpload = async (
    videoId: string, 
    file: File, 
    resolve?: (value: { success: boolean; videoId?: string; error?: string }) => void,
    reject?: (reason: any) => void
  ): Promise<{ success: boolean; videoId?: string; error?: string }> => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      console.log("🔐 Admin token check:", {
        hasToken: !!adminToken,
        tokenLength: adminToken?.length,
        tokenStart: adminToken?.substring(0, 20) + "...",
        tokenEnd: "..." + adminToken?.substring(adminToken.length - 10)
      })
      
      if (!adminToken) {
        throw new Error("No admin token found. Please log in again.")
      }

      // Determine upload method based on file size and user preference
      const shouldUseTus = useTusForAllFiles || file.size > 50 * 1024 * 1024
      
      if (shouldUseTus) {
        console.log('Using TUS upload for file:', file.name, 'Size:', Math.round(file.size / 1024 / 1024), 'MB')
        return await performTusUpload(videoId, file, resolve, reject)
      } else {
        console.log('Using direct upload for file:', file.name, 'Size:', Math.round(file.size / 1024 / 1024), 'MB')
        return await performDirectUpload(videoId, file, resolve, reject)
      }
    } catch (error: any) {
      setUploadStatus('error')
      setUploadError(error.message || 'Upload failed')
      const result = { success: false, error: error.message }
      if (reject) reject(result)
      return result
    }
  }

  const performTusUpload = async (
    videoId: string, 
    file: File, 
    resolve?: (value: { success: boolean; videoId?: string; error?: string }) => void,
    reject?: (reason: any) => void
  ): Promise<{ success: boolean; videoId?: string; error?: string }> => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No admin token found")
      }

      // Create video entry in Bunny.net first
      const createVideoResponse = await fetch(`${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos`, {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: formData.title || 'Uploaded Video',
          description: formData.description || `Uploaded via TUS: ${file.name}`
        })
      })

      let bunnyVideoId = videoId
      if (createVideoResponse.ok) {
        const videoEntry = await createVideoResponse.json()
        bunnyVideoId = videoEntry.guid
        console.log("Video entry created in Bunny.net:", bunnyVideoId)
      }

      // Use TUS upload through our API
      const uploadData = {
        fileSize: file.size,
        filename: file.name,
        contentType: file.type,
        title: formData.title || 'Uploaded Video',
        description: formData.description || `Uploaded via TUS: ${file.name}`
      }
      
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percentage)
        }
      })
      
      console.log("🚀 Starting TUS upload with data:", {
        url: '/api/admin/upload/tus',
        uploadData,
        adminToken: adminToken ? `${adminToken.substring(0, 20)}...` : 'MISSING',
        headers: {
          'Authorization': `Bearer ${adminToken ? 'TOKEN_PRESENT' : 'MISSING'}`,
          'Content-Type': 'application/json'
        }
      })
      
      xhr.open('POST', '/api/admin/upload/tus')
      xhr.setRequestHeader('Authorization', `Bearer ${adminToken}`)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.send(JSON.stringify(uploadData))
      
      // Return a promise that will be resolved by the xhr event handlers
      return new Promise((resolve, reject) => {
              xhr.addEventListener('load', () => {
        console.log("📡 TUS upload response:", {
          status: xhr.status,
          statusText: xhr.statusText,
          responseText: xhr.responseText
        })
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.success && response.uploadUrl && response.videoId) {
              console.log('✅ TUS initialized, starting file upload...', response)
              
              // Now upload the actual file using TUS protocol
              uploadFileWithTUS(file, response.uploadUrl, response.videoId, resolve, reject)
            } else {
              setUploadStatus('error')
              setUploadError(response.error || 'TUS initialization failed')
              reject({ success: false, error: response.error })
            }
          } catch (e) {
            setUploadStatus('error')
            setUploadError('Invalid response from TUS server')
            reject({ success: false, error: 'Invalid response' })
          }
        } else {
          setUploadStatus('error')
          let errorMessage = `TUS upload failed: ${xhr.status} ${xhr.statusText}`
          
          // Provide specific error messages for common issues
          if (xhr.status === 401) {
            errorMessage = "Authentication failed. Please log in again as admin."
          } else if (xhr.status === 403) {
            errorMessage = "Access denied. You don't have admin privileges."
          } else if (xhr.status === 500) {
            errorMessage = "Server error. Please try again later."
          }
          
          setUploadError(errorMessage)
          reject({ success: false, error: errorMessage })
        }
      })
        
        xhr.addEventListener('error', () => {
          setUploadStatus('error')
          setUploadError('TUS upload failed due to network error')
          reject({ success: false, error: 'Network error' })
        })
      })
      
    } catch (error: any) {
      setUploadStatus('error')
      setUploadError(error.message || 'TUS upload failed')
      const result = { success: false, error: error.message }
      if (reject) reject(result)
      return result
    }
  }

  const uploadFileWithTUS = async (
    file: File, 
    uploadUrl: string, 
    videoId: string,
    resolve?: (value: { success: boolean; videoId?: string; error?: string }) => void,
    reject?: (reason: any) => void
  ): Promise<{ success: boolean; videoId?: string; error?: string }> => {
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
            const totalProgress = ((offset + (event.loaded / event.total) * chunk.size) / file.size) * 100
            setUploadProgress(Math.round(totalProgress))
          }
        })
        
        // Wait for chunk upload to complete
        await new Promise((chunkResolve, chunkReject) => {
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              console.log(`✅ Chunk uploaded successfully: ${offset}-${offset + chunk.size}`)
              chunkResolve(true)
            } else {
              console.error(`❌ Chunk upload failed: ${xhr.status} ${xhr.statusText}`)
              chunkReject(new Error(`Chunk upload failed: ${xhr.status}`))
            }
          })
          
          xhr.addEventListener('error', () => {
            console.error('❌ Chunk upload error')
            chunkReject(new Error('Chunk upload error'))
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
      setUploadProgress(100)
      
      const result = { success: true, videoId }
      if (resolve) resolve(result)
      return result
      
    } catch (error) {
      console.error('❌ TUS file upload failed:', error)
      setUploadStatus('error')
      setUploadError(error instanceof Error ? error.message : 'File upload failed')
      
      const result = { success: false, error: error instanceof Error ? error.message : 'File upload failed' }
      if (reject) reject(result)
      return result
    }
  }

  const performDirectUpload = async (
    videoId: string, 
    file: File, 
    resolve?: (value: { success: boolean; videoId?: string; error?: string }) => void,
    reject?: (reason: any) => void
  ): Promise<{ success: boolean; videoId?: string; error?: string }> => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No admin token found")
      }

      // Regular upload for small files
      const formData = new FormData()
      formData.append('video', file)

      // Simulate progress for regular upload
      setUploadProgress(10)
      setTimeout(() => setUploadProgress(30), 200)
      setTimeout(() => setUploadProgress(60), 500)
      setTimeout(() => setUploadProgress(90), 1000)

      const response = await fetch(`/api/admin/upload-video/${videoId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: formData
      })

      if (response.ok) {
        setUploadStatus('success')
        setUploadProgress(100)
        const result = { success: true, videoId }
        if (resolve) resolve(result)
        return result
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Direct upload failed')
      }
    } catch (error: any) {
      setUploadStatus('error')
      setUploadError(error.message || 'Direct upload failed')
      const result = { success: false, error: error.message }
      if (reject) reject(result)
      return result
    }
  }







  const handleSubmitWithUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prepare lesson data with defaults
    const lessonData = {
      ...formData,
      type: "video", // Always video since we only have video upload
      status: "published", // Default status
      durationSec: 0, // Will be updated after video processing
      content: "", // Empty content for video lessons
      contentMn: "" // Empty content for video lessons
    }
    
    if (selectedFile) {
      console.log('🎬 Starting video upload process...')
      const uploadResult = await uploadVideoToBunny()
      console.log('🎬 Upload result:', uploadResult)
      
      if (uploadResult.success && uploadResult.videoId) {
        console.log('✅ Video upload successful, updating form data with videoId:', uploadResult.videoId)
        
        // Update form data with actual Bunny video ID
        const updatedLessonData = {
          ...lessonData,
          video: {
            ...lessonData.video,
            videoId: uploadResult.videoId!,
            status: 'ready'
          }
        }
        
        console.log('📝 Submitting lesson data:', updatedLessonData)
        
        // Submit the form with updated data and close immediately
        onSubmit(updatedLessonData)
        onClose() // Close the form immediately
      } else {
        console.log('❌ Upload failed, not submitting lesson')
        // Don't submit if upload failed
        return
      }
    } else {
      console.log('📝 No file selected, submitting lesson data directly:', lessonData)
      // Submit normally if no file selected and close immediately
      onSubmit(lessonData)
      onClose() // Close the form immediately
    }
  }

  // Test Bunny access
  const testBunnyAccessLocal = async () => {
    try {
      console.log('Testing Bunny access...')
      const result = await testBunnyAccess()
      console.log('Test result:', result)
      return result
    } catch (error) {
      console.error('Bunny access test failed:', error)
      return { success: false, error: 'Test failed' }
    }
  }

  // Monitor TUS upload status
  const monitorTusStatus = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) return null

      const response = await fetch('/api/admin/upload/tus/status', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('TUS Status:', data)
        return data
      }
      return null
    } catch (error) {
      console.error('Failed to get TUS status:', error)
      return null
    }
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === "create" 
                ? (currentLanguage === "mn" ? "Хичээл үүсгэх" : "Create Lesson")
                : (currentLanguage === "mn" ? "Хичээл засах" : "Edit Lesson")
              }
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmitWithUpload} className="space-y-6">
            {/* Test Buttons */}
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  console.log('Testing Bunny access...')
                  const result = await testBunnyAccessLocal()
                  console.log('Test result:', result)
                }}
              >
                Test Bunny Access
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  console.log('Monitoring TUS status...')
                  const status = await monitorTusStatus()
                  console.log('TUS Status:', status)
                }}
              >
                Monitor TUS Status
              </Button>
            </div>

            {/* Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title (English)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter title in English"
                  required
                />
              </div>
              <div>
                <Label htmlFor="titleMn">Title (Mongolian)</Label>
                <Input
                  id="titleMn"
                  value={formData.titleMn}
                  onChange={(e) => handleInputChange("titleMn", e.target.value)}
                  placeholder="Монгол хэл дээр нэр оруулна уу"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Description (English)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter description in English"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="descriptionMn">Description (Mongolian)</Label>
                <Textarea
                  id="descriptionMn"
                  value={formData.descriptionMn}
                  onChange={(e) => handleInputChange("descriptionMn", e.target.value)}
                  placeholder="Монгол хэл дээр тайлбар оруулна уу"
                  rows={3}
                />
              </div>
            </div>



            {/* Video Upload */}
            <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-medium">Video Upload</h3>
              
              {/* File Upload */}
              <div>
                <Label htmlFor="videoFile">Upload Video File</Label>
                <div className="mt-2">
                  <Input
                    id="videoFile"
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                    disabled={uploadStatus === 'uploading'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: MP4, MOV, AVI, WebM (No size limit - will be chunked automatically)
                  </p>
                  
                  {/* Upload Method Toggle */}
                  <div className="mt-3 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useTusForAll"
                      checked={useTusForAllFiles}
                      onChange={(e) => setUseTusForAllFiles(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="useTusForAll" className="text-sm">
                      Use TUS uploader for all files (recommended for large files)
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    TUS uploader provides reliable uploads for large files with resumable capability
                  </p>
                </div>
              </div>

              {/* Upload Progress */}
              {uploadStatus === 'uploading' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      Uploading to Bunny... 
                      {useTusForAllFiles || (selectedFile && selectedFile.size > 50 * 1024 * 1024) ? 
                        ' (TUS Uploader)' : ' (Direct Upload)'}
                    </span>
                    <span>{Math.round(uploadProgress)}%</span>
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{uploadError}</span>
                  </div>
                  {uploadError.includes('TUS uploader') && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowTusUploader(true)
                        }}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Use TUS Uploader
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUploadStatus('idle')
                          setUploadError('')
                        }}
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
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
                      <p className="text-xs text-gray-500">Ready to upload</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                {currentLanguage === "mn" ? "Цуцлах" : "Cancel"}
              </Button>
              <Button type="submit">
                {mode === "create" 
                  ? (currentLanguage === "mn" ? "Үүсгэх" : "Create")
                  : (currentLanguage === "mn" ? "Хадгалах" : "Save Changes")
                }
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      {/* TUS Uploader Modal */}
      {showTusUploader && (
        <TUSUploader
          onUploadComplete={(videoId, videoUrl) => {
            console.log('TUS upload completed:', { videoId, videoUrl })
            setFormData(prev => ({
              ...prev,
              video: {
                ...prev.video,
                videoId: videoId,
                videoUrl: videoUrl
              }
            }))
            setUploadStatus('success')
            setUploadError('')
            setShowTusUploader(false)
          }}
          onClose={() => {
            setShowTusUploader(false)
          }}
        />
      )}
    </div>
  )
}

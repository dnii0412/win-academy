"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Upload, Video, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VideoUploadProps {
  onUploadComplete?: (videoId: string) => void
}

export default function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file type
      if (!selectedFile.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file",
          variant: "destructive",
        })
        return
      }
      
      // Check file size (100MB limit)
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a video file smaller than 100MB",
          variant: "destructive",
        })
        return
      }
      
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!title.trim() || !file) {
      toast({
        title: "Missing information",
        description: "Please provide a title and select a video file",
        variant: "destructive",
      })
      return
    }

    // Start background upload
    setIsUploading(true)
    setUploadProgress(0)

    // Show immediate success message and reset form
    toast({
      title: "Upload started!",
      description: "Your video is uploading in the background. You can continue with other tasks.",
    })

    // Reset form immediately so admin can upload another video
    setTitle("")
    setDescription("")
    setFile(null)

    // Start background upload process
    uploadInBackground(title, description, file)
  }

  const uploadInBackground = async (title: string, description: string, file: File) => {
    try {
      // Step 1: Create video entry
      const createResponse = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      })

      const createResult = await createResponse.json()

      if (!createResult.success) {
        throw new Error(createResult.error || 'Failed to create video')
      }

      const videoId = createResult.videoId

      // Step 2: Get upload URL
      const uploadUrlResponse = await fetch(`/api/videos/${videoId}/upload`)
      const uploadUrlResult = await uploadUrlResponse.json()

      if (!uploadUrlResult.success) {
        throw new Error(uploadUrlResult.error || 'Failed to get upload URL')
      }

      // Step 3: Upload file to Bunny.net
      const formData = new FormData()
      formData.append('video', file)

      const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video file')
      }

      // Step 4: Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Show completion toast
      toast({
        title: "Upload completed!",
        description: "Your video has been uploaded and is being processed.",
      })

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(videoId)
      }

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during background upload",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Upload Video
        </CardTitle>
        <CardDescription>
          Upload a video to your library. Supported formats: MP4, MOV, AVI, and more.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Video Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            disabled={isUploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter video description"
            rows={3}
            disabled={isUploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="video">Video File *</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              id="video"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            <label htmlFor="video" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">
                    {file ? file.name : "Click to select video file"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Max size: 100MB
                  </p>
                </div>
              </div>
            </label>
          </div>
          {file && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              {file.name} selected
            </div>
          )}
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading in background...
              </span>
              <span className="text-blue-600 font-medium">Processing</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              You can continue with other tasks while the upload processes
            </p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={isUploading || !title.trim() || !file}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          <p>Your video will be processed and available for streaming once encoding is complete.</p>
        </div>
      </CardContent>
    </Card>
  )
}

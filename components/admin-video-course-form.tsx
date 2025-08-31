"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Video, Image, Loader2, CheckCircle, AlertCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cloudinary } from "@/lib/cloudinary"

interface VideoCourseFormData {
  title: string
  description: string
  category: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: string
  price: number
  thumbnailUrl?: string
  thumbnailPublicId?: string
  videoId?: string
}

interface AdminVideoCourseFormProps {
  onCourseCreated?: (courseId: string) => void
}

export default function AdminVideoCourseForm({ onCourseCreated }: AdminVideoCourseFormProps) {
  const [formData, setFormData] = useState<VideoCourseFormData>({
    title: "",
    description: "",
    category: "",
    difficulty: "beginner",
    duration: "",
    price: 0,
  })
  
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()

  const handleInputChange = (field: keyof VideoCourseFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file",
          variant: "destructive",
        })
        return
      }
      
      if (selectedFile.size > 500 * 1024 * 1024) { // 500MB limit
        toast({
          title: "File too large",
          description: "Please select a video file smaller than 500MB",
          variant: "destructive",
        })
        return
      }
      
      setVideoFile(selectedFile)
    }
  }

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select an image file smaller than 10MB",
          variant: "destructive",
        })
        return
      }
      
      setThumbnailFile(selectedFile)
    }
  }

  const uploadThumbnail = async (): Promise<string | null> => {
    if (!thumbnailFile) return null

    try {
      const result = await cloudinary.uploadImage(thumbnailFile)
      setFormData(prev => ({
        ...prev,
        thumbnailUrl: result.secure_url,
        thumbnailPublicId: result.public_id
      }))
      return result.secure_url
    } catch (error) {
      toast({
        title: "Thumbnail upload failed",
        description: "Failed to upload thumbnail image",
        variant: "destructive",
      })
      return null
    }
  }

  const createVideoCourse = async () => {
    if (!formData.title || !formData.description || !videoFile) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select a video file",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      // Step 1: Upload thumbnail if provided
      let thumbnailUrl = formData.thumbnailUrl
      if (thumbnailFile && !thumbnailUrl) {
        thumbnailUrl = await uploadThumbnail()
        if (!thumbnailUrl) {
          throw new Error("Failed to upload thumbnail")
        }
      }
      setUploadProgress(20)

      // Step 2: Create video entry in Bunny.net
      const createVideoResponse = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: formData.title,
          description: formData.description 
        }),
      })

      const createVideoResult = await createVideoResponse.json()
      if (!createVideoResult.success) {
        throw new Error(createVideoResult.error || 'Failed to create video')
      }

      const videoId = createVideoResult.videoId
      setUploadProgress(40)

      // Step 3: Get upload URL for video
      const uploadUrlResponse = await fetch(`/api/videos/${videoId}/upload`)
      const uploadUrlResult = await uploadUrlResponse.json()
      if (!uploadUrlResult.success) {
        throw new Error(uploadUrlResult.error || 'Failed to get upload URL')
      }
      setUploadProgress(60)

      // Step 4: Upload video to Bunny.net
      const formData = new FormData()
      formData.append('video', videoFile)

      const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video file')
      }
      setUploadProgress(80)

      // Step 5: Create course entry in database
      const courseData = {
        ...formData,
        videoId,
        thumbnailUrl,
        thumbnailPublicId: formData.thumbnailPublicId,
        status: 'draft' // Courses start as drafts until approved
      }

      const createCourseResponse = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      })

      const createCourseResult = await createCourseResponse.json()
      if (!createCourseResult.success) {
        throw new Error(createCourseResult.error || 'Failed to create course')
      }

      setUploadProgress(100)

      toast({
        title: "Course created successfully!",
        description: "Your video course has been created and is pending approval.",
      })

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        difficulty: "beginner",
        duration: "",
        price: 0,
      })
      setVideoFile(null)
      setThumbnailFile(null)
      
      // Notify parent component
      if (onCourseCreated) {
        onCourseCreated(createCourseResult.courseId)
      }

    } catch (error: any) {
      console.error('Course creation failed:', error)
      toast({
        title: "Course creation failed",
        description: error.message || "An error occurred while creating the course",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const removeThumbnail = () => {
    setThumbnailFile(null)
    setFormData(prev => ({
      ...prev,
      thumbnailUrl: undefined,
      thumbnailPublicId: undefined
    }))
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Create New Video Course
        </CardTitle>
        <CardDescription>
          Admin only: Create a new video course with video upload and thumbnail image
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Course Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter course title"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              placeholder="e.g., Digital Marketing, Design, Programming"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Course Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe what students will learn in this course"
            rows={4}
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value) => handleInputChange('difficulty', value as any)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              placeholder="e.g., 8 weeks, 20 hours"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (₮)</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video">Video File *</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              id="video"
              accept="video/*"
              onChange={handleVideoFileChange}
              className="hidden"
              disabled={isSubmitting}
            />
            <label htmlFor="video" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">
                    {videoFile ? videoFile.name : "Click to select video file"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Max size: 500MB
                  </p>
                </div>
              </div>
            </label>
          </div>
          {videoFile && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              {videoFile.name} selected
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="thumbnail">Thumbnail Image (Optional)</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              id="thumbnail"
              accept="image/*"
              onChange={handleThumbnailFileChange}
              className="hidden"
              disabled={isSubmitting}
            />
            <label htmlFor="thumbnail" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Image className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">
                    {thumbnailFile ? thumbnailFile.name : "Click to select thumbnail image"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Max size: 10MB, Recommended: 1280x720
                  </p>
                </div>
              </div>
            </label>
          </div>
          {thumbnailFile && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {thumbnailFile.name} selected
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeThumbnail}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {isSubmitting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Creating course...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <Button
          onClick={createVideoCourse}
          disabled={isSubmitting || !formData.title || !formData.description || !videoFile}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Course...
            </>
          ) : (
            <>
              <Video className="h-4 w-4 mr-2" />
              Create Video Course
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          <p>Course will be created as a draft and require admin approval before publishing.</p>
        </div>
      </CardContent>
    </Card>
  )
}

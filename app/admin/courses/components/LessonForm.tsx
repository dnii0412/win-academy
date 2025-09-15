
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Loader2 } from "lucide-react"

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
    videoUrl: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || "",
        titleMn: lesson.titleMn || "",
        description: lesson.description || "",
        descriptionMn: lesson.descriptionMn || "",
        videoUrl: lesson.videoUrl || ""
      })
    } else {
      setFormData({
        title: "",
        titleMn: "",
        description: "",
        descriptionMn: "",
        videoUrl: ""
      })
    }
  }, [lesson])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    if (!formData.videoUrl.trim()) {
      alert('Please enter a Bunny video link')
      return
    }

    if (!formData.titleMn.trim()) {
      alert('Please enter a lesson title in Mongolian')
      return
    }

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

      console.log('📝 Submitting lesson data with Bunny video link:', lessonData)
      console.log('🔍 Video URL check:', {
        videoUrl: lessonData.videoUrl,
        hasVideoUrl: !!lessonData.videoUrl,
        videoUrlLength: lessonData.videoUrl?.length
      })
      console.log('🔍 Title validation:', {
        title: lessonData.title,
        titleMn: lessonData.titleMn,
        hasTitle: !!lessonData.title,
        hasTitleMn: !!lessonData.titleMn,
        titleLength: lessonData.title?.length,
        titleMnLength: lessonData.titleMn?.length
      })
      onSubmit(lessonData)
      onClose()
    } catch (error) {
      console.error('❌ Submit failed:', error)
      alert('Failed to submit lesson')
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

            {/* Bunny Video Link */}
            <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-medium">Bunny Video Link</h3>

              <div>
                <Label htmlFor="videoUrl">Bunny Video URL</Label>
                <div className="mt-2">
                  <Input
                    id="videoUrl"
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://iframe.mediadelivery.net/embed/..."
                    disabled={isSubmitting}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste YouTube or Bunny Stream URL here (e.g., https://www.youtube.com/watch?v=... or https://iframe.mediadelivery.net/embed/...)
                  </p>
                </div>
              </div>
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
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
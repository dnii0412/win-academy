"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Upload } from "lucide-react"
import { useEffect } from "react"
import ImageUpload from "@/components/ImageUpload"

interface CourseFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (courseData: any) => void
  course?: any
  mode: "create" | "edit"
}

export default function CourseForm({ isOpen, onClose, onSubmit, course, mode }: CourseFormProps) {
  const [formData, setFormData] = useState({
    title: course?.title || "",
    titleMn: course?.titleMn || "",
    description: course?.description || "",
    descriptionMn: course?.descriptionMn || "",
    shortDescription: course?.shortDescription || "",
    shortDescriptionMn: course?.shortDescriptionMn || "",
    price: course?.price || "",
    status: course?.status || "inactive",
    tags: course?.tags || [],
    tagsMn: course?.tagsMn || [],
    thumbnailUrl: course?.thumbnailUrl || "",
    thumbnailPublicId: course?.thumbnailPublicId || ""
  })

  const [newTag, setNewTag] = useState("")
  const [newTagMn, setNewTagMn] = useState("")

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addTag = () => {
    if (newTagMn.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTagMn.trim()], // Use Mongolian as both
        tagsMn: [...prev.tagsMn, newTagMn.trim()]
      }))
      setNewTag("")
      setNewTagMn("")
    }
  }

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_: any, i: number) => i !== index),
      tagsMn: prev.tagsMn.filter((_: any, i: number) => i !== index)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation - only check Mongolian fields since English fields are hidden
    if (!formData.titleMn.trim() || !formData.descriptionMn.trim()) {
      alert("Бүх талбарыг бөглөнө үү!")
      return
    }

    if (!formData.price || Number(formData.price) < 50) {
      alert("Үнэ дор хаяж ₮50 байх ёстой! (Тест бүтээгдэхүүн)")
      return
    }

    // Transform data before submitting - auto-fill English fields with Mongolian content
    const transformedData = {
      ...formData,
      title: formData.titleMn, // Use Mongolian title as English title
      titleMn: formData.titleMn, // Keep Mongolian title
      description: formData.descriptionMn, // Use Mongolian description as English description
      descriptionMn: formData.descriptionMn, // Keep Mongolian description
      shortDescription: formData.shortDescriptionMn || formData.descriptionMn, // Use Mongolian short description or fallback to description
      shortDescriptionMn: formData.shortDescriptionMn || formData.descriptionMn, // Keep Mongolian short description
      tags: formData.tagsMn, // Use Mongolian tags as English tags
      tagsMn: formData.tagsMn, // Keep Mongolian tags
      price: Number(formData.price) || 0
    }

    onSubmit(transformedData)
  }

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || "",
        titleMn: course.titleMn || "",
        description: course.description || "",
        descriptionMn: course.descriptionMn || "",
        shortDescription: course.shortDescription || "",
        shortDescriptionMn: course.shortDescriptionMn || "",
        price: course.price || "",
        status: course.status || "inactive",
        tags: course.tags || [],
        tagsMn: course.tagsMn || [],
        thumbnailUrl: course.thumbnailUrl || "",
        thumbnailPublicId: course.thumbnailPublicId || ""
      })
    }
  }, [course])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === "create" ? "Сургалт үүсгэх" : "Сургалт засах"}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Үндсэн мэдээлэл
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="titleMn">Нэр (Mongolian)</Label>
                  <Input
                    id="titleMn"
                    value={formData.titleMn}
                    onChange={(e) => handleInputChange("titleMn", e.target.value)}
                    placeholder="Сургалтын нэр"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="descriptionMn">Тайлбар (Mongolian)</Label>
                  <Textarea
                    id="descriptionMn"
                    value={formData.descriptionMn}
                    onChange={(e) => handleInputChange("descriptionMn", e.target.value)}
                    placeholder="Сургалтын тайлбар"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price" className="flex items-center gap-2">
                      Price
                      <span className="text-xs text-gray-500 font-normal">
                        (₮ MNT - QPay Integration)
                      </span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price || ""}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      placeholder="Enter price in MNT (minimum ₮50)"
                      min="50"
                      step="50"
                      required
                    />
                    <div className="text-xs text-gray-600 mt-1">
                      <p>💡 This price will be used for QPay payments when users enroll in the course</p>
                      <p className="text-blue-600">🧪 Test Product: Minimum ₮50 MNT for easy testing</p>
                      {formData.price && Number(formData.price) >= 50 && (
                        <p className="mt-1 text-green-600 font-medium">
                          Preview: ₮{Number(formData.price).toLocaleString()} MNT
                        </p>
                      )}
                      {formData.price && Number(formData.price) > 0 && Number(formData.price) < 50 && (
                        <p className="mt-1 text-red-600 font-medium">
                          ⚠️ Too low: Minimum ₮50 required
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Thumbnail Upload */}
                <div>
                  <Label className="text-base font-medium mb-3 block">
                    Сургалтын зураг
                  </Label>
                  <ImageUpload
                    onUploadSuccess={(url, publicId) => {
                      handleInputChange("thumbnailUrl", url)
                      handleInputChange("thumbnailPublicId", publicId)
                    }}
                    onUploadError={(error) => {
                      console.error("Upload error:", error)
                    }}
                    onDelete={(publicId) => {
                      handleInputChange("thumbnailUrl", "")
                      handleInputChange("thumbnailPublicId", "")
                    }}
                    currentImageUrl={formData.thumbnailUrl}
                    currentPublicId={formData.thumbnailPublicId}
                    folder="course-thumbnails"
                    maxSizeInMB={5}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>



            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tag (Mongolian)</Label>
                  <Input
                    value={newTagMn}
                    onChange={(e) => setNewTagMn(e.target.value)}
                    placeholder="Монгол хэл дээр бичнэ үү"
                  />
                </div>
                <Button type="button" onClick={addTag} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tag
                </Button>

                <div className="flex flex-wrap gap-2">
                  {formData.tagsMn.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTag(index)}
                        className="h-4 w-4 p-0 ml-1"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>



            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Цуцлах
              </Button>
              <Button type="submit">
                {mode === "create" ? "Үүсгэх" : "Хадгалах"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

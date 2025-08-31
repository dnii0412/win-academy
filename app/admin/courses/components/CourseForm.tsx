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
import { useLanguage } from "@/contexts/language-context"
import { useEffect } from "react"

interface CourseFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (courseData: any) => void
  course?: any
  mode: "create" | "edit"
}

export default function CourseForm({ isOpen, onClose, onSubmit, course, mode }: CourseFormProps) {
  const { currentLanguage } = useLanguage()
  const [formData, setFormData] = useState({
    title: course?.title || "",
    titleMn: course?.titleMn || "",
    description: course?.description || "",
    descriptionMn: course?.descriptionMn || "",
    shortDescription: course?.shortDescription || "",
    shortDescriptionMn: course?.shortDescriptionMn || "",
    price: course?.price || "",
    status: course?.status || "draft",
    tags: course?.tags || [],
    tagsMn: course?.tagsMn || [],
    thumbnailUrl: course?.thumbnailUrl || ""
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
    if (newTag.trim() && newTagMn.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
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
    
    // Client-side validation
    if (!formData.title.trim() || !formData.titleMn.trim() || !formData.description.trim() || !formData.descriptionMn.trim()) {
      alert(currentLanguage === "mn" ? "Бүх талбарыг бөглөнө үү!" : "Please fill in all required fields!")
      return
    }
    
    if (!formData.price || Number(formData.price) <= 0) {
      alert(currentLanguage === "mn" ? "Зөв үнэ оруулна уу!" : "Please enter a valid price!")
      return
    }
    
    // Transform data before submitting
    const transformedData = {
      ...formData,
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
        status: course.status || "draft",
        tags: course.tags || [],
        tagsMn: course.tagsMn || [],
        thumbnailUrl: course.thumbnailUrl || ""
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
              {mode === "create" 
                ? (currentLanguage === "mn" ? "Сургалт үүсгэх" : "Create Course")
                : (currentLanguage === "mn" ? "Сургалт засах" : "Edit Course")
              }
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
                    {currentLanguage === "mn" ? "Үндсэн мэдээлэл" : "Basic Information"}
                  </CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title (English)</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Course title in English"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="titleMn">Title (Mongolian)</Label>
                    <Input
                      id="titleMn"
                      value={formData.titleMn}
                      onChange={(e) => handleInputChange("titleMn", e.target.value)}
                      placeholder="Сургалтын нэр"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="description">Description (English)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Course description in English"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="descriptionMn">Description (Mongolian)</Label>
                    <Textarea
                      id="descriptionMn"
                      value={formData.descriptionMn}
                      onChange={(e) => handleInputChange("descriptionMn", e.target.value)}
                      placeholder="Сургалтын тайлбар"
                      rows={3}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price || 0}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                </div>

                {/* Thumbnail Upload */}
                <div>
                  <Label htmlFor="thumbnail">Course Thumbnail</Label>
                  <div className="mt-2">
                    <Input
                      id="thumbnail"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          // For now, just store the file name
                          // You can implement actual file upload logic here
                          handleInputChange("thumbnailUrl", file.name)
                        }
                      }}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload a thumbnail image for the course (JPG, PNG, GIF)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tag (English)</Label>
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Enter tag in English"
                    />
                  </div>
                  <div>
                    <Label>Tag (Mongolian)</Label>
                    <Input
                      value={newTagMn}
                      onChange={(e) => setNewTagMn(e.target.value)}
                      placeholder="Монгол хэл дээр бичнэ үү"
                    />
                  </div>
                </div>
                <Button type="button" onClick={addTag} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tag
                </Button>

                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag} / {formData.tagsMn[index]}
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
                {currentLanguage === "mn" ? "Цуцлах" : "Cancel"}
              </Button>
              <Button type="submit">
                {mode === "create" 
                  ? (currentLanguage === "mn" ? "Үүсгэх" : "Create Course")
                  : (currentLanguage === "mn" ? "Хадгалах" : "Save Changes")
                }
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

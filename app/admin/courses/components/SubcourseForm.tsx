"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

interface SubcourseFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (subcourseData: any) => void
  subcourse?: any
  mode: "create" | "edit"
  courseId: string
}

export default function SubcourseForm({ isOpen, onClose, onSubmit, subcourse, mode, courseId }: SubcourseFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    titleMn: "",
    description: "",
    descriptionMn: ""
  })

  useEffect(() => {
    if (subcourse) {
      setFormData({
        title: subcourse.title || "",
        titleMn: subcourse.titleMn || "",
        description: subcourse.description || "",
        descriptionMn: subcourse.descriptionMn || ""
      })
    } else {
      setFormData({
        title: "",
        titleMn: "",
        description: "",
        descriptionMn: ""
      })
    }
  }, [subcourse])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Auto-fill English fields with Mongolian content
    const subcourseData = {
      ...formData,
      title: formData.titleMn, // Use Mongolian title as English title
      description: formData.descriptionMn // Use Mongolian description as English description
    }
    
    onSubmit(subcourseData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === "create" ? "Дэд сургалт үүсгэх" : "Дэд сургалт засах"}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
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
                rows={4}
              />
            </div>





            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4">
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

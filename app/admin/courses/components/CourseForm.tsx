"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Upload, X } from "lucide-react"
import { useEffect } from "react"
import ImageUpload from "@/components/ImageUpload"

interface CourseFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (courseData: any) => void
  course?: any
  mode: "create" | "edit"
  addToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void
}

export default function CourseForm({ isOpen, onClose, onSubmit, course, mode, addToast }: CourseFormProps) {
  const [formData, setFormData] = useState({
    title: course?.title || "",
    titleMn: course?.titleMn || "",
    description: course?.description || "",
    descriptionMn: course?.descriptionMn || "",
    shortDescription: course?.shortDescription || "",
    shortDescriptionMn: course?.shortDescriptionMn || "",
    price: course?.price || "",
    price45Days: course?.price45Days !== undefined ? course.price45Days : "",
    price90Days: course?.price90Days !== undefined ? course.price90Days : "",
    originalPrice: course?.originalPrice !== undefined ? course.originalPrice : "",
    originalPrice45Days: course?.originalPrice45Days !== undefined ? course.originalPrice45Days : "",
    originalPrice90Days: course?.originalPrice90Days !== undefined ? course.originalPrice90Days : "",
    status: course?.status || "inactive",
    thumbnailUrl: course?.thumbnailUrl || "",
    thumbnailPublicId: course?.thumbnailPublicId || ""
  })


  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation - only check Mongolian fields since English fields are hidden
    if (!formData.titleMn.trim() || !formData.descriptionMn.trim()) {
      if (addToast) {
        addToast('error', 'Validation Error', 'Бүх талбарыг бөглөнө үү!')
      } else {
        alert("Бүх талбарыг бөглөнө үү!")
      }
      return
    }

    if (!formData.price45Days || formData.price45Days === "" || Number(formData.price45Days) < 50) {
      if (addToast) {
        addToast('error', 'Validation Error', '45 хоногийн үнэ дор хаяж ₮50 байх ёстой! (Тест бүтээгдэхүүн)')
      } else {
        alert("45 хоногийн үнэ дор хаяж ₮50 байх ёстой! (Тест бүтээгдэхүүн)")
      }
      return
    }

    if (!formData.price90Days || formData.price90Days === "" || Number(formData.price90Days) < 50) {
      if (addToast) {
        addToast('error', 'Validation Error', '90 хоногийн үнэ дор хаяж ₮50 байх ёстой! (Тест бүтээгдэхүүн)')
      } else {
        alert("90 хоногийн үнэ дор хаяж ₮50 байх ёстой! (Тест бүтээгдэхүүн)")
      }
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
      price: Number(formData.price45Days), // Use 45-day price as default price
      price45Days: Number(formData.price45Days),
      price90Days: Number(formData.price90Days),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      originalPrice45Days: formData.originalPrice45Days ? Number(formData.originalPrice45Days) : undefined,
      originalPrice90Days: formData.originalPrice90Days ? Number(formData.originalPrice90Days) : undefined
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
        price45Days: course.price45Days !== undefined ? course.price45Days : "",
        price90Days: course.price90Days !== undefined ? course.price90Days : "",
        originalPrice: course.originalPrice !== undefined ? course.originalPrice : "",
        originalPrice45Days: course.originalPrice45Days !== undefined ? course.originalPrice45Days : "",
        originalPrice90Days: course.originalPrice90Days !== undefined ? course.originalPrice90Days : "",
        status: course.status || "inactive",
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
                    <Label htmlFor="price45Days" className="flex items-center gap-2">
                      45 хоногийн үнэ
                      <span className="text-xs text-gray-500 font-normal">
                        (₮ MNT - QPay Integration)
                      </span>
                    </Label>
                    <Input
                      id="price45Days"
                      type="number"
                      value={formData.price45Days || ""}
                      onChange={(e) => handleInputChange("price45Days", e.target.value)}
                      placeholder="45 хоногийн үнэ (₮50-аас дээш)"
                      min="50"
                      step="50"
                      required
                    />
                    <div className="text-xs text-gray-600 mt-1">
                      <p>💡 45 хоногийн хандалтын үнэ</p>
                      <p className="text-gray-600 dark:text-gray-400">🧪 Тест: Дор хаяж ₮50 MNT</p>
                      {formData.price45Days && Number(formData.price45Days) >= 50 && (
                        <p className="mt-1 text-green-600 font-medium">
                          Урьдчилан харах: ₮{Number(formData.price45Days).toLocaleString()} MNT
                        </p>
                      )}
                      {formData.price45Days && Number(formData.price45Days) > 0 && Number(formData.price45Days) < 50 && (
                        <p className="mt-1 text-red-600 font-medium">
                          ⚠️ Хэт бага: Дор хаяж ₮50 шаардлагатай
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="price90Days" className="flex items-center gap-2">
                      90 хоногийн үнэ
                      <span className="text-xs text-gray-500 font-normal">
                        (₮ MNT - QPay Integration)
                      </span>
                    </Label>
                    <Input
                      id="price90Days"
                      type="number"
                      value={formData.price90Days || ""}
                      onChange={(e) => handleInputChange("price90Days", e.target.value)}
                      placeholder="90 хоногийн үнэ (₮50-аас дээш)"
                      min="50"
                      step="50"
                      required
                    />
                    <div className="text-xs text-gray-600 mt-1">
                      <p>💡 90 хоногийн хандалтын үнэ</p>
                      <p className="text-gray-600 dark:text-gray-400">🧪 Тест: Дор хаяж ₮50 MNT</p>
                      {formData.price90Days && Number(formData.price90Days) >= 50 && (
                        <p className="mt-1 text-green-600 font-medium">
                          Урьдчилан харах: ₮{Number(formData.price90Days).toLocaleString()} MNT
                        </p>
                      )}
                      {formData.price90Days && Number(formData.price90Days) > 0 && Number(formData.price90Days) < 50 && (
                        <p className="mt-1 text-red-600 font-medium">
                          ⚠️ Хэт бага: Дор хаяж ₮50 шаардлагатай
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Original Prices (Optional) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="originalPrice45Days" className="flex items-center gap-2">
                      45 хоногийн анхны үнэ (сонголт)
                      <span className="text-xs text-gray-500 font-normal">
                        (Хөнгөлөлт харуулах)
                      </span>
                    </Label>
                    <Input
                      id="originalPrice45Days"
                      type="number"
                      value={formData.originalPrice45Days || ""}
                      onChange={(e) => handleInputChange("originalPrice45Days", e.target.value)}
                      placeholder="45 хоногийн анхны үнэ"
                      min="0"
                      step="50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="originalPrice90Days" className="flex items-center gap-2">
                      90 хоногийн анхны үнэ (сонголт)
                      <span className="text-xs text-gray-500 font-normal">
                        (Хөнгөлөлт харуулах)
                      </span>
                    </Label>
                    <Input
                      id="originalPrice90Days"
                      type="number"
                      value={formData.originalPrice90Days || ""}
                      onChange={(e) => handleInputChange("originalPrice90Days", e.target.value)}
                      placeholder="90 хоногийн анхны үнэ"
                      min="0"
                      step="50"
                    />
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

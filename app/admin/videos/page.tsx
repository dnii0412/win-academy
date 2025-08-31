"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Upload, Video, Settings } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import TUSUploader from "@/components/video-upload/TUSUploader"
import VideoLibrary from "@/components/video-upload/VideoLibrary"

export default function AdminVideosPage() {
  const { currentLanguage } = useLanguage()
  const [showUploader, setShowUploader] = useState(false)

  const handleUploadComplete = (videoId: string, videoUrl: string) => {
    console.log('Video upload completed:', { videoId, videoUrl })
    // You can add additional logic here, such as:
    // - Adding the video to a course
    // - Updating the video library
    // - Showing a success notification
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {currentLanguage === "mn" ? "Видео удирдлага" : "Video Management"}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {currentLanguage === "mn" 
                  ? "Bunny Stream ашиглан видео байршуулах, удирдах"
                  : "Upload and manage videos using Bunny Stream"
                }
              </p>
            </div>
            <Button onClick={() => setShowUploader(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              {currentLanguage === "mn" ? "Видео байршуулах" : "Upload Video"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {currentLanguage === "mn" ? "Нийт видео" : "Total Videos"}
              </CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                {currentLanguage === "mn" ? "Бүх байршуулсан видео" : "All uploaded videos"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {currentLanguage === "mn" ? "Бэлэн видео" : "Ready Videos"}
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                {currentLanguage === "mn" ? "Стрим хийхэд бэлэн" : "Ready for streaming"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {currentLanguage === "mn" ? "Нийт хэмжээ" : "Total Size"}
              </CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 GB</div>
              <p className="text-xs text-muted-foreground">
                {currentLanguage === "mn" ? "Бүх видеоны хэмжээ" : "Size of all videos"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Video Library */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              {currentLanguage === "mn" ? "Видео сан" : "Video Library"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VideoLibrary />
          </CardContent>
        </Card>
      </div>

      {/* Video Upload Modal */}
      {showUploader && (
        <TUSUploader
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUploader(false)}
        />
      )}
    </div>
  )
}

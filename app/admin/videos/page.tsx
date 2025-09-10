"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Upload, Video, Settings, X } from "lucide-react"
import VideoLibrary from "@/components/video-upload/VideoLibrary"

export default function AdminVideosPage() {
  const [showUploader, setShowUploader] = useState(false)
  const [videoData, setVideoData] = useState({
    title: "",
    description: "",
    videoUrl: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!videoData.videoUrl.trim()) {
      alert('Please enter a Bunny video link')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Here you would typically save the video data to your database
      console.log('Saving video data:', videoData)
      
      // Reset form
      setVideoData({ title: "", description: "", videoUrl: "" })
      setShowUploader(false)
      
      alert('Video added successfully!')
    } catch (error) {
      console.error('Failed to save video:', error)
      alert('Failed to save video')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {"Видео удирдлага"}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {"Bunny Stream холбоос ашиглан видео нэмэх, удирдах"
                }
              </p>
            </div>
            <Button onClick={() => setShowUploader(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              {"Видео нэмэх"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {"Нийт видео"}
              </CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                {"Бүх байршуулсан видео"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {"Бэлэн видео"}
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                {"Стрим хийхэд бэлэн"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {"Нийт хэмжээ"}
              </CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 GB</div>
              <p className="text-xs text-muted-foreground">
                {"Бүх видеоны хэмжээ"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Video Library */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              {"Видео сан"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VideoLibrary />
          </CardContent>
        </Card>
      </div>

      {/* Video Add Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Add Bunny Video
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowUploader(false)} disabled={isSubmitting}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="title">Video Title</Label>
                  <Input
                    id="title"
                    value={videoData.title}
                    onChange={(e) => setVideoData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter video title"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={videoData.description}
                    onChange={(e) => setVideoData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter video description"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="videoUrl">Bunny Video URL</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    value={videoData.videoUrl}
                    onChange={(e) => setVideoData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=... or https://iframe.mediadelivery.net/embed/..."
                    disabled={isSubmitting}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste YouTube or Bunny Stream URL here (e.g., https://www.youtube.com/watch?v=... or https://iframe.mediadelivery.net/embed/...)
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowUploader(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Adding...
                      </>
                    ) : (
                      'Add Video'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Video, Upload } from "lucide-react"
import VideoUpload from "@/components/video-upload"
import VideoLibrary from "@/components/video-library"

export default function VideosPage() {
  const [activeTab, setActiveTab] = useState("library")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploadComplete = (videoId: string) => {
    // Switch to library tab and refresh the video list
    setActiveTab("library")
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Video Management</h1>
        <p className="text-gray-600">
          Upload, organize, and stream your video content with Bunny.net integration.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video Library
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Video
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Your Videos</h2>
            <Button
              onClick={() => setActiveTab("upload")}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Upload New Video
            </Button>
          </div>
          
          <VideoLibrary key={refreshTrigger} />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Upload Video</h2>
            <Button
              variant="outline"
              onClick={() => setActiveTab("library")}
            >
              Back to Library
            </Button>
          </div>
          
          <VideoUpload onUploadComplete={handleUploadComplete} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

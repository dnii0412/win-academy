"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Video, 
  Play, 
  Clock, 
  Download, 
  Trash2, 
  Copy,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { BUNNY_STREAM_CONFIG, getBunnyStreamUrl, getBunnyThumbnailUrl } from "@/lib/bunny-stream"

interface BunnyVideo {
  guid: string
  title: string
  description?: string
  status: string
  duration: number
  size: number
  dateCreated: string
  dateUpdated: string
  thumbnailUrl?: string
  videoUrl?: string
}

export default function VideoLibrary() {
  const [videos, setVideos] = useState<BunnyVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch(`${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos`, {
        headers: {
          'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setVideos(data.data || [])
      }
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  const deleteVideo = async (videoId: string) => {
    if (!confirm("Видеог устгахдаа итгэлтэй байна уу?")) {
      return
    }

    try {
      const response = await fetch(`${BUNNY_STREAM_CONFIG.baseUrl}/library/${BUNNY_STREAM_CONFIG.libraryId}/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'AccessKey': BUNNY_STREAM_CONFIG.apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setVideos(prev => prev.filter(video => video.guid !== videoId))
        alert("Видео амжилттай устгагдлаа")
      }
    } catch (error) {
      alert("Видео устгахад алдаа гарлаа")
    }
  }

  const copyVideoId = async (videoId: string) => {
    try {
      await navigator.clipboard.writeText(videoId)
      setCopiedId(videoId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
    }
  }

  const copyStreamUrl = async (videoId: string) => {
    try {
      const streamUrl = getBunnyStreamUrl(videoId)
      await navigator.clipboard.writeText(streamUrl)
      alert("Стрим URL хуулж авлаа")
    } catch (error) {
    }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ready</Badge>
      case 'encoding':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Encoding</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Видео хайх..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Video Count */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Видео сан
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {filteredVideos.length} видео
        </span>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <Card key={video.guid} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Video className="h-16 w-16 text-gray-400" />
                </div>
              )}
              
              {/* Status Overlay */}
              <div className="absolute top-2 right-2">
                {getStatusBadge(video.status)}
              </div>

              {/* Duration Overlay */}
              {video.duration > 0 && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(video.duration)}
                </div>
              )}
            </div>

            {/* Video Info */}
            <CardHeader className="pb-3">
              <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
              {video.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {video.description}
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Video Details */}
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(video.dateCreated)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>{formatFileSize(video.size)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyVideoId(video.guid)}
                  className="flex-1"
                >
                  {copiedId === video.guid ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Хуулсан
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      ID хуулах
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyStreamUrl(video.guid)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  URL
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => deleteVideo(video.guid)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Videos */}
      {filteredVideos.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm 
                ? "Хайлтад тохирох видео олдсонгүй"
                : "Видео байхгүй байна"
              }
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Анхны видеог байршуулж эхлээрэй
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

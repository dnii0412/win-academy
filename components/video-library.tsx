"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Clock, HardDrive, Trash2, RefreshCw, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import VideoPlayer from "./video-player"
import { BunnyVideo } from "@/lib/bunny-stream"

export default function VideoLibrary() {
    const [videos, setVideos] = useState<BunnyVideo[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedVideo, setSelectedVideo] = useState<BunnyVideo | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        fetchVideos()
    }, [])

    const fetchVideos = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch('/api/videos')
            const result = await response.json()

            if (result.success) {
                setVideos(result.videos)
            } else {
                setError(result.error || 'Failed to fetch videos')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch videos')
        } finally {
            setIsLoading(false)
        }
    }

    const deleteVideo = async (videoId: string) => {
        if (!confirm('Are you sure you want to delete this video?')) {
            return
        }

        try {
            const response = await fetch(`/api/videos/${videoId}`, {
                method: 'DELETE',
            })

            const result = await response.json()

            if (result.success) {
                toast({
                    title: "Video deleted",
                    description: "Video has been removed from your library",
                })
                // Remove from local state
                setVideos(videos.filter(v => v.id !== videoId))
                // Clear selection if it was the deleted video
                if (selectedVideo?.id === videoId) {
                    setSelectedVideo(null)
                }
            } else {
                throw new Error(result.error || 'Failed to delete video')
            }
        } catch (err: any) {
            toast({
                title: "Delete failed",
                description: err.message || "Failed to delete video",
                variant: "destructive",
            })
        }
    }

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    const formatFileSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024)
        if (mb >= 1) {
            return `${mb.toFixed(1)} MB`
        }
        const kb = bytes / 1024
        return `${kb.toFixed(1)} KB`
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ready':
                return 'bg-green-100 text-green-800'
            case 'encoding':
                return 'bg-yellow-100 text-yellow-800'
            case 'error':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Loading videos...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Error Loading Videos</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={fetchVideos} variant="outline">
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    if (videos.length === 0) {
        return (
            <div className="text-center p-8">
                <h3 className="text-lg font-semibold mb-2">No Videos Yet</h3>
                <p className="text-gray-600">Upload your first video to get started!</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Selected Video Player */}
            {selectedVideo && (
                <div className="mb-6">
                    <VideoPlayer
                        videoId={selectedVideo.id}
                        title={selectedVideo.title}
                        description={selectedVideo.description}
                        className="w-full"
                    />
                    <div className="mt-4 flex justify-between items-center">
                        <h3 className="text-lg font-semibold">{selectedVideo.title}</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVideo(null)}
                        >
                            Close Player
                        </Button>
                    </div>
                </div>
            )}

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                    <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative">
                            {/* Thumbnail */}
                            <div className="aspect-video bg-gray-200 relative">
                                {video.thumbnailUrl ? (
                                    <img
                                        src={video.thumbnailUrl}
                                        alt={video.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                        <Play className="h-12 w-12 text-gray-500" />
                                    </div>
                                )}

                                {/* Play Button Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-all">
                                    <Button
                                        size="lg"
                                        variant="secondary"
                                        className="opacity-0 hover:opacity-100 transition-opacity"
                                        onClick={() => setSelectedVideo(video)}
                                    >
                                        <Play className="h-6 w-6 mr-2" />
                                        Play
                                    </Button>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="absolute top-2 right-2">
                                <Badge className={getStatusColor(video.status)}>
                                    {video.status}
                                </Badge>
                            </div>
                        </div>

                        <CardContent className="p-4">
                            <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                                {video.title}
                            </h3>

                            {video.description && (
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                    {video.description}
                                </p>
                            )}

                            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {formatDuration(video.duration)}
                                </div>
                                <div className="flex items-center gap-1">
                                    <HardDrive className="h-4 w-4" />
                                    {formatFileSize(video.size)}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <Button
                                    size="sm"
                                    onClick={() => setSelectedVideo(video)}
                                    disabled={video.status !== 'ready'}
                                >
                                    <Play className="h-4 w-4 mr-2" />
                                    {video.status === 'ready' ? 'Play' : 'Processing...'}
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deleteVideo(video.id)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

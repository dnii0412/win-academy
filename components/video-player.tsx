"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
    videoId: string
    title?: string
    description?: string
    autoPlay?: boolean
    className?: string
}

export default function VideoPlayer({
    videoId,
    title,
    description,
    autoPlay = false,
    className
}: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [streamUrl, setStreamUrl] = useState<string | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchStreamUrl()
    }, [videoId])

    const fetchStreamUrl = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch(`/api/videos/${videoId}/stream`)
            const result = await response.json()

            if (result.success) {
                setStreamUrl(result.streamUrl)
            } else {
                setError(result.error || 'Failed to get stream URL')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch video stream')
        } finally {
            setIsLoading(false)
        }
    }

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    const handleVideoLoad = () => {
        setIsLoading(false)
        if (autoPlay) {
            setIsPlaying(true)
        }
    }

    const handleVideoError = () => {
        setError('Failed to load video')
        setIsLoading(false)
    }

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setIsPlaying(!videoRef.current.paused)
        }
    }

    if (error) {
        return (
            <Card className={cn("w-full", className)}>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Video Error</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={fetchStreamUrl} variant="outline">
                        Retry
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={cn("w-full", className)} ref={containerRef}>
            <CardHeader>
                {title && <CardTitle>{title}</CardTitle>}
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="p-0">
                <div className="relative bg-black rounded-lg overflow-hidden">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
                            <div className="text-center text-white">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                <p>Loading video...</p>
                            </div>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        src={streamUrl || undefined}
                        className="w-full h-auto"
                        onLoadedData={handleVideoLoad}
                        onError={handleVideoError}
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        playsInline
                    />

                    {/* Video Controls */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={togglePlay}
                                    className="text-white hover:bg-white/20"
                                >
                                    {isPlaying ? (
                                        <Pause className="h-4 w-4" />
                                    ) : (
                                        <Play className="h-4 w-4" />
                                    )}
                                </Button>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={toggleMute}
                                    className="text-white hover:bg-white/20"
                                >
                                    {isMuted ? (
                                        <VolumeX className="h-4 w-4" />
                                    ) : (
                                        <Volume2 className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={toggleFullscreen}
                                className="text-white hover:bg-white/20"
                            >
                                <Maximize className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

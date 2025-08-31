"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, PictureInPicture } from "lucide-react"

interface VideoPlayerProps {
  videoUrl: string
  title: string
  onProgressUpdate?: (progress: number) => void
  onComplete?: () => void
}

export function VideoPlayer({ videoUrl, title, onProgressUpdate, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      onComplete?.()
    }

    video.addEventListener("timeupdate", updateTime)
    video.addEventListener("loadedmetadata", updateDuration)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("timeupdate", updateTime)
      video.removeEventListener("loadedmetadata", updateDuration)
      video.removeEventListener("ended", handleEnded)
    }
  }, [onComplete])

  useEffect(() => {
    if (duration > 0) {
      const progress = (currentTime / duration) * 100
      onProgressUpdate?.(progress)
    }
  }, [currentTime, duration, onProgressUpdate])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault()
          togglePlay()
          break
        case "j":
          e.preventDefault()
          skipBackward()
          break
        case "l":
          e.preventDefault()
          skipForward()
          break
        case "m":
          e.preventDefault()
          toggleMute()
          break
        case "f":
          e.preventDefault()
          toggleFullscreen()
          break
        case "arrowleft":
          e.preventDefault()
          videoRef.current.currentTime -= 5
          break
        case "arrowright":
          e.preventDefault()
          videoRef.current.currentTime += 5
          break
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [])

  const togglePlay = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 10
    }
  }

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += 10
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * duration
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const togglePictureInPicture = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture()
        } else {
          await videoRef.current.requestPictureInPicture()
        }
      } catch (error) {
        console.error("Picture-in-picture failed:", error)
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div
      className="relative bg-black group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video ref={videoRef} className="w-full aspect-video" poster="/video-thumbnail.png" onClick={togglePlay}>
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Video Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={skipBackward} className="text-white hover:bg-white/20">
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={togglePlay} className="text-white hover:bg-white/20">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            <Button variant="ghost" size="sm" onClick={skipForward} className="text-white hover:bg-white/20">
              <SkipForward className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2 ml-4">
              <Button variant="ghost" size="sm" onClick={toggleMute} className="text-white hover:bg-white/20">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <div className="w-20">
                <Slider value={[isMuted ? 0 : volume * 100]} onValueChange={handleVolumeChange} max={100} step={1} />
              </div>
            </div>

            <span className="text-white text-sm ml-4">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Playback Speed */}
            <select
              value={playbackRate}
              onChange={(e) => changePlaybackRate(Number(e.target.value))}
              className="bg-transparent text-white text-sm border border-white/20 rounded px-2 py-1"
            >
              <option value={0.5} className="text-black">
                0.5x
              </option>
              <option value={0.75} className="text-black">
                0.75x
              </option>
              <option value={1} className="text-black">
                1x
              </option>
              <option value={1.25} className="text-black">
                1.25x
              </option>
              <option value={1.5} className="text-black">
                1.5x
              </option>
              <option value={2} className="text-black">
                2x
              </option>
            </select>

            <Button variant="ghost" size="sm" onClick={togglePictureInPicture} className="text-white hover:bg-white/20">
              <PictureInPicture className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {!duration && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  )
}

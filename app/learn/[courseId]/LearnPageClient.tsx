"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, Play, BookOpen, ChevronLeft, ChevronRight, ChevronDown, AlertCircle } from "lucide-react"
import { Course } from "@/types/course"

// Helper functions for video URL handling
function isYouTubeUrl(url: string | undefined): boolean {
  if (!url) return false
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function isBunnyStreamUrl(url: string | undefined): boolean {
  if (!url) return false
  
  // Check for various Bunny Stream URL patterns
  const bunnyPatterns = [
    'iframe.mediadelivery.net',
    'bunnyinfra.net', 
    'mediadelivery.net',
    'bunny.net',
    'bunnycdn.com',
    'video.bunnycdn.com'
  ]
  
  const isBunny = bunnyPatterns.some(pattern => url.toLowerCase().includes(pattern.toLowerCase()))
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 Bunny URL detection:', {
      url,
      isBunny,
      patterns: bunnyPatterns
    })
  }
  
  return isBunny
}

function convertYouTubeToEmbed(url: string | undefined): string {
  if (!url) return ''
  
  let videoId = ''
  
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0] || ''
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || ''
  }
  
  return `https://www.youtube.com/embed/${videoId}`
}

function optimizeBunnyStreamUrl(url: string | undefined, retryCount: number = 0): string {
  if (!url) return ''
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Optimizing Bunny URL:', { url, retryCount })
  }
  
  // If it's already a Bunny Stream embed URL, optimize it
  if (url.includes('iframe.mediadelivery.net') || url.includes('bunnyinfra.net')) {
    // Check if it's a play URL and convert to embed URL
    if (url.includes('/play/')) {
      const playMatch = url.match(/\/play\/(\d+)\/([^/?]+)/)
      if (playMatch) {
        const [, libraryId, videoId] = playMatch
        const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`
        const params = new URLSearchParams({
          autoplay: 'false',
          muted: 'false',
          controls: 'true',
          responsive: 'true',
          fit: 'cover',
          background: '000000',
          width: '100%',
          height: '100%',
          retry: retryCount.toString()
        })
        const optimizedUrl = `${embedUrl}?${params.toString()}`
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Converted play URL to embed URL:', optimizedUrl)
        }
        return optimizedUrl
      }
    }
    
    const baseUrl = url.split('?')[0] // Remove existing query params
    const params = new URLSearchParams({
      autoplay: 'false',
      muted: 'false',
      controls: 'true',
      responsive: 'true',
      fit: 'cover',
      background: '000000',
      width: '100%',
      height: '100%',
      retry: retryCount.toString()
    })
    const optimizedUrl = `${baseUrl}?${params.toString()}`
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Optimized Bunny URL:', optimizedUrl)
    }
    return optimizedUrl
  }
  
  // If it's a direct Bunny video URL, convert to embed format
  if (url.includes('bunny.net') || url.includes('bunnycdn.com') || url.includes('mediadelivery.net')) {
    // Try to extract video ID from various URL formats
    let videoId = ''
    
    // Pattern 1: https://iframe.mediadelivery.net/embed/486981/video-id
    const embedMatch = url.match(/\/embed\/\d+\/([^/?]+)/)
    if (embedMatch) {
      videoId = embedMatch[1]
    }
    
    // Pattern 2: https://video.bunnycdn.com/library/486981/videos/video-id
    const libraryMatch = url.match(/\/videos\/([^/?]+)/)
    if (libraryMatch) {
      videoId = libraryMatch[1]
    }
    
    // Pattern 3: Direct video ID
    if (!videoId && url.length < 50 && !url.includes('http')) {
      videoId = url
    }
    
    if (videoId) {
      const embedUrl = `https://iframe.mediadelivery.net/embed/486981/${videoId}`
      const params = new URLSearchParams({
        autoplay: 'false',
        muted: 'false',
        controls: 'true',
        responsive: 'true',
        fit: 'cover',
        background: '000000',
        width: '100%',
        height: '100%',
        retry: retryCount.toString()
      })
      const optimizedUrl = `${embedUrl}?${params.toString()}`
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Converted to Bunny embed URL:', optimizedUrl)
      }
      return optimizedUrl
    }
  }
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️ Could not optimize URL, returning as-is:', url)
  }
  return url
}

interface Lesson {
  _id: string
  title: string
  titleMn: string
  type: string
  duration: number
  videoUrl?: string
  videoStatus?: string
  description?: string
  descriptionMn?: string
  order: number
}

interface Subcourse {
  _id: string
  title: string
  titleMn: string
  description?: string
  descriptionMn?: string
  order: number
  status: string
  lessons: Lesson[]
}

interface LearnPageClientProps {
  course: Course | null
  subcourses: Subcourse[]
  hasAccess: boolean
  error: string | null
  courseId: string
  debug?: any
}

export default function LearnPageClient({ 
  course, 
  subcourses, 
  hasAccess, 
  error, 
  courseId,
  debug
}: LearnPageClientProps) {
  const router = useRouter()
  const { data: session } = useSession()
  
  const [isCheckingAccess, setIsCheckingAccess] = useState(false)
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [isLearning, setIsLearning] = useState(false)
  const [expandedSubcourses, setExpandedSubcourses] = useState<Set<string>>(new Set())
  const [videoError, setVideoError] = useState<string | null>(null)
  const [videoRetryCount, setVideoRetryCount] = useState(0)
  const [useDirectVideo, setUseDirectVideo] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const previousLessonsRef = useRef<Lesson[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const networkCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Network connectivity monitoring
  useEffect(() => {
    const handleOnline = () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🌐 Network back online')
      }
      setIsOnline(true)
      // Retry video if there was an error
      if (videoError) {
        setVideoError(null)
        setVideoRetryCount(0)
      }
    }

    const handleOffline = () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🌐 Network offline')
      }
      setIsOnline(false)
    }

    // Check network connectivity periodically
    const checkNetwork = async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        })
        setIsOnline(response.ok)
      } catch (error) {
        setIsOnline(false)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Check network every 30 seconds
    networkCheckRef.current = setInterval(checkNetwork, 30000)
    
    // Initial check
    checkNetwork()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (networkCheckRef.current) {
        clearInterval(networkCheckRef.current)
      }
    }
  }, [videoError])

  // Handle video errors and retry mechanism
  const handleVideoError = (error?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Video playback error detected:', error)
    }
    
    const currentLesson = allLessons[currentLessonIndex]
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Error handling debug:', {
        currentLesson: currentLesson?.videoUrl,
        useDirectVideo,
        isYouTube: isYouTubeUrl(currentLesson?.videoUrl),
        isBunny: isBunnyStreamUrl(currentLesson?.videoUrl),
        videoRetryCount,
        error: error?.message || error
      })
    }
    
    // Try direct video element as fallback for non-YouTube videos
    if (!useDirectVideo && currentLesson?.videoUrl && !isYouTubeUrl(currentLesson.videoUrl)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔄 Trying direct video element as fallback for:', currentLesson.videoUrl)
      }
      setUseDirectVideo(true)
      setVideoError(null)
      return
    }
    
    // For Bunny Stream videos, try different URL formats
    if (currentLesson?.videoUrl && isBunnyStreamUrl(currentLesson.videoUrl)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔄 Retrying Bunny Stream with different URL format:', currentLesson.videoUrl)
      }
      setVideoRetryCount(prev => prev + 1)
      setVideoError(null)
      return
    }
    
    // For direct video URLs, try different formats
    if (currentLesson?.videoUrl && !isYouTubeUrl(currentLesson.videoUrl) && !isBunnyStreamUrl(currentLesson.videoUrl)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔄 Retrying direct video with different format:', currentLesson.videoUrl)
      }
      setVideoRetryCount(prev => prev + 1)
      setVideoError(null)
      return
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('❌ Setting video error state')
    }
    setVideoError('Video playback failed. Please try refreshing the page.')
    
    // Auto-retry after 2 seconds with exponential backoff
    if (videoRetryCount < 5) {
      const retryDelay = Math.min(2000 * Math.pow(2, videoRetryCount), 10000) // Max 10 seconds
      setTimeout(() => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔄 Auto-retrying video, attempt:', videoRetryCount + 1, 'delay:', retryDelay)
        }
        setVideoRetryCount(prev => prev + 1)
        setVideoError(null)
      }, retryDelay)
    }
  }

  const retryVideo = () => {
    setVideoError(null)
    setVideoRetryCount(0)
    setUseDirectVideo(false)
  }

  // Reset video error when lesson changes
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Lesson changed to index:', currentLessonIndex)
    }
    setVideoError(null)
    setVideoRetryCount(0)
    setUseDirectVideo(false)
  }, [currentLessonIndex])

  // Add timeout for Bunny iframe loading
  useEffect(() => {
    if (isLearning && allLessons.length > 0) {
      const currentLesson = allLessons[currentLessonIndex]
      if (currentLesson?.videoUrl && isBunnyStreamUrl(currentLesson.videoUrl)) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('🕐 Setting Bunny iframe timeout for:', currentLesson.videoUrl)
        }
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
          if (process.env.NODE_ENV !== 'production') {
            console.error('⏰ Bunny iframe load timeout after 30 seconds')
            console.log('🔍 Timeout debug:', {
              videoUrl: currentLesson.videoUrl,
              optimizedUrl: optimizeBunnyStreamUrl(currentLesson.videoUrl, videoRetryCount),
              retryCount: videoRetryCount
            })
          }
          handleVideoError()
        }, 30000) // Increased to 30 seconds

        return () => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
        }
      }
    }
  }, [currentLessonIndex, isLearning, allLessons, videoRetryCount])

  const recheckAccess = async () => {
    if (!session?.user?.email) return false
    
    setIsCheckingAccess(true)
    try {
      const accessResponse = await fetch(`/api/courses/${courseId}/access`)
      if (accessResponse.ok) {
        const accessData = await accessResponse.json()
        if (process.env.NODE_ENV !== 'production') {
          console.log('Access re-check result:', {
            courseId,
            hasAccess: accessData.hasAccess,
            accessSource: accessData.accessSource,
            accessDetails: accessData.accessDetails
          })
        }
        return accessData.hasAccess
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error re-checking access:', error)
      }
    } finally {
      setIsCheckingAccess(false)
    }
    return false
  }

  const startCourse = async () => {
    if (!course) return
    
    try {
      // Fetch subcourses for this course
      const response = await fetch(`/api/courses/${courseId}/subcourses`)
      if (response.ok) {
        const data = await response.json()
        const fetchedSubcourses = data.subcourses || []
        
        if (fetchedSubcourses.length > 0) {
          // Flatten all lessons from all subcourses
          const allLessonsFromSubcourses = fetchedSubcourses.flatMap((subcourse: Subcourse) => subcourse.lessons)
          setAllLessons(allLessonsFromSubcourses)
          
          if (allLessonsFromSubcourses.length > 0) {
            // Only reset to lesson 0 if we haven't started learning yet
            if (!isLearning) {
              if (process.env.NODE_ENV !== 'production') {
                console.log('startCourse: Setting lesson index to 0 - starting fresh')
              }
              setCurrentLessonIndex(0)
            } else {
              if (process.env.NODE_ENV !== 'production') {
                console.log('startCourse: Keeping current lesson index:', currentLessonIndex)
              }
            }
            setIsLearning(true)
          } else {
            alert("Энэ сургалтад одоогоор хичээл байхгүй байна")
          }
        } else {
          alert("Энэ сургалтад одоогоор дэд сургалт байхгүй байна")
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error fetching subcourses:', error)
      }
      alert("Дэд сургалт ачаалахад алдаа гарлаа")
    }
  }

  const toggleSubcourse = (subcourseId: string) => {
    setExpandedSubcourses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(subcourseId)) {
        newSet.delete(subcourseId)
      } else {
        newSet.add(subcourseId)
      }
      return newSet
    })
  }

  // Initialize lessons when subcourses are available
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('useEffect triggered:', { hasAccess, subcoursesLength: subcourses.length, isLearning, currentLessonIndex })
    }
    
    if (hasAccess && subcourses.length > 0) {
      const allLessonsFromSubcourses = subcourses.flatMap((subcourse: Subcourse) => subcourse.lessons)
      
      // Only update if lessons have actually changed
      if (allLessonsFromSubcourses.length !== previousLessonsRef.current.length || 
          allLessonsFromSubcourses.some((lesson, index) => lesson._id !== previousLessonsRef.current[index]?._id)) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('Lessons changed, updating allLessons')
        }
        setAllLessons(allLessonsFromSubcourses)
        previousLessonsRef.current = allLessonsFromSubcourses
        
        // Only reset lesson index if we're not already learning or if current index is invalid
        if (allLessonsFromSubcourses.length > 0) {
          if (!isLearning || currentLessonIndex >= allLessonsFromSubcourses.length) {
            if (process.env.NODE_ENV !== 'production') {
              console.log('Auto-starting learning mode or resetting invalid index')
            }
            setCurrentLessonIndex(0)
            setIsLearning(true)
          } else {
            if (process.env.NODE_ENV !== 'production') {
              console.log('Keeping current lesson index:', currentLessonIndex)
            }
          }
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.log('Lessons unchanged, skipping update')
        }
      }
    }
  }, [hasAccess, subcourses, isLearning, currentLessonIndex])

  // Ensure currentLessonIndex is within bounds when allLessons changes
  useEffect(() => {
    if (allLessons.length > 0 && currentLessonIndex >= allLessons.length) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Current lesson index out of bounds, resetting to 0')
      }
      setCurrentLessonIndex(0)
    }
  }, [allLessons.length, currentLessonIndex])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Lock className="w-5 h-5" />
              Алдаа
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push("/login")} 
                className="w-full bg-[#FF344A] hover:bg-[#E02A3C]"
              >
                Нэвтрэх
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/courses")} 
                className="w-full"
              >
                Сургалтууд руу буцах
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-yellow-600" />
              Хандах эрх хэрэгтэй
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                Энэ сургалтад хандахын тулд эхлээд худалдаж авах шаардлагатай.
              </AlertDescription>
            </Alert>
            
            {course && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">
                  {course.titleMn || course.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  {course.descriptionMn || course.description}
                </p>
                <p className="text-2xl font-bold text-[#FF344A]">
                  ₮{course.price.toLocaleString()} MNT
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Button 
                onClick={() => router.push(`/checkout/${courseId}`)} 
                className="w-full bg-[#FF344A] hover:bg-[#E02A3C]"
              >
                Худалдаж авах
              </Button>
              <Button 
                onClick={recheckAccess}
                disabled={isCheckingAccess}
                variant="outline"
                className="w-full"
              >
                {isCheckingAccess ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Хандах эрх шалгаж байна...
                  </>
                ) : (
                  'Хандах эрх дахин шалгах'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/courses")} 
                className="w-full"
              >
                Сургалтууд руу буцах
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Хэрэв та төлбөр төлсөн бол "Хандах эрх дахин шалгах" товчийг дарж дахин шалгана уу.
            </p>
            
            {/* Debug information */}
            {debug && (
              <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
                <h4 className="font-bold mb-2">Debug Information:</h4>
                <p><strong>User ID:</strong> {debug.userId}</p>
                <p><strong>User Email:</strong> {debug.userEmail}</p>
                <p><strong>Course ID:</strong> {debug.courseId}</p>
                <p><strong>Course Access Exists:</strong> {debug.courseAccessExists ? 'Yes' : 'No'}</p>
                <p><strong>Any Access Exists:</strong> {debug.anyAccessExists ? 'Yes' : 'No'}</p>
                {debug.courseAccessData && (
                  <div className="mt-2">
                    <p><strong>Access Data:</strong></p>
                    <p>User ID in access: {debug.courseAccessData.userId}</p>
                    <p>Has Access: {debug.courseAccessData.hasAccess ? 'Yes' : 'No'}</p>
                    <p>Access Type: {debug.courseAccessData.accessType}</p>
                    <p>Status: {debug.courseAccessData.status}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show lesson content if in learning mode
  if (isLearning && allLessons.length > 0) {
    const currentLesson = allLessons[currentLessonIndex]
    
    // Check if currentLesson exists
    if (!currentLesson) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Хичээл олдсонгүй</h2>
            <p className="text-muted-foreground mb-4">Сонгосон хичээл байхгүй байна.</p>
            <Button onClick={() => setIsLearning(false)}>
              Буцах
            </Button>
          </div>
        </div>
      )
    }

    // Debug logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('LearnPageClient render:', {
        isLearning,
        allLessonsLength: allLessons.length,
        currentLessonIndex,
        currentLesson: currentLesson ? 'exists' : 'undefined',
        currentLessonId: currentLesson?._id,
        videoUrl: currentLesson?.videoUrl,
        videoStatus: currentLesson?.videoStatus
      })
    }

    // Create a safe reference to currentLesson
    const safeCurrentLesson = currentLesson
    
    // Final safety check
    if (!safeCurrentLesson) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('safeCurrentLesson is undefined, returning error state')
      }
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Хичээл олдсонгүй</h2>
            <p className="text-muted-foreground mb-4">Сонгосон хичээл байхгүй байна.</p>
            <Button onClick={() => setIsLearning(false)}>
              Буцах
            </Button>
          </div>
        </div>
      )
    }
    
    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="border-b border-border px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/courses")}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Буцах
              </Button>
              <div>
                <h1 className="text-xl font-semibold">
                  {course?.titleMn || course?.title}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        {/* Full-bleed container */}
        <div className="mx-[calc(50%-50vw)] w-screen py-4 md:py-6">
          {/* Optional: center content to a larger cap if you don't want true edge-to-edge on ultrawide */}
          <div className="mx-auto w-full max-w-7xl px-0 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Video/Content Area */}
              <div className="md:col-span-2 bg-transparent rounded-none md:min-h-[600px]">
                  {safeCurrentLesson?.videoUrl ? (
                    <div 
                      className="relative w-full aspect-video"
                      ref={(el) => {
                        if (el && process.env.NODE_ENV !== 'production') {
                          console.log('📐 Video container dimensions:', {
                            offsetWidth: el.offsetWidth,
                            offsetHeight: el.offsetHeight,
                            clientWidth: el.clientWidth,
                            clientHeight: el.clientHeight,
                            computedStyle: {
                              paddingTop: getComputedStyle(el).paddingTop,
                              position: getComputedStyle(el).position
                            }
                          })
                        }
                      }}
                    >
                      {(() => {
                        const isYouTube = isYouTubeUrl(safeCurrentLesson.videoUrl)
                        const isBunny = isBunnyStreamUrl(safeCurrentLesson.videoUrl)
                        if (process.env.NODE_ENV !== 'production') {
                          console.log('🎬 Rendering video:', {
                            videoUrl: safeCurrentLesson.videoUrl,
                            isYouTube,
                            isBunny,
                            useDirectVideo,
                            videoType: isYouTube ? 'YouTube' : isBunny ? 'Bunny Stream' : 'Other',
                            embedUrl: isYouTube ? convertYouTubeToEmbed(safeCurrentLesson.videoUrl) : safeCurrentLesson.videoUrl,
                            retryCount: videoRetryCount
                          })
                        }
                        return null
                      })()}
                      
                      {videoError ? (
                        <div className="absolute inset-0 bg-muted flex items-center justify-center rounded-lg" style={{ width: '100%', height: '100%' }}>
                          <div className="text-center p-6">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Video Playback Error</h3>
                            <p className="text-sm text-muted-foreground mb-4">{videoError}</p>
                            <div className="space-x-2">
                              <Button onClick={retryVideo} variant="outline" size="sm">
                                Try Again
                              </Button>
                              {!isYouTubeUrl(safeCurrentLesson?.videoUrl) && !useDirectVideo && (
                                <Button onClick={() => {
                                  if (process.env.NODE_ENV !== 'production') {
                                    console.log('🔄 Manual direct video fallback triggered')
                                  }
                                  setUseDirectVideo(true)
                                  setVideoError(null)
                                }} variant="outline" size="sm">
                                  Use Direct Video
                                </Button>
                              )}
                              <Button 
                                onClick={() => {
                                  const debugInfo = {
                                    url: safeCurrentLesson?.videoUrl,
                                    isYouTube: isYouTubeUrl(safeCurrentLesson?.videoUrl),
                                    isBunny: isBunnyStreamUrl(safeCurrentLesson?.videoUrl),
                                    useDirectVideo,
                                    retryCount: videoRetryCount,
                                    optimizedUrl: isBunnyStreamUrl(safeCurrentLesson?.videoUrl) ? 
                                      optimizeBunnyStreamUrl(safeCurrentLesson?.videoUrl, videoRetryCount) : 
                                      'N/A',
                                    containerDimensions: {
                                      width: document.querySelector('.aspect-video')?.clientWidth,
                                      height: document.querySelector('.aspect-video')?.clientHeight
                                    }
                                  }
                                  if (process.env.NODE_ENV !== 'production') {
                                    console.log('🔍 Video Debug Info:', debugInfo)
                                    
                                    // Test the Bunny URL directly
                                    if (debugInfo.isBunny && debugInfo.optimizedUrl !== 'N/A') {
                                      console.log('🧪 Testing Bunny URL in new tab:', debugInfo.optimizedUrl)
                                      window.open(debugInfo.optimizedUrl, '_blank')
                                    }
                                    
                                    alert(`Video Debug Info:\n\nURL: ${debugInfo.url}\nIs YouTube: ${debugInfo.isYouTube}\nIs Bunny: ${debugInfo.isBunny}\nUse Direct: ${debugInfo.useDirectVideo}\nRetry Count: ${debugInfo.retryCount}\nOptimized URL: ${debugInfo.optimizedUrl}\nContainer: ${debugInfo.containerDimensions.width}x${debugInfo.containerDimensions.height}`)
                                  }
                                }} 
                                variant="outline" 
                                size="sm"
                              >
                                Debug Info
                              </Button>
                              <Button onClick={() => window.location.reload()} variant="default" size="sm">
                                Refresh Page
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : useDirectVideo ? (
                        <video
                          src={safeCurrentLesson.videoUrl}
                          className="absolute inset-0 w-full h-full border-0 rounded-none"
                          controls
                          preload="auto"
                          crossOrigin="anonymous"
                          playsInline
                          style={{
                            objectFit: 'contain'
                          }}
                          onError={(e) => handleVideoError(e)}
                          onLoadStart={() => {
                            if (process.env.NODE_ENV !== 'production') {
                              console.log('🎬 Video load started')
                            }
                          }}
                          onCanPlay={() => {
                            if (process.env.NODE_ENV !== 'production') {
                              console.log('✅ Video can play')
                            }
                            setVideoError(null)
                          }}
                          onStalled={(e) => {
                            if (process.env.NODE_ENV !== 'production') {
                              console.warn('⚠️ Video stalled, attempting recovery')
                            }
                            // Try to recover from stall
                            setTimeout(() => {
                              const video = e.currentTarget
                              if (video && video.readyState < 3) {
                                video.load()
                              }
                            }, 1000)
                          }}
                          onSuspend={() => {
                            if (process.env.NODE_ENV !== 'production') {
                              console.warn('⚠️ Video suspended')
                            }
                          }}
                          onWaiting={() => {
                            if (process.env.NODE_ENV !== 'production') {
                              console.warn('⏳ Video waiting for data')
                            }
                          }}
                        >
                          <source src={safeCurrentLesson.videoUrl} type="video/mp4" />
                          <source src={safeCurrentLesson.videoUrl} type="video/webm" />
                          <source src={safeCurrentLesson.videoUrl} type="video/ogg" />
                          Your browser does not support the video tag.
                        </video>
                      ) : isBunnyStreamUrl(safeCurrentLesson.videoUrl) ? (
                        <>
                          <iframe
                            src={optimizeBunnyStreamUrl(safeCurrentLesson.videoUrl, videoRetryCount)}
                            className="absolute inset-0 w-full h-full border-0 rounded-none"
                            allowFullScreen
                            allow="autoplay; encrypted-media; accelerometer; gyroscope; fullscreen; picture-in-picture"
                            title={safeCurrentLesson?.titleMn || safeCurrentLesson?.title}
                            loading="eager"
                            referrerPolicy="no-referrer-when-downgrade"
                            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              border: 'none',
                              borderRadius: '8px',
                              background: 'transparent'
                            }}
                            onError={(e) => {
                              if (process.env.NODE_ENV !== 'production') {
                                console.error('❌ Bunny iframe error:', e)
                                console.error('❌ Bunny iframe src:', optimizeBunnyStreamUrl(safeCurrentLesson.videoUrl || '', videoRetryCount))
                                console.error('❌ Original video URL:', safeCurrentLesson.videoUrl)
                              }
                              handleVideoError()
                            }}
                            onLoad={() => {
                              if (process.env.NODE_ENV !== 'production') {
                                console.log('✅ Bunny iframe loaded successfully')
                                
                                // Clear the timeout since video loaded successfully
                                if (timeoutRef.current) {
                                  clearTimeout(timeoutRef.current)
                                  timeoutRef.current = null
                                  console.log('🕐 Cleared Bunny iframe timeout - video loaded successfully')
                                }
                                
                                setTimeout(() => {
                                  const iframe = document.querySelector('iframe[title*="' + (safeCurrentLesson?.titleMn || safeCurrentLesson?.title) + '"]') as HTMLElement
                                  const container = iframe?.parentElement as HTMLElement
                                  const parentContainer = container?.parentElement as HTMLElement
                                  
                                  console.log('🔍 Bunny iframe dimensions:', {
                                    iframe: {
                                      offsetWidth: iframe?.offsetWidth,
                                      offsetHeight: iframe?.offsetHeight,
                                      clientWidth: iframe?.clientWidth,
                                      clientHeight: iframe?.clientHeight
                                    },
                                    container: {
                                      offsetWidth: container?.offsetWidth,
                                      offsetHeight: container?.offsetHeight,
                                      clientWidth: container?.clientWidth,
                                      clientHeight: container?.clientHeight
                                    },
                                    parentContainer: {
                                      offsetWidth: parentContainer?.offsetWidth,
                                      offsetHeight: parentContainer?.offsetHeight,
                                      clientWidth: parentContainer?.clientWidth,
                                      clientHeight: parentContainer?.clientHeight
                                    }
                                  })
                                }, 100)
                              }
                            }}
                          />
                        </>
                      ) : isYouTubeUrl(safeCurrentLesson.videoUrl) ? (
                        <iframe
                          src={convertYouTubeToEmbed(safeCurrentLesson.videoUrl)}
                          className="absolute inset-0 w-full h-full border-0 rounded-none"
                          allowFullScreen
                          allow="autoplay; encrypted-media; accelerometer; gyroscope; fullscreen"
                          title={safeCurrentLesson?.titleMn || safeCurrentLesson?.title}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          onError={handleVideoError}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted flex items-center justify-center rounded-lg">
                          <div className="text-center p-6">
                            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Unsupported Video Format</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              This video format is not supported. URL: {safeCurrentLesson.videoUrl}
                            </p>
                            <Button onClick={() => setUseDirectVideo(true)} variant="outline" size="sm">
                              Try Direct Video
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
                      <div className="text-center">
                        <Play className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          Видео бэлэн биш байна
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Video URL: {safeCurrentLesson?.videoUrl || 'None'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Lesson Description - Now inside the same Card */}
                  {(safeCurrentLesson && (safeCurrentLesson.description || safeCurrentLesson.descriptionMn)) && (
                    <div className="p-6 border-t border-border">
                      <h3 className="text-lg font-semibold mb-3">
                        Хичээлийн тайлбар
                      </h3>
                      <p className="text-muted-foreground">
                        {safeCurrentLesson?.descriptionMn || safeCurrentLesson?.description}
                      </p>
                    </div>
                  )}
              </div>

            {/* Subcourses and Lessons List */}
            <div className="md:col-span-1 md:sticky md:top-4 md:self-start">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Дэд сургалтууд
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {subcourses.map((subcourse) => {
                      const isExpanded = expandedSubcourses.has(subcourse._id)
                      return (
                        <div key={subcourse._id} className="border rounded-lg">
                          {/* Subcourse Header - Clickable to expand/collapse */}
                          <div
                            onClick={() => toggleSubcourse(subcourse._id)}
                            className="p-3 cursor-pointer hover:bg-muted transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                              <h4 className="font-semibold text-sm text-foreground">
                                {subcourse.titleMn || subcourse.title}
                              </h4>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {subcourse.lessons.length} хичээл
                            </span>
                          </div>
                          
                          {/* Lessons - Only show when expanded */}
                          {isExpanded && (
                            <div className="px-3 pb-3 space-y-1">
                              {subcourse.lessons.map((lesson, lessonIndex) => {
                                const globalIndex = allLessons.findIndex(l => l._id === lesson._id)
                                return (
                                  <div
                                    key={lesson._id}
                                    onClick={() => {
                                      if (globalIndex >= 0 && globalIndex < allLessons.length) {
                                        setCurrentLessonIndex(globalIndex)
                                      }
                                    }}
                                    className={`p-2 rounded cursor-pointer transition-colors ${
                                      globalIndex === currentLessonIndex
                                        ? 'bg-[#FF344A] text-white'
                                        : 'bg-card hover:bg-muted'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                        globalIndex === currentLessonIndex
                                          ? 'bg-white text-[#FF344A]'
                                          : 'bg-muted-foreground/20 text-muted-foreground'
                                      }`}>
                                        {globalIndex + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${
                                          globalIndex === currentLessonIndex ? 'text-white' : 'text-foreground'
                                        }`}>
                                          {lesson.titleMn || lesson.title}
                                        </p>
                                        <p className={`text-xs ${
                                          globalIndex === currentLessonIndex ? 'text-gray-200' : 'text-muted-foreground'
                                        }`}>
                                          {lesson.duration > 0 ? `${Math.floor(lesson.duration / 60)}:${(lesson.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If user has access but no lessons loaded yet, show loading
  
  // This should never be reached since we handle all cases above
  return null
}
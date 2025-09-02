"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { VideoPlayer } from "@/components/course-player/video-player"
import { CurriculumSidebar } from "@/components/course-player/curriculum-sidebar"
import { NotesPanel } from "@/components/course-player/notes-panel"
import { DiscussionPanel } from "@/components/course-player/discussion-panel"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, FileText, MessageSquare, Download, AlertCircle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Course as BaseCourse, Lesson as BaseLesson } from "@/types/course"

interface Lesson extends BaseLesson {
  description: string
  descriptionMn: string
  attachments: Array<{
    id: string
    name: string
    nameMn: string
    type: string
    url: string
    size: number
  }>
}

interface Course extends Omit<BaseCourse, 'modules'> {
  modules: Array<{
    id: string
    title: string
    titleMn: string
    order: number
    lessons: Array<{
      id: string
      title: string
      titleMn: string
      slug: string
      type: "video" | "text" | "quiz" | "assignment"
      duration: number
      status: string
      order: number
      videoUrl: string | null
      videoStatus: string
      completed: boolean
    }>
  }>
}

export default function CoursePlayerPage() {
  const params = useParams()
  const router = useRouter()
  const { courseSlug: courseId, lessonId } = params
  const { currentLanguage } = useLanguage()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("notes")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (courseId && lessonId) {
      fetchLessonData()
    }
  }, [courseId, lessonId])

  const fetchLessonData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError(currentLanguage === "mn" ? "Хичээл олдсонгүй" : "Lesson not found")
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return
      }
      
      const data = await response.json()
      setCourse(data.course)
      setCurrentLesson(data.lesson)
      
    } catch (err) {
      console.error('Error fetching lesson data:', err)
      setError(currentLanguage === "mn" ? "Хичээл татахад алдаа гарлаа" : "Error loading lesson")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLessonComplete = () => {
    if (currentLesson) {
      // Mark lesson as complete
      console.log("[v0] Marking lesson complete:", currentLesson.id)
      // Update progress and move to next lesson
    }
  }

  const handleProgressUpdate = (newProgress: number) => {
    setProgress(newProgress)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E10600] mx-auto mb-4"></div>
          <p className="text-gray-600">
            {currentLanguage === "mn" ? "Хичээл татаж байна..." : "Loading lesson..."}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchLessonData} className="bg-[#E10600] hover:bg-[#C70500] text-white">
            {currentLanguage === "mn" ? "Дахин оролдох" : "Retry"}
          </Button>
        </div>
      </div>
    )
  }

  if (!currentLesson || !course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">
            {currentLanguage === "mn" ? "Хичээл олдсонгүй" : "Lesson not found"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Curriculum Sidebar */}
      <CurriculumSidebar
        course={course}
        currentLessonId={lessonId as string}
        onLessonSelect={(lesson) => {
          // Navigate to lesson
          router.push(`/learn/${courseId}/${lesson.id}`)
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Video Player */}
        <div className="bg-black">
          {currentLesson.videoUrl ? (
            <VideoPlayer
              videoUrl={currentLesson.videoUrl}
              title={currentLanguage === "mn" ? currentLesson.titleMn : currentLesson.title}
              onProgressUpdate={handleProgressUpdate}
              onComplete={handleLessonComplete}
            />
          ) : (
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">
                  {currentLanguage === "mn" ? "Видео боломжгүй" : "Video Not Available"}
                </h3>
                <p className="text-gray-400">
                  {currentLanguage === "mn" 
                    ? "Энэ хичээлийн видео одоогоор бэлэн биш байна" 
                    : "Video for this lesson is not yet available"
                  }
                </p>
                {currentLesson.videoStatus === 'processing' && (
                  <p className="text-yellow-400 mt-2">
                    {currentLanguage === "mn" ? "Видео боловсруулж байна..." : "Video is being processed..."}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Lesson Info & Actions */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentLanguage === "mn" ? currentLesson.titleMn : currentLesson.title}
              </h1>
              <p className="text-gray-600 mt-1">
                {currentLanguage === "mn" ? currentLesson.descriptionMn : currentLesson.description}
              </p>
              {currentLesson.duration > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {Math.floor(currentLesson.duration / 60)}:{String(currentLesson.duration % 60).padStart(2, '0')} 
                  {currentLanguage === "mn" ? " минут" : " minutes"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleLessonComplete} className="bg-[#E10600] hover:bg-[#C70500] text-white">
                <CheckCircle className="w-4 h-4 mr-2" />
                {currentLanguage === "mn" ? "Дуусгасан" : "Mark Complete"}
              </Button>
              <Button variant="outline" onClick={() => setRightPanelOpen(!rightPanelOpen)}>
                {rightPanelOpen 
                  ? (currentLanguage === "mn" ? "Хавтас нуух" : "Hide Panel")
                  : (currentLanguage === "mn" ? "Хавтас харуулах" : "Show Panel")
                }
              </Button>
            </div>
          </div>
        </div>

        {/* Resources Section */}
        {currentLesson.attachments && currentLesson.attachments.length > 0 && (
          <div className="bg-white px-6 py-4 border-b">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Download className="w-4 h-4 mr-2" />
              {currentLanguage === "mn" ? "Хичээлийн материал" : "Lesson Resources"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentLesson.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="w-4 h-4" />
                  <span>{currentLanguage === "mn" ? attachment.nameMn : attachment.name}</span>
                  <span className="text-gray-500">({formatFileSize(attachment.size)})</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel */}
      {rightPanelOpen && (
        <div className="w-80 bg-white border-l flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="discussion" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Discussion
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="flex-1 m-0">
              <NotesPanel lessonId={lessonId as string} />
            </TabsContent>

            <TabsContent value="discussion" className="flex-1 m-0">
              <DiscussionPanel lessonId={lessonId as string} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

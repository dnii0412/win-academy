"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { VideoPlayer } from "@/components/course-player/video-player"
import { CurriculumSidebar } from "@/components/course-player/curriculum-sidebar"
import { NotesPanel } from "@/components/course-player/notes-panel"
import { DiscussionPanel } from "@/components/course-player/discussion-panel"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, FileText, MessageSquare, Download } from "lucide-react"

// Mock data - replace with real API calls
const mockCourse = {
  id: "1",
  title: "Graphic Design + AI Mastery",
  slug: "graphic-design-ai",
  instructor: "Sarah Johnson",
  modules: [
    {
      id: "1",
      title: "Introduction to Design",
      lessons: [
        {
          id: "1",
          title: "Welcome to the Course",
          type: "video",
          duration: 480,
          completed: true,
          videoUrl: "/placeholder.mp4",
          description: "Get started with your design journey",
        },
        {
          id: "2",
          title: "Design Fundamentals",
          type: "video",
          duration: 720,
          completed: false,
          videoUrl: "/placeholder.mp4",
          description: "Learn the core principles of design",
        },
      ],
    },
    {
      id: "2",
      title: "AI Tools Integration",
      lessons: [
        {
          id: "3",
          title: "Introduction to AI Design Tools",
          type: "video",
          duration: 600,
          completed: false,
          videoUrl: "/placeholder.mp4",
          description: "Explore modern AI-powered design tools",
        },
      ],
    },
  ],
}

const mockResources = [
  { id: "1", name: "Design Templates.zip", size: "2.4 MB", url: "#" },
  { id: "2", name: "Color Palette Guide.pdf", size: "1.2 MB", url: "#" },
  { id: "3", name: "Typography Cheat Sheet.pdf", size: "800 KB", url: "#" },
]

export default function CoursePlayerPage() {
  const params = useParams()
  const { courseSlug, lessonId } = params
  const [currentLesson, setCurrentLesson] = useState(null)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("notes")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Find current lesson from mock data
    const lesson = mockCourse.modules.flatMap((module) => module.lessons).find((l) => l.id === lessonId)
    setCurrentLesson(lesson)
  }, [lessonId])

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

  if (!currentLesson) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E10600] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Curriculum Sidebar */}
      <CurriculumSidebar
        course={mockCourse}
        currentLessonId={lessonId as string}
        onLessonSelect={(lesson) => {
          // Navigate to lesson
          window.location.href = `/learn/${courseSlug}/${lesson.id}`
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Video Player */}
        <div className="bg-black">
          <VideoPlayer
            videoUrl={currentLesson.videoUrl}
            title={currentLesson.title}
            onProgressUpdate={handleProgressUpdate}
            onComplete={handleLessonComplete}
          />
        </div>

        {/* Lesson Info & Actions */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h1>
              <p className="text-gray-600 mt-1">{currentLesson.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleLessonComplete} className="bg-[#E10600] hover:bg-[#C70500] text-white">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
              <Button variant="outline" onClick={() => setRightPanelOpen(!rightPanelOpen)}>
                {rightPanelOpen ? "Hide Panel" : "Show Panel"}
              </Button>
            </div>
          </div>
        </div>

        {/* Resources Section */}
        <div className="bg-white px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Lesson Resources
          </h3>
          <div className="flex flex-wrap gap-2">
            {mockResources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>{resource.name}</span>
                <span className="text-gray-500">({resource.size})</span>
              </a>
            ))}
          </div>
        </div>
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

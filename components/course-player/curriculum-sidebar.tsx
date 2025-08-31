"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronDown, ChevronRight, Play, CheckCircle, Clock, FileText, HelpCircle } from "lucide-react"

interface Lesson {
  id: string
  title: string
  type: "video" | "text" | "quiz" | "assignment"
  duration: number
  completed: boolean
  description?: string
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  instructor: string
  modules: Module[]
}

interface CurriculumSidebarProps {
  course: Course
  currentLessonId: string
  onLessonSelect: (lesson: Lesson) => void
}

export function CurriculumSidebar({ course, currentLessonId, onLessonSelect }: CurriculumSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>(["1"]) // First module expanded by default

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => (prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]))
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m`
  }

  const getTotalDuration = () => {
    return course.modules.reduce(
      (total, module) => total + module.lessons.reduce((moduleTotal, lesson) => moduleTotal + lesson.duration, 0),
      0,
    )
  }

  const getCompletedLessons = () => {
    return course.modules.reduce(
      (total, module) => total + module.lessons.filter((lesson) => lesson.completed).length,
      0,
    )
  }

  const getTotalLessons = () => {
    return course.modules.reduce((total, module) => total + module.lessons.length, 0)
  }

  const getProgressPercentage = () => {
    const completed = getCompletedLessons()
    const total = getTotalLessons()
    return total > 0 ? (completed / total) * 100 : 0
  }

  const getLessonIcon = (lesson: Lesson) => {
    if (lesson.completed) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }

    switch (lesson.type) {
      case "video":
        return <Play className="w-4 h-4 text-gray-400" />
      case "text":
        return <FileText className="w-4 h-4 text-gray-400" />
      case "quiz":
        return <HelpCircle className="w-4 h-4 text-gray-400" />
      default:
        return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="w-80 bg-white border-r flex flex-col h-full">
      {/* Course Header */}
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg text-gray-900 mb-1">{course.title}</h2>
        <p className="text-sm text-gray-600 mb-3">by {course.instructor}</p>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">
              {getCompletedLessons()}/{getTotalLessons()} lessons
            </span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{Math.round(getProgressPercentage())}% complete</span>
            <span>{formatDuration(getTotalDuration())} total</span>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="flex-1 overflow-y-auto">
        {course.modules.map((module) => (
          <div key={module.id} className="border-b">
            {/* Module Header */}
            <Button
              variant="ghost"
              onClick={() => toggleModule(module.id)}
              className="w-full justify-between p-4 h-auto text-left hover:bg-gray-50"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{module.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {module.lessons.length} lessons •{" "}
                  {formatDuration(module.lessons.reduce((total, lesson) => total + lesson.duration, 0))}
                </p>
              </div>
              {expandedModules.includes(module.id) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>

            {/* Module Lessons */}
            {expandedModules.includes(module.id) && (
              <div className="pb-2">
                {module.lessons.map((lesson) => (
                  <Button
                    key={lesson.id}
                    variant="ghost"
                    onClick={() => onLessonSelect(lesson)}
                    className={`w-full justify-start p-3 pl-6 h-auto text-left hover:bg-gray-50 ${
                      lesson.id === currentLessonId ? "bg-[#E10600]/10 border-r-2 border-[#E10600]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      {getLessonIcon(lesson)}
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`font-medium text-sm ${
                            lesson.id === currentLessonId ? "text-[#E10600]" : "text-gray-900"
                          }`}
                        >
                          {lesson.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{formatDuration(lesson.duration)}</span>
                          {lesson.type !== "video" && (
                            <span className="text-xs text-gray-500 capitalize">• {lesson.type}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <Button
          variant="outline"
          className="w-full bg-transparent"
          onClick={() => (window.location.href = "/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}

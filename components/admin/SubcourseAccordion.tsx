"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit, 
  Copy, 
  Trash2,
  GripVertical,
  BookOpen,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import StatusChip from "./StatusChip"

interface Subcourse {
  _id: string
  title: string
  titleMn: string
  description: string
  descriptionMn: string
  status: string
  order: number
  totalLessons: number
  duration: number
  thumbnailUrl?: string
}

interface Lesson {
  _id: string
  id: string
  subcourseId: string
  title: string
  titleMn: string
  slug: string
  type: 'video' | 'article' | 'quiz' | 'text' | 'assignment'
  status: string
  order: number
  duration: number
  durationSec: number
  videoUrl: string | null
  videoStatus: string
  video?: {
    status: 'processing' | 'ready' | 'error'
    videoId: string
  }
}

interface SubcourseAccordionProps {
  subcourses: Subcourse[]
  lessons: Lesson[]
  onAddLesson: (subcourseId: string) => void
  onEditSubcourse: (subcourse: Subcourse) => void
  onDuplicateSubcourse: (subcourse: Subcourse) => void
  onDeleteSubcourse: (subcourse: Subcourse) => void
  onReorderSubcourses: (subcourseIds: string[]) => void
  onReorderLessons: (subcourseId: string, lessonIds: string[]) => void
  onEditLesson: (lesson: Lesson) => void
  onDuplicateLesson: (lesson: Lesson) => void
  onDeleteLesson: (lesson: Lesson) => void
  onToggleLessonStatus: (lesson: Lesson) => void
  onToggleSubcourseStatus: (subcourse: Subcourse) => void
  expandedSubcourses: string[]
  onToggleExpanded: (subcourseId: string) => void
  selectedItems: string[]
  onSelectItem: (itemId: string, type: 'subcourse' | 'lesson') => void
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
}

export default function SubcourseAccordion({
  subcourses,
  lessons,
  onAddLesson,
  onEditSubcourse,
  onDuplicateSubcourse,
  onDeleteSubcourse,
  onReorderSubcourses,
  onReorderLessons,
  onEditLesson,
  onDuplicateLesson,
  onDeleteLesson,
  onToggleLessonStatus,
  onToggleSubcourseStatus,
  expandedSubcourses,
  onToggleExpanded,
  selectedItems,
  onSelectItem,
  isDragging,
  onDragStart,
  onDragEnd
}: SubcourseAccordionProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const handleDragStart = (e: React.DragEvent, subcourseId: string) => {
    setDraggedId(subcourseId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', subcourseId)
    onDragStart()
  }

  const handleDragOver = (e: React.DragEvent, subcourseId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedId && draggedId !== subcourseId) {
      setDragOverId(subcourseId)
    }
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetSubcourseId: string) => {
    e.preventDefault()
    if (draggedId && draggedId !== targetSubcourseId) {
      const draggedIndex = subcourses.findIndex(s => s._id === draggedId)
      const targetIndex = subcourses.findIndex(s => s._id === targetSubcourseId)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newOrder = [...subcourses]
        const [draggedItem] = newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, draggedItem)
        
        const newOrderIds = newOrder.map(s => s._id)
        onReorderSubcourses(newOrderIds)
      }
    }
    setDraggedId(null)
    setDragOverId(null)
    onDragEnd()
  }

  // Lesson drag and drop handlers
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null)
  const [dragOverLessonId, setDragOverLessonId] = useState<string | null>(null)

  const handleLessonDragStart = (e: React.DragEvent, lessonId: string, subcourseId: string) => {
    setDraggedLessonId(lessonId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ lessonId, subcourseId }))
    onDragStart()
  }

  const handleLessonDragOver = (e: React.DragEvent, lessonId: string, subcourseId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedLessonId && draggedLessonId !== lessonId) {
      setDragOverLessonId(lessonId)
    }
  }

  const handleLessonDragLeave = () => {
    setDragOverLessonId(null)
  }

  const handleLessonDrop = (e: React.DragEvent, targetLessonId: string, subcourseId: string) => {
    e.preventDefault()
    if (draggedLessonId && draggedLessonId !== targetLessonId) {
      const subcourseLessons = lessons.filter(l => l.subcourseId === subcourseId)
      const draggedIndex = subcourseLessons.findIndex(l => l._id === draggedLessonId)
      const targetIndex = subcourseLessons.findIndex(l => l._id === targetLessonId)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newOrder = [...subcourseLessons]
        const [draggedItem] = newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, draggedItem)
        
        const newOrderIds = newOrder.map(l => l._id)
        onReorderLessons(subcourseId, newOrderIds)
      }
    }
    setDraggedLessonId(null)
    setDragOverLessonId(null)
    onDragEnd()
  }

  const getSubcourseLessons = (subcourseId: string) => {
    return lessons.filter(lesson => lesson.subcourseId === subcourseId)
  }

  if (subcourses.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No subcourses yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create your first subcourse to get started
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {subcourses.map((subcourse, index) => {
        const subcourseLessons = getSubcourseLessons(subcourse._id)
        const isExpanded = expandedSubcourses.includes(subcourse._id)
        const isSelected = selectedItems.includes(subcourse._id)

        return (
          <div key={subcourse._id} className="relative">
            {/* Drop zone indicator */}
            {dragOverId === subcourse._id && draggedId && draggedId !== subcourse._id && (
              <div className="absolute -top-2 left-0 right-0 h-1 bg-gray-400 rounded-full z-10" />
            )}
            
            <Card
              draggable
              onDragStart={(e) => handleDragStart(e, subcourse._id)}
              onDragOver={(e) => handleDragOver(e, subcourse._id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, subcourse._id)}
              className={cn(
                "transition-all duration-200 group cursor-move",
                isSelected && "ring-2 ring-gray-500 ring-offset-2",
                draggedId === subcourse._id && "opacity-50",
                dragOverId === subcourse._id && "ring-2 ring-gray-300 ring-offset-2 bg-gray-50 dark:bg-gray-900/20"
              )}
            >
              <CardHeader className="pb-3 cursor-pointer" onClick={() => onToggleExpanded(subcourse._id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={cn(
                      "transition-opacity cursor-grab",
                      isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  

                  

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                      {subcourse.title}
                    </h3>
                    
                    {subcourse.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {subcourse.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{subcourse.totalLessons}</span>
                    </div>
                    {subcourse.duration > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(subcourse.duration)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditSubcourse(subcourse)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteSubcourse(subcourse)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <div className="mb-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddLesson(subcourse._id)}
                    className="h-8 px-3"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Lesson
                  </Button>
                </div>
                <div className="space-y-2">
                  {subcourseLessons.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      No lessons yet
                    </div>
                  ) : (
                    subcourseLessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson._id}
                        draggable
                        onDragStart={(e) => handleLessonDragStart(e, lesson._id, subcourse._id)}
                        onDragOver={(e) => handleLessonDragOver(e, lesson._id, subcourse._id)}
                        onDragLeave={handleLessonDragLeave}
                        onDrop={(e) => handleLessonDrop(e, lesson._id, subcourse._id)}
                        className={cn(
                          "flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-move hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                          draggedLessonId === lesson._id && "opacity-50",
                          dragOverLessonId === lesson._id && "ring-2 ring-gray-300 ring-offset-2 bg-gray-50 dark:bg-gray-900/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {lesson.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditLesson(lesson)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDeleteLesson(lesson)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )})}
    </div>
  )
}

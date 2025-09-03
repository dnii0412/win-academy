"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Edit, 
  Copy, 
  Trash2, 
  Play, 
  FileText, 
  HelpCircle,
  Clock,
  Eye,
  EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"
import StatusChip from "./StatusChip"
import ReorderHandle from "./ReorderHandle"
import InlineEditableText from "./InlineEditableText"
import { useLanguage } from "@/contexts/language-context"

interface Lesson {
  _id: string
  subcourseId: string
  title: string
  titleMn: string
  type: 'video' | 'article' | 'quiz'
  status: 'published'
  order: number
  durationSec: number
  video?: {
    status: 'processing' | 'ready' | 'error'
    videoId: string
  }
}

interface LessonListProps {
  lessons: Lesson[]
  subcourseId: string
  onEdit: (lesson: Lesson) => void
  onDuplicate: (lesson: Lesson) => void
  onDelete: (lesson: Lesson) => void
  onReorder: (lessonIds: string[]) => void
  onToggleStatus: (lessonId: string, status: 'published') => Promise<void>
  selectedItems: string[]
  onSelectItem: (itemId: string, type: 'subcourse' | 'lesson') => void
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
}

export default function LessonList({
  lessons,
  subcourseId,
  onEdit,
  onDuplicate,
  onDelete,
  onReorder,
  onToggleStatus,
  selectedItems,
  onSelectItem,
  isDragging,
  onDragStart,
  onDragEnd
}: LessonListProps) {
  const { currentLanguage } = useLanguage()

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4 text-blue-600" />
      case 'article':
        return <FileText className="w-4 h-4 text-green-600" />
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-purple-600" />
      default:
        return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return currentLanguage === "mn" ? "Видео" : "Video"
      case 'article':
        return currentLanguage === "mn" ? "Нийтлэл" : "Article"
      case 'quiz':
        return currentLanguage === "mn" ? "Тест" : "Quiz"
      default:
        return type
    }
  }

  const handleTitleSave = async (lessonId: string, newTitle: string) => {
    // This would typically call an API to update the lesson title
    // For now, we'll just log it
    console.log(`Updating lesson ${lessonId} title to: ${newTitle}`)
  }

  // Status toggle removed - all lessons are now published by default

  if (lessons.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
          {currentLanguage === "mn" ? "Хичээл байхгүй" : "No lessons yet"}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {currentLanguage === "mn" 
            ? "Эхний хичээлээ нэмж эхлээрэй"
            : "Add your first lesson to get started"
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {lessons.map((lesson) => {
        const isSelected = selectedItems.includes(lesson._id)
        const isVideoReady = lesson.video?.status === 'ready'

        return (
          <div
            key={lesson._id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
              "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
              isSelected && "ring-2 ring-blue-500 ring-offset-2"
            )}
          >
            <ReorderHandle
              onMouseDown={onDragStart}
              onMouseUp={onDragEnd}
              className={cn(
                "transition-opacity",
                isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            />

            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelectItem(lesson._id, 'lesson')}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />

            <div className="flex items-center gap-2">
              {getTypeIcon(lesson.type)}
              <Badge variant="outline" className="text-xs">
                {getTypeLabel(lesson.type)}
              </Badge>
            </div>

            <div className="flex-1 min-w-0">
              <InlineEditableText
                value={currentLanguage === "mn" ? lesson.titleMn : lesson.title}
                onSave={(newTitle) => handleTitleSave(lesson._id, newTitle)}
                className="font-medium text-gray-900 dark:text-white"
                placeholder={currentLanguage === "mn" ? "Хичээлийн нэр" : "Lesson title"}
              />
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {lesson.durationSec > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(lesson.durationSec)}</span>
                </div>
              )}

              {lesson.video && (
                <div className="flex items-center gap-1">
                  <StatusChip 
                    status={lesson.video.status} 
                    size="sm"
                    className={cn(
                      lesson.video.status === 'ready' && "cursor-pointer hover:bg-green-200"
                    )}
                  />
                  {isVideoReady && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                      title="Preview video"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">


              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(lesson)}
                className="h-8 w-8 p-0"
                title="Edit lesson"
              >
                <Edit className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDuplicate(lesson)}
                className="h-8 w-8 p-0"
                title="Duplicate lesson"
              >
                <Copy className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(lesson)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete lesson"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

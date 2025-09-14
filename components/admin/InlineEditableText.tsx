"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, X, Edit } from "lucide-react"
import { cn } from "@/lib/utils"

interface InlineEditableTextProps {
  value: string
  onSave: (newValue: string) => Promise<void>
  placeholder?: string
  className?: string
  disabled?: boolean
  multiline?: boolean
  maxLength?: number
}

export default function InlineEditableText({
  value,
  onSave,
  placeholder = "Enter text...",
  className,
  disabled = false,
  multiline = false,
  maxLength
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const [originalValue, setOriginalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(value)
    setOriginalValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && !disabled) {
      if (multiline && textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.select()
      } else if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }
  }, [isEditing, disabled, multiline])

  const handleEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setEditValue(value)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value)
  }

  const handleSave = async () => {
    if (editValue.trim() === value.trim()) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(editValue.trim())
      setIsEditing(false)
      setShowUndo(true)
      setTimeout(() => setShowUndo(false), 3000)
    } catch (error) {
      console.error("Failed to save:", error)
      setEditValue(value) // Revert on error
    } finally {
      setIsSaving(false)
    }
  }

  const handleUndo = async () => {
    try {
      await onSave(originalValue)
      setShowUndo(false)
    } catch (error) {
      console.error("Failed to undo:", error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel()
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        {multiline ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "min-h-[60px] w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500",
              className
            )}
            maxLength={maxLength}
          />
        ) : (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn("h-8 text-sm", className)}
            maxLength={maxLength}
          />
        )}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving || editValue.trim() === value.trim()}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className={cn("min-h-[20px]", className)}>
        {value || placeholder}
      </span>
      {!disabled && (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit className="h-3 w-3" />
          </Button>
          {showUndo && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndo}
              className="h-6 px-2 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            >
              Undo
            </Button>
          )}
        </>
      )}
    </div>
  )
}

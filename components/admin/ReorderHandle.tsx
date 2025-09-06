"use client"

import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReorderHandleProps {
  className?: string
  disabled?: boolean
  "aria-label"?: string
  onMouseDown?: () => void
  onMouseUp?: () => void
}

export default function ReorderHandle({ 
  className, 
  disabled = false,
  "aria-label": ariaLabel = "Reorder item",
  onMouseDown,
  onMouseUp
}: ReorderHandleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-6 h-6 rounded cursor-grab active:cursor-grabbing",
        "text-gray-400 hover:text-gray-600 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={ariaLabel}
      aria-disabled={disabled}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      <GripVertical className="w-4 h-4" />
    </div>
  )
}

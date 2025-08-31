"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  Archive,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BulkAction {
  id: string
  label: string
  icon: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary"
  onClick: () => void
  disabled?: boolean
}

interface BulkActionsBarProps {
  selectedCount: number
  actions: BulkAction[]
  onClearSelection: () => void
  className?: string
}

export default function BulkActionsBar({
  selectedCount,
  actions,
  onClearSelection,
  className
}: BulkActionsBarProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (selectedCount === 0 || !isVisible) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50",
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg",
        "px-4 py-3 flex items-center gap-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-sm">
          {selectedCount} selected
        </Badge>
        
        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              size="sm"
              variant={action.variant || "outline"}
              onClick={action.onClick}
              disabled={action.disabled}
              className="h-8 px-3"
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          className="h-8 px-3 text-gray-600 hover:text-gray-800"
        >
          Clear
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsVisible(false)}
          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

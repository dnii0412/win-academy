"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  Trash2, 
  Archive, 
  EyeOff,
  Info
} from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
    } finally {
      setIsConfirming(false)
    }
  }

  const getVariantConfig = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <Trash2 className="w-6 h-6 text-red-600" />,
          confirmVariant: "destructive" as const,
          confirmText: confirmText || "Delete",
          className: "border-red-200 bg-red-50"
        }
      case "warning":
        return {
          icon: <Archive className="w-6 h-6 text-yellow-600" />,
          confirmVariant: "outline" as const,
          confirmText: confirmText || "Archive",
          className: "border-yellow-200 bg-yellow-50"
        }
      case "info":
        return {
          icon: <Info className="w-6 h-6 text-blue-600" />,
          confirmVariant: "outline" as const,
          confirmText: confirmText || "Confirm",
          className: "border-blue-200 bg-blue-50"
        }
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-gray-600" />,
          confirmVariant: "outline" as const,
          confirmText: confirmText || "Confirm",
          className: "border-gray-200 bg-gray-50"
        }
    }
  }

  const config = getVariantConfig()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border ${config.className}`}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {config.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading || isConfirming}
              className="min-w-[80px]"
            >
              {cancelText}
            </Button>
            <Button
              variant={config.confirmVariant}
              onClick={handleConfirm}
              disabled={isLoading || isConfirming}
              className="min-w-[80px]"
            >
              {isLoading || isConfirming ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {isConfirming ? "Confirming..." : "Loading..."}
                </div>
              ) : (
                config.confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

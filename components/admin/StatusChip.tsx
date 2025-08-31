"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusChipProps {
  status: string
  variant?: "default" | "secondary" | "destructive" | "outline"
  size?: "sm" | "default" | "lg"
  className?: string
}

export default function StatusChip({ 
  status, 
  variant = "default", 
  size = "default",
  className 
}: StatusChipProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return {
          label: 'Draft',
          variant: 'outline' as const,
          className: 'border-gray-300 text-gray-700 bg-gray-50'
        }
      case 'live':
      case 'published':
      case 'active':
        return {
          label: 'Live',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        }
      case 'processing':
        return {
          label: 'Processing',
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        }
      case 'ready':
        return {
          label: 'Ready',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        }
      case 'error':
        return {
          label: 'Error',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200'
        }
      case 'inactive':
      case 'archived':
        return {
          label: 'Inactive',
          variant: 'outline' as const,
          className: 'border-gray-300 text-gray-500 bg-gray-50'
        }
      default:
        return {
          label: status,
          variant: 'outline' as const,
          className: 'border-gray-300 text-gray-700 bg-gray-50'
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge
      variant={variant}
      className={cn(
        'font-medium',
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'default' && 'text-sm px-2.5 py-1',
        size === 'lg' && 'text-base px-3 py-1.5',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  )
}

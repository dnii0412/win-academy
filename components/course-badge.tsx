interface CourseBadgeProps {
  modality: "online" | "onsite" | "hybrid"
  className?: string
}

export function CourseBadge({ modality, className = "" }: CourseBadgeProps) {
  const getBadgeStyles = () => {
    switch (modality) {
      case "online":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 dark:border-blue-500/40"
      case "onsite":
        return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30 dark:border-green-500/40"
      case "hybrid":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30 dark:border-purple-500/40"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getBadgeText = () => {
    switch (modality) {
      case "online":
        return "Онлайн"
      case "onsite":
        return "Танхимын"
      case "hybrid":
        return "Хослол"
      default:
        return "Unknown"
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyles()} ${className}`}
    >
      {getBadgeText()}
    </span>
  )
}

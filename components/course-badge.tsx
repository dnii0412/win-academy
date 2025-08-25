interface CourseBadgeProps {
  modality: "online" | "onsite" | "hybrid"
  className?: string
}

export function CourseBadge({ modality, className = "" }: CourseBadgeProps) {
  const getBadgeStyles = () => {
    switch (modality) {
      case "online":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "onsite":
        return "bg-green-100 text-green-800 border-green-200"
      case "hybrid":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { CourseBadge } from "@/components/course-badge"
import { Calendar, Clock, User } from "lucide-react"
import Link from "next/link"
import CourseImage from "@/components/course-image"

interface CourseCardProps {
  title: string
  description: string
  price: string
  image?: string
  progress?: number
  modality: "online" | "onsite" | "hybrid"
  duration?: string
  startDate?: string
  instructor?: string
  schedule?: string
  courseId?: string
  category?: string
}

export default function CourseCard({
  title,
  description,
  price,
  image,
  progress,
  modality,
  duration,
  startDate,
  instructor,
  schedule,
  courseId,
  category,
}: CourseCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] group">
      <div className="aspect-video bg-gray-200 relative overflow-hidden">
        <CourseImage
          thumbnailUrl={image}
          title={title}
          category={category}
          size="medium"
          className="w-full h-full"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 left-3 z-10">
          <CourseBadge modality={modality} />
        </div>
      </div>
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{description}</p>

        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
          {duration && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{duration}</span>
            </div>
          )}
          {startDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{startDate}</span>
            </div>
          )}
          {instructor && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{instructor}</span>
            </div>
          )}
          {schedule && modality === "onsite" && <div className="text-xs text-muted-foreground/70">{schedule}</div>}
        </div>

        {progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1 text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-[#E10600] h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-6 pt-0 flex flex-col items-center space-y-4">
        <span className="text-2xl font-bold text-[#E10600]">{price}</span>
        {courseId ? (
          <Link href={`/checkout/${courseId}`}>
            <Button className="bg-[#E10600] hover:bg-[#C70500] text-white relative overflow-hidden group/btn transition-all duration-300 hover:shadow-lg hover:scale-105">
              <span className="relative z-10">{progress !== undefined ? "Continue" : "Enroll Now"}</span>
              <div className="absolute inset-0 bg-white/20 scale-0 group-hover/btn:scale-100 transition-transform duration-300 rounded-full" />
            </Button>
          </Link>
        ) : (
          <Button className="bg-[#E10600] hover:bg-[#C70500] text-white relative overflow-hidden group/btn transition-all duration-300 hover:shadow-lg hover:scale-105">
            <span className="relative z-10">{progress !== undefined ? "Continue" : "Enroll Now"}</span>
            <div className="absolute inset-0 bg-white/20 scale-0 group-hover/btn:scale-100 transition-transform duration-300 rounded-full" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

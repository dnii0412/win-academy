"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  PlayCircle,
  DollarSign
} from "lucide-react"
import Link from "next/link"

interface Course {
  _id: string
  title: string
  titleMn?: string
  description: string
  descriptionMn?: string
  price: number
  category: string
  categoryMn?: string
  difficulty: string
  difficultyMn?: string
  duration: string
  durationMn?: string
  instructor: string
  instructorMn?: string
  thumbnailUrl?: string
  status: string
  enrolledStudents: number
  totalVideos: number
  createdAt: string
}

export default function AdminCoursesPage() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.role === "admin") {
      loadCourses()
    }
  }, [session])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, selectedCategory])

  const loadCourses = async () => {
    try {
      // In a real app, you'd fetch from your API
      // Mock data for demonstration
      const mockCourses: Course[] = [
        {
          _id: "1",
          title: "Digital Marketing Mastery",
          titleMn: "Дижитал маркетингийн мастер",
          description: "Complete digital marketing course covering all aspects",
          descriptionMn: "Бүх талын дижитал маркетингийн бүрэн сургалт",
          price: 250000,
          category: "Marketing",
          categoryMn: "Маркетинг",
          difficulty: "Intermediate",
          difficultyMn: "Дунд",
          duration: "8 weeks",
          durationMn: "8 долоо хоног",
          instructor: "John Smith",
          instructorMn: "Жон Смит",
          thumbnailUrl: "/images/digital-marketing.jpg",
          status: "active",
          enrolledStudents: 45,
          totalVideos: 24,
          createdAt: "2024-01-15"
        },
        {
          _id: "2",
          title: "UI/UX Design Fundamentals",
          titleMn: "UI/UX дизайны үндэс",
          description: "Learn the basics of user interface and experience design",
          descriptionMn: "Хэрэглэгчийн интерфейс болон туршлагын дизайны үндсийг сурах",
          price: 300000,
          category: "Design",
          categoryMn: "Дизайн",
          difficulty: "Beginner",
          difficultyMn: "Эхлэгч",
          duration: "6 weeks",
          durationMn: "6 долоо хоног",
          instructor: "Sarah Johnson",
          instructorMn: "Сара Жонсон",
          thumbnailUrl: "/images/ui-ux-design.jpg",
          status: "active",
          enrolledStudents: 32,
          totalVideos: 18,
          createdAt: "2024-01-10"
        }
      ]
      
      setCourses(mockCourses)
      setFilteredCourses(mockCourses)
    } catch (error) {
      console.error("Error loading courses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = courses

    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(course => course.category === selectedCategory)
    }

    setFilteredCourses(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (!session || session.user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Course Management</h1>
          <p className="text-muted-foreground">Manage all courses in your academy</p>
        </div>
        <Link href="/admin/courses/new">
          <Button className="bg-[#E10600] hover:bg-[#C70500]">
            <Plus className="h-4 w-4 mr-2" />
            Add New Course
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find specific courses quickly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courses by title, description, or instructor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="">All Categories</option>
              <option value="Marketing">Marketing</option>
              <option value="Design">Design</option>
              <option value="Programming">Programming</option>
              <option value="Business">Business</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-white opacity-80" />
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                <Badge className={getStatusColor(course.status)}>
                  {course.status}
                </Badge>
              </div>
            </div>
            
            <CardHeader className="pb-3">
              <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
              <CardDescription className="line-clamp-2">{course.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-semibold text-[#E10600]">₮{course.price.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Category:</span>
                  <Badge variant="outline">{course.category}</Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
                    {course.difficulty}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{course.duration}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Instructor:</span>
                  <span>{course.instructor}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4 text-center text-sm">
                <div className="p-2 bg-muted rounded-lg">
                  <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-semibold">{course.enrolledStudents}</div>
                  <div className="text-xs text-muted-foreground">Students</div>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <PlayCircle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-semibold">{course.totalVideos}</div>
                  <div className="text-xs text-muted-foreground">Videos</div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Link href={`/admin/courses/${course._id}/edit`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Link href={`/admin/courses/${course._id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </Link>
                <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory 
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating your first course"
              }
            </p>
            <Link href="/admin/courses/new">
              <Button className="bg-[#E10600] hover:bg-[#C70500]">
                <Plus className="h-4 w-4 mr-2" />
                Create First Course
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

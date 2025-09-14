import AdminSidebar from "@/components/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlayCircle, FileText, HelpCircle, Upload, Edit, Trash2, Plus } from "lucide-react"

export default function LessonsManagement() {
  const lessons = [
    {
      id: 1,
      title: "Introduction to Digital Marketing",
      course: "Digital Marketing Mastery",
      type: "Video",
      duration: "15:30",
      status: "Published",
      order: 1,
    },
    {
      id: 2,
      title: "Understanding Your Target Audience",
      course: "Digital Marketing Mastery",
      type: "Text",
      duration: "8 min read",
      status: "Published",
      order: 2,
    },
    {
      id: 3,
      title: "Social Media Strategy Quiz",
      course: "Digital Marketing Mastery",
      type: "Quiz",
      duration: "10 questions",
      status: "Draft",
      order: 3,
    },
    {
      id: 4,
      title: "Create Your Marketing Plan",
      course: "Digital Marketing Mastery",
      type: "Assignment",
      duration: "Project",
      status: "Published",
      order: 4,
    },
  ]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Video":
        return <PlayCircle className="w-4 h-4" />
      case "Text":
        return <FileText className="w-4 h-4" />
      case "Quiz":
        return <HelpCircle className="w-4 h-4" />
      case "Assignment":
        return <Upload className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    return status === "Published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
  }

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <AdminSidebar />

      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#111111] mb-2">Lessons Management</h1>
            <p className="text-gray-600">Manage course lessons and content</p>
          </div>
          <Button className="bg-[#FF344A] hover:bg-[#E02A3C] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Lesson
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Order</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Course</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => (
                    <tr key={lesson.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium">{lesson.order}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#111111]">{lesson.title}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{lesson.course}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(lesson.type)}
                          <span className="text-sm">{lesson.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{lesson.duration}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(lesson.status)}>{lesson.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

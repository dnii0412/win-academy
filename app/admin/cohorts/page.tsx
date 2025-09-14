import AdminSidebar from "@/components/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Clock, Plus, Edit, Trash2 } from "lucide-react"

export default function CohortsManagement() {
  const cohorts = [
    {
      id: 1,
      course: "Digital Marketing Mastery",
      startDate: "2024-02-01",
      endDate: "2024-04-01",
      schedule: "Weekdays 18:00-20:00",
      instructor: "Batbayar Ganbold",
      capacity: 25,
      enrolled: 18,
      status: "Active",
    },
    {
      id: 2,
      course: "UI/UX Design Fundamentals",
      startDate: "2024-02-15",
      endDate: "2024-05-15",
      schedule: "Weekends 10:00-14:00",
      instructor: "Oyunaa Tseren",
      capacity: 20,
      enrolled: 20,
      status: "Full",
    },
    {
      id: 3,
      course: "AI Tools for Business",
      startDate: "2024-03-01",
      endDate: "2024-04-30",
      schedule: "Weekdays 19:00-21:00",
      instructor: "Munkh-Erdene Bold",
      capacity: 30,
      enrolled: 12,
      status: "Enrolling",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Full":
        return "bg-red-100 text-red-800"
      case "Enrolling":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <AdminSidebar />

      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#111111] mb-2">Cohorts Management</h1>
            <p className="text-gray-600">Manage course cohorts and schedules</p>
          </div>
          <Button className="bg-[#FF344A] hover:bg-[#E02A3C] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Cohort
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {cohorts.map((cohort) => (
            <Card key={cohort.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{cohort.course}</CardTitle>
                  <Badge className={getStatusColor(cohort.status)}>{cohort.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {cohort.startDate} - {cohort.endDate}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{cohort.schedule}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>
                    {cohort.enrolled}/{cohort.capacity} students
                  </span>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">Instructor</p>
                  <p className="font-medium text-[#111111]">{cohort.instructor}</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

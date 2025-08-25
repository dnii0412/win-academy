import AdminSidebar from "@/components/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

export default function AdminDashboard() {
  const stats = [
    { title: "Total Revenue", value: "₮45.2M", change: "+18%", trend: "up", icon: "💰" },
    { title: "Total Enrollments", value: "1,234", change: "+12%", trend: "up", icon: "📚" },
    { title: "Active Students", value: "987", change: "+8%", trend: "up", icon: "👥" },
    { title: "Completion Rate", value: "87%", change: "+5%", trend: "up", icon: "📈" },
  ]

  const recentUsers = [
    { name: "Batbayar S.", email: "batbayar@email.com", course: "Digital Marketing", date: "2024-01-15" },
    { name: "Oyunaa T.", email: "oyunaa@email.com", course: "UI/UX Design", date: "2024-01-14" },
    { name: "Munkh-Erdene B.", email: "munkh@email.com", course: "AI Tools", date: "2024-01-13" },
  ]

  const recentActivity = [
    { action: "New enrollment", user: "Batbayar S.", course: "Digital Marketing", time: "2 hours ago" },
    { action: "Course completed", user: "Oyunaa T.", course: "UI/UX Design", time: "4 hours ago" },
    { action: "Payment received", user: "Munkh-Erdene B.", course: "AI Tools", time: "6 hours ago" },
    { action: "New user registered", user: "Tserendorj M.", course: "-", time: "8 hours ago" },
  ]

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <AdminSidebar />

      <div className="flex-1 p-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Overview of Win Academy platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <div className="flex items-center gap-1">
                        {stat.trend === "up" ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <p className="text-sm text-green-600">{stat.change}</p>
                      </div>
                    </div>
                    <div className="text-2xl">{stat.icon}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-[#E10600]">{user.course}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">{user.date}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Digital Marketing Mastery</span>
                    <span className="text-[#E10600] font-bold">456 students</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">UI/UX Design Fundamentals</span>
                    <span className="text-[#E10600] font-bold">342 students</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">AI Tools for Business</span>
                    <span className="text-[#E10600] font-bold">298 students</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                      <div className="w-2 h-2 bg-[#E10600] rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.user} {activity.course !== "-" && `• ${activity.course}`}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

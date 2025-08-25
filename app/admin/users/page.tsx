import AdminSidebar from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminUsersPage() {
  const users = [
    {
      id: 1,
      name: "Batbayar Sukhbaatar",
      email: "batbayar@email.com",
      role: "Student",
      status: "Active",
      joined: "2024-01-15",
    },
    {
      id: 2,
      name: "Oyunaa Tserendorj",
      email: "oyunaa@email.com",
      role: "Student",
      status: "Active",
      joined: "2024-01-14",
    },
    {
      id: 3,
      name: "Munkh-Erdene Bold",
      email: "munkh@email.com",
      role: "Student",
      status: "Active",
      joined: "2024-01-13",
    },
    {
      id: 4,
      name: "Ganbaatar Nyam",
      email: "ganbaatar@email.com",
      role: "Instructor",
      status: "Active",
      joined: "2024-01-10",
    },
    {
      id: 5,
      name: "Saikhanbileg Dash",
      email: "saikhan@email.com",
      role: "Student",
      status: "Inactive",
      joined: "2024-01-08",
    },
  ]

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <AdminSidebar />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#111111] mb-2">User Management</h1>
              <p className="text-gray-600">Manage students and instructors</p>
            </div>
            <div className="flex space-x-4">
              <Input type="search" placeholder="Search users..." className="w-64" />
              <Button className="bg-[#E10600] hover:bg-[#C70500] text-white">+ Add User</Button>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Joined</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#E10600] rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <span className="font-medium text-[#111111]">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "Instructor" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.joined}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
                          >
                            Suspend
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

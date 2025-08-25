import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminCoursesPage() {
  const courses = [
    { id: 1, title: "Digital Marketing Mastery", students: 456, price: "₮299,000", status: "Active" },
    { id: 2, title: "UI/UX Design Fundamentals", students: 342, price: "₮349,000", status: "Active" },
    { id: 3, title: "AI Tools for Business", students: 298, price: "₮199,000", status: "Active" },
    { id: 4, title: "Social Media Strategy", students: 187, price: "₮249,000", status: "Draft" },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#111111] mb-2">Course Management</h1>
            <p className="text-gray-600">Create and manage courses</p>
          </div>
          <Button className="bg-[#E10600] hover:bg-[#C70500] text-white">+ Add New Course</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Course</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Students</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-[#111111]">{course.title}</td>
                        <td className="py-3 px-4 text-gray-600">{course.students}</td>
                        <td className="py-3 px-4 text-gray-600">{course.price}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              course.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {course.status}
                          </span>
                        </td>
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
                              Delete
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

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add New Course</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Course Title
                  </label>
                  <Input id="title" type="text" placeholder="Enter course title" className="w-full" />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#E10600] focus:border-[#E10600]"
                    placeholder="Course description..."
                  />
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <Input id="price" type="text" placeholder="₮299,000" className="w-full" />
                </div>

                <div>
                  <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-1">
                    Thumbnail
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <p className="text-gray-500">Upload course thumbnail</p>
                    <Button variant="outline" className="mt-2 bg-transparent">
                      Choose File
                    </Button>
                  </div>
                </div>

                <div>
                  <label htmlFor="video" className="block text-sm font-medium text-gray-700 mb-1">
                    Course Video
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <p className="text-gray-500">Upload course video</p>
                    <Button variant="outline" className="mt-2 bg-transparent">
                      Choose File
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-[#E10600] hover:bg-[#C70500] text-white">
                  Create Course
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

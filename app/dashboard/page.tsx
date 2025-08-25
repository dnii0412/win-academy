import DashboardSidebar from "@/components/dashboard-sidebar"
import CourseCard from "@/components/course-card"

export default function DashboardPage() {
  const enrolledCourses = [
    {
      title: "Digital Marketing Mastery",
      description: "Complete guide to social media marketing, SEO, and content creation.",
      price: "₮299,000",
      progress: 65,
    },
    {
      title: "UI/UX Design Fundamentals",
      description: "Master design principles, user research, and prototyping.",
      price: "₮349,000",
      progress: 30,
    },
    {
      title: "AI Tools for Business",
      description: "Harness ChatGPT, Midjourney, and automation tools.",
      price: "₮199,000",
      progress: 85,
    },
  ]

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <DashboardSidebar />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-[#E10600] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">JD</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#111111]">Welcome back, John!</h1>
              <p className="text-gray-600">Continue your learning journey</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-[#111111] mb-2">Courses Enrolled</h3>
            <p className="text-3xl font-bold text-[#E10600]">3</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-[#111111] mb-2">Hours Learned</h3>
            <p className="text-3xl font-bold text-[#E10600]">47</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-[#111111] mb-2">Certificates</h3>
            <p className="text-3xl font-bold text-[#E10600]">1</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#111111] mb-6">My Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course, index) => (
              <CourseCard key={index} {...course} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

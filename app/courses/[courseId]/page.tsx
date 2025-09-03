import { auth } from '@/auth'
import { notFound, redirect } from 'next/navigation'
import dbConnect from '@/lib/mongoose'
import Course from '@/lib/models/Course'
import { checkCourseAccess } from '@/lib/course-access'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, User, BookOpen, Lock, Play } from 'lucide-react'
import Link from 'next/link'
import CourseImage from '@/components/course-image'

interface CoursePageProps {
  params: { courseId: string }
}

export default async function CoursePage({ params }: CoursePageProps) {
  const session = await auth()
  const { courseId } = params

  await dbConnect()

  // Fetch course details
  const course = await Course.findById(courseId).lean()
  if (!course) {
    notFound()
  }

  // Check if user has access to this course
  const hasAccess = session?.user?.email
    ? await checkCourseAccess(courseId, session.user.id || session.user.email)
    : false

  // If not authenticated, redirect to login
  if (!session?.user?.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/courses/${courseId}`)}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Course Header */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <Badge variant="outline" className="mb-2">
                  {course.level}
                </Badge>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {course.title}
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  {course.description}
                </p>

                <div className="flex items-center gap-6 text-sm text-gray-500">
                  {course.instructor && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{course.instructor}</span>
                    </div>
                  )}
                  {course.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration} minutes</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.totalLessons} lessons</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Thumbnail and Purchase */}
            <div>
              <Card>
                <CardContent className="p-0">
                  <CourseImage
                    thumbnailUrl={course.thumbnailUrl}
                    title={course.title}
                    category={course.category}
                    size="medium"
                    className="w-full h-48 rounded-t-lg"
                  />
                  <div className="p-6">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-[#E10600]">
                        ₮{course.price.toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-500">One-time payment</p>
                    </div>

                    {hasAccess ? (
                      <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                        <Link href={`/learn/${courseId}`}>
                          <Play className="mr-2 h-4 w-4" />
                          Continue Learning
                        </Link>
                      </Button>
                    ) : (
                      <Button className="w-full bg-[#E10600] hover:bg-[#C70500]" asChild>
                        <Link href={`/checkout/${courseId}`}>
                          <Lock className="mr-2 h-4 w-4" />
                          Purchase Course
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {hasAccess ? (
              // Show course content for users with access
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Content</CardTitle>
                    <CardDescription>
                      You have full access to this course
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {course.modules && course.modules.length > 0 ? (
                      <div className="space-y-4">
                        {course.modules.map((module: any, index: number) => (
                          <div key={module._id || index} className="border rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-2">
                              {module.title}
                            </h3>
                            {module.description && (
                              <p className="text-gray-600 text-sm mb-3">
                                {module.description}
                              </p>
                            )}
                            {module.topics && module.topics.length > 0 && (
                              <div className="space-y-2">
                                {module.topics.map((topic: any, topicIndex: number) => (
                                  <div key={topic._id || topicIndex} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                    <Play className="h-4 w-4 text-[#E10600]" />
                                    <span className="text-sm">{topic.title}</span>
                                    {topic.videoDuration && (
                                      <span className="text-xs text-gray-500 ml-auto">
                                        {Math.floor(topic.videoDuration / 60)}:{(topic.videoDuration % 60).toString().padStart(2, '0')}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        Course content is being prepared. Check back soon!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              // Show preview for users without access
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Course Preview
                  </CardTitle>
                  <CardDescription>
                    Purchase this course to unlock all content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Unlock Full Course Access
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Get lifetime access to all course materials, video lessons,
                      and exclusive resources.
                    </p>
                    <Button className="bg-[#E10600] hover:bg-[#C70500]" asChild>
                      <Link href={`/checkout/${courseId}`}>
                        Purchase for ₮{course.price.toLocaleString()}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Level</h4>
                  <Badge variant="outline">{course.level}</Badge>
                </div>

                {course.category && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Category</h4>
                    <p className="text-sm">{course.category}</p>
                  </div>
                )}

                {course.tags && course.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {course.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Students Enrolled</h4>
                  <p className="text-sm">{course.enrolledUsers.toLocaleString()} students</p>
                </div>

                {course.certificate && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-green-600">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-sm font-medium">Certificate included</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
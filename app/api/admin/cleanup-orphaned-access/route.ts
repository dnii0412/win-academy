import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import CourseAccess from "@/lib/models/CourseAccess"
import Course from "@/lib/models/Course"

export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await dbConnect()
    console.log("Starting cleanup of orphaned course access records...")

    // Get all course access records
    const allAccess = await CourseAccess.find({})
    console.log(`Found ${allAccess.length} course access records`)

    let deletedCount = 0
    let keptCount = 0
    const deletedRecords = []

    for (const access of allAccess) {
      const courseId = access.courseId?.toString()
      
      if (!courseId) {
        // Record has no courseId, delete it
        await CourseAccess.findByIdAndDelete(access._id)
        deletedCount++
        deletedRecords.push({
          id: access._id,
          userId: access.userId,
          accessType: access.accessType,
          reason: 'No courseId'
        })
        console.log(`Deleted access record ${access._id} - no courseId`)
        continue
      }

      // Check if course exists
      const course = await Course.findById(courseId)
      if (!course) {
        // Course doesn't exist, delete the access record
        await CourseAccess.findByIdAndDelete(access._id)
        deletedCount++
        deletedRecords.push({
          id: access._id,
          userId: access.userId,
          courseId: courseId,
          accessType: access.accessType,
          reason: 'Course deleted'
        })
        console.log(`Deleted access record ${access._id} - course ${courseId} not found`)
      } else {
        keptCount++
      }
    }

    console.log(`Cleanup completed: ${deletedCount} deleted, ${keptCount} kept`)

    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${deletedCount} orphaned records deleted, ${keptCount} valid records kept`,
      deletedCount,
      keptCount,
      deletedRecords: deletedRecords.slice(0, 10) // Show first 10 deleted records
    })

  } catch (error) {
    console.error("Error cleaning up orphaned access:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

#!/usr/bin/env tsx

/**
 * Test script to verify course access after payment
 * This script simulates the course access verification process
 */

import dbConnect from '../lib/mongoose'
import User from '../lib/models/User'
import CourseAccess from '../lib/models/CourseAccess'
import Course from '../lib/models/Course'
import mongoose from 'mongoose'

async function testCourseAccess() {
    try {
        console.log('🔍 Testing course access verification...')

        await dbConnect()
        console.log('✅ Database connected')

        // Get a test user (replace with actual user email)
        const testEmail = process.argv[2] || 'test@example.com'
        console.log(`👤 Testing with user: ${testEmail}`)

        const user = await User.findOne({ email: testEmail })
        if (!user) {
            console.log('❌ User not found. Please provide a valid email as argument.')
            console.log('Usage: tsx scripts/test-course-access-fix.ts user@example.com')
            return
        }

        console.log(`✅ User found: ${user._id.toString()}`)

        // Get all course access records for this user
        const accessRecords = await CourseAccess.find({
            $or: [
                { userId: user._id.toString() },
                { userId: user.email }
            ]
        }).populate('courseId', 'title titleMn')

        console.log(`📚 Found ${accessRecords.length} course access records:`)

        accessRecords.forEach((access, index) => {
            console.log(`  ${index + 1}. Course: ${access.courseId?.title || 'Unknown'}`)
            console.log(`     UserId: ${access.userId}`)
            console.log(`     Has Access: ${access.hasAccess}`)
            console.log(`     Access Type: ${access.accessType}`)
            console.log(`     Status: ${access.status}`)
            console.log(`     Granted At: ${access.grantedAt}`)
            console.log('')
        })

        // Test the new access verification logic
        if (accessRecords.length > 0) {
            const testCourseId = accessRecords[0].courseId?._id
            if (testCourseId) {
                console.log(`🧪 Testing access verification for course: ${testCourseId}`)

                const courseAccess = await CourseAccess.findOne({
                    $or: [
                        { userId: user._id.toString(), courseId: testCourseId, hasAccess: true },
                        { userId: user.email, courseId: testCourseId, hasAccess: true }
                    ]
                })

                console.log(`✅ Access verification result: ${!!courseAccess}`)
                if (courseAccess) {
                    console.log(`   UserId in access record: ${courseAccess.userId}`)
                    console.log(`   Access type: ${courseAccess.accessType}`)
                }
            }
        }

        console.log('✅ Test completed successfully!')

    } catch (error) {
        console.error('❌ Test failed:', error)
    } finally {
        process.exit(0)
    }
}

testCourseAccess()

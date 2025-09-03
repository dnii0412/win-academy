import mongoose from 'mongoose'

const courseEnrollmentSchema = new mongoose.Schema({
  userId: {
    type: String, // Changed to String to handle both ObjectId and string UUIDs
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'suspended', 'expired'],
    default: 'active'
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  accessGrantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Create compound index to ensure unique user-course combinations
courseEnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true })

// Create indexes for better query performance
courseEnrollmentSchema.index({ status: 1 })
courseEnrollmentSchema.index({ enrolledAt: -1 })
courseEnrollmentSchema.index({ expiresAt: 1 })

export default mongoose.models.CourseEnrollment || mongoose.model('CourseEnrollment', courseEnrollmentSchema)

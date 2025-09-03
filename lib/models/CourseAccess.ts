import mongoose from 'mongoose'

const courseAccessSchema = new mongoose.Schema({
  userId: {
    type: String, // Changed to String to handle both ObjectId and string UUIDs
    index: true,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    index: true,
    required: true
  },
  hasAccess: {
    type: Boolean,
    default: false
  },
  // Track source order/payment
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  // Access type (purchase, enrollment, admin grant, etc.)
  accessType: {
    type: String,
    enum: ['purchase', 'enrollment', 'admin_grant', 'free'],
    default: 'purchase'
  },
  // Expiry date for time-limited access
  expiresAt: {
    type: Date,
    default: null
  },
  // Access granted date
  grantedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Compound unique index to prevent duplicate access records
courseAccessSchema.index({ userId: 1, courseId: 1 }, { unique: true })

// Index for expiry cleanup
courseAccessSchema.index({ expiresAt: 1 })

// Virtual to check if access is still valid
courseAccessSchema.virtual('isValid').get(function () {
  if (!this.hasAccess) return false
  if (!this.expiresAt) return true
  return this.expiresAt > new Date()
})

// Static methods interface
interface CourseAccessModel extends mongoose.Model<any> {
  grantAccess(userId: string, courseId: string, orderId?: string, accessType?: string): Promise<any>
  revokeAccess(userId: string, courseId: string): Promise<any>
  hasAccess(userId: string, courseId: string): Promise<boolean>
}

// Static method to grant access
courseAccessSchema.statics.grantAccess = async function (userId: string, courseId: string, orderId?: string, accessType: string = 'purchase') {
  return this.findOneAndUpdate(
    { userId, courseId },
    {
      hasAccess: true,
      orderId,
      accessType,
      grantedAt: new Date()
    },
    { upsert: true, new: true }
  )
}

// Static method to revoke access
courseAccessSchema.statics.revokeAccess = async function (userId: string, courseId: string) {
  return this.findOneAndUpdate(
    { userId, courseId },
    { hasAccess: false },
    { new: true }
  )
}

// Static method to check access
courseAccessSchema.statics.hasAccess = async function (userId: string, courseId: string) {
  const access = await this.findOne({ userId, courseId })
  if (!access || !access.hasAccess) return false
  if (!access.expiresAt) return true
  return access.expiresAt > new Date()
}

export default (mongoose.models.CourseAccess || mongoose.model('CourseAccess', courseAccessSchema)) as CourseAccessModel

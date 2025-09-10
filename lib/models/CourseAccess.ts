import mongoose from 'mongoose'

const courseAccessSchema = new mongoose.Schema({
  userId: {
    type: String, // String to handle both ObjectId and string UUIDs
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
  // Status for admin-managed access (replaces CourseEnrollment status)
  status: {
    type: String,
    enum: ['active', 'suspended', 'expired', 'completed'],
    default: 'active'
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
  },
  // Progress tracking (from CourseEnrollment)
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Last accessed date
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  // Who granted access (for admin grants)
  accessGrantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Admin notes
  notes: {
    type: String,
    trim: true
  },
  // Completion date
  completedAt: {
    type: Date
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
  grantAccess(userId: string, courseId: string, orderId?: string, accessType?: string, grantedBy?: string, notes?: string, expiresAt?: string): Promise<any>
  revokeAccess(userId: string, courseId: string): Promise<any>
  hasAccess(userId: string, courseId: string): Promise<boolean>
  updateProgress(userId: string, courseId: string, progress: number): Promise<any>
  updateStatus(userId: string, courseId: string, status: string, notes?: string): Promise<any>
}

// Static method to grant access
courseAccessSchema.statics.grantAccess = async function (userId: string, courseId: string, orderId?: string, accessType: string = 'purchase', grantedBy?: string, notes?: string, expiresAt?: string) {
  return this.findOneAndUpdate(
    { userId, courseId },
    {
      hasAccess: true,
      orderId,
      accessType,
      status: 'active',
      grantedAt: new Date(),
      lastAccessedAt: new Date(),
      accessGrantedBy: grantedBy,
      notes: notes || '',
      expiresAt: expiresAt ? new Date(expiresAt) : null
    },
    { upsert: true, new: true }
  )
}

// Static method to revoke access
courseAccessSchema.statics.revokeAccess = async function (userId: string, courseId: string) {
  return this.findOneAndUpdate(
    { userId, courseId },
    { 
      hasAccess: false,
      status: 'suspended'
    },
    { new: true }
  )
}

// Static method to check access
courseAccessSchema.statics.hasAccess = async function (userId: string, courseId: string) {
  const access = await this.findOne({ userId, courseId })
  if (!access || !access.hasAccess) return false
  if (access.status === 'suspended' || access.status === 'expired') return false
  if (!access.expiresAt) return true
  return access.expiresAt > new Date()
}

// Static method to update progress
courseAccessSchema.statics.updateProgress = async function (userId: string, courseId: string, progress: number) {
  return this.findOneAndUpdate(
    { userId, courseId },
    { 
      progress: Math.min(100, Math.max(0, progress)),
      lastAccessedAt: new Date(),
      completedAt: progress >= 100 ? new Date() : null,
      status: progress >= 100 ? 'completed' : 'active'
    },
    { new: true }
  )
}

// Static method to update status
courseAccessSchema.statics.updateStatus = async function (userId: string, courseId: string, status: string, notes?: string) {
  return this.findOneAndUpdate(
    { userId, courseId },
    { 
      status,
      notes: notes || '',
      lastAccessedAt: new Date()
    },
    { new: true }
  )
}

export default (mongoose.models.CourseAccess || mongoose.model('CourseAccess', courseAccessSchema)) as CourseAccessModel

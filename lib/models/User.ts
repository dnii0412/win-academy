import mongoose from 'mongoose'
import { CallbackError } from 'mongoose'

const userSchema = new mongoose.Schema({
  // Basic user information
  firstName: {
    type: String,
    trim: true,
    default: ''
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
  },
  fullName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  // Phone number (optional for OAuth users, required for form registration)
  phoneNumber: {
    type: String,
    trim: true,
    default: ''
  },
  // Legacy phone field for backward compatibility
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  // Password (optional for OAuth users, required for form registration)
  password: {
    type: String,
    required: false // Changed to false to support OAuth users
  },
  // Avatar/Profile image
  avatar: {
    type: String,
    default: ''
  },
  // Legacy image field for backward compatibility
  image: {
    type: String,
    default: ''
  },
  // OAuth provider information
  provider: {
    type: String,
    enum: ['credentials', 'google', 'facebook'],
    default: 'credentials'
  },
  providerId: {
    type: String,
    default: ''
  },
  // User role for access control
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Create indexes for better query performance
userSchema.index({ createdAt: -1 })
userSchema.index({ provider: 1 })

// Virtual for full name
userSchema.virtual('displayName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`.trim()
  }
  return this.fullName || this.email
})

// Pre-save middleware to handle name fields
userSchema.pre('save', function(next) {
  // If firstName and lastName are provided, update fullName
  if (this.firstName && this.lastName) {
    this.fullName = `${this.firstName} ${this.lastName}`.trim()
  }
  
  // If fullName is provided but firstName/lastName are not, try to split
  if (this.fullName && (!this.firstName || !this.lastName)) {
    const nameParts = this.fullName.split(' ')
    if (nameParts.length >= 2) {
      this.firstName = nameParts[0]
      this.lastName = nameParts.slice(1).join(' ')
    }
  }

  // Handle avatar/image field consistency
  if (this.avatar && !this.image) {
    this.image = this.avatar
  }
  if (this.image && !this.avatar) {
    this.avatar = this.image
  }

  // Handle phone/phoneNumber field consistency
  if (this.phone && !this.phoneNumber) {
    this.phoneNumber = this.phone
  }
  if (this.phoneNumber && !this.phone) {
    this.phone = this.phoneNumber
  }

  next()
})

// Prevent password from being returned in queries
userSchema.methods.toJSON = function () {
  const user = this.toObject()
  delete user.password
  return user
}

// Pre-delete middleware to clean up related data
userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Try to clean up course access records, but don't fail if it doesn't work
    try {
      // Ensure CourseAccess model is registered
      let CourseAccess
      if (mongoose.models.CourseAccess) {
        CourseAccess = mongoose.models.CourseAccess
      } else {
        // Import and register CourseAccess model if not already registered
        const CourseAccessModule = require('./CourseAccess')
        CourseAccess = CourseAccessModule.default
      }
      
      // Delete all course access records for this user
      await CourseAccess.deleteMany({ userId: this._id.toString() })
      
      console.log(`Cleaned up course access records for user: ${this._id}`)
    } catch (courseAccessError) {
      console.warn(`Could not clean up course access records for user ${this._id}:`, courseAccessError instanceof Error ? courseAccessError.message : String(courseAccessError))
      // Continue with user deletion even if course access cleanup fails
    }
    
    next()
  } catch (error) {
    console.error('Error in user pre-delete hook:', error)
    // Don't fail the deletion if cleanup fails
    next()
  }
})

export default mongoose.models.User || mongoose.model('User', userSchema)

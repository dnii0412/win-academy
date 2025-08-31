import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
  // Course information
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseTitle: {
    type: String,
    required: true,
    trim: true
  },
  courseTitleMn: {
    type: String,
    trim: true
  },
  
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true
  },
  
  // Payment information
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'MNT', 'EUR']
  },
  paymentMethod: {
    type: String,
    required: true,
    trim: true
  },
  paymentProvider: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  
  // Order status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Additional fields
  notes: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
})

// Create indexes for better query performance
orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ courseId: 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ paymentMethod: 1 })
orderSchema.index({ createdAt: -1 })

// Virtual for formatted amount
orderSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`
})

// Pre-save middleware to update updatedAt
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.Order || mongoose.model('Order', orderSchema)

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
    type: String, // Changed to String to handle both ObjectId and string UUIDs
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
    default: 'MNT',
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

  // QPay specific fields - enhanced structure
  qpay: {
    invoiceId: { type: String },
    senderInvoiceNo: { type: String, unique: true, sparse: true },
    qrText: { type: String },
    qrImage: { type: String }, // base64 image
    urls: [{ // deeplinks for bank apps
      name: String,
      description: String,
      link: String
    }],
    rawCreateRes: { type: Object }, // full QPay create response
    lastCheckRes: { type: Object }, // last payment check response
    webhookEvents: [{ // track webhook calls
      timestamp: { type: Date, default: Date.now },
      payload: Object,
      processed: { type: Boolean, default: false }
    }]
  },

  // Order status
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
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
orderSchema.index({ 'qpay.invoiceId': 1 })

// Virtual for formatted amount
orderSchema.virtual('formattedAmount').get(function () {
  return `₮${this.amount.toFixed(2)}`
})

// Pre-save middleware to update updatedAt
orderSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.Order || mongoose.model('Order', orderSchema)

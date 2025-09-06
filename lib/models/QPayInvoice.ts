import mongoose, { Schema, Document } from 'mongoose'

export interface IQPayInvoice extends Document {
  // QPay fields
  qpayInvoiceId: string
  senderInvoiceNo: string
  senderBranchCode: string
  invoiceReceiverCode: string
  invoiceDescription: string
  amount: number
  callbackUrl: string
  allowPartial: boolean
  allowExceed: boolean
  
  // QR and URLs
  qrText: string
  qrImage?: string
  urls: {
    deeplink: string
    qr: string
  }
  
  // Status and tracking
  status: 'NEW' | 'PAID' | 'CANCELLED' | 'EXPIRED'
  paidAt?: Date
  paymentId?: string
  
  // Application fields
  userId: string
  courseId: string
  orderId?: string
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
}

const QPayInvoiceSchema = new Schema<IQPayInvoice>({
  qpayInvoiceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  senderInvoiceNo: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  senderBranchCode: {
    type: String,
    required: true
  },
  invoiceReceiverCode: {
    type: String,
    required: true
  },
  invoiceDescription: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  callbackUrl: {
    type: String,
    required: true
  },
  allowPartial: {
    type: Boolean,
    default: false
  },
  allowExceed: {
    type: Boolean,
    default: false
  },
  qrText: {
    type: String,
    required: true
  },
  qrImage: {
    type: String
  },
  urls: {
    deeplink: {
      type: String,
      required: true
    },
    qr: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['NEW', 'PAID', 'CANCELLED', 'EXPIRED'],
    default: 'NEW',
    index: true
  },
  paidAt: {
    type: Date
  },
  paymentId: {
    type: String
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  courseId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
QPayInvoiceSchema.index({ userId: 1, status: 1 })
QPayInvoiceSchema.index({ courseId: 1, status: 1 })
QPayInvoiceSchema.index({ paymentId: 1 }, { sparse: true })

// Static methods
QPayInvoiceSchema.statics.findBySenderInvoiceNo = function(senderInvoiceNo: string) {
  return this.findOne({ senderInvoiceNo })
}

QPayInvoiceSchema.statics.findByQPayInvoiceId = function(qpayInvoiceId: string) {
  return this.findOne({ qpayInvoiceId })
}

QPayInvoiceSchema.statics.findByPaymentId = function(paymentId: string) {
  return this.findOne({ paymentId })
}

QPayInvoiceSchema.statics.findActiveByUser = function(userId: string) {
  return this.find({ 
    userId, 
    status: { $in: ['NEW', 'PAID'] },
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 })
}

// Instance methods
QPayInvoiceSchema.methods.markAsPaid = function(paymentId: string) {
  this.status = 'PAID'
  this.paymentId = paymentId
  this.paidAt = new Date()
  return this.save()
}

QPayInvoiceSchema.methods.cancel = function() {
  this.status = 'CANCELLED'
  return this.save()
}

QPayInvoiceSchema.methods.expire = function() {
  this.status = 'EXPIRED'
  return this.save()
}

export default mongoose.models.QPayInvoice || mongoose.model<IQPayInvoice>('QPayInvoice', QPayInvoiceSchema)

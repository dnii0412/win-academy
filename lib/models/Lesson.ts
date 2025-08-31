import mongoose from 'mongoose'

const lessonSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  subcourseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcourse',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  titleMn: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  descriptionMn: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['video', 'article', 'quiz'],
    default: 'video'
  },
  durationSec: {
    type: Number,
    default: 0
  },
  content: {
    type: String,
    trim: true
  },
  contentMn: {
    type: String,
    trim: true
  },
  attachments: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    nameMn: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['pdf', 'image', 'assignment', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    size: {
      type: Number, // in bytes
      default: 0
    }
  }],
  video: {
    libraryId: {
      type: String,
      trim: true
    },
    videoId: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'error'],
      default: 'processing'
    },
    thumbnailUrl: {
      type: String,
      trim: true
    },
    duration: {
      type: Number, // in seconds
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['draft', 'live'],
    default: 'draft'
  },
  order: {
    type: Number,
    default: 0
  },
  seo: {
    title: String,
    description: String,
    noindex: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
})

// Create indexes for better query performance
lessonSchema.index({ courseId: 1, subcourseId: 1, order: 1 })
lessonSchema.index({ status: 1 })
lessonSchema.index({ 'video.videoId': 1 })

// Pre-save middleware to ensure slug uniqueness within course
lessonSchema.pre('save', async function(next) {
  if (this.isModified('slug')) {
    const existingLesson = await mongoose.models.Lesson.findOne({
      slug: this.slug,
      courseId: this.courseId,
      _id: { $ne: this._id }
    })
    
    if (existingLesson) {
      const error = new Error('Slug must be unique within the course')
      return next(error)
    }
  }
  next()
})

export default mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema)

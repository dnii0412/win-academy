import mongoose from 'mongoose'

const moduleSchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true
  },
  descriptionMn: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true
  },
  topics: [{
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
    description: {
      type: String,
      trim: true
    },
    descriptionMn: {
      type: String,
      trim: true
    },
    order: {
      type: Number,
      required: true
    },
    videoUrl: {
      type: String,
      trim: true
    },
    videoDuration: {
      type: Number, // in seconds
      default: 0
    },
    thumbnailUrl: {
      type: String,
      trim: true
    },
    materials: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      nameMn: {
        type: String,
        required: true,
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
    assignments: [{
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
      description: {
        type: String,
        trim: true
      },
      descriptionMn: {
        type: String,
        trim: true
      },
      dueDate: {
        type: Date
      },
      points: {
        type: Number,
        default: 0
      }
    }]
  }]
})

const courseSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: true,
    trim: true
  },
  descriptionMn: {
    type: String,
    required: true,
    trim: true
  },
  shortDescription: {
    type: String,
    trim: true
  },
  shortDescriptionMn: {
    type: String,
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  thumbnailPublicId: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 50
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['inactive', 'archived', 'draft', 'published'],
    default: 'inactive'
  },
  category: {
    type: String,
    trim: true
  },
  categoryMn: {
    type: String,
    trim: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  levelMn: {
    type: String,
    enum: ['Эхлэгч', 'Дунд', 'Дээд'],
    default: 'Эхлэгч'
  },
  duration: {
    type: Number, // total duration in minutes
    default: 0
  },
  modules: [moduleSchema],
  totalLessons: {
    type: Number,
    default: 0
  },
  enrolledUsers: {
    type: Number,
    default: 0
  },
  instructor: {
    type: String,
    trim: true
  },
  instructorMn: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  tagsMn: [{
    type: String,
    trim: true
  }],
  featured: {
    type: Boolean,
    default: false
  },
  certificate: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    enum: ['en', 'mn', 'both'],
    default: 'both'
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
courseSchema.index({ status: 1, createdAt: -1 })
courseSchema.index({ category: 1 })
courseSchema.index({ featured: 1 })
courseSchema.index({ 'modules.topics.videoUrl': 1 })

// Pre-save middleware to calculate total lessons
courseSchema.pre('save', function(next) {
  let totalLessons = 0
  if (this.modules && this.modules.length > 0) {
    this.modules.forEach(module => {
      if (module.topics && module.topics.length > 0) {
        totalLessons += module.topics.length
      }
    })
  }
  this.totalLessons = totalLessons
  next()
})

export default mongoose.models.Course || mongoose.model('Course', courseSchema)

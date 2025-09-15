import mongoose from 'mongoose'

const subcourseSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
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
  thumbnailUrl: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  totalLessons: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number, // total duration in minutes
    default: 0
  }
}, {
  timestamps: true
})

// Create indexes for better query performance
subcourseSchema.index({ courseId: 1, order: 1 })

// Pre-save middleware to ensure slug uniqueness within course
subcourseSchema.pre('save', async function(next) {
  if (this.isModified('slug')) {
    const existingSubcourse = await mongoose.models.Subcourse.findOne({
      slug: this.slug,
      courseId: this.courseId,
      _id: { $ne: this._id }
    })
    
    if (existingSubcourse) {
      const error = new Error('Slug must be unique within the course')
      return next(error)
    }
  }
  next()
})

// Pre-delete middleware to cascade delete all lessons in this subcourse
subcourseSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    const subcourseId = this._id.toString()
    const courseId = this.courseId.toString()
    console.log(`Starting cascade deletion for subcourse: ${subcourseId}`)

    // Import Lesson model dynamically to avoid circular dependencies
    const Lesson = mongoose.models.Lesson || (await import('./Lesson')).default

    // Delete all lessons in this subcourse
    const deletedLessons = await Lesson.deleteMany({
      courseId,
      subcourseId
    })

    console.log(`Deleted ${deletedLessons.deletedCount} lessons from subcourse ${subcourseId}`)
    console.log(`Cascade deletion completed for subcourse: ${subcourseId}`)
    next()
  } catch (error) {
    console.error('Error in subcourse pre-delete hook:', error)
    // Don't fail the deletion if cleanup fails
    next()
  }
})

export default mongoose.models.Subcourse || mongoose.model('Subcourse', subcourseSchema)

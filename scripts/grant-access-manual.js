const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/win-academy';
mongoose.connect(MONGODB_URI);

// Define schemas
const userSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  fullName: String
}, { timestamps: true });

const courseAccessSchema = new mongoose.Schema({
  userId: String,
  courseId: mongoose.Schema.Types.ObjectId,
  hasAccess: { type: Boolean, default: false },
  accessType: { type: String, default: 'purchase' },
  status: { type: String, default: 'active' },
  grantedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const CourseAccess = mongoose.model('CourseAccess', courseAccessSchema);

async function grantAccess() {
  try {
    // Find user by email
    const user = await User.findOne({ email: 'okodanny0412@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Found user:', user.email);

    // Grant access to the course
    const courseId = '68be5d3570b8624249055c3a';
    
    const courseAccess = await CourseAccess.findOneAndUpdate(
      { 
        userId: user._id.toString(), 
        courseId: new mongoose.Types.ObjectId(courseId) 
      },
      {
        hasAccess: true,
        accessType: 'purchase',
        status: 'active',
        grantedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log('Course access granted:', courseAccess);

    // Also try with email as userId
    const courseAccessEmail = await CourseAccess.findOneAndUpdate(
      { 
        userId: user.email, 
        courseId: new mongoose.Types.ObjectId(courseId) 
      },
      {
        hasAccess: true,
        accessType: 'purchase',
        status: 'active',
        grantedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log('Course access granted with email:', courseAccessEmail);

    console.log('✅ Course access granted successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

grantAccess();

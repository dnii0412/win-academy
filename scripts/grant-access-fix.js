// Import the existing models
const mongoose = require('mongoose');

// Connect to MongoDB using the same connection as the app
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://danny:123456789@cluster0.8qjqj.mongodb.net/win-academy?retryWrites=true&w=majority';
mongoose.connect(MONGODB_URI);

// Import the actual models from the app
const User = require('./lib/models/User').default;
const CourseAccess = require('./lib/models/CourseAccess').default;

async function grantAccess() {
  try {
    console.log('🔍 Looking for user with email: okodanny0412@gmail.com');
    
    // Find user by email
    const user = await User.findOne({ email: 'okodanny0412@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      
      // Let's see what users exist
      const allUsers = await User.find({}, 'email firstName lastName').limit(5);
      console.log('Available users:', allUsers.map(u => ({ email: u.email, name: u.fullName || `${u.firstName} ${u.lastName}` })));
      return;
    }

    console.log('✅ Found user:', {
      id: user._id.toString(),
      email: user.email,
      name: user.fullName || `${user.firstName} ${user.lastName}`
    });

    // Grant access to the course
    const courseId = '68be5d3570b8624249055c3a';
    
    console.log('🔧 Granting access to course:', courseId);
    
    // Try with ObjectId as userId
    const courseAccess1 = await CourseAccess.findOneAndUpdate(
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

    console.log('✅ Course access granted with ObjectId:', courseAccess1._id);

    // Also try with email as userId
    const courseAccess2 = await CourseAccess.findOneAndUpdate(
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

    console.log('✅ Course access granted with email:', courseAccess2._id);

    // Verify the access was created
    const verifyAccess = await CourseAccess.findOne({
      $or: [
        { userId: user._id.toString(), courseId: new mongoose.Types.ObjectId(courseId) },
        { userId: user.email, courseId: new mongoose.Types.ObjectId(courseId) }
      ],
      hasAccess: true
    });

    console.log('🔍 Verification - Access record exists:', !!verifyAccess);
    if (verifyAccess) {
      console.log('📋 Access details:', {
        userId: verifyAccess.userId,
        hasAccess: verifyAccess.hasAccess,
        accessType: verifyAccess.accessType,
        status: verifyAccess.status
      });
    }

    console.log('🎉 Course access granted successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    mongoose.disconnect();
  }
}

grantAccess();

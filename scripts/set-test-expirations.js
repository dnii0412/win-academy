require('dotenv').config();
const mongoose = require('mongoose');

// Simple schema for testing
const CourseAccessSchema = new mongoose.Schema({
  userId: String,
  courseId: String,
  hasAccess: Boolean,
  expiresAt: Date,
  accessType: String,
  status: String,
  grantedAt: Date
});

const CourseAccess = mongoose.model('CourseAccess', CourseAccessSchema);

async function setTestExpirations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all active course access records
    const accessRecords = await CourseAccess.find({ 
      hasAccess: true,
      expiresAt: null // Only those without expiration dates
    }).limit(5); // Limit to 5 records for testing
    
    console.log(`Found ${accessRecords.length} course access records without expiration dates`);
    
    if (accessRecords.length === 0) {
      console.log('No course access records found to update');
      process.exit(0);
    }
    
    // Set different expiration dates for testing
    const now = new Date();
    const testExpirations = [
      new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    ];
    
    for (let i = 0; i < accessRecords.length; i++) {
      const record = accessRecords[i];
      const expirationDate = testExpirations[i % testExpirations.length];
      
      await CourseAccess.findByIdAndUpdate(record._id, {
        expiresAt: expirationDate
      });
      
      console.log(`✅ Set expiration for course ${record.courseId} to ${expirationDate.toISOString()}`);
    }
    
    console.log('🎉 Test expiration dates set successfully!');
    console.log('Now visit the dashboard to see the time remaining display.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting test expirations:', error);
    process.exit(1);
  }
}

setTestExpirations();

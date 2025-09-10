const mongoose = require('mongoose');

// Simple schema for checking
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

async function checkExpirationData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const accessRecords = await CourseAccess.find({}).select('courseId expiresAt accessType status').lean();
    console.log('Total course access records:', accessRecords.length);
    console.log('Records with expiresAt:', accessRecords.filter(r => r.expiresAt).length);
    
    if (accessRecords.filter(r => r.expiresAt).length > 0) {
      console.log('Sample record with expiration:');
      console.log(accessRecords.find(r => r.expiresAt));
    } else {
      console.log('No records with expiration dates found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkExpirationData();

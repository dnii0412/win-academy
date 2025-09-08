const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema (matching the one in lib/models/User.ts)
const userSchema = new mongoose.Schema({
  firstName: { type: String, trim: true, default: '' },
  lastName: { type: String, trim: true, default: '' },
  fullName: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phoneNumber: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  password: { type: String, required: false },
  avatar: { type: String, default: '' },
  image: { type: String, default: '' },
  provider: { type: String, enum: ['credentials', 'google', 'facebook'], default: 'credentials' },
  providerId: { type: String, default: '' },
  emailVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Update user to admin role
const updateUserToAdmin = async () => {
  try {
    // Find the user by email
    const user = await User.findOne({ email: 'admin@winacademy.mn' });

    if (!user) {
      console.log('User not found. Please create the user first.');
      return;
    }

    // Update the user to admin role
    user.role = 'admin';
    await user.save();

    console.log('User updated to admin role successfully!');

  } catch (error) {
    console.error('Error updating user to admin:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await updateUserToAdmin();
  mongoose.connection.close();
  console.log('Script completed');
};

main();

const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/win-academy');
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

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@winacademy.mn' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash('password', 12);

    // Create admin user
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      fullName: 'Admin User',
      email: 'admin@winacademy.mn',
      password: hashedPassword,
      provider: 'credentials',
      emailVerified: true,
      role: 'admin'
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@winacademy.mn');
    console.log('Password: password');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await createAdminUser();
  mongoose.connection.close();
  console.log('Script completed');
};

main();

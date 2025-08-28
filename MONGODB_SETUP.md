# MongoDB Setup Guide

## Prerequisites
- MongoDB Atlas account (free tier available)
- Or local MongoDB installation

## Environment Variables

Add the following to your `.env.local` file:

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/win-academy?retryWrites=true&w=majority

# NextAuth Configuration
AUTH_SECRET=your-auth-secret-here
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (Optional)
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

## MongoDB Atlas Setup

1. **Create Cluster:**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a free cluster
   - Choose your preferred cloud provider and region

2. **Database Access:**
   - Create a database user with read/write permissions
   - Use a strong password

3. **Network Access:**
   - Add your IP address or `0.0.0.0/0` for development
   - For production, restrict to your app's IP

4. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<username>`, `<password>`, and `<dbname>` with your values

## Local MongoDB Setup

If using local MongoDB:

```bash
# Install MongoDB Community Edition
# macOS with Homebrew:
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Connection string for local:
MONGODB_URI=mongodb://localhost:27017/win-academy
```

## Features Implemented

✅ **User Registration** - Stores users in MongoDB
✅ **User Authentication** - NextAuth with MongoDB backend
✅ **Password Hashing** - Secure bcrypt encryption
✅ **Duplicate Prevention** - Unique email constraints
✅ **Error Handling** - MongoDB-specific error handling
✅ **Connection Management** - Efficient connection pooling

## Database Schema

The User model includes:
- `fullName` - User's full name
- `email` - Unique email address
- `phone` - Phone number
- `password` - Hashed password
- `image` - Profile image URL
- `emailVerified` - Email verification status
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

## Testing

After setup, test the registration:
1. Start your development server
2. Go to `/register`
3. Create a new account
4. Check MongoDB Atlas dashboard for the new user

## Troubleshooting

- **Connection Error**: Check your MONGODB_URI format
- **Authentication Error**: Verify username/password in connection string
- **Network Error**: Ensure your IP is whitelisted in Atlas
- **Build Error**: Make sure all dependencies are installed

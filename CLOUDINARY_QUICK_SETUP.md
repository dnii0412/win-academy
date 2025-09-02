# 🚀 Quick Cloudinary Setup (5 minutes)

Your image upload is failing because Cloudinary environment variables are missing. Here's how to fix it:

## Step 1: Get Cloudinary Account (FREE)
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for free (no credit card required)
3. After signup, you'll see your dashboard

## Step 2: Get Your Credentials
From your Cloudinary dashboard, copy these values:
- **Cloud Name** (e.g., "your-cloud-name")
- **API Key** (e.g., "123456789012345")
- **API Secret** (e.g., "abcdefghijklmnopqrstuvwxyz123456")

## Step 3: Add to Environment Variables
Add these lines to your `.env.local` file:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here
```

**⚠️ Replace the values with your actual Cloudinary credentials!**

## Step 3.5: Upload Preset (Automatic)
The system will automatically create an upload preset called `win-academy-uploads` when you first run it. This preset is configured for:
- Unsigned uploads (no authentication needed)
- Course thumbnails folder organization
- Auto quality optimization
- Supported formats: JPG, PNG, WebP, GIF

## Step 4: Restart Development Server
```bash
# Stop the server (Ctrl+C) then restart
npm run dev
```

## Step 5: Test Upload
1. Go to `/admin/courses`
2. Click "Add Course" 
3. Try uploading a thumbnail image
4. It should work now! ✅

## Alternative: Client-Side Only Setup (Simpler)
If you don't want to use API keys, you can use unsigned uploads:

1. In Cloudinary dashboard, go to Settings → Upload
2. Enable "Unsigned uploading"
3. Note the "Upload preset name" (usually `ml_default`)
4. Only add this to `.env.local`:
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name-here
```

## Troubleshooting
- ❌ **"Cloudinary not configured"** → Check `.env.local` file
- ❌ **"Authentication required"** → Make sure you're logged in as admin
- ❌ **"Invalid file type"** → Only PNG, JPG, WebP, GIF allowed
- ❌ **"File too large"** → Max 5MB for course thumbnails

## Need Help?
Check the browser console (F12) for detailed error messages.

---
**That's it! Your image uploads should work now. 🎉**

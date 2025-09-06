# 🚨 Production Image Upload Fix Guide

## Quick Diagnosis

If image uploads aren't working in production, check these common issues:

### 1. Environment Variables Missing
Make sure these are set in your production environment (Vercel, Netlify, etc.):

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=win-academy-uploads
```

### 2. Cloudinary Upload Preset Not Created
The system tries multiple presets in order:
1. `win-academy-uploads` (custom preset)
2. `ml_default` (Cloudinary default)
3. `unsigned` (fallback)

**To create the custom preset:**
1. Go to Cloudinary Dashboard → Settings → Upload
2. Click "Add upload preset"
3. Name: `win-academy-uploads`
4. Signing Mode: **Unsigned** (for easier setup)
5. Folder: `course-thumbnails`
6. Save

### 3. Authentication Issues
In production, admin authentication is required. Make sure:
- User is logged in as admin
- Admin token is valid
- JWT_SECRET is set in production

### 4. CORS Issues
If you see CORS errors, check:
- Cloudinary account settings
- Domain whitelist in Cloudinary
- Production domain is allowed

## Debugging Steps

### Step 1: Check Environment Variables
Add this to your production logs to verify:

```javascript
console.log('Cloudinary Config:', {
  hasCloudName: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  hasApiKey: !!process.env.CLOUDINARY_API_KEY,
  hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
  hasUploadPreset: !!process.env.CLOUDINARY_UPLOAD_PRESET,
  nodeEnv: process.env.NODE_ENV
})
```

### Step 2: Test Upload Presets
Try uploading with different presets manually:

```bash
curl -X POST \
  https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload \
  -F "file=@test-image.jpg" \
  -F "upload_preset=win-academy-uploads"
```

### Step 3: Check Browser Console
Look for these error messages:
- "Cloudinary cloud name not configured"
- "Upload preset not configured"
- "Authentication required"
- "All upload methods failed"

## Quick Fixes

### Fix 1: Use Default Preset
If custom preset doesn't work, the system will automatically try `ml_default` (Cloudinary's default preset).

### Fix 2: Enable Unsigned Uploads
In Cloudinary dashboard:
1. Go to Settings → Upload
2. Enable "Unsigned uploading"
3. This allows uploads without API keys

### Fix 3: Check File Size/Type
Make sure uploaded files are:
- Under 10MB
- Supported formats: JPEG, PNG, WebP, GIF

## Production Deployment Checklist

- [ ] Environment variables set in production platform
- [ ] Cloudinary account active and accessible
- [ ] Upload preset created (`win-academy-uploads`)
- [ ] Admin authentication working
- [ ] CORS settings configured
- [ ] Domain whitelisted in Cloudinary (if needed)

## Still Not Working?

1. Check production logs for detailed error messages
2. Test with a simple image upload outside the app
3. Verify Cloudinary account limits (free tier has limits)
4. Contact support with specific error messages

## Alternative: Use Server-Side Upload Only

If client-side uploads keep failing, the system will automatically fall back to server-side uploads via `/api/cloudinary/upload`. This is more reliable but requires admin authentication.

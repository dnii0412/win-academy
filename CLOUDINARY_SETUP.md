# Cloudinary Integration Setup Guide

## Overview

This guide covers the complete Cloudinary integration system for WIN Academy, including thumbnail uploads, storage, and retrieval.

## Features Implemented

✅ **Complete Image Upload System**
- Drag & drop interface
- File validation (type, size)
- Progress tracking
- Error handling
- Image preview and management

✅ **Server-side API Endpoints**
- Secure upload with authentication
- Image deletion
- Image existence checking
- Upload signature generation

✅ **Course Integration**
- Thumbnail upload in admin course form
- Automatic URL and public ID storage
- Image deletion when updating

✅ **Cloudinary Optimizations**
- Auto format and quality
- Responsive image transformations
- Organized folder structure

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

## Cloudinary Setup Steps

### 1. Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com)
2. Sign up for a free account
3. Note your Cloud Name from the dashboard

### 2. Get API Credentials
1. Go to Settings → API Keys
2. Copy your API Key and API Secret
3. Add them to your environment variables

### 3. Create Upload Preset
1. Go to Settings → Upload
2. Click "Add upload preset"
3. Configure settings:
   - **Preset name**: `win-academy-uploads` (or your choice)
   - **Signing Mode**: Signed
   - **Folder**: `course-thumbnails` (optional)
   - **Transformation**: `w_800,h_600,c_fill,q_auto,f_auto`
   - **Format**: Auto
   - **Quality**: Auto

## File Structure

### API Endpoints

**`/api/cloudinary/upload` (POST)**
- Uploads images to Cloudinary
- Requires authentication
- Validates file type and size
- Returns secure URL and public ID

**`/api/cloudinary/delete` (POST)**
- Deletes images from Cloudinary
- Requires authentication
- Takes public ID as parameter

**`/api/cloudinary/upload` (GET)**
- Generates upload signature for direct uploads
- Returns signature and timestamp

### Components

**`components/ImageUpload.tsx`**
- Complete drag & drop upload interface
- File validation and error handling
- Progress tracking and preview
- Delete functionality
- Multi-language support

### Services

**`lib/cloudinary.ts`**
- Cloudinary service class
- Upload and optimization methods
- URL generation utilities

## Usage Examples

### Basic Upload Component

```tsx
import ImageUpload from "@/components/ImageUpload"

function MyForm() {
  const [imageUrl, setImageUrl] = useState("")
  const [publicId, setPublicId] = useState("")

  return (
    <ImageUpload
      onUploadSuccess={(url, id) => {
        setImageUrl(url)
        setPublicId(id)
      }}
      onUploadError={(error) => {
        console.error("Upload failed:", error)
      }}
      currentImageUrl={imageUrl}
      currentPublicId={publicId}
      folder="my-folder"
      maxSizeInMB={5}
    />
  )
}
```

### Direct API Usage

```javascript
// Upload image
const formData = new FormData()
formData.append('file', file)
formData.append('folder', 'course-thumbnails')

const response = await fetch('/api/cloudinary/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  },
  body: formData
})

const result = await response.json()
console.log(result.data.secure_url) // Cloudinary URL
```

### Delete Image

```javascript
const response = await fetch('/api/cloudinary/delete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({ publicId: 'image-public-id' })
})
```

## Image Optimization

The system automatically applies optimizations:

- **Format**: Auto (WebP, AVIF when supported)
- **Quality**: Auto (based on content)
- **Compression**: Automatic
- **Responsive**: Different sizes for different devices

### Custom Transformations

```typescript
import { cloudinary } from '@/lib/cloudinary'

// Get optimized URL
const optimizedUrl = cloudinary.getOptimizedUrl(publicId, {
  width: 400,
  height: 300,
  quality: 80,
  format: 'webp'
})
```

## Folder Structure

Images are organized in Cloudinary folders:
- `course-thumbnails/` - Course thumbnail images
- `user-avatars/` - User profile pictures
- `lesson-materials/` - Lesson attachments

## Security Features

✅ **Authentication Required**
- All upload/delete operations require admin token
- Prevents unauthorized access

✅ **File Validation**
- Type validation (JPEG, PNG, WebP, GIF only)
- Size limits (configurable, default 10MB)
- Malicious file detection

✅ **Upload Presets**
- Signed uploads for security
- Controlled transformations
- Folder restrictions

## Error Handling

The system handles common errors:
- Invalid file types
- File size too large
- Network failures
- Authentication errors
- Cloudinary service errors

## Testing

### Test Upload
1. Go to `/admin/courses`
2. Click "Add Course"
3. Upload a thumbnail image
4. Verify image appears in form
5. Check Cloudinary dashboard for uploaded file

### Test Deletion
1. Upload an image in course form
2. Click delete button on uploaded image
3. Verify image is removed from form
4. Check Cloudinary dashboard (image should be deleted)

## Troubleshooting

### Common Issues

**"Cloudinary configuration missing"**
- Check environment variables are set
- Verify NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is correct

**"Upload failed"**
- Check API key and secret
- Verify upload preset exists and is signed
- Check file size and type

**"Authentication required"**
- Ensure admin token is valid
- Check Authorization header format

**"Image not displaying"**
- Verify secure_url is saved correctly
- Check if image exists in Cloudinary dashboard
- Test URL directly in browser

### Debug Mode

Enable debug logging by adding:
```javascript
// In your component
console.log('Cloudinary config:', {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  hasApiKey: !!process.env.CLOUDINARY_API_KEY,
  hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
})
```

## Performance Optimization

### Image Loading
- Use lazy loading for course thumbnails
- Implement progressive JPEG loading
- Add blur placeholders

### Caching
- Cloudinary provides automatic CDN caching
- Set appropriate cache headers
- Use responsive images with srcset

### Bundle Size
- Import only needed Cloudinary features
- Use dynamic imports for upload components

## Next Steps

### Potential Enhancements
- [ ] Multiple image upload for galleries
- [ ] Image cropping interface
- [ ] Bulk image operations
- [ ] Video upload support
- [ ] Advanced image analytics
- [ ] Automatic alt text generation

## Support

For issues with this integration:
1. Check Cloudinary dashboard for upload logs
2. Review browser network tab for API errors
3. Check server logs for detailed error messages
4. Verify environment variables are correct

## Cost Optimization

### Free Tier Limits
- 25 GB storage
- 25 GB bandwidth
- 25,000 transformations/month

### Best Practices
- Use appropriate image sizes
- Enable auto-optimization
- Delete unused images regularly
- Monitor usage in Cloudinary dashboard

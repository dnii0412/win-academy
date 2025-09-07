# 🐰 Bunny Stream Integration with TUS Upload

This document describes the complete integration of Bunny Stream with TUS (Tus Resumable Upload) for video management in the WIN Academy admin panel.

## 🚀 Features Implemented

### ✅ **Video Upload System**
- **TUS Resumable Upload**: Supports large video files with resume capability
- **Bunny Stream Integration**: Direct upload to Bunny.net CDN
- **Progress Tracking**: Real-time upload progress with percentage and file size
- **File Validation**: Video format and size validation (max 2GB)
- **Bilingual Support**: English and Mongolian interface

### ✅ **Video Management**
- **Video Library**: Browse all uploaded videos
- **Status Tracking*e*: Monitor encoding status (ready, encoding, error)
- **Metadata Management**: Edit video titles, descriptions, and details
- **Bulk Operations**: Delete multiple videos
- **Search & Filter**: Find videos quickly

### ✅ **Course Integration**
- **Module Management**: Create and organize course modules
- **Topic Creation**: Add video lessons to modules
- **Drag & Drop**: Reorder modules and topics
- **Video Assignment**: Link Bunny Stream videos to course topics

## 🔧 Technical Implementation

### **Bunny Stream Configuration**
```typescript
// lib/bunny-stream.ts
export const BUNNY_STREAM_CONFIG = {
  libraryId: '488255',
  apiKey: '4c28cdf8-f836-423a-9cfee09414d0-1f41-4b3a',
  baseUrl: 'https://video.bunnycdn.com',
  streamUrl: 'https://iframe.mediadelivery.net',
  uploadUrl: 'https://video.bunnycdn.com/tusupload'
}
```

### **TUS Upload Component**
- **File Selection**: Drag & drop or click to select
- **Progress Bar**: Visual upload progress
- **Error Handling**: Comprehensive error messages
- **Resume Support**: Automatic resume on connection loss

### **API Endpoints**
- `POST /api/admin/courses/[courseId]/modules` - Create modules
- `POST /api/admin/courses/[courseId]/modules/[moduleId]/topics` - Create topics
- `PUT /api/admin/courses/[courseId]` - Update course details
- `DELETE /api/admin/courses/[courseId]` - Delete courses

## 📱 User Interface

### **Admin Video Management Page**
- **Upload Button**: Large, prominent upload button
- **Statistics Cards**: Total videos, ready videos, total size
- **Video Grid**: Thumbnail view with status indicators
- **Search Functionality**: Find videos by title or description

### **Video Upload Modal**
- **Video Information**: Title and description fields
- **File Selection**: Supported formats (MP4, MOV, AVI, MKV)
- **Upload Progress**: Real-time progress with cancel option
- **Success/Error States**: Clear feedback messages

### **Course Management Integration**
- **Module Creation**: Add modules to courses
- **Topic Management**: Add video lessons to modules
- **Video Linking**: Connect uploaded videos to course topics
- **Order Management**: Drag & drop reordering

## 🎯 Usage Instructions

### **1. Upload a Video**
1. Navigate to `/admin/videos`
2. Click "Upload Video" button
3. Enter video title and description
4. Select video file (max 2GB)
5. Click "Upload" and wait for completion

### **2. Add Video to Course**
1. Go to course detail page (`/admin/courses/[courseId]`)
2. Click "Add Module" to create a module
3. Click "Add Topic" within the module
4. Enter topic details and video URL from Bunny Stream
5. Save the topic

### **3. Manage Video Library**
1. View all videos in the video library
2. Search for specific videos
3. Copy video IDs or stream URLs
4. Delete unwanted videos
5. Monitor encoding status

## 🔒 Security Features

### **Authentication**
- JWT token verification for all API calls
- Admin role validation
- Secure file upload validation

### **File Validation**
- Video format restriction
- File size limits (2GB max)
- MIME type verification

## 📊 Supported Video Formats

- **MP4** (H.264, H.265)
- **MOV** (QuickTime)
- **AVI** (Audio Video Interleave)
- **MKV** (Matroska)
- **WebM** (Web Media)

## 🌐 Bunny Stream Features

### **CDN Benefits**
- **Global Distribution**: Fast video delivery worldwide
- **Adaptive Bitrate**: Automatic quality adjustment
- **Thumbnail Generation**: Automatic thumbnail creation
- **Analytics**: View count and engagement metrics

### **Streaming URLs**
- **Embed URLs**: For iframe embedding
- **Direct URLs**: For direct video access
- **HLS/DASH**: Adaptive streaming support

## 🚨 Error Handling

### **Upload Errors**
- Network connection issues
- File size exceeded
- Invalid file format
- Bunny Stream API errors

### **User Feedback**
- Clear error messages in both languages
- Progress indication during uploads
- Success confirmations
- Retry mechanisms

## 🔄 Future Enhancements

### **Planned Features**
- **Batch Upload**: Multiple video uploads
- **Video Editing**: Basic video trimming and effects
- **Playlist Creation**: Organize videos into playlists
- **Advanced Analytics**: Detailed video performance metrics
- **Auto-encoding**: Automatic format conversion

### **Integration Possibilities**
- **AI Thumbnail Generation**: Automatic thumbnail creation
- **Video Transcription**: Automatic subtitle generation
- **Content Moderation**: AI-powered content filtering
- **Multi-language Support**: Additional language interfaces

## 📝 Configuration

### **Environment Variables**
```bash
# Bunny Stream Configuration
BUNNY_LIBRARY_ID=486981
BUNNY_API_KEY=ddd7543e-9a27-419e-b5347544bd92-12f7-4baf

# JWT Configuration
JWT_SECRET=your-secret-key
NEXTAUTH_SECRET=your-nextauth-secret
```

### **Database Models**
- **Course Model**: Includes modules and topics
- **Module Schema**: Course organization structure
- **Topic Schema**: Individual video lessons

## 🧪 Testing

### **Test Scenarios**
1. **Small Video Upload** (< 100MB)
2. **Large Video Upload** (> 1GB)
3. **Upload Resume**: Interrupt and resume
4. **Error Handling**: Invalid files, network issues
5. **Course Integration**: Add videos to courses

### **Performance Metrics**
- Upload speed and reliability
- Error rate and recovery
- User experience feedback
- System resource usage

## 📞 Support

### **Troubleshooting**
- Check Bunny Stream API status
- Verify network connectivity
- Review browser console for errors
- Check file format compatibility

### **Contact Information**
- **Bunny Stream Support**: [support@bunny.net](mailto:support@bunny.net)
- **Technical Issues**: Check GitHub issues
- **Feature Requests**: Submit via GitHub

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅

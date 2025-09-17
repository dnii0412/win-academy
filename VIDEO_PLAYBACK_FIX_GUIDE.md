# 🎬 Video Playback Fix Guide

## 🔍 **DIAGNOSTIC RESULTS**

### ❌ **Critical Issues Found:**

1. **Bunny Stream Authentication Failure (401)**
   - API key is invalid or expired
   - Videos cannot be loaded or streamed

2. **Missing Environment Variables**
   - No `.env.local` file found
   - Database connection will fail
   - Authentication will fail

3. **Bunny Stream Service Issues**
   - 404 errors on Bunny Stream endpoints
   - Video streaming completely broken

## 🔧 **IMMEDIATE FIXES REQUIRED**

### **Step 1: Create Environment File**

Create `.env.local` in your project root with:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/win-academy

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here-change-this-in-production

# JWT Secret for admin authentication
JWT_SECRET=your-jwt-secret-here-change-this-in-production

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=win-academy-uploads

# QPay Configuration
QPAY_BASE_URL=https://merchant-sandbox.qpay.mn
QPAY_CLIENT_ID=your-qpay-client-id
QPAY_CLIENT_SECRET=your-qpay-client-secret
QPAY_INVOICE_CODE=your-qpay-invoice-code
QPAY_CALLBACK_URL=https://yourdomain.com/api/qpay/webhook

# QPay Mock Mode (for development)
QPAY_MOCK_MODE=false

# Bunny Stream Configuration
BUNNY_LIBRARY_ID=486981
BUNNY_API_KEY=ddd7543e-9a27-419e-b5347544bd92-12f7-4baf
```

### **Step 2: Fix Bunny Stream API Key**

The current API key is returning 401 errors. You need to:

1. **Log into your Bunny.net account**
2. **Go to Stream Dashboard**
3. **Generate a new API key**
4. **Update the `BUNNY_API_KEY` in `.env.local`**

### **Step 3: Verify Bunny Stream Library**

1. **Check if Library ID `486981` is correct**
2. **Verify the library exists and is accessible**
3. **Update `BUNNY_LIBRARY_ID` if needed**

### **Step 4: Test the Fixes**

After creating the environment file and updating the API key:

```bash
# Restart the development server
npm run dev

# Test the health endpoint
curl http://localhost:3000/api/health

# Run the diagnostic script
npx tsx scripts/video-diagnostic.ts
```

## 🎯 **EXPECTED RESULTS AFTER FIXES**

- ✅ Database connection: `connected`
- ✅ Bunny Stream: `connected`
- ✅ API: `operational`
- ✅ Video playback: Working
- ✅ Error handling: Improved

## 🚨 **ADDITIONAL RECOMMENDATIONS**

### **1. Video Format Optimization**
- Ensure videos are in MP4 format
- Use H.264 codec for maximum compatibility
- Optimize video bitrates for streaming

### **2. Fallback Mechanisms**
- Implement YouTube fallback for critical videos
- Add direct video file serving as backup
- Use multiple CDN providers

### **3. Monitoring & Alerts**
- Set up video playback monitoring
- Alert on API key expiration
- Monitor video loading times

### **4. Error Recovery**
- Implement automatic retry logic
- Add user-friendly error messages
- Provide manual refresh options

## 🔄 **TESTING CHECKLIST**

- [ ] Environment variables loaded
- [ ] Database connection working
- [ ] Bunny Stream API accessible
- [ ] Video URLs generating correctly
- [ ] Video playback working
- [ ] Error handling functioning
- [ ] Network monitoring active
- [ ] Retry logic working

## 📞 **SUPPORT**

If issues persist after following this guide:

1. Check Bunny.net account status
2. Verify API key permissions
3. Test with a simple video file
4. Check network connectivity
5. Review browser console for errors

---

**Last Updated**: September 17, 2025
**Status**: Critical fixes required

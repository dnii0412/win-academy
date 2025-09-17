#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables...\n');

const envContent = `# Database
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
`;

const envPath = path.join(process.cwd(), '.env.local');

try {
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists. Backing up to .env.local.backup');
    fs.copyFileSync(envPath, envPath + '.backup');
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local created successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Update the API keys with your actual values');
  console.log('2. Restart your development server: npm run dev');
  console.log('3. Test the health endpoint: curl http://localhost:3000/api/health');
  console.log('4. Run diagnostics: npx tsx scripts/video-diagnostic.ts');
  
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
  console.log('\n📝 Please create .env.local manually with the content above.');
}

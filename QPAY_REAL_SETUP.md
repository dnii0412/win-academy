# QPay Real Integration Setup Guide

## Step 1: Get QPay Merchant Credentials

1. **Register for QPay Merchant Account**
   - Go to https://merchant.qpay.mn
   - Register your business
   - Complete the verification process

2. **Get Your Credentials**
   - Login to your QPay merchant dashboard
   - Go to "API Settings" or "Developer Settings"
   - Copy the following credentials:
     - Client ID
     - Client Secret
     - Username
     - Password
     - Invoice Code

## Step 2: Set Up Environment Variables

Create a `.env.local` file in your project root with:

```bash
# QPay Configuration
QPAY_BASE_URL=https://merchant-sandbox.qpay.mn
QPAY_GRANT_TYPE=password
QPAY_CLIENT_ID=your_actual_client_id
QPAY_CLIENT_SECRET=your_actual_client_secret
QPAY_USERNAME=your_actual_username
QPAY_PASSWORD=your_actual_password
QPAY_INVOICE_CODE=your_actual_invoice_code

# Webhook URL (must be publicly accessible)
# For local development, use ngrok:
# 1. Install ngrok: https://ngrok.com/
# 2. Run: ngrok http 3000
# 3. Use the HTTPS URL it provides
QPAY_WEBHOOK_PUBLIC_URL=https://your-ngrok-url.ngrok.io/api/payments/callback

# Disable mock mode to use real QPay
QPAY_MOCK_MODE=false

# Other required environment variables
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
MONGODB_URI=your_mongodb_connection_string
```

## Step 3: Set Up Webhook for Local Development

### Option A: Using ngrok (Recommended for testing)

1. **Install ngrok**
   ```bash
   # Install via npm
   npm install -g ngrok
   
   # Or download from https://ngrok.com/
   ```

2. **Start your Next.js app**
   ```bash
   npm run dev
   ```

3. **In another terminal, start ngrok**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Update your .env.local**
   ```bash
   QPAY_WEBHOOK_PUBLIC_URL=https://abc123.ngrok.io/api/payments/callback
   ```

### Option B: Deploy to Production

Deploy your app to Vercel, Netlify, or another hosting service and use the production URL.

## Step 4: Test the Integration

1. **Start your app**
   ```bash
   npm run dev
   ```

2. **Check the logs** - You should see:
   ```
   QPay running in REAL MODE
   ```

3. **Test a payment**:
   - Go to a course page
   - Click "Buy"
   - You should see a real QPay QR code
   - Scan with a real bank app to test

## Step 5: Production Setup

1. **Switch to Production QPay**
   ```bash
   QPAY_BASE_URL=https://merchant.qpay.mn
   ```

2. **Update webhook URL** to your production domain
   ```bash
   QPAY_WEBHOOK_PUBLIC_URL=https://yourdomain.com/api/payments/callback
   ```

3. **Set QPAY_MOCK_MODE=false**

## Troubleshooting

### Common Issues:

1. **"Missing QPay env" error**
   - Check that all QPay environment variables are set
   - Make sure .env.local is in the project root

2. **Webhook not working**
   - Ensure webhook URL is HTTPS
   - Check that the URL is publicly accessible
   - Verify the callback endpoint exists

3. **Authentication failed**
   - Double-check your QPay credentials
   - Make sure you're using the correct environment (sandbox vs production)

4. **QR code not showing**
   - Check browser console for errors
   - Verify QPay API is returning valid data

### Testing Commands:

```bash
# Test QPay connection
npm run qpay:test

# Check environment variables
npm run qpay:check

# Test invoice creation
npm run qpay:invoice:test
```

## Security Notes

- Never commit .env.local to version control
- Use different credentials for development and production
- Regularly rotate your API credentials
- Monitor your QPay dashboard for suspicious activity

## Support

- QPay Documentation: https://merchant.qpay.mn/docs
- QPay Support: Contact through your merchant dashboard
- This Project Issues: Create an issue in the repository

# QPay Setup with Vercel

## 🚀 Quick Setup Guide

### 1. **Vercel Environment Variables**

Add these to your Vercel project settings → Environment Variables:

```bash
# QPay Configuration (Sandbox)
QPAY_BASE_URL=https://merchant-sandbox.qpay.mn
QPAY_GRANT_TYPE=password
QPAY_CLIENT_ID=your_sandbox_client_id
QPAY_CLIENT_SECRET=your_sandbox_client_secret
QPAY_USERNAME=your_sandbox_username
QPAY_PASSWORD=your_sandbox_password
QPAY_INVOICE_CODE=WINACADEMY-COURSE
QPAY_WEBHOOK_PUBLIC_URL=https://your-app-name.vercel.app/api/pay/qpay/webhook

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
CURRENCY_MNT=MNT

# Database
MONGODB_URI=your_mongodb_connection_string

# Auth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-app-name.vercel.app
```

### 2. **Local Development (.env.local)**

Create `.env.local` in your project root:

```bash
# Enable mock mode for local development
QPAY_MOCK_MODE=true

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
CURRENCY_MNT=MNT

# Database
MONGODB_URI=your_mongodb_connection_string

# Auth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. **Testing Workflow**

#### **Local Development (Mock Mode)**
1. Run `npm run dev`
2. Navigate to `/checkout/[courseId]`
3. Click "Pay with QPay" - will use mock data
4. See QR code and payment simulation

#### **Vercel Production (Real QPay)**
1. Deploy to Vercel with environment variables
2. Navigate to `https://your-app.vercel.app/checkout/[courseId]`
3. Click "Pay with QPay" - will create real QPay invoice
4. Scan QR with QPay-compatible app
5. Payment webhook will be called automatically

### 4. **Getting QPay Credentials**

Contact QPay to get:
- Sandbox credentials for testing
- Production credentials for live payments
- Invoice code for your merchant account

### 5. **Webhook Testing**

The webhook URL will be:
`https://your-app-name.vercel.app/api/pay/qpay/webhook`

QPay will call this URL when payments are made.

## 🔧 **Mock Mode Features**

When `QPAY_MOCK_MODE=true`:
- ✅ Creates fake invoices with mock QR codes
- ✅ Simulates payment responses
- ✅ No real QPay API calls
- ✅ Perfect for UI testing and development

## 🚀 **Production Checklist**

- [ ] Set real QPay credentials in Vercel
- [ ] Update `QPAY_WEBHOOK_PUBLIC_URL` to your Vercel domain
- [ ] Test payment flow end-to-end
- [ ] Verify webhook receives payment notifications
- [ ] Confirm course access is granted after payment

## 🐛 **Troubleshooting**

**"Missing QPay env" error:**
- Check environment variables in Vercel dashboard
- Ensure all required QPay variables are set

**Webhook not working:**
- Verify `QPAY_WEBHOOK_PUBLIC_URL` points to your Vercel domain
- Check Vercel function logs for webhook errors

**Payment not completing:**
- Check QPay sandbox credentials
- Verify invoice creation in QPay dashboard
- Check payment status API endpoint

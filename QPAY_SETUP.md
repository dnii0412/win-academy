# QPay Integration Setup Guide

## 🚀 Complete QPay Payment Integration for Win Academy

This implementation provides a production-ready QPay payment system with QR codes, bank deeplinks, webhook verification, and automatic course access management.

## 📋 Features Implemented

✅ **Complete QPay SDK**
- Token management with automatic refresh
- Invoice creation and management  
- Payment verification and status checking
- Error handling and retry logic

✅ **Secure Payment Flow**
- Server-side only QPay credentials
- Webhook verification with payment double-check
- Idempotent operations
- Comprehensive audit trail

✅ **User Experience**
- QR code display for mobile payments
- Bank app deeplinks
- Real-time payment status polling
- Automatic page refresh after payment

✅ **Course Access Management**
- Automatic access granting after payment
- Access verification utilities
- Course viewing with purchase flow

## 🔧 Setup Instructions

### 1. Environment Configuration

Add these variables to your `.env.local` file:

```bash
# QPay Configuration (Sandbox)
QPAY_BASE_URL=https://merchant-sandbox.qpay.mn
QPAY_GRANT_TYPE=password
QPAY_CLIENT_ID=your_client_id
QPAY_CLIENT_SECRET=your_client_secret
QPAY_USERNAME=your_merchant_username
QPAY_PASSWORD=your_merchant_password
QPAY_INVOICE_CODE=WINACADEMY-COURSE
QPAY_WEBHOOK_PUBLIC_URL=https://your-domain.com/api/pay/qpay/webhook

# Additional
CURRENCY_MNT=MNT
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Database Setup

The integration automatically creates the necessary MongoDB collections:
- Enhanced `Order` model with QPay fields
- New `CourseAccess` model for access management

### 3. Webhook Configuration

For local development:
1. Install ngrok: `npm install -g ngrok`
2. Expose your local server: `ngrok http 3000`
3. Update `QPAY_WEBHOOK_PUBLIC_URL` with the ngrok URL + `/api/pay/qpay/webhook`

### 4. Testing the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to any course checkout page:
   ```
   http://localhost:3000/checkout/[courseId]
   ```

3. The QPay payment component will:
   - Create a QPay invoice
   - Display QR code and bank links
   - Poll for payment status
   - Automatically grant course access
   - Refresh the page to show unlocked content

## 🏗️ Architecture Overview

### API Endpoints

- `POST /api/pay/qpay/create` - Create payment invoice
- `POST /api/pay/qpay/webhook` - Handle QPay callbacks
- `GET /api/pay/qpay/status` - Check payment status

### Components

- `PayWithQPay` - Main payment interface component
- `CourseImage` - Optimized course thumbnail display
- Course access checking utilities

### Security Features

- All QPay credentials server-side only
- Webhook payload verification
- Payment amount verification
- User authentication required
- Idempotent payment processing

## 🔄 Payment Flow

1. **User initiates payment** → Creates order in database
2. **QPay invoice created** → Returns QR code and deeplinks  
3. **User pays** → QPay sends webhook notification
4. **Webhook received** → Verifies payment with QPay API
5. **Payment confirmed** → Grants course access
6. **Status polling** → Updates UI automatically
7. **Page refresh** → Shows unlocked content

## 🚦 Production Checklist

When ready for production:

1. **Update environment variables:**
   ```bash
   QPAY_BASE_URL=https://merchant.qpay.mn
   QPAY_CLIENT_ID=production_client_id
   QPAY_CLIENT_SECRET=production_client_secret
   QPAY_INVOICE_CODE=production_invoice_code
   QPAY_WEBHOOK_PUBLIC_URL=https://yourdomain.com/api/pay/qpay/webhook
   ```

2. **Ensure webhook endpoint is publicly accessible**
3. **Test with small amounts first**
4. **Monitor logs for any issues**
5. **Set up proper error alerting**

## 🔍 Monitoring & Debugging

### Webhook Logs
All webhook events are stored in the database under `order.qpay.webhookEvents` for debugging.

### Status Checking
The system polls QPay every 3 seconds and also responds to webhooks for redundancy.

### Error Handling
Comprehensive error handling with user-friendly messages and detailed server logs.

## 🛠️ Customization

### Payment Amounts
Modify the course price in your Course model - the system automatically uses the course price.

### UI Styling
The PayWithQPay component uses your existing Tailwind classes and can be customized.

### Access Control
Extend the CourseAccess model to add features like:
- Time-limited access
- Subscription models
- Bundle purchases

## 📞 Support

For QPay-specific issues:
- Check QPay merchant documentation
- Verify webhook endpoint accessibility
- Monitor server logs for API errors

For integration issues:
- Check environment variables
- Verify database connectivity
- Test with QPay sandbox first

## 🎯 Next Steps

Optional enhancements you can add:
- Admin dashboard for payment management
- Refund functionality
- Subscription support
- Bundle purchases
- Payment analytics

The current implementation provides a solid foundation for all these features!

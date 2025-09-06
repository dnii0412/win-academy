# QPay Integration Guide

This guide covers the complete QPay payment integration for the WIN Academy Next.js application.

## Overview

The QPay integration provides:
- ✅ Secure token management with auto-refresh
- ✅ Idempotent invoice creation
- ✅ Webhook-based payment verification
- ✅ Real-time payment status checking
- ✅ Automatic course access granting
- ✅ Comprehensive error handling and logging

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client UI     │    │   Next.js API    │    │   QPay API      │
│                 │    │                  │    │                 │
│ QPayPayment.tsx │◄──►│ /api/qpay/*      │◄──►│ /v2/invoice     │
│                 │    │                  │    │ /v2/payment/*   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   MongoDB        │
                       │                  │
                       │ QPayInvoice      │
                       │ CourseAccess     │
                       └──────────────────┘
```

## Environment Configuration

Add these variables to your `.env.local`:

```bash
# QPay Configuration
QPAY_BASE_URL=https://merchant-sandbox.qpay.mn
QPAY_CLIENT_ID=your-qpay-client-id
QPAY_CLIENT_SECRET=your-qpay-client-secret
QPAY_INVOICE_CODE=your-qpay-invoice-code
QPAY_CALLBACK_URL=https://yourdomain.com/api/qpay/webhook

# For production, change to:
# QPAY_BASE_URL=https://merchant.qpay.mn
```

## API Endpoints

### 1. Create Invoice - `POST /api/qpay/invoice`

**Request:**
```json
{
  "userId": "user123",
  "courseId": "course456",
  "amount": 50000,
  "description": "Course: Advanced React"
}
```

**Response:**
```json
{
  "success": true,
  "invoice": {
    "invoice_id": "qpay_invoice_123",
    "qr_text": "base64_qr_code",
    "qr_image": "base64_qr_image",
    "urls": [
      {
        "deeplink": "qpay://payment/...",
        "qr": "https://qr.qpay.mn/..."
      }
    ],
    "status": "NEW",
    "amount": 50000,
    "expires_at": "2024-01-01T23:59:59.000Z"
  }
}
```

### 2. Payment Webhook - `POST /api/qpay/webhook`

Automatically called by QPay when payment status changes.

**Features:**
- ✅ Server-to-server payment verification
- ✅ Idempotent processing (ignores duplicate events)
- ✅ Automatic course access granting
- ✅ Comprehensive logging

### 3. Check Payment Status - `POST /api/qpay/check`

**Request:**
```json
{
  "invoice_id": "qpay_invoice_123"
}
```

**Response:**
```json
{
  "success": true,
  "status": {
    "invoice_id": "qpay_invoice_123",
    "status": "PAID",
    "amount": 50000,
    "paid_amount": 50000,
    "payment_id": "payment_789",
    "paid_at": "2024-01-01T12:00:00.000Z",
    "expires_at": "2024-01-01T23:59:59.000Z",
    "qr_text": "base64_qr_code",
    "qr_image": "base64_qr_image",
    "urls": { ... }
  }
}
```

## Client Integration

### QPayPayment Component

```tsx
import QPayPayment from '@/components/QPayPayment'

function CheckoutPage() {
  return (
    <QPayPayment
      courseId="course123"
      amount={50000}
      description="Course: Advanced React"
      onPaymentSuccess={(invoiceId) => {
        console.log('Payment successful!', invoiceId)
        // Redirect to course or success page
      }}
      onPaymentError={(error) => {
        console.error('Payment failed:', error)
        // Show error message
      }}
    />
  )
}
```

**Features:**
- ✅ QR code display
- ✅ Payment links (QPay app, QR link)
- ✅ Real-time status updates
- ✅ Auto-refresh every 5 seconds
- ✅ Responsive design
- ✅ Error handling

## Database Models

### QPayInvoice Schema

```typescript
{
  qpayInvoiceId: string        // QPay invoice ID
  senderInvoiceNo: string      // Unique invoice number
  amount: number               // Invoice amount
  status: 'NEW' | 'PAID' | 'CANCELLED' | 'EXPIRED'
  qrText: string              // QR code text
  qrImage?: string            // QR code image (base64)
  urls: {                     // Payment URLs
    deeplink: string
    qr: string
  }
  userId: string              // User who made payment
  courseId: string            // Course being purchased
  paymentId?: string          // QPay payment ID
  paidAt?: Date              // Payment completion time
  expiresAt: Date            // Invoice expiration
  createdAt: Date
  updatedAt: Date
}
```

## Security Features

### 1. Server-Side Price Validation
- ✅ Course price fetched from database
- ✅ Client amount ignored for security
- ✅ Prevents price manipulation

### 2. Token Management
- ✅ Secure token caching
- ✅ Automatic refresh on 401 errors
- ✅ No tokens exposed to client

### 3. Idempotent Operations
- ✅ Unique sender invoice numbers
- ✅ Duplicate payment prevention
- ✅ Webhook idempotency

### 4. Webhook Verification
- ✅ Server-to-server payment verification
- ✅ QPay API confirmation required
- ✅ No client-side payment confirmation

## Error Handling

### QPay API Errors
```typescript
class QPayError extends Error {
  public httpCode?: number
  public qpayError?: QPayError
}
```

### Retry Logic
- ✅ Automatic retry on 401 (token refresh)
- ✅ Exponential backoff
- ✅ Maximum 3 retry attempts

### Logging
- ✅ Correlation IDs for request tracking
- ✅ Comprehensive error logging
- ✅ Payment flow monitoring

## Testing

### 1. Sandbox Testing
```bash
# Set sandbox URL
QPAY_BASE_URL=https://merchant-sandbox.qpay.mn

# Test invoice creation
curl -X POST http://localhost:3000/api/qpay/invoice \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123","courseId":"course456","amount":1000}'
```

### 2. Webhook Testing
```bash
# Test webhook endpoint
curl -X POST http://localhost:3000/api/qpay/webhook \
  -H "Content-Type: application/json" \
  -d '{"invoice_id":"test_invoice_123","payment_id":"payment_456"}'
```

### 3. Payment Status Check
```bash
# Test status check
curl -X POST http://localhost:3000/api/qpay/check \
  -H "Content-Type: application/json" \
  -d '{"invoice_id":"test_invoice_123"}'
```

## Production Deployment

### 1. Environment Variables
```bash
# Production QPay
QPAY_BASE_URL=https://merchant.qpay.mn
QPAY_CLIENT_ID=your_production_client_id
QPAY_CLIENT_SECRET=your_production_client_secret
QPAY_INVOICE_CODE=your_production_invoice_code
QPAY_CALLBACK_URL=https://yourdomain.com/api/qpay/webhook
```

### 2. Webhook Configuration
- Configure QPay webhook URL in QPay merchant dashboard
- Ensure HTTPS is enabled
- Test webhook delivery

### 3. Monitoring
- Monitor QPay API response times
- Track payment success rates
- Log webhook delivery status
- Monitor course access granting

## Troubleshooting

### Common Issues

1. **Token Expired (401)**
   - Solution: Automatic retry with token refresh
   - Check: QPay credentials validity

2. **Invoice Creation Failed**
   - Check: Course exists and has valid price
   - Verify: QPay invoice code configuration

3. **Webhook Not Received**
   - Check: QPay webhook URL configuration
   - Verify: Server accessibility from QPay

4. **Payment Not Confirmed**
   - Check: QPay payment verification API
   - Verify: Webhook processing logs

### Debug Commands

```bash
# Check QPay configuration
npm run qpay:check

# Test invoice creation
npm run qpay:test

# Monitor webhook logs
tail -f logs/qpay-webhook.log
```

## Migration from Old System

The new QPay integration replaces the existing mock system:

1. **Remove old files:**
   - `components/PayWithQPay.tsx` (replaced by `QPayPayment.tsx`)
   - `lib/qpay/api.ts` (replaced by `lib/qpay.ts`)
   - `lib/qpay/mock.ts` (no longer needed)

2. **Update environment:**
   - Add QPay credentials to `.env.local`
   - Remove `QPAY_MOCK_MODE` variable

3. **Database migration:**
   - New `QPayInvoice` collection
   - Existing `Order` collection remains for compatibility

## Support

For issues or questions:
1. Check the logs for correlation IDs
2. Verify QPay credentials and configuration
3. Test with QPay sandbox environment
4. Review webhook delivery status in QPay dashboard

# QPay Integration Fix Guide

## 🚨 Critical Issues Fixed

### 1. Authentication Method (FIXED)
**Problem:** Using Basic Auth with clientId:clientSecret instead of username/password
**Fix:** Updated `lib/qpay/token.ts` to use username/password authentication
**Impact:** All API calls will now authenticate correctly

### 2. Invoice Creation Payload (FIXED)
**Problem:** Using `calback_url` instead of `callback_url` (typo in QPay API field)
**Fix:** Updated `lib/qpay/api.ts` to use correct field name
**Impact:** Invoice creation will now work properly

### 3. Configuration Validation (FIXED)
**Problem:** Validating wrong environment variables and missing webhook URL validation
**Fix:** Updated `lib/qpay/config.ts` to validate username/password and webhook URL format
**Impact:** Better error messages and validation

## 🔧 Required Environment Variables

Add these to your `.env.local` file:

```bash
# QPay V2 Configuration
QPAY_BASE_URL=https://merchant-sandbox.qpay.mn
QPAY_USERNAME=your_merchant_username
QPAY_PASSWORD=your_merchant_password
QPAY_INVOICE_CODE=WINACADEMY-COURSE
QPAY_WEBHOOK_PUBLIC_URL=https://your-domain.com/api/pay/qpay/webhook

# Development (optional)
QPAY_MOCK_MODE=false
```

## 🧪 Testing the Fix

### 1. Run Diagnostic Script
```bash
npx tsx scripts/qpay-diagnostic.ts
```

### 2. Test with Curl
```bash
# Make executable first
chmod +x scripts/qpay-curl-examples.sh

# Run curl examples (update credentials first)
./scripts/qpay-curl-examples.sh
```

### 3. Test Integration
1. Start your development server: `npm run dev`
2. Navigate to a course checkout page
3. Try to create a QPay payment
4. Check server logs for any errors

## 🔍 What Was Fixed

### Authentication Flow
- **Before:** Basic Auth with clientId:clientSecret
- **After:** Username/password authentication as per QPay V2 API

### Invoice Creation
- **Before:** `calback_url` field (typo)
- **After:** `callback_url` field (correct)

### Configuration
- **Before:** Validating clientId/clientSecret
- **After:** Validating username/password + webhook URL format

### Error Handling
- **Before:** Generic error messages
- **After:** Specific error messages with correlation IDs

## 🚀 Next Steps

1. **Update Environment Variables:** Add the required QPay credentials to `.env.local`
2. **Test Authentication:** Run the diagnostic script to verify auth works
3. **Test Invoice Creation:** Try creating a payment through the UI
4. **Set Up Webhook:** Use ngrok for local development or deploy to get a public webhook URL
5. **Monitor Logs:** Check server logs for any remaining issues

## 📊 Expected Behavior After Fix

1. **Token Acquisition:** Should work with username/password
2. **Invoice Creation:** Should return proper QR codes and URLs
3. **Payment Verification:** Should correctly check payment status
4. **Webhook Handling:** Should process payments when received
5. **Error Messages:** Should be clear and actionable

## 🔧 Troubleshooting

### If authentication still fails:
- Verify your QPay credentials are correct
- Check that you're using the sandbox environment
- Ensure username/password are properly set in `.env.local`

### If invoice creation fails:
- Check that `QPAY_INVOICE_CODE` is set correctly
- Verify the webhook URL is HTTPS and accessible
- Check server logs for specific error messages

### If webhooks don't work:
- Ensure webhook URL is publicly accessible
- Use ngrok for local development
- Check that the webhook endpoint returns 200 status

## 📞 Support

If you encounter issues after applying these fixes:
1. Run the diagnostic script and share the output
2. Check server logs for error details
3. Verify all environment variables are set correctly
4. Test with the curl examples to isolate the issue

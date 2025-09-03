export const QPAY = {
  baseUrl: process.env.QPAY_BASE_URL || 'https://merchant-sandbox.qpay.mn',
  grantType: process.env.QPAY_GRANT_TYPE || 'password',
  clientId: process.env.QPAY_CLIENT_ID || '',
  clientSecret: process.env.QPAY_CLIENT_SECRET || '',
  username: process.env.QPAY_USERNAME, // optional depending on grant
  password: process.env.QPAY_PASSWORD, // optional depending on grant
  invoiceCode: process.env.QPAY_INVOICE_CODE || '',
  webhookUrl: process.env.QPAY_WEBHOOK_PUBLIC_URL || '',
  mockMode: process.env.QPAY_MOCK_MODE === 'true' || process.env.NODE_ENV === 'development' && !process.env.QPAY_CLIENT_ID,
}

// Only validate QPay config at runtime, not during build
export function validateQPayConfig() {
  // Skip validation in mock mode
  if (QPAY.mockMode) {
    console.log('🔧 QPay running in MOCK MODE for development')
    return
  }
  
  if (!QPAY.baseUrl || !QPAY.clientId || !QPAY.clientSecret || !QPAY.invoiceCode) {
    throw new Error('Missing QPay env. Please check .env.local')
  }
}

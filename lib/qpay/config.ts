export const QPAY = {
  baseUrl: process.env.QPAY_BASE_URL || 'https://merchant-sandbox.qpay.mn',
  grantType: process.env.QPAY_GRANT_TYPE || 'password',
  clientId: process.env.QPAY_CLIENT_ID || '',
  clientSecret: process.env.QPAY_CLIENT_SECRET || '',
  username: process.env.QPAY_USERNAME, // optional depending on grant
  password: process.env.QPAY_PASSWORD, // optional depending on grant
  invoiceCode: process.env.QPAY_INVOICE_CODE || '',
  webhookUrl: process.env.QPAY_WEBHOOK_PUBLIC_URL || '',
  mockMode: process.env.QPAY_MOCK_MODE === 'true' || (process.env.NODE_ENV === 'development' && (!process.env.QPAY_USERNAME || !process.env.QPAY_PASSWORD)),
}

// Only validate QPay config at runtime, not during build
export function validateQPayConfig() {
  // Skip validation in mock mode
  if (QPAY.mockMode) {
    console.log('🔧 QPay running in MOCK MODE for development', {
      hasUsername: !!QPAY.username,
      hasPassword: !!QPAY.password,
      nodeEnv: process.env.NODE_ENV,
      mockModeFlag: process.env.QPAY_MOCK_MODE
    })
    return
  }
  
  if (!QPAY.baseUrl || !QPAY.username || !QPAY.password || !QPAY.invoiceCode) {
    throw new Error('Missing QPay env. Please check .env.local')
  }
  
  // Validate webhook URL format
  if (QPAY.webhookUrl && !QPAY.webhookUrl.startsWith('https://')) {
    throw new Error('QPAY_WEBHOOK_PUBLIC_URL must be HTTPS and publicly accessible')
  }
}

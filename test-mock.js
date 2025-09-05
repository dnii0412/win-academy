// Quick test to verify mock mode
const { QPAY } = require('./lib/qpay/config.ts')

console.log('QPay config:', {
  mockMode: QPAY.mockMode,
  baseUrl: QPAY.baseUrl,
  hasUsername: !!QPAY.username,
  hasPassword: !!QPAY.password
})

console.log('Environment:', {
  QPAY_MOCK_MODE: process.env.QPAY_MOCK_MODE,
  NODE_ENV: process.env.NODE_ENV
})

import { QPayInvoiceParams, QPayInvoiceCreateResponse, QPayPaymentCheckResponse } from '../../types/qpay'

// Mock QPay functions for development/testing
export const mockQPay = {
  createInvoice: async (params: QPayInvoiceParams): Promise<QPayInvoiceCreateResponse> => {
    console.log('🔧 Mock QPay createInvoice called with params:', params)
    
    // Generate a realistic QR code text (simplified version of real QPay QR)
    const qrText = `0002010102121531279404962794049600000000KKTQPAY52046010530349654031005802MN5913TEST_MERCHANT6011Ulaanbaatar62440107${params.sender_invoice_no}0504test0721G7ZEWdbzkppBhJ1nouBhZ6304879D`
    
    // Simulate QPay response with realistic bank URLs
    const response: QPayInvoiceCreateResponse = {
      invoice_id: `mock_invoice_${Date.now()}`,
      qr_text: qrText,
      qr_image: '', // Let the QRCodeDisplay component generate the QR from qr_text
      urls: [
        {
          name: 'Khan bank',
          description: 'Хаан банк',
          link: `khanbank://q?qPay_QRcode=${qrText}`
        },
        {
          name: 'State bank',
          description: 'Төрийн банк',
          link: `statebank://q?qPay_QRcode=${qrText}`
        },
        {
          name: 'Xac bank',
          description: 'Хас банк',
          link: `xacbank://q?qPay_QRcode=${qrText}`
        },
        {
          name: 'Trade and Development bank',
          description: 'TDB online',
          link: `tdbbank://q?qPay_QRcode=${qrText}`
        },
        {
          name: 'Most money',
          description: 'МОСТ мони',
          link: `most://q?qPay_QRcode=${qrText}`
        },
        {
          name: 'National investment bank',
          description: 'Үндэсний хөрөнгө оруулалтын банк',
          link: `nibank://q?qPay_QRcode=${qrText}`
        },
        {
          name: 'Chinggis khaan bank',
          description: 'Чингис Хаан банк',
          link: `ckbank://q?qPay_QRcode=${qrText}`
        },
        {
          name: 'Capitron bank',
          description: 'Капитрон банк',
          link: `capitronbank://q?qPay_QRcode=${qrText}`
        },
        {
          name: 'Bogd bank',
          description: 'Богд банк',
          link: `bogdbank://q?qPay_QRcode=${qrText}`
        },
        {
          name: 'Candy pay',
          description: 'Мон Пэй',
          link: `candypay://q?qPay_QRcode=${qrText}`
        }
      ]
    }
    
    console.log('🔧 Mock QPay createInvoice returning:', response)
    return response
  },

  paymentCheck: async (invoiceId: string): Promise<QPayPaymentCheckResponse> => {
    // In mock mode, we should NOT automatically mark payments as paid
    // This should only happen when explicitly testing with the "Mark as Paid" button
    console.log('🔧 Mock payment check - no automatic payment:', { invoiceId })
    
    const response: QPayPaymentCheckResponse = {
      count: 0,
      paid_amount: 0,
      rows: []
    }
    
    return response
  }
}

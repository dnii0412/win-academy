// Mock QPay functions for development/testing
export const mockQPay = {
  createInvoice: async (params: any) => {
    // Simulate QPay response
    return {
      invoice_id: `mock_invoice_${Date.now()}`,
      qr_text: `mock_qr_${params.sender_invoice_no}`,
      qr_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 transparent PNG
      urls: [
        {
          name: 'Mock Bank App',
          description: 'Test payment link',
          link: 'https://example.com/mock-payment'
        }
      ]
    }
  },

  paymentCheck: async (invoiceId: string) => {
    // Simulate payment check - randomly return paid/unpaid
    const isPaid = Math.random() > 0.7 // 30% chance of being paid
    return {
      payments: isPaid ? [
        {
          payment_id: `mock_payment_${Date.now()}`,
          amount: 50000, // Mock amount
          status: 'PAID'
        }
      ] : []
    }
  }
}

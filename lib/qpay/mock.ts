// Mock QPay functions for development/testing
export const mockQPay = {
  createInvoice: async (params: any) => {
    console.log('🔧 Mock QPay createInvoice called with params:', params)
    
    // Simulate QPay response
    const response = {
      invoice_id: `mock_invoice_${Date.now()}`,
      qr_text: `mock_qr_${params.sender_invoice_no}`,
      qr_image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZmZmZiIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMwMDAwMDAiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5RUiBDb2RlPC90ZXh0Pgo8L3N2Zz4K', // Mock QR code SVG
      urls: [
        {
          name: 'Mock Bank App',
          description: 'Test payment link',
          link: 'https://example.com/mock-payment'
        }
      ]
    }
    
    console.log('🔧 Mock QPay createInvoice returning:', response)
    return response
  },

  paymentCheck: async (invoiceId: string) => {
    // Simulate payment check - check if this is a "paid" invoice
    // For testing, we'll mark invoices as paid after 30 seconds
    const invoiceTime = parseInt(invoiceId.split('_')[2]) // Extract timestamp from mock_invoice_1234567890
    const now = Date.now()
    const isPaid = (now - invoiceTime) > 30000 // 30 seconds after creation
    
    console.log('🔧 Mock payment check:', { invoiceId, isPaid, timeDiff: now - invoiceTime })
    
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

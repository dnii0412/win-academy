#!/bin/bash

# QPay cURL Templates for Testing
# 
# These templates show how to manually test QPay endpoints.
# Replace the placeholders with your actual values.
# 
# Usage: 
#   chmod +x scripts/qpay-smoke.ts
#   ./scripts/qpay-curl-templates.sh

echo "🔧 QPay cURL Test Templates"
echo "=========================="
echo ""

# Environment variables (replace with your actual values)
QPAY_BASE_URL="${QPAY_BASE_URL:-https://merchant-sandbox.qpay.mn}"
QPAY_CLIENT_ID="${QPAY_CLIENT_ID:-your_client_id}"
QPAY_CLIENT_SECRET="${QPAY_CLIENT_SECRET:-your_client_secret}"
QPAY_USERNAME="${QPAY_USERNAME:-your_username}"
QPAY_PASSWORD="${QPAY_PASSWORD:-your_password}"
QPAY_INVOICE_CODE="${QPAY_INVOICE_CODE:-WINACADEMY-COURSE}"
QPAY_WEBHOOK_URL="${QPAY_WEBHOOK_PUBLIC_URL:-https://your-domain.com/api/pay/qpay/webhook}"

echo "1. Get Access Token (Basic Auth)"
echo "==============================="
echo "curl -i -X POST \"$QPAY_BASE_URL/v2/auth/token\" \\"
echo "  -H \"Authorization: Basic \$(echo -n \"$QPAY_CLIENT_ID:$QPAY_CLIENT_SECRET\" | base64)\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{}'"
echo ""

echo "2. Create Invoice"
echo "================"
echo "curl -i -X POST \"$QPAY_BASE_URL/v2/invoice\" \\"
echo "  -H \"Authorization: Bearer YOUR_ACCESS_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"invoice_code\": \"$QPAY_INVOICE_CODE\","
echo "    \"sender_invoice_no\": \"test-$(date +%s)\","
echo "    \"invoice_receiver_code\": \"$QPAY_INVOICE_CODE\","
echo "    \"invoice_description\": \"Test Invoice\","
echo "    \"amount\": 1000,"
echo "    \"calback_url\": \"$QPAY_WEBHOOK_URL\","
echo "    \"allow_partial\": false"
echo "  }'"
echo ""

echo "3. Check Payment Status"
echo "======================"
echo "curl -i -X POST \"$QPAY_BASE_URL/v2/payment/check\" \\"
echo "  -H \"Authorization: Bearer YOUR_ACCESS_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"object_type\": \"INVOICE\","
echo "    \"object_id\": \"YOUR_INVOICE_ID\","
echo "    \"offset\": {"
echo "      \"page_number\": 1,"
echo "      \"page_limit\": 100"
echo "    }"
echo "  }'"
echo ""

echo "4. Get Invoice Details"
echo "====================="
echo "curl -i -X GET \"$QPAY_BASE_URL/v2/invoice/YOUR_INVOICE_ID\" \\"
echo "  -H \"Authorization: Bearer YOUR_ACCESS_TOKEN\""
echo ""

echo "5. Cancel Invoice"
echo "================"
echo "curl -i -X DELETE \"$QPAY_BASE_URL/v2/invoice/YOUR_INVOICE_ID\" \\"
echo "  -H \"Authorization: Bearer YOUR_ACCESS_TOKEN\""
echo ""

echo "6. Test Webhook (Local Development)"
echo "=================================="
echo "curl -i -X POST \"http://localhost:3000/api/pay/qpay/webhook\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"invoice_id\": \"YOUR_INVOICE_ID\","
echo "    \"amount\": 1000,"
echo "    \"status\": \"PAID\""
echo "  }'"
echo ""

echo "📝 Notes:"
echo "- Replace YOUR_ACCESS_TOKEN with the token from step 1"
echo "- Replace YOUR_INVOICE_ID with the invoice ID from step 2"
echo "- For local testing, use ngrok to expose your webhook endpoint"
echo "- Check the QPay documentation for the latest API changes"

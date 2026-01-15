# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-15

### Added

- Initial release of MCP Server for Siigo API
- **Authentication**
  - `siigo_authenticate` - Generate authentication token (valid for 24 hours)

- **Products** (5 tools)
  - `siigo_list_products` - List products with pagination and filters
  - `siigo_get_product` - Get product details by ID
  - `siigo_create_product` - Create new product or service
  - `siigo_update_product` - Update existing product
  - `siigo_delete_product` - Delete product without associated movements

- **Account Groups** (3 tools)
  - `siigo_get_account_groups` - List inventory classifications
  - `siigo_create_account_group` - Create inventory classification
  - `siigo_update_account_group` - Update inventory classification

- **Customers** (4 tools)
  - `siigo_list_customers` - List customers/third parties
  - `siigo_get_customer` - Get customer details
  - `siigo_create_customer` - Create customer
  - `siigo_update_customer` - Update customer

- **Invoices** (11 tools)
  - `siigo_list_invoices` - List sales invoices
  - `siigo_get_invoice` - Get invoice details
  - `siigo_create_invoice` - Create sales invoice
  - `siigo_update_invoice` - Update invoice
  - `siigo_delete_invoice` - Delete invoice
  - `siigo_annul_invoice` - Annul invoice
  - `siigo_get_invoice_pdf` - Get invoice PDF (base64)
  - `siigo_get_invoice_xml` - Get electronic invoice XML
  - `siigo_send_invoice_email` - Send invoice by email
  - `siigo_get_invoice_stamp_errors` - Get DIAN rejection errors
  - `siigo_create_invoice_batch` - Create invoices in batch (async)

- **Quotations** (5 tools)
  - `siigo_list_quotations` - List quotations
  - `siigo_get_quotation` - Get quotation details
  - `siigo_create_quotation` - Create quotation
  - `siigo_update_quotation` - Update quotation
  - `siigo_delete_quotation` - Delete quotation

- **Credit Notes** (4 tools)
  - `siigo_list_credit_notes` - List credit notes
  - `siigo_get_credit_note` - Get credit note details
  - `siigo_create_credit_note` - Create credit note
  - `siigo_get_credit_note_pdf` - Get credit note PDF

- **Purchases** (5 tools)
  - `siigo_list_purchases` - List purchase invoices
  - `siigo_get_purchase` - Get purchase details
  - `siigo_create_purchase` - Create purchase invoice
  - `siigo_update_purchase` - Update purchase
  - `siigo_delete_purchase` - Delete purchase

- **Vouchers/Cash Receipts** (3 tools)
  - `siigo_list_vouchers` - List cash receipts
  - `siigo_get_voucher` - Get voucher details
  - `siigo_create_voucher` - Create cash receipt

- **Payment Receipts** (4 tools)
  - `siigo_list_payment_receipts` - List payment receipts
  - `siigo_get_payment_receipt` - Get payment receipt details
  - `siigo_create_payment_receipt` - Create payment receipt
  - `siigo_delete_payment_receipt` - Delete payment receipt

- **Journals** (2 tools)
  - `siigo_list_journals` - List accounting vouchers
  - `siigo_create_journal` - Create accounting entry

- **Reports** (3 tools)
  - `siigo_test_balance_report` - Generate trial balance report
  - `siigo_test_balance_by_thirdparty` - Trial balance by third party
  - `siigo_accounts_payable` - Accounts payable report

- **Catalogs** (8 tools)
  - `siigo_get_taxes` - List configured taxes
  - `siigo_get_users` - List users/sellers
  - `siigo_get_document_types` - Get document types
  - `siigo_get_payment_types` - Get payment methods
  - `siigo_get_warehouses` - List warehouses
  - `siigo_get_cost_centers` - List cost centers
  - `siigo_get_price_lists` - List price lists
  - `siigo_get_fixed_assets` - List fixed assets

- **Webhooks** (4 tools)
  - `siigo_list_webhooks` - List webhook subscriptions
  - `siigo_create_webhook` - Subscribe to events
  - `siigo_update_webhook` - Update webhook
  - `siigo_delete_webhook` - Delete webhook subscription

### Features

- **Automatic token management** - Tokens are cached and automatically refreshed
- **Retry logic with exponential backoff** - Handles rate limits (429) and transient errors (500, 502, 503, 504)
- **Input validation** - Zod schemas validate inputs before API calls
- **Comprehensive error messages** - Formatted error responses from Siigo API
- **Request timeout** - 30-second timeout for all requests
- **Idempotency support** - Prevent duplicate operations with idempotency keys

### Technical

- Built with TypeScript
- Uses MCP SDK (@modelcontextprotocol/sdk)
- Axios for HTTP requests
- Zod for input validation
- Compatible with Node.js >= 18.0.0

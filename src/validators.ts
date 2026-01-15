import { z } from 'zod';

// Common validators
const GuidSchema = z.string().uuid('Invalid GUID format');
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in yyyy-MM-dd format');
const PositiveNumber = z.number().positive('Must be a positive number');
const NonEmptyString = z.string().min(1, 'Cannot be empty');

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().min(1).optional(),
  page_size: z.number().int().min(1).max(100).optional(),
}).strict();

// Product schemas
export const ProductIdSchema = z.object({
  id: GuidSchema,
}).strict();

export const CreateProductSchema = z.object({
  code: z.string().min(1).max(30).regex(/^\S+$/, 'Code cannot contain spaces'),
  name: z.string().min(1).max(100),
  account_group: PositiveNumber,
  type: z.enum(['Product', 'Service', 'Combo']).optional(),
  stock_control: z.boolean().optional(),
  tax_classification: z.enum(['Taxed', 'Exempt', 'Excluded']).optional(),
  taxes: z.array(z.object({ id: z.number() })).optional(),
  prices: z.array(z.object({
    currency_code: z.string(),
    price_list: z.array(z.object({
      position: z.number(),
      value: z.number(),
    })),
  })).optional(),
  description: z.string().max(2500).optional(),
}).strict();

export const UpdateProductSchema = z.object({
  id: GuidSchema,
  code: z.string().min(1).max(30).optional(),
  name: z.string().min(1).max(100).optional(),
  account_group: PositiveNumber.optional(),
  type: z.enum(['Product', 'Service', 'Combo']).optional(),
  stock_control: z.boolean().optional(),
  active: z.boolean().optional(),
  tax_classification: z.enum(['Taxed', 'Exempt', 'Excluded']).optional(),
  taxes: z.array(z.object({ id: z.number() })).optional(),
  prices: z.array(z.object({
    currency_code: z.string(),
    price_list: z.array(z.object({
      position: z.number(),
      value: z.number(),
    })),
  })).optional(),
  description: z.string().max(2500).optional(),
}).strict();

// Customer schemas
export const CustomerIdSchema = z.object({
  id: GuidSchema,
}).strict();

export const CreateCustomerSchema = z.object({
  type: z.enum(['Customer', 'Supplier', 'Other']).optional(),
  person_type: z.enum(['Person', 'Company']),
  id_type: NonEmptyString,
  identification: NonEmptyString,
  check_digit: z.string().optional(),
  name: z.array(z.string()).min(1),
  commercial_name: z.string().optional(),
  vat_responsible: z.boolean().optional(),
  fiscal_responsibilities: z.array(z.object({ code: z.string() })),
  address: z.object({
    address: z.string(),
    city: z.object({
      country_code: z.string(),
      state_code: z.string(),
      city_code: z.string(),
    }),
  }),
  contacts: z.array(z.object({
    first_name: z.string(),
    last_name: z.string().optional(),
    email: z.string().email().optional(),
  })),
});

// Invoice schemas
export const InvoiceIdSchema = z.object({
  id: GuidSchema,
}).strict();

export const CreateInvoiceSchema = z.object({
  document_id: PositiveNumber,
  date: DateSchema,
  customer_identification: NonEmptyString,
  customer_branch: z.number().int().min(0).optional(),
  seller_id: PositiveNumber,
  stamp_send: z.boolean().optional(),
  mail_send: z.boolean().optional(),
  observations: z.string().optional(),
  items: z.array(z.object({
    code: NonEmptyString,
    quantity: PositiveNumber,
    price: z.number().min(0),
    discount: z.number().min(0).max(100).optional(),
    taxes: z.array(z.object({ id: z.number() })).optional(),
  })).min(1, 'At least one item is required'),
  payments: z.array(z.object({
    id: z.number(),
    value: z.number(),
    due_date: DateSchema.optional(),
  })).min(1, 'At least one payment is required'),
  idempotency_key: z.string().optional(),
});

// Quotation schemas
export const QuotationIdSchema = z.object({
  id: GuidSchema,
}).strict();

export const CreateQuotationSchema = z.object({
  document_id: PositiveNumber,
  date: DateSchema,
  customer_identification: NonEmptyString,
  customer_branch: z.number().int().min(0).optional(),
  seller_id: PositiveNumber,
  observations: z.string().optional(),
  items: z.array(z.object({
    code: NonEmptyString,
    quantity: PositiveNumber,
    price: z.number().min(0),
    discount: z.number().min(0).max(100).optional(),
    taxes: z.array(z.object({ id: z.number() })).optional(),
  })).min(1, 'At least one item is required'),
});

// Credit Note schemas
export const CreditNoteIdSchema = z.object({
  id: GuidSchema,
}).strict();

export const CreateCreditNoteSchema = z.object({
  document_id: PositiveNumber,
  date: DateSchema,
  invoice_id: z.number().optional(),
  customer_identification: NonEmptyString,
  seller_id: PositiveNumber,
  items: z.array(z.object({
    code: NonEmptyString,
    quantity: PositiveNumber,
    price: z.number().min(0),
    taxes: z.array(z.object({ id: z.number() })).optional(),
  })).min(1, 'At least one item is required'),
  payments: z.array(z.object({
    id: z.number(),
    value: z.number(),
  })).min(1, 'At least one payment is required'),
  idempotency_key: z.string().optional(),
});

// Purchase schemas
export const PurchaseIdSchema = z.object({
  id: GuidSchema,
}).strict();

export const CreatePurchaseSchema = z.object({
  document_id: PositiveNumber,
  date: DateSchema,
  supplier_identification: NonEmptyString,
  supplier_branch: z.number().int().min(0).optional(),
  observations: z.string().optional(),
  items: z.array(z.object({
    code: NonEmptyString,
    quantity: PositiveNumber,
    price: z.number().min(0),
    discount: z.number().min(0).max(100).optional(),
    taxes: z.array(z.object({ id: z.number() })).optional(),
  })).min(1, 'At least one item is required'),
  payments: z.array(z.object({
    id: z.number(),
    value: z.number(),
    due_date: DateSchema.optional(),
  })).min(1, 'At least one payment is required'),
  retentions: z.array(z.object({
    id: z.number(),
  })).optional(),
});

// Voucher schemas
export const VoucherIdSchema = z.object({
  id: GuidSchema,
}).strict();

export const CreateVoucherSchema = z.object({
  document_id: PositiveNumber,
  date: DateSchema,
  type: z.enum(['AdvancePayment', 'DebtPayment', 'Balance']),
  customer_identification: NonEmptyString,
  items: z.array(z.object({
    value: z.number(),
    due_prefix: z.string().optional(),
    due_consecutive: z.number().optional(),
    due_quote: z.number().optional(),
    account_code: z.string().optional(),
  })).min(1),
  payments: z.array(z.object({
    id: z.number(),
    value: z.number(),
  })).min(1),
  idempotency_key: z.string().optional(),
});

// Payment Receipt schemas
export const PaymentReceiptIdSchema = z.object({
  id: GuidSchema,
}).strict();

export const CreatePaymentReceiptSchema = z.object({
  document_id: PositiveNumber,
  date: DateSchema,
  type: z.enum(['AdvancePayment', 'DebtPayment', 'Balance']),
  supplier_identification: NonEmptyString,
  items: z.array(z.object({
    value: z.number(),
    due_prefix: z.string().optional(),
    due_consecutive: z.number().optional(),
    due_quote: z.number().optional(),
    account_code: z.string().optional(),
  })).min(1),
  payments: z.array(z.object({
    id: z.number(),
    value: z.number(),
  })).min(1),
  idempotency_key: z.string().optional(),
});

// Journal schemas
export const CreateJournalSchema = z.object({
  document_id: PositiveNumber,
  date: DateSchema,
  observations: z.string().optional(),
  items: z.array(z.object({
    account_code: NonEmptyString,
    customer_identification: z.string().optional(),
    description: z.string().optional(),
    debit: z.number().min(0).optional(),
    credit: z.number().min(0).optional(),
  })).min(1, 'At least one item is required'),
  idempotency_key: z.string().optional(),
});

// Report schemas
export const TestBalanceReportSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month_start: z.number().int().min(1).max(13),
  month_end: z.number().int().min(1).max(13),
  account_start: z.string().optional(),
  account_end: z.string().optional(),
}).refine(data => data.month_start <= data.month_end, {
  message: 'month_start must be less than or equal to month_end',
});

// Webhook schemas
export const WebhookIdSchema = z.object({
  id: GuidSchema,
}).strict();

export const CreateWebhookSchema = z.object({
  application_id: NonEmptyString,
  topic: z.string().regex(/^public\.siigoapi\..+$/, 'Topic must start with "public.siigoapi."'),
  url: z.string().url('Invalid URL format'),
}).strict();

export const UpdateWebhookSchema = z.object({
  id: GuidSchema,
  application_id: z.string().optional(),
  topic: z.string().optional(),
  url: z.string().url().optional(),
  active: z.boolean().optional(),
}).strict();

// Account Group schemas
export const AccountGroupIdSchema = z.object({
  id: PositiveNumber,
}).strict();

export const CreateAccountGroupSchema = z.object({
  name: NonEmptyString,
  active: z.boolean().optional(),
}).strict();

export const UpdateAccountGroupSchema = z.object({
  id: PositiveNumber,
  name: z.string().optional(),
  active: z.boolean().optional(),
}).strict();

// List Products schema
export const ListProductsSchema = z.object({
  page: z.number().int().min(1).optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  code: z.string().optional(),
  created_start: DateSchema.optional(),
  created_end: DateSchema.optional(),
}).strict();

// List Customers schema
export const ListCustomersSchema = z.object({
  page: z.number().int().min(1).optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  identification: z.string().optional(),
  created_start: DateSchema.optional(),
  created_end: DateSchema.optional(),
}).strict();

// List Invoices schema
export const ListInvoicesSchema = z.object({
  page: z.number().int().min(1).optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  customer_identification: z.string().optional(),
  date_start: DateSchema.optional(),
  date_end: DateSchema.optional(),
  document_id: z.number().int().positive().optional(),
}).strict();

// List Quotations schema
export const ListQuotationsSchema = z.object({
  page: z.number().int().min(1).optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  customer_identification: z.string().optional(),
  date_start: DateSchema.optional(),
  date_end: DateSchema.optional(),
  document_id: z.number().int().positive().optional(),
}).strict();

// List Purchases schema
export const ListPurchasesSchema = z.object({
  page: z.number().int().min(1).optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  supplier_identification: z.string().optional(),
  date_start: DateSchema.optional(),
  date_end: DateSchema.optional(),
  document_id: z.number().int().positive().optional(),
}).strict();

// List Payment Receipts schema
export const ListPaymentReceiptsSchema = z.object({
  page: z.number().int().min(1).optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  supplier_identification: z.string().optional(),
  date_start: DateSchema.optional(),
  date_end: DateSchema.optional(),
  document_id: z.number().int().positive().optional(),
}).strict();

// Invoice Batch schema
export const CreateInvoiceBatchSchema = z.object({
  callback_url: z.string().url('Invalid callback URL format'),
  invoices: z.array(z.object({
    document_id: PositiveNumber,
    date: DateSchema,
    customer_identification: NonEmptyString,
    customer_branch: z.number().int().min(0).optional(),
    seller_id: PositiveNumber,
    stamp_send: z.boolean().optional(),
    mail_send: z.boolean().optional(),
    observations: z.string().optional(),
    items: z.array(z.object({
      code: NonEmptyString,
      quantity: PositiveNumber,
      price: z.number().min(0),
      discount: z.number().min(0).max(100).optional(),
      taxes: z.array(z.object({ id: z.number() })).optional(),
    })).min(1, 'At least one item is required'),
    payments: z.array(z.object({
      id: z.number(),
      value: z.number(),
      due_date: DateSchema.optional(),
    })).min(1, 'At least one payment is required'),
  })).min(1, 'At least one invoice is required'),
}).strict();

// Accounts Payable schema
export const AccountsPayableSchema = z.object({
  page: z.number().int().min(1).optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  due_date_start: DateSchema.optional(),
  due_date_end: DateSchema.optional(),
  provider_identification: z.string().optional(),
  provider_branch_office: z.number().int().min(0).optional(),
}).strict();

// Validation helper function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    throw new Error(`Validation error: ${errors}`);
  }
  return result.data;
}

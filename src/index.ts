#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { SiigoClient } from './siigo-client.js';
import {
  validateInput,
  ProductIdSchema,
  CreateProductSchema,
  UpdateProductSchema,
  CustomerIdSchema,
  CreateCustomerSchema,
  InvoiceIdSchema,
  CreateInvoiceSchema,
  QuotationIdSchema,
  CreateQuotationSchema,
  CreditNoteIdSchema,
  CreateCreditNoteSchema,
  PurchaseIdSchema,
  CreatePurchaseSchema,
  VoucherIdSchema,
  CreateVoucherSchema,
  PaymentReceiptIdSchema,
  CreatePaymentReceiptSchema,
  CreateJournalSchema,
  TestBalanceReportSchema,
  WebhookIdSchema,
  CreateWebhookSchema,
  UpdateWebhookSchema,
  CreateAccountGroupSchema,
  UpdateAccountGroupSchema,
} from './validators.js';

// Get credentials from environment variables
const SIIGO_USERNAME = process.env.SIIGO_USERNAME || '';
const SIIGO_ACCESS_KEY = process.env.SIIGO_ACCESS_KEY || '';

let siigoClient: SiigoClient | null = null;

function getClient(): SiigoClient {
  if (!siigoClient) {
    if (!SIIGO_USERNAME || !SIIGO_ACCESS_KEY) {
      throw new Error('SIIGO_USERNAME and SIIGO_ACCESS_KEY environment variables are required');
    }
    siigoClient = new SiigoClient(SIIGO_USERNAME, SIIGO_ACCESS_KEY);
  }
  return siigoClient;
}

// Define all tools
const tools: Tool[] = [
  // Authentication
  {
    name: 'siigo_authenticate',
    description: 'Genera un token de autenticacion para Siigo API. Valido por 24 horas.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // Products
  {
    name: 'siigo_list_products',
    description: 'Lista los productos registrados en Siigo Nube con paginacion y filtros opcionales',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Numero de pagina (default: 1)' },
        page_size: { type: 'number', description: 'Registros por pagina (default: 25)' },
        code: { type: 'string', description: 'Filtrar por codigo de producto' },
        created_start: { type: 'string', description: 'Fecha creacion inicio (yyyy-MM-dd)' },
        created_end: { type: 'string', description: 'Fecha creacion fin (yyyy-MM-dd)' },
      },
    },
  },
  {
    name: 'siigo_get_product',
    description: 'Obtiene informacion detallada de un producto por su ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID del producto (GUID)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_create_product',
    description: 'Crea un nuevo producto o servicio en Siigo Nube',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Codigo unico del producto (max 30 caracteres, sin espacios)' },
        name: { type: 'string', description: 'Nombre del producto (max 100 caracteres)' },
        account_group: { type: 'number', description: 'ID de la clasificacion de inventario' },
        type: { type: 'string', enum: ['Product', 'Service', 'Combo'], description: 'Tipo de producto' },
        stock_control: { type: 'boolean', description: 'Control de inventario' },
        tax_classification: { type: 'string', enum: ['Taxed', 'Exempt', 'Excluded'] },
        taxes: {
          type: 'array',
          items: { type: 'object', properties: { id: { type: 'number' } } },
          description: 'Array de impuestos [{id: number}]',
        },
        prices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              currency_code: { type: 'string' },
              price_list: { type: 'array' },
            },
          },
        },
        description: { type: 'string', description: 'Descripcion (max 2500 caracteres)' },
      },
      required: ['code', 'name', 'account_group'],
    },
  },
  {
    name: 'siigo_update_product',
    description: 'Actualiza un producto existente en Siigo Nube',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID del producto (GUID)' },
        code: { type: 'string', description: 'Codigo unico del producto' },
        name: { type: 'string', description: 'Nombre del producto' },
        account_group: { type: 'number', description: 'ID de la clasificacion de inventario' },
        type: { type: 'string', enum: ['Product', 'Service', 'Combo'] },
        stock_control: { type: 'boolean', description: 'Control de inventario' },
        active: { type: 'boolean', description: 'Estado activo' },
        tax_classification: { type: 'string', enum: ['Taxed', 'Exempt', 'Excluded'] },
        taxes: { type: 'array', items: { type: 'object', properties: { id: { type: 'number' } } } },
        prices: { type: 'array' },
        description: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_delete_product',
    description: 'Elimina un producto sin movimientos asociados',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID del producto a eliminar' },
      },
      required: ['id'],
    },
  },

  // Account Groups
  {
    name: 'siigo_get_account_groups',
    description: 'Obtiene las clasificaciones de inventario',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'siigo_create_account_group',
    description: 'Crea una nueva clasificacion de inventario',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre de la clasificacion' },
        active: { type: 'boolean', description: 'Estado activo' },
      },
      required: ['name'],
    },
  },
  {
    name: 'siigo_update_account_group',
    description: 'Edita una clasificacion de inventario existente',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'ID de la clasificacion' },
        name: { type: 'string', description: 'Nombre de la clasificacion' },
        active: { type: 'boolean', description: 'Estado activo' },
      },
      required: ['id'],
    },
  },

  // Customers
  {
    name: 'siigo_list_customers',
    description: 'Lista los clientes/terceros registrados en Siigo Nube',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        page_size: { type: 'number' },
        identification: { type: 'string', description: 'Filtrar por numero de identificacion' },
        created_start: { type: 'string' },
        created_end: { type: 'string' },
      },
    },
  },
  {
    name: 'siigo_get_customer',
    description: 'Obtiene informacion detallada de un cliente por su ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID del cliente (GUID)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_create_customer',
    description: 'Crea un nuevo cliente o tercero en Siigo Nube',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['Customer', 'Supplier', 'Other'] },
        person_type: { type: 'string', enum: ['Person', 'Company'], description: 'Persona natural o juridica' },
        id_type: { type: 'string', description: 'Tipo documento (13=CC, 31=NIT)' },
        identification: { type: 'string', description: 'Numero de identificacion' },
        check_digit: { type: 'string', description: 'Digito de verificacion (para NIT)' },
        name: { type: 'array', items: { type: 'string' }, description: 'Para Person: [nombre, apellido]. Para Company: [razon social]' },
        commercial_name: { type: 'string' },
        vat_responsible: { type: 'boolean', description: 'Responsable de IVA' },
        fiscal_responsibilities: {
          type: 'array',
          items: { type: 'object', properties: { code: { type: 'string' } } },
          description: 'Responsabilidades fiscales [{code: "R-99-PN"}]',
        },
        address: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            city: {
              type: 'object',
              properties: {
                country_code: { type: 'string' },
                state_code: { type: 'string' },
                city_code: { type: 'string' },
              },
            },
          },
        },
        contacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              email: { type: 'string' },
            },
          },
        },
      },
      required: ['person_type', 'id_type', 'identification', 'name', 'fiscal_responsibilities', 'address', 'contacts'],
    },
  },
  {
    name: 'siigo_update_customer',
    description: 'Actualiza un cliente existente en Siigo Nube (reemplaza todos los datos)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID del cliente (GUID)' },
        type: { type: 'string', enum: ['Customer', 'Supplier', 'Other'] },
        person_type: { type: 'string', enum: ['Person', 'Company'] },
        id_type: { type: 'string', description: 'Tipo documento (13=CC, 31=NIT)' },
        identification: { type: 'string' },
        check_digit: { type: 'string' },
        name: { type: 'array', items: { type: 'string' } },
        commercial_name: { type: 'string' },
        vat_responsible: { type: 'boolean' },
        fiscal_responsibilities: { type: 'array', items: { type: 'object', properties: { code: { type: 'string' } } } },
        address: { type: 'object' },
        contacts: { type: 'array' },
      },
      required: ['id'],
    },
  },

  // Invoices
  {
    name: 'siigo_list_invoices',
    description: 'Lista las facturas de venta registradas',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        page_size: { type: 'number' },
        customer_identification: { type: 'string' },
        date_start: { type: 'string' },
        date_end: { type: 'string' },
        document_id: { type: 'number' },
      },
    },
  },
  {
    name: 'siigo_get_invoice',
    description: 'Obtiene informacion detallada de una factura',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la factura' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_create_invoice',
    description: 'Crea una nueva factura de venta',
    inputSchema: {
      type: 'object',
      properties: {
        document_id: { type: 'number', description: 'ID del tipo de comprobante' },
        date: { type: 'string', description: 'Fecha de la factura (yyyy-MM-dd)' },
        customer_identification: { type: 'string', description: 'Identificacion del cliente' },
        customer_branch: { type: 'number', description: 'Sucursal del cliente (default: 0)' },
        seller_id: { type: 'number', description: 'ID del vendedor' },
        stamp_send: { type: 'boolean', description: 'Enviar a DIAN' },
        mail_send: { type: 'boolean', description: 'Enviar por email' },
        observations: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              quantity: { type: 'number' },
              price: { type: 'number' },
              discount: { type: 'number' },
              taxes: { type: 'array' },
            },
          },
          description: 'Productos de la factura',
        },
        payments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              value: { type: 'number' },
              due_date: { type: 'string' },
            },
          },
          description: 'Formas de pago',
        },
        idempotency_key: { type: 'string', description: 'Clave unica para evitar duplicados' },
      },
      required: ['document_id', 'date', 'customer_identification', 'seller_id', 'items', 'payments'],
    },
  },
  {
    name: 'siigo_update_invoice',
    description: 'Edita una factura de venta existente',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la factura' },
        document_id: { type: 'number', description: 'ID del tipo de comprobante' },
        date: { type: 'string', description: 'Fecha de la factura (yyyy-MM-dd)' },
        customer_identification: { type: 'string' },
        customer_branch: { type: 'number' },
        seller_id: { type: 'number' },
        stamp_send: { type: 'boolean' },
        mail_send: { type: 'boolean' },
        observations: { type: 'string' },
        items: { type: 'array' },
        payments: { type: 'array' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_delete_invoice',
    description: 'Elimina una factura de venta',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la factura' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_annul_invoice',
    description: 'Anula una factura de venta',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la factura' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_get_invoice_pdf',
    description: 'Obtiene el PDF de una factura en base64',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la factura' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_get_invoice_xml',
    description: 'Obtiene el XML de la factura electronica',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la factura' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_send_invoice_email',
    description: 'Envia una factura por correo electronico',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la factura' },
        mail_to: { type: 'string', description: 'Email destino' },
        copy_to: { type: 'string', description: 'Email para copia' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_get_invoice_stamp_errors',
    description: 'Consulta errores de facturas rechazadas por la DIAN',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la factura' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_create_invoice_batch',
    description: 'Crea multiples facturas de forma asincrona',
    inputSchema: {
      type: 'object',
      properties: {
        invoices: { type: 'array', description: 'Array de facturas a crear' },
        callback_url: { type: 'string', description: 'URL para notificacion del resultado' },
      },
      required: ['invoices', 'callback_url'],
    },
  },

  // Quotations
  {
    name: 'siigo_list_quotations',
    description: 'Lista las cotizaciones registradas',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        page_size: { type: 'number' },
        customer_identification: { type: 'string' },
        date_start: { type: 'string' },
        date_end: { type: 'string' },
        document_id: { type: 'number' },
      },
    },
  },
  {
    name: 'siigo_get_quotation',
    description: 'Obtiene informacion detallada de una cotizacion',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la cotizacion' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_create_quotation',
    description: 'Crea una nueva cotizacion',
    inputSchema: {
      type: 'object',
      properties: {
        document_id: { type: 'number', description: 'ID del tipo de comprobante' },
        date: { type: 'string', description: 'Fecha (yyyy-MM-dd)' },
        customer_identification: { type: 'string' },
        customer_branch: { type: 'number' },
        seller_id: { type: 'number', description: 'ID del vendedor' },
        observations: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              quantity: { type: 'number' },
              price: { type: 'number' },
              discount: { type: 'number' },
              taxes: { type: 'array' },
            },
          },
        },
      },
      required: ['document_id', 'date', 'customer_identification', 'seller_id', 'items'],
    },
  },
  {
    name: 'siigo_update_quotation',
    description: 'Edita una cotizacion existente',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la cotizacion' },
        document_id: { type: 'number' },
        date: { type: 'string' },
        customer_identification: { type: 'string' },
        customer_branch: { type: 'number' },
        seller_id: { type: 'number' },
        observations: { type: 'string' },
        items: { type: 'array' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_delete_quotation',
    description: 'Elimina una cotizacion',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la cotizacion' },
      },
      required: ['id'],
    },
  },

  // Credit Notes
  {
    name: 'siigo_list_credit_notes',
    description: 'Lista las notas credito registradas',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        page_size: { type: 'number' },
      },
    },
  },
  {
    name: 'siigo_get_credit_note',
    description: 'Obtiene informacion detallada de una nota credito',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la nota credito' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_create_credit_note',
    description: 'Crea una nota credito asociada a una factura',
    inputSchema: {
      type: 'object',
      properties: {
        document_id: { type: 'number', description: 'ID tipo de nota credito' },
        date: { type: 'string', description: 'Fecha (yyyy-MM-dd)' },
        invoice_id: { type: 'number', description: 'ID factura origen (si electronica)' },
        customer_identification: { type: 'string' },
        seller_id: { type: 'number', description: 'ID del vendedor' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              quantity: { type: 'number' },
              price: { type: 'number' },
              taxes: { type: 'array' },
            },
          },
        },
        payments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              value: { type: 'number' },
            },
          },
        },
        idempotency_key: { type: 'string' },
      },
      required: ['document_id', 'date', 'customer_identification', 'seller_id', 'items', 'payments'],
    },
  },
  {
    name: 'siigo_get_credit_note_pdf',
    description: 'Obtiene el PDF de la nota credito en base64',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la nota credito' },
      },
      required: ['id'],
    },
  },

  // Purchases
  {
    name: 'siigo_list_purchases',
    description: 'Lista las facturas de compra registradas',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        page_size: { type: 'number' },
        supplier_identification: { type: 'string' },
        date_start: { type: 'string' },
        date_end: { type: 'string' },
        document_id: { type: 'number' },
      },
    },
  },
  {
    name: 'siigo_get_purchase',
    description: 'Obtiene informacion detallada de una factura de compra',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la factura de compra' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_create_purchase',
    description: 'Crea una nueva factura de compra o gasto',
    inputSchema: {
      type: 'object',
      properties: {
        document_id: { type: 'number', description: 'ID del tipo de comprobante' },
        date: { type: 'string', description: 'Fecha (yyyy-MM-dd)' },
        supplier_identification: { type: 'string' },
        supplier_branch: { type: 'number' },
        observations: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              quantity: { type: 'number' },
              price: { type: 'number' },
              discount: { type: 'number' },
              taxes: { type: 'array' },
            },
          },
        },
        payments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              value: { type: 'number' },
              due_date: { type: 'string' },
            },
          },
        },
        retentions: { type: 'array' },
      },
      required: ['document_id', 'date', 'supplier_identification', 'items', 'payments'],
    },
  },
  {
    name: 'siigo_update_purchase',
    description: 'Edita una factura de compra existente',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la factura de compra' },
        document_id: { type: 'number' },
        date: { type: 'string' },
        supplier_identification: { type: 'string' },
        supplier_branch: { type: 'number' },
        observations: { type: 'string' },
        items: { type: 'array' },
        payments: { type: 'array' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_delete_purchase',
    description: 'Elimina una factura de compra',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la factura de compra' },
      },
      required: ['id'],
    },
  },

  // Vouchers (Cash Receipts)
  {
    name: 'siigo_list_vouchers',
    description: 'Lista los recibos de caja registrados',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        page_size: { type: 'number' },
      },
    },
  },
  {
    name: 'siigo_get_voucher',
    description: 'Obtiene informacion detallada de un recibo de caja',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID del recibo de caja' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_create_voucher',
    description: 'Crea un nuevo recibo de caja',
    inputSchema: {
      type: 'object',
      properties: {
        document_id: { type: 'number', description: 'ID tipo de recibo de caja' },
        date: { type: 'string', description: 'Fecha (yyyy-MM-dd)' },
        type: { type: 'string', enum: ['AdvancePayment', 'DebtPayment', 'Balance'], description: 'Tipo de recibo' },
        customer_identification: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              due_prefix: { type: 'string', description: 'Prefijo factura (para DebtPayment)' },
              due_consecutive: { type: 'number', description: 'Consecutivo factura' },
              due_quote: { type: 'number', description: 'Cuota a pagar' },
              value: { type: 'number' },
              account_code: { type: 'string', description: 'Cuenta contable (para Balance)' },
            },
          },
        },
        payments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              value: { type: 'number' },
            },
          },
        },
        idempotency_key: { type: 'string' },
      },
      required: ['document_id', 'date', 'customer_identification', 'type', 'items', 'payments'],
    },
  },

  // Payment Receipts
  {
    name: 'siigo_list_payment_receipts',
    description: 'Lista los recibos de pago/egreso registrados',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        page_size: { type: 'number' },
        supplier_identification: { type: 'string' },
        date_start: { type: 'string' },
        date_end: { type: 'string' },
        document_id: { type: 'number' },
      },
    },
  },
  {
    name: 'siigo_get_payment_receipt',
    description: 'Obtiene informacion detallada de un recibo de pago',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID del recibo de pago' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_create_payment_receipt',
    description: 'Crea un nuevo recibo de pago o egreso',
    inputSchema: {
      type: 'object',
      properties: {
        document_id: { type: 'number', description: 'ID tipo de recibo de pago' },
        date: { type: 'string', description: 'Fecha (yyyy-MM-dd)' },
        type: { type: 'string', enum: ['AdvancePayment', 'DebtPayment', 'Balance'] },
        supplier_identification: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              due_prefix: { type: 'string' },
              due_consecutive: { type: 'number' },
              due_quote: { type: 'number' },
              value: { type: 'number' },
              account_code: { type: 'string' },
            },
          },
        },
        payments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              value: { type: 'number' },
            },
          },
        },
        idempotency_key: { type: 'string' },
      },
      required: ['document_id', 'date', 'supplier_identification', 'type', 'items', 'payments'],
    },
  },
  {
    name: 'siigo_delete_payment_receipt',
    description: 'Elimina un recibo de pago',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID del recibo de pago' },
      },
      required: ['id'],
    },
  },

  // Journals (Accounting Vouchers)
  {
    name: 'siigo_list_journals',
    description: 'Lista los comprobantes contables registrados',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        page_size: { type: 'number' },
      },
    },
  },
  {
    name: 'siigo_create_journal',
    description: 'Crea un nuevo comprobante contable (asiento)',
    inputSchema: {
      type: 'object',
      properties: {
        document_id: { type: 'number', description: 'ID tipo de comprobante' },
        date: { type: 'string', description: 'Fecha (yyyy-MM-dd)' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              account_code: { type: 'string', description: 'Codigo cuenta contable' },
              debit: { type: 'number', description: 'Valor debito' },
              credit: { type: 'number', description: 'Valor credito' },
              customer_identification: { type: 'string', description: 'Identificacion del tercero' },
              description: { type: 'string', description: 'Descripcion del movimiento' },
            },
          },
        },
        observations: { type: 'string' },
        idempotency_key: { type: 'string' },
      },
      required: ['document_id', 'date', 'items'],
    },
  },

  // Reports
  {
    name: 'siigo_test_balance_report',
    description: 'Genera el reporte de balance de prueba general',
    inputSchema: {
      type: 'object',
      properties: {
        year: { type: 'number', description: 'Ano del reporte' },
        month_start: { type: 'number', description: 'Mes inicio (1-13)' },
        month_end: { type: 'number', description: 'Mes fin (1-13)' },
        account_start: { type: 'string', description: 'Cuenta contable inicio' },
        account_end: { type: 'string', description: 'Cuenta contable fin' },
      },
      required: ['year', 'month_start', 'month_end'],
    },
  },
  {
    name: 'siigo_test_balance_by_thirdparty',
    description: 'Genera el balance de prueba detallado por tercero',
    inputSchema: {
      type: 'object',
      properties: {
        year: { type: 'number', description: 'Ano del reporte' },
        month_start: { type: 'number', description: 'Mes inicio (1-13)' },
        month_end: { type: 'number', description: 'Mes fin (1-13)' },
      },
      required: ['year', 'month_start', 'month_end'],
    },
  },
  {
    name: 'siigo_accounts_payable',
    description: 'Genera el reporte de cuentas por pagar',
    inputSchema: { type: 'object', properties: {} },
  },

  // Catalogs
  {
    name: 'siigo_get_taxes',
    description: 'Obtiene la lista de impuestos configurados en Siigo',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'siigo_get_users',
    description: 'Obtiene la lista de usuarios/vendedores',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'siigo_get_document_types',
    description: 'Obtiene los tipos de documentos configurados',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['FV', 'FC', 'NC', 'RC', 'CC', 'RP', 'C'],
          description: 'FV=Factura Venta, FC=Factura Compra, NC=Nota Credito, RC=Recibo Caja, CC=Comprobante Contable',
        },
      },
    },
  },
  {
    name: 'siigo_get_payment_types',
    description: 'Obtiene las formas de pago configuradas',
    inputSchema: {
      type: 'object',
      properties: {
        document_type: {
          type: 'string',
          enum: ['FV', 'NC', 'RC'],
          description: 'Tipo de documento para filtrar',
        },
      },
    },
  },
  {
    name: 'siigo_get_warehouses',
    description: 'Obtiene la lista de bodegas',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'siigo_get_cost_centers',
    description: 'Obtiene los centros de costo',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'siigo_get_price_lists',
    description: 'Obtiene las listas de precio configuradas',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'siigo_get_fixed_assets',
    description: 'Obtiene la lista de activos fijos',
    inputSchema: { type: 'object', properties: {} },
  },

  // Webhooks
  {
    name: 'siigo_list_webhooks',
    description: 'Lista todas las suscripciones de webhooks de la compania',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'siigo_create_webhook',
    description: 'Suscribe a notificaciones en tiempo real de eventos',
    inputSchema: {
      type: 'object',
      properties: {
        application_id: { type: 'string', description: 'Nombre de la aplicacion' },
        topic: { type: 'string', description: 'Evento: public.siigoapi.products.create, .update, .stock.update' },
        url: { type: 'string', description: 'URL para recibir notificaciones' },
      },
      required: ['application_id', 'topic', 'url'],
    },
  },
  {
    name: 'siigo_update_webhook',
    description: 'Edita una suscripcion de webhook existente',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID del webhook' },
        application_id: { type: 'string' },
        topic: { type: 'string' },
        url: { type: 'string' },
        active: { type: 'boolean' },
      },
      required: ['id'],
    },
  },
  {
    name: 'siigo_delete_webhook',
    description: 'Elimina una suscripcion de webhook',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID del webhook' },
      },
      required: ['id'],
    },
  },
];

// Tool handler
async function handleTool(name: string, args: any): Promise<any> {
  const client = getClient();

  switch (name) {
    // Authentication
    case 'siigo_authenticate':
      return client.getToken();

    // Products
    case 'siigo_list_products':
      return client.listProducts(args);
    case 'siigo_get_product':
      validateInput(ProductIdSchema, args);
      return client.getProduct(args.id);
    case 'siigo_create_product':
      validateInput(CreateProductSchema, args);
      return client.createProduct(args);
    case 'siigo_update_product':
      validateInput(UpdateProductSchema, args);
      const { id: productId, ...productData } = args;
      return client.updateProduct(productId, productData);
    case 'siigo_delete_product':
      validateInput(ProductIdSchema, args);
      return client.deleteProduct(args.id);

    // Account Groups
    case 'siigo_get_account_groups':
      return client.getAccountGroups();
    case 'siigo_create_account_group':
      validateInput(CreateAccountGroupSchema, args);
      return client.createAccountGroup(args);
    case 'siigo_update_account_group':
      validateInput(UpdateAccountGroupSchema, args);
      const { id: groupId, ...groupData } = args;
      return client.updateAccountGroup(groupId, groupData);

    // Customers
    case 'siigo_list_customers':
      return client.listCustomers(args);
    case 'siigo_get_customer':
      validateInput(CustomerIdSchema, args);
      return client.getCustomer(args.id);
    case 'siigo_create_customer':
      validateInput(CreateCustomerSchema, args);
      return client.createCustomer(args);
    case 'siigo_update_customer':
      validateInput(CustomerIdSchema, { id: args.id });
      const { id: customerId, ...customerData } = args;
      return client.updateCustomer(customerId, customerData);

    // Invoices
    case 'siigo_list_invoices':
      return client.listInvoices(args);
    case 'siigo_get_invoice':
      validateInput(InvoiceIdSchema, args);
      return client.getInvoice(args.id);
    case 'siigo_create_invoice':
      validateInput(CreateInvoiceSchema, args);
      return client.createInvoice({
        document: { id: args.document_id },
        date: args.date,
        customer: {
          identification: args.customer_identification,
          branch_office: args.customer_branch,
        },
        seller: args.seller_id,
        stamp: args.stamp_send ? { send: true } : undefined,
        mail: args.mail_send ? { send: true } : undefined,
        observations: args.observations,
        items: args.items,
        payments: args.payments,
      }, args.idempotency_key);
    case 'siigo_update_invoice':
      validateInput(InvoiceIdSchema, { id: args.id });
      const { id: invoiceId, ...invoiceUpdateData } = args;
      return client.updateInvoice(invoiceId, {
        document: invoiceUpdateData.document_id ? { id: invoiceUpdateData.document_id } : undefined,
        date: invoiceUpdateData.date,
        customer: invoiceUpdateData.customer_identification ? {
          identification: invoiceUpdateData.customer_identification,
          branch_office: invoiceUpdateData.customer_branch,
        } : undefined,
        seller: invoiceUpdateData.seller_id,
        observations: invoiceUpdateData.observations,
        items: invoiceUpdateData.items,
        payments: invoiceUpdateData.payments,
      });
    case 'siigo_delete_invoice':
      validateInput(InvoiceIdSchema, args);
      return client.deleteInvoice(args.id);
    case 'siigo_annul_invoice':
      validateInput(InvoiceIdSchema, args);
      return client.annulInvoice(args.id);
    case 'siigo_get_invoice_pdf':
      validateInput(InvoiceIdSchema, args);
      return client.getInvoicePdf(args.id);
    case 'siigo_get_invoice_xml':
      validateInput(InvoiceIdSchema, args);
      return client.getInvoiceXml(args.id);
    case 'siigo_send_invoice_email':
      validateInput(InvoiceIdSchema, args);
      return client.sendInvoiceEmail(args.id, {
        mail_to: args.mail_to,
        copy_to: args.copy_to,
      });
    case 'siigo_get_invoice_stamp_errors':
      validateInput(InvoiceIdSchema, args);
      return client.getInvoiceStampErrors(args.id);
    case 'siigo_create_invoice_batch':
      return client.createInvoiceBatch({
        notification_url: args.callback_url,
        invoices: args.invoices,
      });

    // Quotations
    case 'siigo_list_quotations':
      return client.listQuotations(args);
    case 'siigo_get_quotation':
      validateInput(QuotationIdSchema, args);
      return client.getQuotation(args.id);
    case 'siigo_create_quotation':
      validateInput(CreateQuotationSchema, args);
      return client.createQuotation({
        document: { id: args.document_id },
        date: args.date,
        customer: {
          identification: args.customer_identification,
          branch_office: args.customer_branch,
        },
        seller: args.seller_id,
        items: args.items,
        observations: args.observations,
      });
    case 'siigo_update_quotation':
      validateInput(QuotationIdSchema, { id: args.id });
      const { id: quotationId, ...quotationData } = args;
      return client.updateQuotation(quotationId, {
        document: quotationData.document_id ? { id: quotationData.document_id } : undefined,
        date: quotationData.date,
        customer: quotationData.customer_identification ? {
          identification: quotationData.customer_identification,
          branch_office: quotationData.customer_branch,
        } : undefined,
        seller: quotationData.seller_id,
        items: quotationData.items,
        observations: quotationData.observations,
      });
    case 'siigo_delete_quotation':
      validateInput(QuotationIdSchema, args);
      return client.deleteQuotation(args.id);

    // Credit Notes
    case 'siigo_list_credit_notes':
      return client.listCreditNotes(args);
    case 'siigo_get_credit_note':
      validateInput(CreditNoteIdSchema, args);
      return client.getCreditNote(args.id);
    case 'siigo_create_credit_note':
      validateInput(CreateCreditNoteSchema, args);
      return client.createCreditNote({
        document: { id: args.document_id },
        date: args.date,
        invoice: args.invoice_id?.toString(),
        customer: args.customer_identification ? {
          identification: args.customer_identification,
        } : undefined,
        seller: args.seller_id,
        reason: args.reason || 1,
        items: args.items,
        payments: args.payments,
      }, args.idempotency_key);
    case 'siigo_get_credit_note_pdf':
      validateInput(CreditNoteIdSchema, args);
      return client.getCreditNotePdf(args.id);

    // Purchases
    case 'siigo_list_purchases':
      return client.listPurchases(args);
    case 'siigo_get_purchase':
      validateInput(PurchaseIdSchema, args);
      return client.getPurchase(args.id);
    case 'siigo_create_purchase':
      validateInput(CreatePurchaseSchema, args);
      return client.createPurchase({
        document: { id: args.document_id },
        date: args.date,
        supplier: {
          identification: args.supplier_identification,
          branch_office: args.supplier_branch,
        },
        observations: args.observations,
        items: args.items.map((item: any) => ({
          type: item.type || 'Product',
          code: item.code,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          taxes: item.taxes,
        })),
        payments: args.payments,
        retentions: args.retentions,
      });
    case 'siigo_update_purchase':
      validateInput(PurchaseIdSchema, { id: args.id });
      const { id: purchaseId, ...purchaseData } = args;
      return client.updatePurchase(purchaseId, {
        document: purchaseData.document_id ? { id: purchaseData.document_id } : undefined,
        date: purchaseData.date,
        supplier: purchaseData.supplier_identification ? {
          identification: purchaseData.supplier_identification,
          branch_office: purchaseData.supplier_branch,
        } : undefined,
        observations: purchaseData.observations,
        items: purchaseData.items,
        payments: purchaseData.payments,
      });
    case 'siigo_delete_purchase':
      validateInput(PurchaseIdSchema, args);
      return client.deletePurchase(args.id);

    // Vouchers
    case 'siigo_list_vouchers':
      return client.listVouchers(args);
    case 'siigo_get_voucher':
      validateInput(VoucherIdSchema, args);
      return client.getVoucher(args.id);
    case 'siigo_create_voucher':
      validateInput(CreateVoucherSchema, args);
      return client.createVoucher({
        document: { id: args.document_id },
        date: args.date,
        type: args.type,
        customer: {
          identification: args.customer_identification,
        },
        items: args.items?.map((item: any) => ({
          due: item.due_prefix ? {
            prefix: item.due_prefix,
            consecutive: item.due_consecutive,
            quote: item.due_quote,
          } : undefined,
          value: item.value,
          account: item.account_code ? {
            code: item.account_code,
            movement: item.movement || 'Debit',
          } : undefined,
        })),
        payment: args.payments?.[0] ? {
          id: args.payments[0].id,
          value: args.payments[0].value,
        } : undefined,
      }, args.idempotency_key);

    // Payment Receipts
    case 'siigo_list_payment_receipts':
      return client.listPaymentReceipts(args);
    case 'siigo_get_payment_receipt':
      validateInput(PaymentReceiptIdSchema, args);
      return client.getPaymentReceipt(args.id);
    case 'siigo_create_payment_receipt':
      validateInput(CreatePaymentReceiptSchema, args);
      return client.createPaymentReceipt({
        document: { id: args.document_id },
        date: args.date,
        type: args.type,
        supplier: {
          identification: args.supplier_identification,
        },
        items: args.items?.map((item: any) => ({
          due: item.due_prefix ? {
            prefix: item.due_prefix,
            consecutive: item.due_consecutive,
            quote: item.due_quote,
          } : undefined,
          value: item.value,
          account: item.account_code ? {
            code: item.account_code,
            movement: item.movement || 'Debit',
          } : undefined,
        })),
        payment: args.payments?.[0] ? {
          id: args.payments[0].id,
          value: args.payments[0].value,
        } : undefined,
      }, args.idempotency_key);
    case 'siigo_delete_payment_receipt':
      validateInput(PaymentReceiptIdSchema, args);
      return client.deletePaymentReceipt(args.id);

    // Journals
    case 'siigo_list_journals':
      return client.listJournals(args);
    case 'siigo_create_journal':
      validateInput(CreateJournalSchema, args);
      return client.createJournal({
        document: { id: args.document_id },
        date: args.date,
        items: args.items.map((item: any) => ({
          account: {
            code: item.account_code,
            movement: item.debit ? 'Debit' : 'Credit',
          },
          customer: {
            identification: item.customer_identification,
          },
          description: item.description,
          value: item.debit || item.credit,
        })),
        observations: args.observations,
      }, args.idempotency_key);

    // Reports
    case 'siigo_test_balance_report':
      validateInput(TestBalanceReportSchema, args);
      return client.generateTestBalanceReport(args);
    case 'siigo_test_balance_by_thirdparty':
      validateInput(TestBalanceReportSchema, args);
      return client.generateTestBalanceByThirdParty(args);
    case 'siigo_accounts_payable':
      return client.getAccountsPayable(args);

    // Catalogs
    case 'siigo_get_taxes':
      return client.getTaxes();
    case 'siigo_get_users':
      return client.getUsers();
    case 'siigo_get_document_types':
      return client.getDocumentTypes(args.type);
    case 'siigo_get_payment_types':
      return client.getPaymentTypes(args.document_type);
    case 'siigo_get_warehouses':
      return client.getWarehouses();
    case 'siigo_get_cost_centers':
      return client.getCostCenters();
    case 'siigo_get_price_lists':
      return client.getPriceLists();
    case 'siigo_get_fixed_assets':
      return client.getFixedAssets();

    // Webhooks
    case 'siigo_list_webhooks':
      return client.listWebhooks();
    case 'siigo_create_webhook':
      validateInput(CreateWebhookSchema, args);
      return client.createWebhook(args);
    case 'siigo_update_webhook':
      validateInput(UpdateWebhookSchema, args);
      const { id: webhookId, ...webhookData } = args;
      return client.updateWebhook(webhookId, webhookData);
    case 'siigo_delete_webhook':
      validateInput(WebhookIdSchema, args);
      return client.deleteWebhook(args.id);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Main server setup
async function main() {
  const server = new Server(
    {
      name: 'mcp-server-siigo',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await handleTool(name, args || {});
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Siigo MCP Server started');
}

main().catch(console.error);

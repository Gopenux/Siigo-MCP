import axios, { AxiosInstance, AxiosError } from 'axios';

const BASE_URL = 'https://api.siigo.com';
const PARTNER_ID = 'MCPSiigoServer';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface SiigoError {
  Status: number;
  Errors: Array<{
    Code: string;
    Message: string;
    Params?: string[];
    Detail?: string;
  }>;
}

interface SiigoRateLimitError {
  Status: string;
  Message: string;
}

export class SiigoClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private username: string;
  private accessKey: string;

  constructor(username: string, accessKey: string) {
    this.username = username;
    this.accessKey = accessKey;
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Partner-Id': PARTNER_ID,
      },
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Sleep for a specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private getRetryDelay(attempt: number, retryAfterHeader?: string): number {
    // If server provides Retry-After header, use it
    if (retryAfterHeader) {
      const retryAfterSeconds = parseInt(retryAfterHeader, 10);
      if (!isNaN(retryAfterSeconds)) {
        return retryAfterSeconds * 1000;
      }
    }
    // Otherwise use exponential backoff: 1s, 2s, 4s
    return INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) {
      // Network errors are retryable
      return true;
    }
    return RETRYABLE_STATUS_CODES.includes(error.response.status);
  }

  /**
   * Format error message from Siigo API response
   */
  private formatErrorMessage(error: AxiosError<SiigoError | SiigoRateLimitError>): string {
    const data = error.response?.data;
    const status = error.response?.status;

    if (!data) {
      return `HTTP ${status}: ${error.message}`;
    }

    // Handle rate limit error format
    if ('Message' in data && typeof data.Message === 'string') {
      return `${(data as SiigoRateLimitError).Status}: ${(data as SiigoRateLimitError).Message}`;
    }

    // Handle standard Siigo error format
    if ('Errors' in data && Array.isArray((data as SiigoError).Errors)) {
      const errors = (data as SiigoError).Errors;
      return errors.map(e => `${e.Code}: ${e.Message}${e.Detail ? ` - ${e.Detail}` : ''}`).join('; ');
    }

    return JSON.stringify(data);
  }

  private async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await this.client.post<TokenResponse>('/auth', {
      username: this.username,
      access_key: this.accessKey,
    });

    this.accessToken = response.data.access_token;
    this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000) - 60000);
    return this.accessToken;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    params?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const token = await this.authenticate();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.client.request<T>({
          method,
          url: endpoint,
          data,
          params,
          headers: {
            Authorization: `Bearer ${token}`,
            ...headers,
          },
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<SiigoError | SiigoRateLimitError>;

          // Check if we should retry
          if (attempt < MAX_RETRIES && this.isRetryableError(axiosError)) {
            const retryAfter = axiosError.response?.headers?.['retry-after'];
            const delay = this.getRetryDelay(attempt, retryAfter);

            // Log retry attempt (useful for debugging)
            console.error(
              `Siigo API request failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), ` +
              `retrying in ${delay}ms: ${this.formatErrorMessage(axiosError)}`
            );

            await this.sleep(delay);
            continue;
          }

          // No more retries, throw formatted error
          const errorMessage = this.formatErrorMessage(axiosError);
          lastError = new Error(`Siigo API Error: ${errorMessage}`);

          // Add additional context to the error
          (lastError as any).statusCode = axiosError.response?.status;
          (lastError as any).endpoint = endpoint;
          (lastError as any).method = method;
        } else {
          lastError = error as Error;
        }
        break;
      }
    }

    throw lastError || new Error('Unknown error occurred');
  }

  // ==================== AUTHENTICATION ====================
  async getToken(): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth', {
      username: this.username,
      access_key: this.accessKey,
    });

    this.accessToken = response.data.access_token;
    this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000) - 60000);

    return response.data;
  }

  // ==================== PRODUCTS ====================
  async listProducts(params?: {
    page?: number;
    page_size?: number;
    code?: string;
    created_start?: string;
    created_end?: string;
  }): Promise<any> {
    return this.request('GET', '/v1/products', undefined, params);
  }

  async getProduct(id: string): Promise<any> {
    return this.request('GET', `/v1/products/${id}`);
  }

  async createProduct(data: {
    code: string;
    name: string;
    account_group: number;
    type?: 'Product' | 'Service' | 'Combo';
    stock_control?: boolean;
    active?: boolean;
    tax_classification?: 'Taxed' | 'Exempt' | 'Excluded';
    taxes?: Array<{ id: number; milliliters?: number; rate?: number }>;
    prices?: Array<{
      currency_code: string;
      price_list: Array<{ position: number; value: number }>;
    }>;
    description?: string;
  }): Promise<any> {
    return this.request('POST', '/v1/products', data);
  }

  async updateProduct(id: string, data: any): Promise<any> {
    return this.request('PUT', `/v1/products/${id}`, data);
  }

  async deleteProduct(id: string): Promise<any> {
    return this.request('DELETE', `/v1/products/${id}`);
  }

  // ==================== ACCOUNT GROUPS ====================
  async getAccountGroups(): Promise<any> {
    return this.request('GET', '/v1/account-groups');
  }

  async createAccountGroup(data: { name: string; active?: boolean }): Promise<any> {
    return this.request('POST', '/v1/account-groups', data);
  }

  async updateAccountGroup(id: number, data: { name?: string; active?: boolean }): Promise<any> {
    return this.request('PUT', `/v1/account-groups/${id}`, data);
  }

  // ==================== CUSTOMERS ====================
  async listCustomers(params?: {
    page?: number;
    page_size?: number;
    identification?: string;
    created_start?: string;
    created_end?: string;
  }): Promise<any> {
    return this.request('GET', '/v1/customers', undefined, params);
  }

  async getCustomer(id: string): Promise<any> {
    return this.request('GET', `/v1/customers/${id}`);
  }

  async createCustomer(data: {
    type?: 'Customer' | 'Supplier' | 'Other';
    person_type: 'Person' | 'Company';
    id_type: string;
    identification: string;
    check_digit?: string;
    name: string[];
    commercial_name?: string;
    branch_office?: number;
    active?: boolean;
    vat_responsible?: boolean;
    fiscal_responsibilities: Array<{ code: string }>;
    address: {
      address: string;
      city: {
        country_code: string;
        state_code: string;
        city_code: string;
      };
      postal_code?: string;
    };
    phones?: Array<{
      indicative?: string;
      number: string;
      extension?: string;
    }>;
    contacts: Array<{
      first_name: string;
      last_name?: string;
      email?: string;
      phone?: {
        indicative?: string;
        number?: string;
        extension?: string;
      };
    }>;
    comments?: string;
    related_users?: {
      seller_id?: number;
      collector_id?: number;
    };
  }): Promise<any> {
    return this.request('POST', '/v1/customers', data);
  }

  async updateCustomer(id: string, data: any): Promise<any> {
    return this.request('PUT', `/v1/customers/${id}`, data);
  }

  // ==================== INVOICES ====================
  async listInvoices(params?: {
    page?: number;
    page_size?: number;
    customer_identification?: string;
    date_start?: string;
    date_end?: string;
    document_id?: number;
  }): Promise<any> {
    return this.request('GET', '/v1/invoices', undefined, params);
  }

  async getInvoice(id: string): Promise<any> {
    return this.request('GET', `/v1/invoices/${id}`);
  }

  async createInvoice(data: {
    document: { id: number };
    date: string;
    customer: {
      identification: string;
      branch_office?: number;
    };
    seller: number;
    stamp?: { send: boolean };
    mail?: { send: boolean };
    observations?: string;
    items: Array<{
      code: string;
      description?: string;
      quantity: number;
      price: number;
      discount?: number;
      taxes?: Array<{ id: number }>;
    }>;
    payments: Array<{
      id: number;
      value: number;
      due_date?: string;
    }>;
    cost_center?: number;
    currency?: {
      code: string;
      exchange_rate: number;
    };
  }, idempotencyKey?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return this.request('POST', '/v1/invoices', data, undefined, headers);
  }

  async updateInvoice(id: string, data: any): Promise<any> {
    return this.request('PUT', `/v1/invoices/${id}`, data);
  }

  async deleteInvoice(id: string): Promise<any> {
    return this.request('DELETE', `/v1/invoices/${id}`);
  }

  async annulInvoice(id: string): Promise<any> {
    return this.request('POST', `/v1/invoices/${id}/annul`);
  }

  async getInvoicePdf(id: string): Promise<any> {
    return this.request('GET', `/v1/invoices/${id}/pdf`);
  }

  async getInvoiceXml(id: string): Promise<any> {
    return this.request('GET', `/v1/invoices/${id}/xml`);
  }

  async sendInvoiceEmail(id: string, data?: { mail_to?: string; copy_to?: string }): Promise<any> {
    return this.request('POST', `/v1/invoices/${id}/mail`, data);
  }

  async getInvoiceStampErrors(id: string): Promise<any> {
    return this.request('GET', `/v1/invoices/${id}/stamp/errors`);
  }

  async createInvoiceBatch(data: {
    notification_url: string;
    invoices: Array<any>;
  }): Promise<any> {
    return this.request('POST', '/v1/invoices/batch', data);
  }

  // ==================== QUOTATIONS ====================
  async listQuotations(params?: {
    page?: number;
    page_size?: number;
    customer_identification?: string;
    date_start?: string;
    date_end?: string;
    document_id?: number;
  }): Promise<any> {
    return this.request('GET', '/v1/quotations', undefined, params);
  }

  async getQuotation(id: string): Promise<any> {
    return this.request('GET', `/v1/quotations/${id}`);
  }

  async createQuotation(data: {
    document: { id: number };
    date: string;
    customer: {
      identification: string;
      branch_office?: number;
    };
    seller: number;
    items: Array<{
      code: string;
      description?: string;
      quantity: number;
      price: number;
      discount?: number;
      taxes?: Array<{ id: number }>;
    }>;
    cost_center?: number;
    currency?: {
      code: string;
      exchange_rate: number;
    };
    observations?: string;
  }): Promise<any> {
    return this.request('POST', '/v1/quotations', data);
  }

  async updateQuotation(id: string, data: any): Promise<any> {
    return this.request('PUT', `/v1/quotations/${id}`, data);
  }

  async deleteQuotation(id: string): Promise<any> {
    return this.request('DELETE', `/v1/quotations/${id}`);
  }

  // ==================== CREDIT NOTES ====================
  async listCreditNotes(params?: {
    page?: number;
    page_size?: number;
  }): Promise<any> {
    return this.request('GET', '/v1/credit-notes', undefined, params);
  }

  async getCreditNote(id: string): Promise<any> {
    return this.request('GET', `/v1/credit-notes/${id}`);
  }

  async createCreditNote(data: {
    document: { id: number };
    date: string;
    invoice?: string;
    customer?: {
      identification: string;
      branch_office?: number;
    };
    seller?: number;
    cost_center?: number;
    reason: number;
    stamp?: { send: boolean };
    mail?: { send: boolean };
    items: Array<{
      code: string;
      description?: string;
      quantity: number;
      price: number;
      taxes?: Array<{ id: number }>;
    }>;
    payments: Array<{
      id: number;
      value: number;
    }>;
  }, idempotencyKey?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return this.request('POST', '/v1/credit-notes', data, undefined, headers);
  }

  async getCreditNotePdf(id: string): Promise<any> {
    return this.request('GET', `/v1/credit-notes/${id}/pdf`);
  }

  // ==================== PURCHASES ====================
  async listPurchases(params?: {
    page?: number;
    page_size?: number;
    supplier_identification?: string;
    date_start?: string;
    date_end?: string;
    document_id?: number;
  }): Promise<any> {
    return this.request('GET', '/v1/purchases', undefined, params);
  }

  async getPurchase(id: string): Promise<any> {
    return this.request('GET', `/v1/purchases/${id}`);
  }

  async createPurchase(data: {
    document: { id: number };
    date: string;
    supplier: {
      identification: string;
      branch_office?: number;
    };
    cost_center?: number;
    observations?: string;
    items: Array<{
      type: 'Product' | 'FixedAsset' | 'Account';
      code: string;
      description?: string;
      quantity: number;
      price: number;
      discount?: number;
      taxes?: Array<{ id: number }>;
    }>;
    payments: Array<{
      id: number;
      value: number;
      due_date?: string;
    }>;
    retentions?: Array<{ id: number }>;
  }): Promise<any> {
    return this.request('POST', '/v1/purchases', data);
  }

  async updatePurchase(id: string, data: any): Promise<any> {
    return this.request('PUT', `/v1/purchases/${id}`, data);
  }

  async deletePurchase(id: string): Promise<any> {
    return this.request('DELETE', `/v1/purchases/${id}`);
  }

  // ==================== VOUCHERS (CASH RECEIPTS) ====================
  async listVouchers(params?: {
    page?: number;
    page_size?: number;
  }): Promise<any> {
    return this.request('GET', '/v1/vouchers', undefined, params);
  }

  async getVoucher(id: string): Promise<any> {
    return this.request('GET', `/v1/vouchers/${id}`);
  }

  async createVoucher(data: {
    document: { id: number };
    date: string;
    type: 'DebtPayment' | 'AdvancePayment' | 'Detailed';
    customer: {
      identification: string;
      branch_office?: number;
    };
    cost_center?: number;
    currency?: {
      code: string;
      exchange_rate: number;
    };
    items?: Array<{
      due?: {
        prefix: string;
        consecutive: number;
        quote: number;
        date?: string;
      };
      value: number;
      account?: {
        code: string;
        movement: 'Debit' | 'Credit';
      };
    }>;
    payment?: {
      id: number;
      value: number;
    };
    observations?: string;
  }, idempotencyKey?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return this.request('POST', '/v1/vouchers', data, undefined, headers);
  }

  // ==================== PAYMENT RECEIPTS ====================
  async listPaymentReceipts(params?: {
    page?: number;
    page_size?: number;
    supplier_identification?: string;
    date_start?: string;
    date_end?: string;
    document_id?: number;
  }): Promise<any> {
    return this.request('GET', '/v1/payment-receipts', undefined, params);
  }

  async getPaymentReceipt(id: string): Promise<any> {
    return this.request('GET', `/v1/payment-receipts/${id}`);
  }

  async createPaymentReceipt(data: {
    document: { id: number };
    date: string;
    type: 'DebtPayment' | 'AdvancePayment' | 'Detailed';
    supplier: {
      identification: string;
      branch_office?: number;
    };
    cost_center?: number;
    currency?: {
      code: string;
      exchange_rate: number;
    };
    items?: Array<{
      due?: {
        prefix: string;
        consecutive: number;
        quote: number;
        date?: string;
      };
      value: number;
      account?: {
        code: string;
        movement: 'Debit' | 'Credit';
      };
    }>;
    payment?: {
      id: number;
      value: number;
    };
    observations?: string;
  }, idempotencyKey?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return this.request('POST', '/v1/payment-receipts', data, undefined, headers);
  }

  async deletePaymentReceipt(id: string): Promise<any> {
    return this.request('DELETE', `/v1/payment-receipts/${id}`);
  }

  // ==================== JOURNALS (ACCOUNTING VOUCHERS) ====================
  async listJournals(params?: {
    page?: number;
    page_size?: number;
    document_id?: number;
  }): Promise<any> {
    return this.request('GET', '/v1/journals', undefined, params);
  }

  async createJournal(data: {
    document: { id: number };
    date: string;
    number?: number;
    items: Array<{
      account: {
        code: string;
        movement: 'Debit' | 'Credit';
      };
      customer: {
        identification: string;
        branch_office?: number;
      };
      description?: string;
      cost_center?: number;
      value: number;
    }>;
    observations?: string;
  }, idempotencyKey?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return this.request('POST', '/v1/journals', data, undefined, headers);
  }

  // ==================== REPORTS ====================
  async generateTestBalanceReport(data: {
    year: number;
    month_start: number;
    month_end: number;
    account_start?: string;
    account_end?: string;
    includes_tax_difference?: boolean;
  }): Promise<any> {
    return this.request('POST', '/v1/test-balance-report', data);
  }

  async generateTestBalanceByThirdParty(data: {
    year: number;
    month_start: number;
    month_end: number;
    account_start?: string;
    account_end?: string;
    includes_tax_difference?: boolean;
    customer?: {
      identification?: string;
      branch_office?: number;
    };
  }): Promise<any> {
    return this.request('POST', '/v1/test-balance-report-by-thirdparty', data);
  }

  async getAccountsPayable(params?: {
    page?: number;
    page_size?: number;
    due_date_start?: string;
    due_date_end?: string;
    provider_identification?: string;
    provider_branch_office?: number;
  }): Promise<any> {
    return this.request('GET', '/v1/accounts-payable', undefined, params);
  }

  // ==================== CATALOGS ====================
  async getTaxes(): Promise<any> {
    return this.request('GET', '/v1/taxes');
  }

  async getUsers(): Promise<any> {
    return this.request('GET', '/v1/users');
  }

  async getDocumentTypes(type?: 'FV' | 'FC' | 'NC' | 'RC' | 'CC' | 'RP' | 'C'): Promise<any> {
    return this.request('GET', '/v1/document-types', undefined, type ? { type } : undefined);
  }

  async getPaymentTypes(documentType?: 'FV' | 'NC' | 'RC'): Promise<any> {
    return this.request('GET', '/v1/payment-types', undefined, documentType ? { document_type: documentType } : undefined);
  }

  async getWarehouses(): Promise<any> {
    return this.request('GET', '/v1/warehouses');
  }

  async getCostCenters(): Promise<any> {
    return this.request('GET', '/v1/cost-centers');
  }

  async getPriceLists(): Promise<any> {
    return this.request('GET', '/v1/price-lists');
  }

  async getFixedAssets(): Promise<any> {
    return this.request('GET', '/v1/fixed-assets');
  }

  // ==================== WEBHOOKS ====================
  async listWebhooks(): Promise<any> {
    return this.request('GET', '/v1/webhooks');
  }

  async createWebhook(data: {
    application_id: string;
    topic: string;
    url: string;
  }): Promise<any> {
    return this.request('POST', '/v1/webhooks', data);
  }

  async updateWebhook(id: string, data: {
    application_id?: string;
    topic?: string;
    url?: string;
    active?: boolean;
  }): Promise<any> {
    return this.request('PUT', `/v1/webhooks/${id}`, data);
  }

  async deleteWebhook(id: string): Promise<any> {
    return this.request('DELETE', `/v1/webhooks/${id}`);
  }
}

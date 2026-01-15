# MCP Server Siigo

Servidor MCP (Model Context Protocol) para integrar la API de Siigo Nube con Claude y otros clientes MCP.

## Instalacion

```bash
cd /Users/gopenux/Documents/mcp_server_siigo
npm install
npm run build
```

## Configuracion

### Variables de Entorno

Configura las siguientes variables de entorno:

```bash
export SIIGO_USERNAME="tu_usuario@empresa.com"
export SIIGO_ACCESS_KEY="tu_access_key_aqui"
```

### Configuracion en Claude Desktop

Agrega la siguiente configuracion a tu archivo `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "siigo": {
      "command": "node",
      "args": ["/Users/gopenux/Documents/mcp_server_siigo/dist/index.js"],
      "env": {
        "SIIGO_USERNAME": "tu_usuario@empresa.com",
        "SIIGO_ACCESS_KEY": "tu_access_key_aqui"
      }
    }
  }
}
```

## Uso

Una vez configurado, las herramientas de Siigo estaran disponibles en Claude. Puedes:

- Listar, crear, actualizar y eliminar productos
- Gestionar clientes/terceros
- Crear y consultar facturas de venta
- Gestionar cotizaciones
- Crear notas credito
- Registrar facturas de compra
- Crear recibos de caja y pagos
- Generar comprobantes contables
- Consultar reportes financieros
- Administrar webhooks

## Herramientas Disponibles

### Autenticacion
- `siigo_authenticate` - Genera token de autenticacion

### Productos
- `siigo_list_products` - Lista productos
- `siigo_get_product` - Obtiene un producto
- `siigo_create_product` - Crea un producto
- `siigo_update_product` - Actualiza un producto
- `siigo_delete_product` - Elimina un producto

### Grupos de Inventario
- `siigo_get_account_groups` - Lista clasificaciones de inventario
- `siigo_create_account_group` - Crea clasificacion
- `siigo_update_account_group` - Actualiza clasificacion

### Clientes
- `siigo_list_customers` - Lista clientes
- `siigo_get_customer` - Obtiene un cliente
- `siigo_create_customer` - Crea un cliente
- `siigo_update_customer` - Actualiza un cliente

### Facturas de Venta
- `siigo_list_invoices` - Lista facturas
- `siigo_get_invoice` - Obtiene una factura
- `siigo_create_invoice` - Crea una factura
- `siigo_update_invoice` - Actualiza una factura
- `siigo_delete_invoice` - Elimina una factura
- `siigo_annul_invoice` - Anula una factura
- `siigo_get_invoice_pdf` - Obtiene PDF
- `siigo_get_invoice_xml` - Obtiene XML
- `siigo_send_invoice_email` - Envia por email
- `siigo_get_invoice_stamp_errors` - Consulta errores DIAN
- `siigo_create_invoice_batch` - Crea facturas en lote

### Cotizaciones
- `siigo_list_quotations` - Lista cotizaciones
- `siigo_get_quotation` - Obtiene una cotizacion
- `siigo_create_quotation` - Crea una cotizacion
- `siigo_update_quotation` - Actualiza una cotizacion
- `siigo_delete_quotation` - Elimina una cotizacion

### Notas Credito
- `siigo_list_credit_notes` - Lista notas credito
- `siigo_get_credit_note` - Obtiene una nota credito
- `siigo_create_credit_note` - Crea una nota credito
- `siigo_get_credit_note_pdf` - Obtiene PDF

### Facturas de Compra
- `siigo_list_purchases` - Lista compras
- `siigo_get_purchase` - Obtiene una compra
- `siigo_create_purchase` - Crea una compra
- `siigo_update_purchase` - Actualiza una compra
- `siigo_delete_purchase` - Elimina una compra

### Recibos de Caja
- `siigo_list_vouchers` - Lista recibos
- `siigo_get_voucher` - Obtiene un recibo
- `siigo_create_voucher` - Crea un recibo

### Recibos de Pago/Egreso
- `siigo_list_payment_receipts` - Lista recibos de pago
- `siigo_get_payment_receipt` - Obtiene un recibo de pago
- `siigo_create_payment_receipt` - Crea un recibo de pago
- `siigo_delete_payment_receipt` - Elimina un recibo de pago

### Comprobantes Contables
- `siigo_list_journals` - Lista comprobantes
- `siigo_create_journal` - Crea un comprobante

### Reportes
- `siigo_test_balance_report` - Balance de prueba general
- `siigo_test_balance_by_thirdparty` - Balance por tercero
- `siigo_accounts_payable` - Cuentas por pagar

### Catalogos
- `siigo_get_taxes` - Impuestos
- `siigo_get_users` - Usuarios/vendedores
- `siigo_get_document_types` - Tipos de documentos
- `siigo_get_payment_types` - Formas de pago
- `siigo_get_warehouses` - Bodegas
- `siigo_get_cost_centers` - Centros de costo
- `siigo_get_price_lists` - Listas de precio
- `siigo_get_fixed_assets` - Activos fijos

### Webhooks
- `siigo_list_webhooks` - Lista webhooks
- `siigo_create_webhook` - Crea webhook
- `siigo_update_webhook` - Actualiza webhook
- `siigo_delete_webhook` - Elimina webhook

## Licencia

MIT

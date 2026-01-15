# Checklist de Validacion - MCP Server Siigo API

Este documento contiene la lista completa de verificacion para validar que el servidor MCP implementa correctamente todos los endpoints de la API de Siigo.

## Resumen de Cobertura

| Categoria | Endpoints Doc | Implementados | Estado |
|-----------|---------------|---------------|--------|
| Autenticacion | 1 | 1 | OK |
| Productos | 5 | 5 | OK |
| Categorias Inventario | 3 | 3 | OK |
| Clientes | 4 | 4 | OK |
| Facturas Venta | 11 | 11 | OK |
| Cotizaciones | 5 | 5 | OK |
| Notas Credito | 4 | 4 | OK |
| Facturas Compra | 5 | 5 | OK |
| Recibos Caja | 3 | 3 | OK |
| Recibos Pago | 4 | 4 | OK |
| Comprobantes Contables | 2 | 2 | OK |
| Reportes | 3 | 3 | OK |
| Catalogos | 8 | 8 | OK |
| Webhooks | 4 | 4 | OK |
| **TOTAL** | **62** | **62** | **100%** |

---

## 1. AUTENTICACION

### POST /auth - Generar Token
- [x] Endpoint implementado: `siigo_authenticate`
- [ ] **Validar**: Genera token valido por 24 horas
- [ ] **Validar**: Retorna access_token, expires_in, token_type, scope

**Comando de prueba:**
```
Usa la herramienta siigo_authenticate para obtener un token
```

---

## 2. PRODUCTOS

### POST /v1/products - Crear Producto
- [x] Endpoint implementado: `siigo_create_product`
- [ ] **Validar**: Campos obligatorios (code, name, account_group)
- [ ] **Validar**: Tipos: Product, Service, Combo
- [ ] **Validar**: tax_classification: Taxed, Exempt, Excluded
- [ ] **Validar**: Impuestos y precios

### GET /v1/products/{id} - Consultar Producto
- [x] Endpoint implementado: `siigo_get_product`
- [ ] **Validar**: Retorna informacion completa del producto
- [ ] **Validar**: Incluye available_quantity, warehouses

### GET /v1/products - Listar Productos
- [x] Endpoint implementado: `siigo_list_products`
- [ ] **Validar**: Paginacion (page, page_size)
- [ ] **Validar**: Filtros (code, created_start, created_end)

### PUT /v1/products/{id} - Actualizar Producto
- [x] Endpoint implementado: `siigo_update_product`
- [ ] **Validar**: Actualiza campos correctamente
- [ ] **Validar**: No permite cambiar account_group si tiene movimientos

### DELETE /v1/products/{id} - Eliminar Producto
- [x] Endpoint implementado: `siigo_delete_product`
- [ ] **Validar**: Solo elimina productos sin movimientos

---

## 3. CATEGORIAS DE INVENTARIO

### GET /v1/account-groups - Consultar Grupos
- [x] Endpoint implementado: `siigo_get_account_groups`
- [ ] **Validar**: Lista todas las clasificaciones de inventario

### POST /v1/account-groups - Crear Grupo
- [x] Endpoint implementado: `siigo_create_account_group`
- [ ] **Validar**: Crea nueva clasificacion con name obligatorio

### PUT /v1/account-groups/{id} - Editar Grupo
- [x] Endpoint implementado: `siigo_update_account_group`
- [ ] **Validar**: Actualiza name y active

---

## 4. CLIENTES/TERCEROS

### POST /v1/customers - Crear Cliente
- [x] Endpoint implementado: `siigo_create_customer`
- [ ] **Validar**: Tipos: Customer, Supplier, Other
- [ ] **Validar**: person_type: Person, Company
- [ ] **Validar**: id_type: 13 (CC), 31 (NIT), etc.
- [ ] **Validar**: fiscal_responsibilities obligatorio
- [ ] **Validar**: address con city (country_code, state_code, city_code)
- [ ] **Validar**: contacts obligatorio

### GET /v1/customers/{id} - Consultar Cliente
- [x] Endpoint implementado: `siigo_get_customer`
- [ ] **Validar**: Retorna informacion completa

### GET /v1/customers - Listar Clientes
- [x] Endpoint implementado: `siigo_list_customers`
- [ ] **Validar**: Paginacion
- [ ] **Validar**: Filtros (identification, created_start, etc.)

### PUT /v1/customers/{id} - Actualizar Cliente
- [x] Endpoint implementado: `siigo_update_customer`
- [ ] **Validar**: Reemplaza todos los datos

---

## 5. FACTURAS DE VENTA

### GET /v1/document-types?type=FV - Tipos de Factura
- [x] Endpoint implementado: `siigo_get_document_types`
- [ ] **Validar**: Retorna configuracion de facturas

### POST /v1/invoices - Crear Factura
- [x] Endpoint implementado: `siigo_create_invoice`
- [ ] **Validar**: document.id obligatorio
- [ ] **Validar**: date en formato yyyy-MM-dd
- [ ] **Validar**: customer.identification obligatorio
- [ ] **Validar**: seller obligatorio
- [ ] **Validar**: items con code, quantity, price
- [ ] **Validar**: payments con id, value
- [ ] **Validar**: stamp.send para factura electronica
- [ ] **Validar**: mail.send para envio por correo
- [ ] **Validar**: Idempotency-Key header

### GET /v1/invoices/{id} - Consultar Factura
- [x] Endpoint implementado: `siigo_get_invoice`
- [ ] **Validar**: Retorna informacion completa

### GET /v1/invoices - Listar Facturas
- [x] Endpoint implementado: `siigo_list_invoices`
- [ ] **Validar**: Filtros (customer_identification, date_start, etc.)

### PUT /v1/invoices/{id} - Editar Factura
- [x] Endpoint implementado: `siigo_update_invoice`
- [ ] **Validar**: No edita facturas con CUFE

### DELETE /v1/invoices/{id} - Eliminar Factura
- [x] Endpoint implementado: `siigo_delete_invoice`
- [ ] **Validar**: No elimina facturas con CUFE

### POST /v1/invoices/{id}/annul - Anular Factura
- [x] Endpoint implementado: `siigo_annul_invoice`
- [ ] **Validar**: No anula facturas con CUFE

### GET /v1/invoices/{id}/pdf - Obtener PDF
- [x] Endpoint implementado: `siigo_get_invoice_pdf`
- [ ] **Validar**: Retorna base64 del PDF

### GET /v1/invoices/{id}/xml - Obtener XML
- [x] Endpoint implementado: `siigo_get_invoice_xml`
- [ ] **Validar**: Retorna base64 del XML

### POST /v1/invoices/{id}/mail - Enviar por Email
- [x] Endpoint implementado: `siigo_send_invoice_email`
- [ ] **Validar**: mail_to y copy_to opcionales

### GET /v1/invoices/{id}/stamp/errors - Errores DIAN
- [x] Endpoint implementado: `siigo_get_invoice_stamp_errors`
- [ ] **Validar**: Retorna errores de rechazo

### POST /v1/invoices/batch - Crear Lote
- [x] Endpoint implementado: `siigo_create_invoice_batch`
- [ ] **Validar**: notification_url obligatorio
- [ ] **Validar**: invoices array con idempotency_key

---

## 6. COTIZACIONES

### GET /v1/document-types?type=C - Tipos de Cotizacion
- [x] Endpoint implementado: `siigo_get_document_types`
- [ ] **Validar**: Retorna configuracion de cotizaciones

### POST /v1/quotations - Crear Cotizacion
- [x] Endpoint implementado: `siigo_create_quotation`
- [ ] **Validar**: Campos obligatorios

### GET /v1/quotations/{id} - Consultar Cotizacion
- [x] Endpoint implementado: `siigo_get_quotation`
- [ ] **Validar**: Retorna informacion completa

### GET /v1/quotations - Listar Cotizaciones
- [x] Endpoint implementado: `siigo_list_quotations`
- [ ] **Validar**: Paginacion y filtros

### PUT /v1/quotations/{id} - Editar Cotizacion
- [x] Endpoint implementado: `siigo_update_quotation`
- [ ] **Validar**: No edita document, number, customer, currency

### DELETE /v1/quotations/{id} - Eliminar Cotizacion
- [x] Endpoint implementado: `siigo_delete_quotation`
- [ ] **Validar**: Elimina correctamente

---

## 7. NOTAS CREDITO

### GET /v1/document-types?type=NC - Tipos de Nota Credito
- [x] Endpoint implementado: `siigo_get_document_types`
- [ ] **Validar**: Retorna configuracion

### POST /v1/credit-notes - Crear Nota Credito
- [x] Endpoint implementado: `siigo_create_credit_note`
- [ ] **Validar**: Motivos de devolucion DIAN (1-7)
- [ ] **Validar**: invoice para notas electronicas
- [ ] **Validar**: invoice_data para facturas externas

### GET /v1/credit-notes/{id} - Consultar Nota Credito
- [x] Endpoint implementado: `siigo_get_credit_note`
- [ ] **Validar**: Retorna informacion completa

### GET /v1/credit-notes - Listar Notas Credito
- [x] Endpoint implementado: `siigo_list_credit_notes`
- [ ] **Validar**: Paginacion

### GET /v1/credit-notes/{id}/pdf - Obtener PDF
- [x] Endpoint implementado: `siigo_get_credit_note_pdf`
- [ ] **Validar**: Retorna base64

---

## 8. FACTURAS DE COMPRA

### GET /v1/document-types?type=FC - Tipos
- [x] Endpoint implementado: `siigo_get_document_types`
- [ ] **Validar**: Retorna configuracion

### POST /v1/purchases - Crear Compra
- [x] Endpoint implementado: `siigo_create_purchase`
- [ ] **Validar**: items.type: Product, FixedAsset, Account
- [ ] **Validar**: supplier obligatorio

### GET /v1/purchases/{id} - Consultar Compra
- [x] Endpoint implementado: `siigo_get_purchase`
- [ ] **Validar**: Retorna informacion completa

### GET /v1/purchases - Listar Compras
- [x] Endpoint implementado: `siigo_list_purchases`
- [ ] **Validar**: Filtros

### PUT /v1/purchases/{id} - Editar Compra
- [x] Endpoint implementado: `siigo_update_purchase`
- [ ] **Validar**: Campos no editables

### DELETE /v1/purchases/{id} - Eliminar Compra
- [x] Endpoint implementado: `siigo_delete_purchase`
- [ ] **Validar**: Elimina correctamente

---

## 9. RECIBOS DE CAJA

### GET /v1/document-types?type=RC - Tipos
- [x] Endpoint implementado: `siigo_get_document_types`
- [ ] **Validar**: Retorna configuracion

### POST /v1/vouchers - Crear Recibo
- [x] Endpoint implementado: `siigo_create_voucher`
- [ ] **Validar**: type: DebtPayment, AdvancePayment, Detailed
- [ ] **Validar**: items.due para DebtPayment

### GET /v1/vouchers/{id} - Consultar Recibo
- [x] Endpoint implementado: `siigo_get_voucher`
- [ ] **Validar**: Retorna informacion completa

### GET /v1/vouchers - Listar Recibos
- [x] Endpoint implementado: `siigo_list_vouchers`
- [ ] **Validar**: Paginacion

---

## 10. RECIBOS DE PAGO/EGRESO

### GET /v1/document-types?type=RP - Tipos
- [x] Endpoint implementado: `siigo_get_document_types`
- [ ] **Validar**: Retorna configuracion

### POST /v1/payment-receipts - Crear Recibo
- [x] Endpoint implementado: `siigo_create_payment_receipt`
- [ ] **Validar**: type: DebtPayment, AdvancePayment, Detailed
- [ ] **Validar**: supplier obligatorio

### GET /v1/payment-receipts/{id} - Consultar Recibo
- [x] Endpoint implementado: `siigo_get_payment_receipt`
- [ ] **Validar**: Retorna informacion completa

### GET /v1/payment-receipts - Listar Recibos
- [x] Endpoint implementado: `siigo_list_payment_receipts`
- [ ] **Validar**: Filtros

### DELETE /v1/payment-receipts/{id} - Eliminar
- [x] Endpoint implementado: `siigo_delete_payment_receipt`
- [ ] **Validar**: Elimina correctamente

---

## 11. COMPROBANTES CONTABLES

### GET /v1/document-types?type=CC - Tipos
- [x] Endpoint implementado: `siigo_get_document_types`
- [ ] **Validar**: Retorna configuracion

### POST /v1/journals - Crear Comprobante
- [x] Endpoint implementado: `siigo_create_journal`
- [ ] **Validar**: items con account (code, movement)
- [ ] **Validar**: Debitos y creditos balanceados

### GET /v1/journals - Listar Comprobantes
- [x] Endpoint implementado: `siigo_list_journals`
- [ ] **Validar**: Paginacion y filtros

---

## 12. REPORTES

### POST /v1/test-balance-report - Balance General
- [x] Endpoint implementado: `siigo_test_balance_report`
- [ ] **Validar**: year obligatorio
- [ ] **Validar**: month_start y month_end (1-13)
- [ ] **Validar**: Retorna file_url para descarga

### POST /v1/test-balance-report-by-thirdparty - Balance por Tercero
- [x] Endpoint implementado: `siigo_test_balance_by_thirdparty`
- [ ] **Validar**: customer opcional para filtrar

### GET /v1/accounts-payable - Cuentas por Pagar
- [x] Endpoint implementado: `siigo_accounts_payable`
- [ ] **Validar**: Filtros por fecha y proveedor

---

## 13. CATALOGOS

### GET /v1/taxes - Impuestos
- [x] Endpoint implementado: `siigo_get_taxes`
- [ ] **Validar**: Lista id, name, type, percentage, active

### GET /v1/price-lists - Listas de Precio
- [x] Endpoint implementado: `siigo_get_price_lists`
- [ ] **Validar**: Lista id, name, active, position

### GET /v1/warehouses - Bodegas
- [x] Endpoint implementado: `siigo_get_warehouses`
- [ ] **Validar**: Lista id, name, active, has_movements

### GET /v1/users - Usuarios/Vendedores
- [x] Endpoint implementado: `siigo_get_users`
- [ ] **Validar**: Lista id, username, first_name, etc.

### GET /v1/document-types - Tipos de Comprobante
- [x] Endpoint implementado: `siigo_get_document_types`
- [ ] **Validar**: Filtro por type (FV, FC, NC, RC, CC, RP, C)

### GET /v1/payment-types - Formas de Pago
- [x] Endpoint implementado: `siigo_get_payment_types`
- [ ] **Validar**: Filtro por document_type

### GET /v1/cost-centers - Centros de Costo
- [x] Endpoint implementado: `siigo_get_cost_centers`
- [ ] **Validar**: Lista id, code, name, active

### GET /v1/fixed-assets - Activos Fijos
- [x] Endpoint implementado: `siigo_get_fixed_assets`
- [ ] **Validar**: Lista id, name, group, active

---

## 14. WEBHOOKS

### GET /v1/webhooks - Listar Webhooks
- [x] Endpoint implementado: `siigo_list_webhooks`
- [ ] **Validar**: Lista suscripciones activas

### POST /v1/webhooks - Crear Webhook
- [x] Endpoint implementado: `siigo_create_webhook`
- [ ] **Validar**: application_id, topic, url obligatorios
- [ ] **Validar**: Topics: products.create, .update, .stock.update

### PUT /v1/webhooks/{id} - Editar Webhook
- [x] Endpoint implementado: `siigo_update_webhook`
- [ ] **Validar**: Permite cambiar active, url, etc.

### DELETE /v1/webhooks/{id} - Eliminar Webhook
- [x] Endpoint implementado: `siigo_delete_webhook`
- [ ] **Validar**: Elimina suscripcion

---

## PRUEBAS DE VALIDACION

### Paso 1: Autenticacion
```
1. Ejecutar siigo_authenticate
2. Verificar que retorna access_token
```

### Paso 2: Catalogos (Solo lectura)
```
1. siigo_get_taxes
2. siigo_get_users
3. siigo_get_document_types con type=FV
4. siigo_get_payment_types con document_type=FV
5. siigo_get_warehouses
6. siigo_get_cost_centers
7. siigo_get_price_lists
8. siigo_get_fixed_assets
9. siigo_get_account_groups
```

### Paso 3: Productos
```
1. siigo_list_products
2. siigo_create_product (con account_group de paso 2)
3. siigo_get_product con el ID creado
4. siigo_update_product
5. siigo_delete_product
```

### Paso 4: Clientes
```
1. siigo_list_customers
2. siigo_create_customer
3. siigo_get_customer
4. siigo_update_customer
```

### Paso 5: Facturas
```
1. siigo_list_invoices
2. siigo_create_invoice (usar document_id, seller de catalogos)
3. siigo_get_invoice
4. siigo_get_invoice_pdf
5. siigo_update_invoice
6. siigo_annul_invoice o siigo_delete_invoice
```

### Paso 6: Otros documentos
```
1. Cotizaciones: create, get, list, update, delete
2. Notas Credito: create, get, list, pdf
3. Compras: create, get, list, update, delete
4. Recibos de Caja: create, get, list
5. Recibos de Pago: create, get, list, delete
6. Comprobantes Contables: create, list
```

### Paso 7: Reportes
```
1. siigo_test_balance_report
2. siigo_test_balance_by_thirdparty
3. siigo_accounts_payable
```

### Paso 8: Webhooks
```
1. siigo_list_webhooks
2. siigo_create_webhook
3. siigo_update_webhook
4. siigo_delete_webhook
```

---

## NOTAS IMPORTANTES

1. **Rate Limiting**: Maximo 100 peticiones por minuto
2. **Token**: Valido por 24 horas
3. **Idempotencia**: Usar header Idempotency-Key en POST de comprobantes
4. **Partner-Id**: Obligatorio en todas las peticiones
5. **Errores**: Manejar codigos de error segun documentacion

---

## ESTADO FINAL

- **Total Endpoints en Documentacion**: 62
- **Total Endpoints Implementados**: 62
- **Cobertura**: 100%

El servidor MCP cubre todos los endpoints documentados de la API de Siigo.

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const userProfiles = sqliteTable("user_profiles", {
  email: text("email").primaryKey(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("operador"),
  status: text("status").notNull().default("ativo"),
  lastAccess: text("last_access"),
  ...timestamps,
});

export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("categories_name_uq").on(table.name)],
);

export const brands = sqliteTable(
  "brands",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("brands_name_uq").on(table.name)],
);

export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  document: text("document").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  contactPerson: text("contact_person").notNull().default(""),
  leadTimeDays: integer("lead_time_days").notNull().default(0),
  notes: text("notes").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  document: text("document").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  clientType: text("client_type").notNull().default("empresa"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const warehouses = sqliteTable("warehouses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").notNull().default(""),
  address: text("address").notNull().default(""),
  description: text("description").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull(),
    sku: text("sku").notNull(),
    barcode: text("barcode"),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    categoryId: integer("category_id").references(() => categories.id),
    brandId: integer("brand_id").references(() => brands.id),
    supplierId: integer("supplier_id").references(() => suppliers.id),
    warehouseId: integer("warehouse_id").references(() => warehouses.id),
    location: text("location").notNull().default(""),
    unit: text("unit").notNull().default("UN"),
    cost: real("cost").notNull().default(0),
    price: real("price").notNull().default(0),
    minStock: real("min_stock").notNull().default(0),
    currentStock: real("current_stock").notNull().default(0),
    reservedStock: real("reserved_stock").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    lotControl: integer("lot_control", { mode: "boolean" }).notNull().default(false),
    serialControl: integer("serial_control", { mode: "boolean" }).notNull().default(false),
    expiryDate: text("expiry_date"),
    imageUrl: text("image_url").notNull().default(""),
    saleBlocked: integer("sale_blocked", { mode: "boolean" }).notNull().default(false),
    purchaseBlocked: integer("purchase_blocked", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("products_code_uq").on(table.code),
    uniqueIndex("products_sku_uq").on(table.sku),
    uniqueIndex("products_barcode_uq")
      .on(table.barcode)
      .where(sql`${table.barcode} IS NOT NULL AND ${table.barcode} <> ''`),
  ],
);

export const productDetails = sqliteTable("product_details", {
  productId: integer("product_id").primaryKey().references(() => products.id),
  extraData: text("extra_data").notNull().default("{}"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const movements = sqliteTable(
  "movements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    type: text("type").notNull(),
    quantity: real("quantity").notNull(),
    previousStock: real("previous_stock").notNull(),
    newStock: real("new_stock").notNull(),
    origin: text("origin").notNull().default(""),
    destination: text("destination").notNull().default(""),
    reason: text("reason").notNull().default(""),
    reference: text("reference").notNull().default(""),
    userEmail: text("user_email").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("movements_product_idx").on(table.productId, table.createdAt),
  ],
);

export const sales = sqliteTable(
  "sales",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    number: text("number").notNull().unique(),
    clientId: integer("client_id").references(() => clients.id),
    subtotal: real("subtotal").notNull(),
    discount: real("discount").notNull().default(0),
    total: real("total").notNull(),
    status: text("status").notNull().default("aberta"),
    paymentMethod: text("payment_method").notNull().default("informativo"),
    sellerEmail: text("seller_email").notNull(),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("sales_status_idx").on(table.status, table.createdAt)],
);

export const saleItems = sqliteTable("sale_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  saleId: integer("sale_id").notNull().references(() => sales.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  discount: real("discount").notNull().default(0),
  total: real("total").notNull(),
});

export const purchases = sqliteTable("purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  number: text("number").notNull().unique(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  document: text("document").notNull().default(""),
  total: real("total").notNull(),
  status: text("status").notNull().default("recebida"),
  responsibleEmail: text("responsible_email").notNull(),
  notes: text("notes").notNull().default(""),
  receivedAt: text("received_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const purchaseItems = sqliteTable("purchase_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  purchaseId: integer("purchase_id").notNull().references(() => purchases.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: real("quantity").notNull(),
  unitCost: real("unit_cost").notNull(),
  total: real("total").notNull(),
});

export const inventories = sqliteTable("inventories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  number: text("number").notNull().unique(),
  status: text("status").notNull().default("pendente"),
  counterEmail: text("counter_email").notNull(),
  approverEmail: text("approver_email"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
});

export const inventoryItems = sqliteTable("inventory_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inventoryId: integer("inventory_id").notNull().references(() => inventories.id),
  productId: integer("product_id").notNull().references(() => products.id),
  expectedStock: real("expected_stock").notNull(),
  countedStock: real("counted_stock").notNull(),
  difference: real("difference").notNull(),
});

export const shipments = sqliteTable("shipments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  saleId: integer("sale_id").notNull().references(() => sales.id),
  carrier: text("carrier").notNull(),
  trackingCode: text("tracking_code").notNull().default(""),
  status: text("status").notNull().default("expedido"),
  responsibleEmail: text("responsible_email").notNull(),
  occurrence: text("occurrence").notNull().default(""),
  shippedAt: text("shipped_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workflowRecords = sqliteTable(
  "workflow_records",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    module: text("module").notNull(),
    code: text("code").notNull(),
    title: text("title").notNull(),
    recordType: text("record_type").notNull().default("registro"),
    productId: integer("product_id").references(() => products.id),
    quantity: real("quantity").notNull().default(0),
    origin: text("origin").notNull().default(""),
    destination: text("destination").notNull().default(""),
    status: text("status").notNull().default("pendente"),
    priority: text("priority").notNull().default("normal"),
    responsibleEmail: text("responsible_email").notNull().default(""),
    dueAt: text("due_at"),
    amount: real("amount").notNull().default(0),
    reference: text("reference").notNull().default(""),
    notes: text("notes").notNull().default(""),
    metadataJson: text("metadata_json").notNull().default("{}"),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("workflow_module_code_uq").on(table.module, table.code),
    index("workflow_module_status_idx").on(table.module, table.status, table.createdAt),
  ],
);

export const statusHistory = sqliteTable(
  "status_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    previousStatus: text("previous_status").notNull().default(""),
    newStatus: text("new_status").notNull(),
    observation: text("observation").notNull().default(""),
    userEmail: text("user_email").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("status_history_entity_idx").on(
      table.entityType,
      table.entityId,
      table.createdAt,
    ),
  ],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userEmail: text("user_email").notNull(),
    action: text("action").notNull(),
    module: text("module").notNull(),
    recordId: text("record_id").notNull().default(""),
    oldValue: text("old_value").notNull().default(""),
    newValue: text("new_value").notNull().default(""),
    description: text("description").notNull(),
    origin: text("origin").notNull().default(""),
    destination: text("destination").notNull().default(""),
    reason: text("reason").notNull().default(""),
    ipAddress: text("ip_address").notNull().default(""),
    device: text("device").notNull().default(""),
    endpoint: text("endpoint").notNull().default("/api/erp"),
    result: text("result").notNull().default("sucesso"),
    documentReference: text("document_reference").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("audit_module_idx").on(table.module, table.createdAt)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedBy: text("updated_by").notNull().default("sistema"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

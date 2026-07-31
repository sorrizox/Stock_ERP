import express from "express";
import knexFactory from "knex";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

const execFileAsync = promisify(execFile);

const port = Number(process.env.PORT || 3333);
const token = process.env.CONNECTOR_TOKEN || "";
const client = process.env.DB_CLIENT || "mysql2";
const connection = process.env.DATABASE_URL || "";

if (!token || token === "troque-por-uma-chave-forte") {
  throw new Error("Defina CONNECTOR_TOKEN com uma chave forte.");
}
if (!connection) throw new Error("Defina DATABASE_URL.");
if (!["mysql2", "pg", "mssql"].includes(client)) {
  throw new Error("DB_CLIENT deve ser mysql2, pg ou mssql.");
}

const mapPath = resolve(process.env.TABLE_MAP_FILE || "./config/table-map.json");
const tables = JSON.parse(await readFile(mapPath, "utf8"));
const identifier = /^[A-Za-z_][A-Za-z0-9_.]*$/;
for (const [key, value] of Object.entries(tables)) {
  if (!identifier.test(value)) throw new Error(`Nome de tabela inválido em ${key}.`);
}

function connectionConfig() {
  if (client !== "mssql") return connection;
  const parsed = new URL(connection);
  return {
    server: parsed.hostname,
    port: Number(parsed.port || 1433),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
    options: {
      encrypt: process.env.DB_ENCRYPT !== "false",
      trustServerCertificate:
        process.env.DB_TRUST_SERVER_CERTIFICATE !== "false",
    },
  };
}

const db = knexFactory({
  client,
  connection: connectionConfig(),
  pool: { min: 0, max: 10 },
});

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));

function table(name, trx = db) {
  const resolved = tables[name];
  if (!resolved) throw new Error(`Tabela não mapeada: ${name}`);
  return trx(resolved);
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function number(value, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function id(value) {
  const result = Number(value);
  return Number.isInteger(result) && result > 0 ? result : null;
}

function active(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function requestUser(req) {
  return {
    email: clean(req.get("x-stock-erp-user-email")) || "admin@stockerp.local",
    fullName:
      clean(req.get("x-stock-erp-user-full-name")) || "Administrador Stock ERP",
  };
}

function authorize(req, res, next) {
  const authorization = req.get("authorization") || "";
  if (authorization !== `Bearer ${token}`) {
    return res.status(401).json({ error: "Conector não autorizado." });
  }
  next();
}

async function ensureActor(req, trx = db) {
  const incoming = requestUser(req);
  let profile = await table("user_profiles", trx)
    .where({ email: incoming.email })
    .first();
  if (!profile) {
    const [{ total }] = await table("user_profiles", trx).count({ total: "*" });
    await table("user_profiles", trx).insert({
      email: incoming.email,
      full_name: incoming.fullName,
      role: Number(total) === 0 ? "administrador" : "operador",
      status: "ativo",
      last_access: new Date(),
    });
    profile = await table("user_profiles", trx)
      .where({ email: incoming.email })
      .first();
  }
  if (profile.status !== "ativo") {
    const error = new Error("Usuário inativo.");
    error.status = 403;
    throw error;
  }
  await table("user_profiles", trx)
    .where({ email: incoming.email })
    .update({ last_access: new Date(), updated_at: new Date() });
  return {
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    status: profile.status,
  };
}

const permissions = {
  save_product: ["administrador", "gestor"],
  toggle_product: ["administrador", "gestor"],
  create_movement: ["administrador", "gestor", "operador"],
  create_sale: ["administrador", "gestor", "vendedor"],
  cancel_sale: ["administrador", "gestor"],
  create_purchase: ["administrador", "gestor"],
  update_order_status: ["administrador", "gestor", "operador", "expedidor"],
  create_inventory: ["administrador", "gestor", "operador"],
  apply_inventory: ["administrador", "gestor"],
  save_entity: ["administrador", "gestor"],
  toggle_entity: ["administrador", "gestor"],
  save_user: ["administrador"],
  save_settings: ["administrador"],
};

function requirePermission(actor, action) {
  if (!permissions[action]?.includes(actor.role)) {
    const error = new Error("Seu perfil não possui permissão para esta ação.");
    error.status = 403;
    throw error;
  }
}

async function audit(trx, actor, action, module, recordId, description, before = {}, after = {}) {
  await table("audit_logs", trx).insert({
    user_email: actor.email,
    action,
    module,
    record_id: String(recordId ?? ""),
    old_value: JSON.stringify(before),
    new_value: JSON.stringify(after),
    description,
    created_at: new Date(),
  });
}

async function insertId(trx, logicalTable, values) {
  const query = table(logicalTable, trx);
  if (client === "mysql2") {
    const result = await query.insert(values);
    return Number(result[0]);
  }
  const result = await query.insert(values).returning("id");
  return Number(result[0]?.id ?? result[0]);
}

function operationNumber(prefix) {
  return `${prefix}-${String(Date.now()).slice(-8)}`;
}

async function snapshot(actor, trx = db) {
  const products = await table("products", trx)
    .leftJoin(`${tables.categories} as c`, `${tables.products}.category_id`, "c.id")
    .leftJoin(`${tables.brands} as b`, `${tables.products}.brand_id`, "b.id")
    .leftJoin(`${tables.suppliers} as s`, `${tables.products}.supplier_id`, "s.id")
    .leftJoin(`${tables.warehouses} as w`, `${tables.products}.warehouse_id`, "w.id")
    .select(`${tables.products}.*`, "c.name as category_name", "b.name as brand_name", "s.name as supplier_name", "w.name as warehouse_name")
    .orderBy(`${tables.products}.name`);
  const movements = await table("movements", trx)
    .join(`${tables.products} as p`, `${tables.movements}.product_id`, "p.id")
    .select(`${tables.movements}.*`, "p.name as product_name", "p.sku as product_sku")
    .orderBy(`${tables.movements}.created_at`, "desc")
    .limit(150);
  const sales = await table("sales", trx)
    .leftJoin(`${tables.clients} as c`, `${tables.sales}.client_id`, "c.id")
    .select(`${tables.sales}.*`, "c.name as client_name")
    .orderBy(`${tables.sales}.created_at`, "desc")
    .limit(100);
  const saleCounts = await table("sale_items", trx)
    .select("sale_id")
    .count({ item_count: "*" })
    .groupBy("sale_id");
  const saleCountMap = Object.fromEntries(
    saleCounts.map((row) => [String(row.sale_id), Number(row.item_count)]),
  );
  sales.forEach((row) => {
    row.item_count = saleCountMap[String(row.id)] || 0;
  });
  const purchases = await table("purchases", trx)
    .leftJoin(`${tables.suppliers} as s`, `${tables.purchases}.supplier_id`, "s.id")
    .select(`${tables.purchases}.*`, "s.name as supplier_name")
    .orderBy(`${tables.purchases}.created_at`, "desc")
    .limit(100);
  const purchaseCounts = await table("purchase_items", trx)
    .select("purchase_id")
    .count({ item_count: "*" })
    .groupBy("purchase_id");
  const purchaseCountMap = Object.fromEntries(
    purchaseCounts.map((row) => [String(row.purchase_id), Number(row.item_count)]),
  );
  purchases.forEach((row) => {
    row.item_count = purchaseCountMap[String(row.id)] || 0;
  });
  const inventories = await table("inventories", trx)
    .join(`${tables.inventory_items} as ii`, `${tables.inventories}.id`, "ii.inventory_id")
    .join(`${tables.products} as p`, "ii.product_id", "p.id")
    .select(`${tables.inventories}.*`, "ii.product_id", "ii.expected_stock", "ii.counted_stock", "ii.difference", "p.name as product_name", "p.sku as product_sku")
    .orderBy(`${tables.inventories}.created_at`, "desc")
    .limit(100);
  const shipments = await table("shipments", trx)
    .join(`${tables.sales} as s`, `${tables.shipments}.sale_id`, "s.id")
    .leftJoin(`${tables.clients} as c`, "s.client_id", "c.id")
    .select(`${tables.shipments}.*`, "s.number as sale_number", "c.name as client_name")
    .orderBy(`${tables.shipments}.shipped_at`, "desc")
    .limit(100);
  const [categories, brands, suppliers, clients, warehouses, users, auditRows, settingRows] =
    await Promise.all([
      table("categories", trx).select("*").orderBy("name"),
      table("brands", trx).select("*").orderBy("name"),
      table("suppliers", trx).select("*").orderBy("name"),
      table("clients", trx).select("*").orderBy("name"),
      table("warehouses", trx).select("*").orderBy("name"),
      table("user_profiles", trx).select("email", "full_name", "role", "status", "last_access", "created_at").orderBy("full_name"),
      table("audit_logs", trx).select("*").orderBy("created_at", "desc").limit(150),
      table("settings", trx).select("key", "value"),
    ]);
  return {
    profile: actor,
    products,
    movements,
    sales,
    purchases,
    inventories,
    shipments,
    categories,
    brands,
    suppliers,
    clients,
    warehouses,
    users,
    audit: auditRows,
    settings: Object.fromEntries(settingRows.map((row) => [row.key, row.value])),
    dataSource: { mode: "external-api", label: "Banco existente", status: "connected" },
  };
}

async function saveProduct(trx, actor, payload) {
  const productId = id(payload.id);
  const values = {
    code: clean(payload.code),
    sku: clean(payload.sku),
    barcode: clean(payload.barcode) || null,
    name: clean(payload.name),
    description: clean(payload.description),
    category_id: id(payload.category_id),
    brand_id: id(payload.brand_id),
    supplier_id: id(payload.supplier_id),
    warehouse_id: id(payload.warehouse_id),
    location: clean(payload.location),
    unit: clean(payload.unit) || "UN",
    cost: number(payload.cost),
    price: number(payload.price),
    min_stock: number(payload.min_stock),
    active: active(payload.active),
    lot_control: active(payload.lot_control),
    serial_control: active(payload.serial_control),
    expiry_date: clean(payload.expiry_date) || null,
    image_url: clean(payload.image_url),
    sale_blocked: active(payload.sale_blocked),
    purchase_blocked: active(payload.purchase_blocked),
    updated_at: new Date(),
  };
  if (!values.name || !values.code || !values.sku) {
    const error = new Error("Nome, código interno e SKU são obrigatórios.");
    error.status = 400;
    throw error;
  }
  if (productId) {
    const before = await table("products", trx).where({ id: productId }).first();
    await table("products", trx).where({ id: productId }).update(values);
    await audit(trx, actor, "UPDATE", "produtos", productId, `${values.name} atualizado.`, before, values);
    return;
  }
  values.current_stock = number(payload.current_stock);
  values.reserved_stock = 0;
  values.created_at = new Date();
  const newId = await insertId(trx, "products", values);
  await audit(trx, actor, "CREATE", "produtos", newId, `${values.name} cadastrado.`, {}, values);
}

async function movement(trx, actor, payload) {
  const productId = id(payload.product_id);
  const product = await table("products", trx).where({ id: productId }).first();
  if (!product) throw Object.assign(new Error("Produto não encontrado."), { status: 404 });
  const quantity = number(payload.quantity);
  const type = clean(payload.type);
  const delta = ["saida", "venda"].includes(type) ? -Math.abs(quantity) : quantity;
  const next = number(product.current_stock) + delta;
  if (next < 0) throw Object.assign(new Error("Estoque insuficiente."), { status: 409 });
  await table("products", trx).where({ id: productId }).update({ current_stock: next, updated_at: new Date() });
  await table("movements", trx).insert({
    product_id: productId,
    type,
    quantity: delta,
    previous_stock: product.current_stock,
    new_stock: next,
    origin: clean(payload.origin),
    destination: clean(payload.destination),
    reason: clean(payload.reason),
    reference: clean(payload.reference) || operationNumber("MOV"),
    user_email: actor.email,
    created_at: new Date(),
  });
}

async function sale(trx, actor, payload) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) throw Object.assign(new Error("Inclua ao menos um item."), { status: 400 });
  let subtotal = 0;
  const checked = [];
  for (const item of items) {
    const product = await table("products", trx).where({ id: id(item.product_id) }).first();
    const quantity = number(item.quantity);
    const unitPrice = number(item.unit_price);
    if (!product || !product.active || product.sale_blocked) {
      throw Object.assign(new Error("Produto indisponível para venda."), { status: 409 });
    }
    if (number(product.current_stock) < quantity) {
      throw Object.assign(new Error(`${product.name}: estoque insuficiente.`), { status: 409 });
    }
    subtotal += quantity * unitPrice;
    checked.push({ product, quantity, unitPrice });
  }
  const discount = number(payload.discount);
  const saleId = await insertId(trx, "sales", {
    number: operationNumber("VEN"),
    client_id: id(payload.client_id),
    subtotal,
    discount,
    total: subtotal - discount,
    status: "aberta",
    payment_method: clean(payload.payment_method) || "informativo",
    seller_email: actor.email,
    notes: clean(payload.notes),
    created_at: new Date(),
    updated_at: new Date(),
  });
  for (const item of checked) {
    const next = number(item.product.current_stock) - item.quantity;
    await table("sale_items", trx).insert({
      sale_id: saleId,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount: 0,
      total: item.quantity * item.unitPrice,
    });
    await table("products", trx).where({ id: item.product.id }).update({ current_stock: next, updated_at: new Date() });
    await table("movements", trx).insert({
      product_id: item.product.id,
      type: "venda",
      quantity: -item.quantity,
      previous_stock: item.product.current_stock,
      new_stock: next,
      origin: "Estoque",
      destination: "Cliente",
      reason: "Venda finalizada",
      reference: String(saleId),
      user_email: actor.email,
      created_at: new Date(),
    });
  }
  await audit(trx, actor, "CREATE", "vendas", saleId, "Venda registrada e estoque atualizado.");
}

async function purchase(trx, actor, payload) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) throw Object.assign(new Error("Inclua ao menos um item."), { status: 400 });
  const purchaseId = await insertId(trx, "purchases", {
    number: operationNumber("CMP"),
    supplier_id: id(payload.supplier_id),
    document: clean(payload.document),
    total: items.reduce((sum, item) => sum + number(item.quantity) * number(item.unit_cost), 0),
    status: "recebida",
    responsible_email: actor.email,
    notes: clean(payload.notes),
    received_at: new Date(),
    created_at: new Date(),
  });
  for (const item of items) {
    const product = await table("products", trx).where({ id: id(item.product_id) }).first();
    if (!product) throw Object.assign(new Error("Produto não encontrado."), { status: 404 });
    const quantity = number(item.quantity);
    const unitCost = number(item.unit_cost);
    const next = number(product.current_stock) + quantity;
    await table("purchase_items", trx).insert({ purchase_id: purchaseId, product_id: product.id, quantity, unit_cost: unitCost, total: quantity * unitCost });
    await table("products", trx).where({ id: product.id }).update({ current_stock: next, cost: unitCost, updated_at: new Date() });
    await table("movements", trx).insert({
      product_id: product.id,
      type: "entrada",
      quantity,
      previous_stock: product.current_stock,
      new_stock: next,
      origin: "Fornecedor",
      destination: "Estoque",
      reason: "Recebimento de compra",
      reference: String(purchaseId),
      user_email: actor.email,
      created_at: new Date(),
    });
  }
  await audit(trx, actor, "CREATE", "compras", purchaseId, "Compra recebida e estoque atualizado.");
}

const entityTables = {
  categories: ["categories", ["name", "description"]],
  brands: ["brands", ["name", "description"]],
  suppliers: ["suppliers", ["name", "document", "phone", "email", "address", "contact_person", "lead_time_days", "notes"]],
  clients: ["clients", ["name", "document", "phone", "email", "address", "client_type"]],
  warehouses: ["warehouses", ["name", "code", "address", "description"]],
};

async function executeAction(trx, actor, action, payload) {
  if (action === "save_product") return saveProduct(trx, actor, payload);
  if (action === "toggle_product") {
    return table("products", trx).where({ id: id(payload.id) }).update({ active: active(payload.active), updated_at: new Date() });
  }
  if (action === "create_movement") return movement(trx, actor, payload);
  if (action === "create_sale") return sale(trx, actor, payload);
  if (action === "create_purchase") return purchase(trx, actor, payload);
  if (action === "cancel_sale") {
    const saleRow = await table("sales", trx).where({ id: id(payload.id) }).first();
    if (!saleRow || saleRow.status === "cancelada") throw Object.assign(new Error("Venda inválida."), { status: 409 });
    const items = await table("sale_items", trx).where({ sale_id: saleRow.id });
    for (const item of items) {
      const product = await table("products", trx).where({ id: item.product_id }).first();
      const next = number(product.current_stock) + number(item.quantity);
      await table("products", trx).where({ id: product.id }).update({ current_stock: next, updated_at: new Date() });
      await table("movements", trx).insert({ product_id: product.id, type: "estorno", quantity: item.quantity, previous_stock: product.current_stock, new_stock: next, origin: "Cliente", destination: "Estoque", reason: clean(payload.reason) || "Cancelamento", reference: saleRow.number, user_email: actor.email, created_at: new Date() });
    }
    await table("sales", trx).where({ id: saleRow.id }).update({ status: "cancelada", updated_at: new Date() });
    return audit(trx, actor, "CANCEL", "vendas", saleRow.id, "Venda cancelada e saldo estornado.");
  }
  if (action === "update_order_status") {
    const saleId = id(payload.id);
    const nextStatus = clean(payload.status);
    await table("sales", trx).where({ id: saleId }).update({ status: nextStatus, updated_at: new Date() });
    if (nextStatus === "expedido") {
      if (!clean(payload.carrier)) throw Object.assign(new Error("Informe a transportadora."), { status: 400 });
      await table("shipments", trx).insert({ sale_id: saleId, carrier: clean(payload.carrier), tracking_code: clean(payload.tracking_code), status: "expedido", responsible_email: actor.email, occurrence: clean(payload.occurrence), shipped_at: new Date() });
    } else if (nextStatus === "entregue") {
      await table("shipments", trx).where({ sale_id: saleId }).update({ status: "entregue" });
    }
    return audit(trx, actor, "STATUS", "pedidos", saleId, `Pedido alterado para ${nextStatus}.`);
  }
  if (action === "create_inventory") {
    const product = await table("products", trx).where({ id: id(payload.product_id) }).first();
    if (!product) throw Object.assign(new Error("Produto não encontrado."), { status: 404 });
    const counted = number(payload.counted_stock);
    const inventoryId = await insertId(trx, "inventories", { number: operationNumber("INV"), status: "pendente", counter_email: actor.email, notes: clean(payload.notes), created_at: new Date() });
    await table("inventory_items", trx).insert({ inventory_id: inventoryId, product_id: product.id, expected_stock: product.current_stock, counted_stock: counted, difference: counted - number(product.current_stock) });
    return audit(trx, actor, "COUNT", "inventario", inventoryId, "Contagem registrada.");
  }
  if (action === "apply_inventory") {
    const inventoryId = id(payload.id);
    const inventory = await table("inventories", trx).where({ id: inventoryId }).first();
    const item = await table("inventory_items", trx).where({ inventory_id: inventoryId }).first();
    if (!inventory || !item || inventory.status !== "pendente") throw Object.assign(new Error("Inventário inválido."), { status: 409 });
    const product = await table("products", trx).where({ id: item.product_id }).first();
    await table("products", trx).where({ id: item.product_id }).update({ current_stock: item.counted_stock, updated_at: new Date() });
    await table("inventories", trx).where({ id: inventoryId }).update({ status: "concluido", approver_email: actor.email, completed_at: new Date() });
    await table("movements", trx).insert({ product_id: item.product_id, type: "inventario", quantity: item.difference, previous_stock: product.current_stock, new_stock: item.counted_stock, origin: "Estoque", destination: "Estoque", reason: "Ajuste pós-inventário", reference: inventory.number, user_email: actor.email, created_at: new Date() });
    return audit(trx, actor, "APPROVE", "inventario", inventoryId, "Inventário aprovado.");
  }
  if (action === "save_entity") {
    const config = entityTables[clean(payload.entity)];
    if (!config) throw Object.assign(new Error("Cadastro inválido."), { status: 400 });
    const [logicalTable, fields] = config;
    const values = Object.fromEntries(fields.map((field) => [field, field === "lead_time_days" ? number(payload[field]) : clean(payload[field])]));
    values.active = payload.active === undefined ? true : active(payload.active);
    values.updated_at = new Date();
    if (id(payload.id)) return table(logicalTable, trx).where({ id: id(payload.id) }).update(values);
    values.created_at = new Date();
    return insertId(trx, logicalTable, values);
  }
  if (action === "toggle_entity") {
    const config = entityTables[clean(payload.entity)];
    if (!config) throw Object.assign(new Error("Cadastro inválido."), { status: 400 });
    return table(config[0], trx).where({ id: id(payload.id) }).update({ active: active(payload.active), updated_at: new Date() });
  }
  if (action === "save_user") {
    const email = clean(payload.email);
    const existing = await table("user_profiles", trx).where({ email }).first();
    const values = { full_name: clean(payload.full_name), role: clean(payload.role), status: clean(payload.status) || "ativo", updated_at: new Date() };
    if (existing) return table("user_profiles", trx).where({ email }).update(values);
    return table("user_profiles", trx).insert({ email, ...values, created_at: new Date() });
  }
  if (action === "save_settings") {
    for (const [key, value] of Object.entries(payload)) {
      const row = { key, value: String(value), updated_by: actor.email, updated_at: new Date() };
      const existing = await table("settings", trx).where({ key }).first();
      if (existing) await table("settings", trx).where({ key }).update(row);
      else await table("settings", trx).insert(row);
    }
    return;
  }
  throw Object.assign(new Error("Ação não reconhecida."), { status: 400 });
}

app.get("/health", async (_req, res) => {
  try {
    await db.raw("SELECT 1");
    res.json({ ok: true, database: client });
  } catch {
    res.status(503).json({ ok: false, error: "Banco indisponível." });
  }
});

app.use("/api/erp", authorize);

app.get("/api/erp", async (req, res) => {
  try {
    const actor = await ensureActor(req);
    if (req.query.backup === "native") {
      if (!["administrador", "gestor"].includes(actor.role)) {
        return res.status(403).json({ error: "Seu perfil não possui permissão para gerar backup." });
      }
      const parsed = new URL(connection);
      const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
      const stamp = new Date().toISOString().slice(0, 10);
      const commonEnv = { ...process.env };
      let contents;
      let filename;
      let contentType;

      if (client === "mysql2") {
        const args = [
          "--host", parsed.hostname,
          "--port", parsed.port || "3306",
          "--user", decodeURIComponent(parsed.username),
          "--single-transaction",
          "--routines",
          "--triggers",
          "--events",
          "--hex-blob",
          "--set-gtid-purged=OFF",
          "--databases", database,
        ];
        const result = await execFileAsync("mysqldump", args, {
          env: { ...commonEnv, MYSQL_PWD: decodeURIComponent(parsed.password) },
          encoding: "buffer",
          maxBuffer: 1024 * 1024 * 1024,
        });
        contents = result.stdout;
        filename = `backup-stock-erp-${stamp}.sql`;
        contentType = "application/sql; charset=utf-8";
      } else if (client === "pg") {
        const args = [
          "--host", parsed.hostname,
          "--port", parsed.port || "5432",
          "--username", decodeURIComponent(parsed.username),
          "--dbname", database,
          "--format=plain",
          "--clean",
          "--if-exists",
          "--no-owner",
          "--no-privileges",
        ];
        const result = await execFileAsync("pg_dump", args, {
          env: { ...commonEnv, PGPASSWORD: decodeURIComponent(parsed.password) },
          encoding: "buffer",
          maxBuffer: 1024 * 1024 * 1024,
        });
        contents = result.stdout;
        filename = `backup-stock-erp-${stamp}.sql`;
        contentType = "application/sql; charset=utf-8";
      } else {
        const directory = await mkdtemp(resolve(tmpdir(), "stock-erp-backup-"));
        const target = resolve(directory, `backup-stock-erp-${stamp}.bacpac`);
        const adoValue = (value) => `{${String(value).replaceAll("}", "}}")}}`;
        const sourceConnection = [
          `Server=${adoValue(`${parsed.hostname},${parsed.port || "1433"}`)}`,
          `Initial Catalog=${adoValue(database)}`,
          `User ID=${adoValue(decodeURIComponent(parsed.username))}`,
          `Password=${adoValue(decodeURIComponent(parsed.password))}`,
          `Encrypt=${process.env.DB_ENCRYPT !== "false"}`,
          `TrustServerCertificate=${process.env.DB_TRUST_SERVER_CERTIFICATE !== "false"}`,
        ].join(";");
        try {
          await execFileAsync("sqlpackage", [
            "/Action:Export",
            `/SourceConnectionString:${sourceConnection}`,
            `/TargetFile:${target}`,
          ], { maxBuffer: 10 * 1024 * 1024 });
          contents = await readFile(target);
        } finally {
          await rm(directory, { recursive: true, force: true });
        }
        filename = `backup-stock-erp-${stamp}.bacpac`;
        contentType = "application/octet-stream";
      }

      res.set({
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      });
      return res.send(contents);
    }
    res.json(await snapshot(actor));
  } catch (error) {
    const missingTool = error?.code === "ENOENT"
      ? "A ferramenta nativa de backup não está instalada no servidor do conector."
      : "";
    res.status(error.status || 500).json({ error: missingTool || error.message || "Falha ao consultar o banco." });
  }
});

app.post("/api/erp", async (req, res) => {
  try {
    const result = await db.transaction(async (trx) => {
      const actor = await ensureActor(req, trx);
      const action = clean(req.body?.action);
      const payload = req.body?.payload && typeof req.body.payload === "object" ? req.body.payload : {};
      requirePermission(actor, action);
      await executeAction(trx, actor, action, payload);
      return { ok: true, snapshot: await snapshot(actor, trx) };
    });
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Falha ao atualizar o banco." });
  }
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Stock ERP Database Connector ativo na porta ${port}.`);
});

async function shutdown() {
  server.close();
  await db.destroy();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

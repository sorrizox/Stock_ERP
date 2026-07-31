type Role =
  | "administrador"
  | "gestor"
  | "gerente"
  | "operador"
  | "comprador"
  | "vendedor"
  | "separador"
  | "conferente"
  | "expedidor"
  | "financeiro"
  | "auditor";

type Actor = {
  email: string;
  fullName: string;
  role: Role;
  status: string;
  ipAddress: string;
  device: string;
};

type JsonObject = Record<string, unknown>;

declare global {
  var __STOCK_ERP_DB__: D1Database | undefined;
  var __STOCK_ERP_INTEGRATION__:
    | {
        mode: "d1" | "external-api";
        url?: string;
        token?: string;
      }
    | undefined;
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS user_profiles (
    email TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operador',
    status TEXT NOT NULL DEFAULT 'ativo',
    last_access TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    document TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    contact_person TEXT NOT NULL DEFAULT '',
    lead_time_days INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    document TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    client_type TEXT NOT NULL DEFAULT 'empresa',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    sku TEXT NOT NULL UNIQUE,
    barcode TEXT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category_id INTEGER REFERENCES categories(id),
    brand_id INTEGER REFERENCES brands(id),
    supplier_id INTEGER REFERENCES suppliers(id),
    warehouse_id INTEGER REFERENCES warehouses(id),
    location TEXT NOT NULL DEFAULT '',
    unit TEXT NOT NULL DEFAULT 'UN',
    cost REAL NOT NULL DEFAULT 0,
    price REAL NOT NULL DEFAULT 0,
    min_stock REAL NOT NULL DEFAULT 0,
    current_stock REAL NOT NULL DEFAULT 0,
    reserved_stock REAL NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    lot_control INTEGER NOT NULL DEFAULT 0,
    serial_control INTEGER NOT NULL DEFAULT 0,
    expiry_date TEXT,
    image_url TEXT NOT NULL DEFAULT '',
    sale_blocked INTEGER NOT NULL DEFAULT 0,
    purchase_blocked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_uq
    ON products(barcode) WHERE barcode IS NOT NULL AND barcode <> ''`,
  `CREATE TABLE IF NOT EXISTS product_details (
    product_id INTEGER PRIMARY KEY REFERENCES products(id),
    extra_data TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    type TEXT NOT NULL,
    quantity REAL NOT NULL,
    previous_stock REAL NOT NULL,
    new_stock REAL NOT NULL,
    origin TEXT NOT NULL DEFAULT '',
    destination TEXT NOT NULL DEFAULT '',
    reason TEXT NOT NULL DEFAULT '',
    reference TEXT NOT NULL DEFAULT '',
    user_email TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL UNIQUE,
    client_id INTEGER REFERENCES clients(id),
    subtotal REAL NOT NULL,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'aberta',
    payment_method TEXT NOT NULL DEFAULT 'informativo',
    seller_email TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL REFERENCES sales(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL UNIQUE,
    supplier_id INTEGER REFERENCES suppliers(id),
    document TEXT NOT NULL DEFAULT '',
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'recebida',
    responsible_email TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity REAL NOT NULL,
    unit_cost REAL NOT NULL,
    total REAL NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS inventories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pendente',
    counter_email TEXT NOT NULL,
    approver_email TEXT,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_id INTEGER NOT NULL REFERENCES inventories(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    expected_stock REAL NOT NULL,
    counted_stock REAL NOT NULL,
    difference REAL NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL REFERENCES sales(id),
    carrier TEXT NOT NULL,
    tracking_code TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'expedido',
    responsible_email TEXT NOT NULL,
    occurrence TEXT NOT NULL DEFAULT '',
    shipped_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS workflow_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module TEXT NOT NULL,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    record_type TEXT NOT NULL DEFAULT 'registro',
    product_id INTEGER REFERENCES products(id),
    quantity REAL NOT NULL DEFAULT 0,
    origin TEXT NOT NULL DEFAULT '',
    destination TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pendente',
    priority TEXT NOT NULL DEFAULT 'normal',
    responsible_email TEXT NOT NULL DEFAULT '',
    due_at TEXT,
    amount REAL NOT NULL DEFAULT 0,
    reference TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module, code)
  )`,
  `CREATE TABLE IF NOT EXISTS status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    previous_status TEXT NOT NULL DEFAULT '',
    new_status TEXT NOT NULL,
    observation TEXT NOT NULL DEFAULT '',
    user_email TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    record_id TEXT NOT NULL DEFAULT '',
    old_value TEXT NOT NULL DEFAULT '',
    new_value TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL,
    origin TEXT NOT NULL DEFAULT '',
    destination TEXT NOT NULL DEFAULT '',
    reason TEXT NOT NULL DEFAULT '',
    ip_address TEXT NOT NULL DEFAULT '',
    device TEXT NOT NULL DEFAULT '',
    endpoint TEXT NOT NULL DEFAULT '/api/erp',
    result TEXT NOT NULL DEFAULT 'sucesso',
    document_reference TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_by TEXT NOT NULL DEFAULT 'sistema',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS movements_product_idx ON movements(product_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS audit_module_idx ON audit_logs(module, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS sales_status_idx ON sales(status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS workflow_module_status_idx
    ON workflow_records(module, status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS status_history_entity_idx
    ON status_history(entity_type, entity_id, created_at DESC)`,
];

let schemaReady: Promise<void> | null = null;

function db() {
  if (!globalThis.__STOCK_ERP_DB__) {
    throw new Error("A base de dados do Stock ERP não está disponível.");
  }
  return globalThis.__STOCK_ERP_DB__;
}

function integrationConfig() {
  const runtime = globalThis.__STOCK_ERP_INTEGRATION__;
  const mode =
    runtime?.mode ??
    (process.env.ERP_DATA_SOURCE === "external-api" ? "external-api" : "d1");
  return {
    mode,
    url: runtime?.url ?? process.env.EXTERNAL_ERP_API_URL,
    token: runtime?.token ?? process.env.EXTERNAL_ERP_API_TOKEN,
  };
}

async function proxyExternal(request: Request) {
  const config = integrationConfig();
  if (config.mode !== "external-api") return null;
  if (!config.url) {
    return Response.json(
      {
        error:
          "A integração externa está ativada, mas EXTERNAL_ERP_API_URL não foi configurada.",
      },
      { status: 503 },
    );
  }

  try {
    const requestUrl = new URL(request.url);
    const externalUrl = new URL(config.url);
    externalUrl.search = requestUrl.search;
    const isBackup = requestUrl.searchParams.get("backup") === "native";
    const headers = new Headers({
      accept: isBackup ? "application/octet-stream" : "application/json",
      "content-type": "application/json",
      "x-stock-erp-source": "stock-erp-site",
    });
    if (config.token) headers.set("authorization", `Bearer ${config.token}`);

    const email = request.headers.get("x-stock-user-email");
    const fullName = request.headers.get("x-stock-user-name");
    const fullNameEncoding = request.headers.get("x-stock-user-name-encoding");
    if (email) headers.set("x-stock-erp-user-email", email);
    if (fullName) headers.set("x-stock-erp-user-full-name", fullName);
    if (fullNameEncoding) {
      headers.set("x-stock-erp-user-full-name-encoding", fullNameEncoding);
    }

    const response = await fetch(externalUrl, {
      method: request.method,
      headers,
      body: request.method === "POST" ? await request.text() : undefined,
      signal: AbortSignal.timeout(isBackup ? 300_000 : 20_000),
    });
    if (isBackup) {
      const responseHeaders = new Headers();
      for (const name of ["content-type", "content-disposition", "content-length"]) {
        const value = response.headers.get(name);
        if (value) responseHeaders.set(name, value);
      }
      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return Response.json(
        {
          error:
            "O conector do banco respondeu em um formato inválido. Era esperado JSON.",
        },
        { status: 502 },
      );
    }

    const result = (await response.json()) as JsonObject;
    const source = {
      mode: "external-api",
      label: "Banco existente",
      status: response.ok ? "connected" : "error",
    };
    if (request.method === "GET" && response.ok) {
      result.dataSource = source;
    } else if (
      request.method === "POST" &&
      response.ok &&
      result.snapshot &&
      typeof result.snapshot === "object"
    ) {
      (result.snapshot as JsonObject).dataSource = source;
    }
    return Response.json(result, { status: response.status });
  } catch (error) {
    const detail =
      error instanceof Error && error.name === "TimeoutError"
        ? "Tempo limite excedido."
        : "Não foi possível alcançar o conector.";
    return Response.json(
      {
        error: `Falha ao conectar ao banco existente. ${detail}`,
      },
      { status: 502 },
    );
  }
}

function sqlIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function sqlLiteral(value: unknown) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }
  if (typeof value === "boolean") return value ? "1" : "0";
  if (value instanceof ArrayBuffer) {
    return `X'${Array.from(new Uint8Array(value), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("")}'`;
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function createD1Backup() {
  const schema = await db()
    .prepare(
      `SELECT type, name, tbl_name, sql
       FROM sqlite_master
       WHERE sql IS NOT NULL
         AND name NOT LIKE 'sqlite_%'
         AND type IN ('table', 'index', 'trigger', 'view')
       ORDER BY CASE type WHEN 'table' THEN 0 WHEN 'view' THEN 1 ELSE 2 END, name`,
    )
    .all<{ type: string; name: string; tbl_name: string; sql: string }>();
  const entries = schema.results ?? [];
  const tables = entries.filter((entry) => entry.type === "table");
  const lines = [
    "-- Stock ERP - backup completo do Cloudflare D1 / SQLite",
    `-- Gerado em ${new Date().toISOString()}`,
    "PRAGMA foreign_keys=OFF;",
    "BEGIN TRANSACTION;",
    "",
  ];

  for (const entry of entries) {
    if (entry.type === "table") lines.push(`${entry.sql};`, "");
  }
  for (const entry of tables) {
    const result = await db()
      .prepare(`SELECT * FROM ${sqlIdentifier(entry.name)}`)
      .all<Record<string, unknown>>();
    for (const row of result.results ?? []) {
      const columns = Object.keys(row);
      lines.push(
        `INSERT INTO ${sqlIdentifier(entry.name)} (${columns
          .map(sqlIdentifier)
          .join(", ")}) VALUES (${columns.map((column) => sqlLiteral(row[column])).join(", ")});`,
      );
    }
    if ((result.results?.length ?? 0) > 0) lines.push("");
  }
  for (const entry of entries) {
    if (entry.type !== "table") lines.push(`${entry.sql};`, "");
  }
  lines.push("COMMIT;", "PRAGMA foreign_keys=ON;", "");
  return lines.join("\n");
}

function backupFilename(extension: string) {
  return `backup-stock-erp-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

function backupResponse(body: string | ArrayBuffer, extension: string, type: string) {
  return new Response(body, {
    headers: {
      "content-type": type,
      "content-disposition": `attachment; filename="${backupFilename(extension)}"`,
      "cache-control": "no-store",
    },
  });
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = db()
      .batch(schemaStatements.map((statement) => db().prepare(statement)))
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  return schemaReady;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalId(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolValue(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function json(value: unknown) {
  return JSON.stringify(value ?? {});
}

const productExtraKeys = [
  "short_description", "full_description", "subcategory", "manufacturer",
  "model", "product_type", "average_cost", "last_purchase_cost",
  "minimum_price", "maximum_discount", "commission", "promotion",
  "price_table", "blocked_stock", "transit_stock", "maximum_stock",
  "reorder_point", "ideal_purchase_quantity", "allow_negative", "grade",
  "lead_time_days", "abc_class", "weight", "height", "width", "length",
  "volume", "units_per_box", "units_per_package", "package_type", "ncm",
  "cest", "fiscal_origin", "default_cfop", "taxation",
] as const;

function productExtraData(payload: JsonObject) {
  return Object.fromEntries(
    productExtraKeys.filter((key) => key in payload).map((key) => [key, payload[key]]),
  );
}

function actionNumber(prefix: string) {
  const stamp = Date.now().toString();
  return `${prefix}-${stamp.slice(-8)}`;
}

function safeDecode(value: string | null, encoding: string | null) {
  if (!value || encoding !== "percent-encoded-utf-8") return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

async function actorFromRequest(request: Request): Promise<Actor> {
  const emailHeader = request.headers.get("x-stock-user-email");
  const email = emailHeader ?? process.env.STOCK_ERP_DEFAULT_USER ?? "admin@stockerp.local";
  if (!email) throw new Response("Não autenticado", { status: 401 });
  const ipAddress =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "";
  const device = (request.headers.get("user-agent") ?? "não informado").slice(0, 240);

  const fullName =
    safeDecode(
      request.headers.get("x-stock-user-name"),
      request.headers.get("x-stock-user-name-encoding"),
    ) ?? process.env.STOCK_ERP_DEFAULT_NAME ?? "Administrador Stock ERP";

  const existing = await db()
    .prepare(
      "SELECT email, full_name AS fullName, role, status FROM user_profiles WHERE email = ?",
    )
    .bind(email)
    .first<Omit<Actor, "ipAddress" | "device">>();

  if (!existing) {
    const count = await db()
      .prepare("SELECT COUNT(*) AS total FROM user_profiles")
      .first<{ total: number }>();
    const role: Role = Number(count?.total ?? 0) === 0 ? "administrador" : "operador";
    await db()
      .prepare(
        `INSERT INTO user_profiles (email, full_name, role, status, last_access)
         VALUES (?, ?, ?, 'ativo', CURRENT_TIMESTAMP)`,
      )
      .bind(email, fullName, role)
      .run();
    return { email, fullName, role, status: "ativo", ipAddress, device };
  }

  if (existing.status !== "ativo") {
    throw new Response("Usuário inativo", { status: 403 });
  }

  await db()
    .prepare(
      "UPDATE user_profiles SET last_access = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE email = ?",
    )
    .bind(email)
    .run();

  return { ...existing, ipAddress, device };
}

const actionRoles: Record<string, Role[]> = {
  save_product: ["administrador", "gestor", "gerente"],
  toggle_product: ["administrador", "gestor", "gerente"],
  create_movement: ["administrador", "gestor", "gerente", "operador"],
  create_sale: ["administrador", "gestor", "gerente", "vendedor"],
  cancel_sale: ["administrador", "gestor", "gerente"],
  create_purchase: ["administrador", "gestor", "gerente", "comprador"],
  update_order_status: ["administrador", "gestor", "gerente", "operador", "separador", "conferente", "expedidor"],
  create_inventory: ["administrador", "gestor", "gerente", "operador", "auditor"],
  apply_inventory: ["administrador", "gestor", "gerente"],
  save_entity: ["administrador", "gestor", "gerente", "comprador"],
  toggle_entity: ["administrador", "gestor", "gerente"],
  save_user: ["administrador"],
  save_settings: ["administrador"],
  save_workflow_record: ["administrador", "gestor", "gerente", "operador", "comprador", "vendedor", "separador", "conferente", "expedidor", "financeiro", "auditor"],
  update_workflow_status: ["administrador", "gestor", "gerente", "operador", "comprador", "separador", "conferente", "expedidor", "financeiro", "auditor"],
  bulk_import_products: ["administrador", "gestor", "gerente", "comprador"],
};

function requireAction(actor: Actor, action: string) {
  const allowed = actionRoles[action];
  if (!allowed || !allowed.includes(actor.role)) {
    throw new Response("Seu perfil não possui permissão para esta ação.", {
      status: 403,
    });
  }
}

function auditStatement(
  actor: Actor,
  action: string,
  module: string,
  recordId: string | number,
  description: string,
  oldValue: unknown = {},
  newValue: unknown = {},
) {
  const context =
    newValue && typeof newValue === "object"
      ? (newValue as Record<string, unknown>)
      : {};
  return db()
    .prepare(
      `INSERT INTO audit_logs
       (user_email, action, module, record_id, old_value, new_value, description,
        origin, destination, reason, ip_address, device, endpoint, result,
        document_reference)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '/api/erp', 'sucesso', ?)`,
    )
    .bind(
      actor.email,
      action,
      module,
      String(recordId),
      json(oldValue),
      json(newValue),
      description,
      text(context.origin),
      text(context.destination),
      text(context.reason),
      actor.ipAddress,
      actor.device,
      text(context.reference) || text(context.document),
    );
}

async function seedIfEmpty(actor: Actor) {
  const row = await db()
    .prepare("SELECT COUNT(*) AS total FROM products")
    .first<{ total: number }>();
  if (Number(row?.total ?? 0) > 0) return;

  const statements = [
    db().prepare(
      `INSERT OR IGNORE INTO settings (key, value, updated_by) VALUES
       ('company_name', 'Stock ERP', 'sistema'),
       ('default_min_stock', '10', 'sistema'),
       ('allow_negative_stock', 'false', 'sistema'),
       ('max_discount_percent', '10', 'sistema'),
       ('expiry_alert_days', '30', 'sistema')`,
    ),
    db().prepare(
      `INSERT OR IGNORE INTO categories (id, name, description) VALUES
       (1, 'Ferragens', 'Parafusos, porcas e fixadores'),
       (2, 'Ferramentas', 'Ferramentas elétricas e manuais'),
       (3, 'EPI', 'Equipamentos de proteção individual')`,
    ),
    db().prepare(
      `INSERT OR IGNORE INTO brands (id, name, description) VALUES
       (1, 'Vonder', 'Ferramentas e ferragens'),
       (2, 'Bosch', 'Ferramentas profissionais'),
       (3, '3M', 'Proteção e segurança')`,
    ),
    db().prepare(
      `INSERT OR IGNORE INTO suppliers
       (id, name, document, phone, email, address, contact_person, lead_time_days)
       VALUES
       (1, 'Distribuidora Mogiana Ltda.', '12.345.678/0001-90', '(19) 3861-2000', 'compras@mogiana.example', 'Mogi Guaçu - SP', 'Ana Souza', 4),
       (2, 'Ferramentas Campinas S.A.', '98.765.432/0001-10', '(19) 3232-4400', 'vendas@ferramentascampinas.example', 'Campinas - SP', 'Carlos Lima', 6)`,
    ),
    db().prepare(
      `INSERT OR IGNORE INTO clients
       (id, name, document, phone, email, address, client_type)
       VALUES
       (1, 'Construtora Horizonte', '45.111.222/0001-70', '(19) 3521-1180', 'compras@horizonte.example', 'Mogi Mirim - SP', 'empresa'),
       (2, 'Marcos Oliveira', '123.456.789-09', '(19) 99121-8877', 'marcos@example.com', 'Mogi Guaçu - SP', 'pessoa')`,
    ),
    db().prepare(
      `INSERT OR IGNORE INTO warehouses
       (id, name, code, address, description)
       VALUES
       (1, 'Armazém Principal', 'ARM-01', 'Mogi Guaçu - SP', 'Estoque de venda e expedição'),
       (2, 'Depósito de Reserva', 'ARM-02', 'Mogi Guaçu - SP', 'Estoque de segurança')`,
    ),
    db().prepare(
      `INSERT OR IGNORE INTO products
       (id, code, sku, barcode, name, description, category_id, brand_id, supplier_id, warehouse_id, location, unit, cost, price, min_stock, current_stock)
       VALUES
       (1, '0001', 'PAR-008', '7891000000011', 'Parafuso Sextavado 8 mm', 'Parafuso zincado para uso geral', 1, 1, 1, 1, 'A-01', 'UN', 0.78, 1.90, 20, 84),
       (2, '0002', 'FER-650', '7891000000028', 'Furadeira de Impacto 650 W', 'Furadeira profissional com maleta', 2, 2, 2, 1, 'B-03', 'UN', 270, 389.90, 10, 8),
       (3, '0003', 'EPI-014', '7891000000035', 'Luva de Proteção Nitrílica', 'Luva reutilizável tamanho G', 3, 3, 1, 1, 'C-02', 'PAR', 9.40, 18.50, 15, 3),
       (4, '0004', 'FER-210', '7891000000042', 'Jogo de Chaves 21 peças', 'Kit de chaves com estojo', 2, 1, 2, 1, 'B-04', 'UN', 82, 139.90, 8, 32),
       (5, '0005', 'EPI-021', '7891000000059', 'Óculos de Segurança Incolor', 'Proteção ocular com tratamento antirrisco', 3, 3, 1, 1, 'C-01', 'UN', 8.20, 16.90, 12, 46)`,
    ),
    db().prepare(
      `INSERT INTO movements
       (product_id, type, quantity, previous_stock, new_stock, origin, destination, reason, reference, user_email, created_at)
       VALUES
       (1, 'entrada', 40, 44, 84, 'Fornecedor', 'Armazém Principal', 'Recebimento de compra', 'CMP-1001', ?, datetime('now', '-20 minutes')),
       (2, 'venda', -1, 9, 8, 'Armazém Principal', 'Cliente', 'Venda finalizada', 'VEN-1008', ?, datetime('now', '-42 minutes')),
       (3, 'ajuste', -2, 5, 3, 'Armazém Principal', 'Armazém Principal', 'Divergência de contagem', 'AJU-021', ?, datetime('now', '-1 day'))`,
    ).bind(actor.email, actor.email, actor.email),
    auditStatement(
      actor,
      "SEED",
      "sistema",
      "demo",
      "Dados iniciais de apresentação preparados.",
    ),
  ];
  await db().batch(statements);
}

const workflowModules = new Set([
  "catalogs", "locations", "reservations", "receiving", "conference",
  "packaging", "transfers", "traceability", "kits", "returns", "losses",
  "production", "finance", "approvals", "integrations", "import_export",
  "labels", "notifications", "security", "planning",
]);

async function seedEnterpriseIfEmpty() {
  await db()
    .prepare(
      `INSERT OR IGNORE INTO settings (key, value, updated_by) VALUES
       ('company_document', '', 'sistema'),
       ('document_prefix', 'STK', 'sistema'),
       ('cost_method', 'medio', 'sistema'),
       ('purchase_approval_limit', '3000', 'sistema'),
       ('reservation_expiry_hours', '48', 'sistema'),
       ('picking_strategy', 'FIFO', 'sistema'),
       ('blind_inventory', 'true', 'sistema'),
       ('notification_email', '', 'sistema'),
       ('backup_retention_days', '30', 'sistema'),
       ('session_timeout_minutes', '60', 'sistema')`,
    )
    .run();
  const row = await db()
    .prepare("SELECT COUNT(*) AS total FROM workflow_records")
    .first<{ total: number }>();
  if (Number(row?.total ?? 0) > 0) return;
  await db()
    .prepare(
      `INSERT OR IGNORE INTO workflow_records
       (module, code, title, record_type, product_id, quantity, origin,
        destination, status, priority, responsible_email, due_at, amount,
        reference, notes, metadata_json, created_by)
       VALUES
       ('catalogs','CAD-UN-01','Unidade de medida — Unidade','unidade',NULL,0,'','','ativo','normal','cadastro@stockerp.local',NULL,0,'UN','Cadastro com histórico.','{"simbolo":"UN","categoria":"unidade"}','sistema'),
       ('locations','LOC-A010203','Rua A · Coluna 01 · Nível 02 · Posição 03','posicao',1,84,'Armazém Principal','Setor Ferragens','ativo','normal','estoque@stockerp.local',NULL,0,'QR-LOC-A010203','Posição controlada.','{"capacidade_maxima":250,"peso_maximo":180,"capacidade_utilizada":34}','sistema'),
       ('reservations','RES-1001','Reserva do pedido VEN-1012','reserva',2,2,'Armazém Principal','Separação','ativa','normal','separacao@stockerp.local',datetime('now','+2 days'),0,'VEN-1012','Expiração automática.','{"disponivel_antes":8,"prazo_horas":48}','sistema'),
       ('receiving','REC-2001','Recebimento parcial CMP-2048','recebimento',2,10,'Fornecedor','Armazém Principal','aguardando_conferencia','alta','compras@stockerp.local',datetime('now','+1 day'),2700,'NF-2048','Conferir lote e preço.','{"solicitada":12,"enviada":10,"recebida":10,"aprovada":0,"recusada":0}','sistema'),
       ('conference','CNF-3001','Conferência cega VEN-1012','conferencia',1,12,'Separação','Embalagem','pendente','alta','conferencia@stockerp.local',datetime('now','+6 hours'),0,'VEN-1012','Nova leitura obrigatória.','{"esperado":12,"lido":0,"peso_esperado":4.8}','sistema'),
       ('packaging','VOL-4001','Volume 1/2 do pedido VEN-1012','volume',1,12,'Embalagem','Doca 01','aberto','normal','expedicao@stockerp.local',datetime('now','+8 hours'),0,'VEN-1012','Foto e lacre obrigatórios.','{"peso_real":4.7,"peso_cubado":5.2,"dimensoes":"42x31x24 cm","lacre":"LAC-9088"}','sistema'),
       ('transfers','TRF-5001','Reposição do depósito de reserva','deposito',4,5,'Armazém Principal / B-04','Depósito de Reserva / R-02','em_transito','normal','estoque@stockerp.local',datetime('now','+1 day'),410,'TRF-5001','Conferência no destino.','{"enviada":5,"recebida":0,"aprovador":"Gerente"}','sistema'),
       ('traceability','LOT-6001','Lote EPI-2607-A','lote',3,30,'Fornecedor','Armazém Principal / C-02','ativo','normal','qualidade@stockerp.local',date('now','+180 days'),282,'NF-8871','Saída por FEFO.','{"fabricacao":"2026-07-01","validade":"2027-01-24","bloqueado":false,"serie_inicial":"EPI26070001"}','sistema'),
       ('kits','KIT-7001','Kit escritório essencial','kit',NULL,1,'Componentes','Produto comercial','ativo','normal','produtos@stockerp.local',NULL,0,'KIT-ESC-01','Baixa automática.','{"componentes":"2 Canetas; 1 Caderno; 1 Grampeador","custo":24.8}','sistema'),
       ('returns','DEV-8001','Devolução por avaria VEN-1008','devolucao_cliente',2,1,'Cliente','Quarentena','em_analise','alta','qualidade@stockerp.local',datetime('now','+1 day'),389.9,'VEN-1008','Sem retorno ao saldo disponível.','{"motivo":"Avaria no transporte","destino":"Assistência técnica","fotos":2}','sistema'),
       ('losses','PER-9001','Perda por embalagem danificada','avaria',3,2,'C-02','Quarentena','aguardando_aprovacao','alta','gestor@stockerp.local',datetime('now','+1 day'),18.8,'PER-9001','Descarte após aprovação.','{"motivo":"Umidade","forma_descarte":"Coleta especializada","imagens":3}','sistema'),
       ('production','OP-10001','Montagem de kits de manutenção','ordem_producao',4,20,'Matéria-prima','Produto acabado','planejada','normal','producao@stockerp.local',date('now','+5 days'),1640,'OP-10001','Separar materiais.','{"consumo_previsto":60,"perdas_previstas":2,"etapas":4,"qualidade":"pendente"}','sistema'),
       ('finance','FIN-11001','Pagamento fornecedor NF-2048','conta_pagar',NULL,1,'Compras','Contas a pagar','pendente','normal','financeiro@stockerp.local',date('now','+10 days'),2700,'NF-2048','Centro de custo Estoque.','{"parcelas":1,"forma_pagamento":"PIX","conciliado":false}','sistema'),
       ('approvals','APR-12001','Compra acima da alçada','compra',NULL,1,'Comprador','Gerente','pendente','alta','gerencia@stockerp.local',datetime('now','+12 hours'),4500,'CMP-2091','Impacto no caixa: 8%.','{"motivo":"Reposição preventiva","impacto_estoque":"+120 unidades","alcada":"Gerência"}','sistema'),
       ('integrations','INT-13001','Marketplace principal','marketplace',NULL,0,'Stock ERP','Loja virtual','conectado','normal','integracoes@stockerp.local',NULL,0,'MKP-01','Sincronização a cada 15 min.','{"ultima_execucao":"há 4 minutos","tentativas":1,"falhas":0,"webhook":"ativo"}','sistema'),
       ('import_export','IMP-17001','Importação de produtos julho/2026','importacao',NULL,42,'CSV validado','Catálogo','validado','normal','cadastro@stockerp.local',NULL,0,'produtos-julho.csv','Uma linha rejeitada.','{"linhas":42,"aceitas":41,"rejeitadas":1,"erro":"SKU duplicado na linha 18"}','sistema'),
       ('labels','ETQ-18001','Etiquetas de localização A-01','produto',1,50,'Cadastro','Impressora','pronto','normal','estoque@stockerp.local',NULL,0,'7891000000011','Modelo com SKU, barras e QR.','{"formato":"100x50 mm","copias":50}','sistema'),
       ('notifications','ALT-14001','Produto abaixo do estoque mínimo','estoque_minimo',2,2,'Dashboard','Gestor','aberta','critica','gestor@stockerp.local',datetime('now','+4 hours'),0,'FER-650','Compra sugerida.','{"saldo":8,"minimo":10,"sugestao_compra":12,"canal":"sistema"}','sistema'),
       ('security','SEG-15001','Política de acesso e sessão','politica',NULL,0,'Administração','Todos os usuários','ativo','alta','seguranca@stockerp.local',NULL,0,'POL-SEG-01','Identidade protegida pela plataforma.','{"sessao_expira":true,"limite_tentativas":5,"mfa_recomendado":true,"tls":true,"segregacao_empresa":true}','sistema'),
       ('planning','REP-16001','Sugestão automática de reposição','reposicao',2,12,'Fornecedor','Armazém Principal','sugerida','alta','compras@stockerp.local',date('now','+3 days'),3240,'FER-650','Baseada em mínimo, giro e prazo.','{"cobertura_dias":6,"lead_time_dias":6,"curva_abc":"A","demanda_prevista":18}','sistema')`,
    )
    .run();
}

async function getSnapshot(actor: Actor) {
  const queries = await db().batch([
    db().prepare(
      `SELECT p.*, pd.extra_data, c.name AS category_name, b.name AS brand_name,
              s.name AS supplier_name, w.name AS warehouse_name
       FROM products p
       LEFT JOIN product_details pd ON pd.product_id = p.id
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       LEFT JOIN warehouses w ON w.id = p.warehouse_id
       ORDER BY p.active DESC, p.name`,
    ),
    db().prepare(
      `SELECT m.*, p.name AS product_name, p.sku AS product_sku
       FROM movements m JOIN products p ON p.id = m.product_id
       ORDER BY m.created_at DESC, m.id DESC LIMIT 150`,
    ),
    db().prepare(
      `SELECT s.*, c.name AS client_name,
              COUNT(si.id) AS item_count
       FROM sales s
       LEFT JOIN clients c ON c.id = s.client_id
       LEFT JOIN sale_items si ON si.sale_id = s.id
       GROUP BY s.id ORDER BY s.created_at DESC, s.id DESC LIMIT 100`,
    ),
    db().prepare(
      `SELECT p.*, s.name AS supplier_name,
              COUNT(pi.id) AS item_count
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       LEFT JOIN purchase_items pi ON pi.purchase_id = p.id
       GROUP BY p.id ORDER BY p.created_at DESC, p.id DESC LIMIT 100`,
    ),
    db().prepare(
      `SELECT i.*, ii.product_id, ii.expected_stock, ii.counted_stock,
              ii.difference, p.name AS product_name, p.sku AS product_sku
       FROM inventories i
       JOIN inventory_items ii ON ii.inventory_id = i.id
       JOIN products p ON p.id = ii.product_id
       ORDER BY i.created_at DESC, i.id DESC LIMIT 100`,
    ),
    db().prepare(
      `SELECT sh.*, s.number AS sale_number, c.name AS client_name
       FROM shipments sh
       JOIN sales s ON s.id = sh.sale_id
       LEFT JOIN clients c ON c.id = s.client_id
       ORDER BY sh.shipped_at DESC, sh.id DESC LIMIT 100`,
    ),
    db().prepare("SELECT * FROM categories ORDER BY active DESC, name"),
    db().prepare("SELECT * FROM brands ORDER BY active DESC, name"),
    db().prepare("SELECT * FROM suppliers ORDER BY active DESC, name"),
    db().prepare("SELECT * FROM clients ORDER BY active DESC, name"),
    db().prepare("SELECT * FROM warehouses ORDER BY active DESC, name"),
    db().prepare(
      "SELECT email, full_name, role, status, last_access, created_at FROM user_profiles ORDER BY status DESC, full_name",
    ),
    db().prepare(
      "SELECT * FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT 150",
    ),
    db().prepare("SELECT key, value FROM settings ORDER BY key"),
    db().prepare(
      `SELECT wr.*, p.name AS product_name, p.sku AS product_sku
       FROM workflow_records wr
       LEFT JOIN products p ON p.id = wr.product_id
       ORDER BY wr.updated_at DESC, wr.id DESC LIMIT 500`,
    ),
    db().prepare(
      "SELECT * FROM status_history ORDER BY created_at DESC, id DESC LIMIT 300",
    ),
  ]);

  const results = queries.map((result) => result.results ?? []);
  const settingsMap = Object.fromEntries(
    (results[13] as Array<{ key: string; value: string }>).map((item) => [
      item.key,
      item.value,
    ]),
  );

  return {
    profile: actor,
    products: results[0],
    movements: results[1],
    sales: results[2],
    purchases: results[3],
    inventories: results[4],
    shipments: results[5],
    categories: results[6],
    brands: results[7],
    suppliers: results[8],
    clients: results[9],
    warehouses: results[10],
    users: results[11],
    audit: results[12],
    settings: settingsMap,
    workflows: results[14],
    statusHistory: results[15],
    dataSource: {
      mode: "d1",
      label: "Banco interno",
      status: "connected",
    },
  };
}

async function saveProduct(actor: Actor, payload: JsonObject) {
  const id = optionalId(payload.id);
  const name = text(payload.name);
  const code = text(payload.code);
  const sku = text(payload.sku);
  const barcode = text(payload.barcode) || null;
  const unit = text(payload.unit) || "UN";
  const cost = numberValue(payload.cost);
  const price = numberValue(payload.price);
  const minStock = numberValue(payload.min_stock);
  const currentStock = numberValue(payload.current_stock);
  const extraData = json(productExtraData(payload));
  if (!name || !code || !sku) {
    throw new Response("Nome, código interno e SKU são obrigatórios.", {
      status: 400,
    });
  }
  if (cost < 0 || price < 0 || minStock < 0 || currentStock < 0) {
    throw new Response("Preços e quantidades não podem ser negativos.", {
      status: 400,
    });
  }

  const duplicate = await db()
    .prepare(
      `SELECT id FROM products
       WHERE (code = ? OR sku = ? OR (? IS NOT NULL AND barcode = ?))
       AND (? IS NULL OR id <> ?) LIMIT 1`,
    )
    .bind(code, sku, barcode, barcode, id, id)
    .first<{ id: number }>();
  if (duplicate) {
    throw new Response("Já existe um produto com o mesmo código, SKU ou código de barras.", {
      status: 409,
    });
  }

  const values = [
    code,
    sku,
    barcode,
    name,
    text(payload.description),
    optionalId(payload.category_id),
    optionalId(payload.brand_id),
    optionalId(payload.supplier_id),
    optionalId(payload.warehouse_id),
    text(payload.location),
    unit,
    cost,
    price,
    minStock,
    boolValue(payload.active) ? 1 : 0,
    boolValue(payload.lot_control) ? 1 : 0,
    boolValue(payload.serial_control) ? 1 : 0,
    text(payload.expiry_date) || null,
    text(payload.image_url),
    boolValue(payload.sale_blocked) ? 1 : 0,
    boolValue(payload.purchase_blocked) ? 1 : 0,
  ];

  if (id) {
    const before = await db()
      .prepare("SELECT * FROM products WHERE id = ?")
      .bind(id)
      .first();
    if (!before) throw new Response("Produto não encontrado.", { status: 404 });
    await db().batch([
      db()
        .prepare(
          `UPDATE products SET
           code=?, sku=?, barcode=?, name=?, description=?, category_id=?,
           brand_id=?, supplier_id=?, warehouse_id=?, location=?, unit=?,
           cost=?, price=?, min_stock=?, active=?, lot_control=?,
           serial_control=?, expiry_date=?, image_url=?, sale_blocked=?,
           purchase_blocked=?, updated_at=CURRENT_TIMESTAMP
           WHERE id=?`,
        )
        .bind(...values, id),
      db()
        .prepare(
          `INSERT INTO product_details (product_id, extra_data, updated_at)
           VALUES (?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(product_id) DO UPDATE SET
             extra_data=excluded.extra_data, updated_at=CURRENT_TIMESTAMP`,
        )
        .bind(id, extraData),
      auditStatement(
        actor,
        "UPDATE",
        "produtos",
        id,
        `Produto ${name} atualizado.`,
        before,
        payload,
      ),
    ]);
    return;
  }

  const inserted = await db()
    .prepare(
      `INSERT INTO products
       (code, sku, barcode, name, description, category_id, brand_id,
        supplier_id, warehouse_id, location, unit, cost, price, min_stock,
        current_stock, active, lot_control, serial_control, expiry_date,
        image_url, sale_blocked, purchase_blocked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(...values.slice(0, 14), currentStock, ...values.slice(14))
    .run();
  const productId = Number(inserted.meta.last_row_id);
  const statements = [
    db()
      .prepare("INSERT INTO product_details (product_id, extra_data) VALUES (?, ?)")
      .bind(productId, extraData),
    auditStatement(
      actor,
      "CREATE",
      "produtos",
      productId,
      `Produto ${name} cadastrado.`,
      {},
      payload,
    ),
  ];
  if (currentStock > 0) {
    statements.unshift(
      db()
        .prepare(
          `INSERT INTO movements
           (product_id, type, quantity, previous_stock, new_stock, origin,
            destination, reason, reference, user_email)
           VALUES (?, 'entrada', ?, 0, ?, 'Cadastro', ?, 'Estoque inicial', ?, ?)`,
        )
        .bind(
          productId,
          currentStock,
          currentStock,
          text(payload.location),
          `CAD-${productId}`,
          actor.email,
        ),
    );
  }
  await db().batch(statements);
}

async function toggleProduct(actor: Actor, payload: JsonObject) {
  const id = optionalId(payload.id);
  if (!id) throw new Response("Produto inválido.", { status: 400 });
  const before = await db()
    .prepare("SELECT id, name, active FROM products WHERE id = ?")
    .bind(id)
    .first<{ id: number; name: string; active: number }>();
  if (!before) throw new Response("Produto não encontrado.", { status: 404 });
  const active = before.active ? 0 : 1;
  await db().batch([
    db()
      .prepare(
        "UPDATE products SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      )
      .bind(active, id),
    auditStatement(
      actor,
      active ? "REACTIVATE" : "INACTIVATE",
      "produtos",
      id,
      `Produto ${before.name} ${active ? "reativado" : "inativado"}.`,
      before,
      { active },
    ),
  ]);
}

async function createMovement(actor: Actor, payload: JsonObject) {
  const productId = optionalId(payload.product_id);
  const type = text(payload.type);
  const reason = text(payload.reason);
  const quantity = Math.abs(numberValue(payload.quantity));
  const targetStock = numberValue(payload.new_stock, Number.NaN);
  if (!productId || !["entrada", "saida", "ajuste", "transferencia"].includes(type)) {
    throw new Response("Produto e tipo de movimentação são obrigatórios.", {
      status: 400,
    });
  }
  if (type === "ajuste" && !reason) {
    throw new Response("A justificativa é obrigatória para ajustes.", {
      status: 400,
    });
  }
  if (type !== "ajuste" && type !== "transferencia" && quantity <= 0) {
    throw new Response("Informe uma quantidade maior que zero.", { status: 400 });
  }
  if (type === "transferencia" && (!text(payload.origin) || !text(payload.destination))) {
    throw new Response("Origem e destino são obrigatórios na transferência.", {
      status: 400,
    });
  }

  const product = await db()
    .prepare(
      "SELECT id, name, current_stock, active FROM products WHERE id = ?",
    )
    .bind(productId)
    .first<{ id: number; name: string; current_stock: number; active: number }>();
  if (!product || !product.active) {
    throw new Response("O produto está inativo ou não foi encontrado.", {
      status: 400,
    });
  }

  const previous = Number(product.current_stock);
  let next = previous;
  let signedQuantity = quantity;
  if (type === "entrada") next = previous + quantity;
  if (type === "saida") {
    next = previous - quantity;
    signedQuantity = -quantity;
  }
  if (type === "ajuste") {
    if (!Number.isFinite(targetStock) || targetStock < 0) {
      throw new Response("Informe o novo saldo do produto.", { status: 400 });
    }
    next = targetStock;
    signedQuantity = next - previous;
  }

  const negativeSetting = await db()
    .prepare("SELECT value FROM settings WHERE key = 'allow_negative_stock'")
    .first<{ value: string }>();
  if (next < 0 && negativeSetting?.value !== "true") {
    throw new Response(
      `Saldo insuficiente. ${product.name} possui ${previous} unidade(s) disponível(is).`,
      { status: 409 },
    );
  }

  const statements = [];
  if (type !== "transferencia") {
    statements.push(
      db()
        .prepare(
          "UPDATE products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        )
        .bind(next, productId),
    );
  }
  statements.push(
    db()
      .prepare(
        `INSERT INTO movements
         (product_id, type, quantity, previous_stock, new_stock, origin,
          destination, reason, reference, user_email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        productId,
        type,
        signedQuantity,
        previous,
        next,
        text(payload.origin),
        text(payload.destination),
        reason,
        text(payload.reference) || actionNumber("MOV"),
        actor.email,
      ),
    auditStatement(
      actor,
      "CREATE",
      "movimentacoes",
      productId,
      `${type} de ${signedQuantity} em ${product.name}.`,
      { stock: previous },
      { stock: next, reason },
    ),
  );
  await db().batch(statements);
}

type SalePayloadItem = {
  product_id?: unknown;
  quantity?: unknown;
  unit_price?: unknown;
  discount?: unknown;
};

async function createSale(actor: Actor, payload: JsonObject) {
  const rawItems = Array.isArray(payload.items)
    ? (payload.items as SalePayloadItem[])
    : [];
  if (!rawItems.length) throw new Response("Inclua ao menos um produto na venda.", { status: 400 });

  const items = [];
  let subtotal = 0;
  for (const raw of rawItems) {
    const productId = optionalId(raw.product_id);
    const quantity = numberValue(raw.quantity);
    if (!productId || quantity <= 0) {
      throw new Response("Todos os itens precisam de produto e quantidade.", {
        status: 400,
      });
    }
    const product = await db()
      .prepare(
        `SELECT id, name, price, current_stock, active, sale_blocked
         FROM products WHERE id = ?`,
      )
      .bind(productId)
      .first<{
        id: number;
        name: string;
        price: number;
        current_stock: number;
        active: number;
        sale_blocked: number;
      }>();
    if (!product || !product.active || product.sale_blocked) {
      throw new Response("Um dos produtos está inativo ou bloqueado para venda.", {
        status: 409,
      });
    }
    if (Number(product.current_stock) < quantity) {
      throw new Response(
        `${product.name}: solicitado ${quantity}, disponível ${product.current_stock}.`,
        { status: 409 },
      );
    }
    const unitPrice = numberValue(raw.unit_price, Number(product.price));
    const itemDiscount = Math.max(0, numberValue(raw.discount));
    const total = Math.max(0, unitPrice * quantity - itemDiscount);
    subtotal += total;
    items.push({ product, quantity, unitPrice, itemDiscount, total });
  }

  const discount = Math.max(0, numberValue(payload.discount));
  const discountPercent = subtotal > 0 ? (discount / subtotal) * 100 : 0;
  const maxSetting = await db()
    .prepare("SELECT value FROM settings WHERE key = 'max_discount_percent'")
    .first<{ value: string }>();
  const maxDiscount = numberValue(maxSetting?.value, 10);
  if (discountPercent > maxDiscount && actor.role !== "administrador") {
    throw new Response(
      `O desconto supera o limite permitido de ${maxDiscount}%.`,
      { status: 409 },
    );
  }
  const total = Math.max(0, subtotal - discount);
  const saleNumber = actionNumber("VEN");
  const inserted = await db()
    .prepare(
      `INSERT INTO sales
       (number, client_id, subtotal, discount, total, status, payment_method,
        seller_email, notes)
       VALUES (?, ?, ?, ?, ?, 'aberta', ?, ?, ?)`,
    )
    .bind(
      saleNumber,
      optionalId(payload.client_id),
      subtotal,
      discount,
      total,
      text(payload.payment_method) || "informativo",
      actor.email,
      text(payload.notes),
    )
    .run();
  const saleId = Number(inserted.meta.last_row_id);
  const statements = [];
  for (const item of items) {
    const previous = Number(item.product.current_stock);
    const next = previous - item.quantity;
    statements.push(
      db()
        .prepare(
          `INSERT INTO sale_items
           (sale_id, product_id, quantity, unit_price, discount, total)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          saleId,
          item.product.id,
          item.quantity,
          item.unitPrice,
          item.itemDiscount,
          item.total,
        ),
      db()
        .prepare(
          "UPDATE products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        )
        .bind(next, item.product.id),
      db()
        .prepare(
          `INSERT INTO movements
           (product_id, type, quantity, previous_stock, new_stock, origin,
            destination, reason, reference, user_email)
           VALUES (?, 'venda', ?, ?, ?, 'Estoque', 'Cliente', 'Venda finalizada', ?, ?)`,
        )
        .bind(
          item.product.id,
          -item.quantity,
          previous,
          next,
          saleNumber,
          actor.email,
        ),
    );
  }
  statements.push(
    auditStatement(
      actor,
      "CREATE",
      "vendas",
      saleId,
      `Venda ${saleNumber} finalizada no valor de ${total.toFixed(2)}.`,
      {},
      { saleNumber, subtotal, discount, total, items: items.length },
    ),
  );
  await db().batch(statements);
}

async function cancelSale(actor: Actor, payload: JsonObject) {
  const saleId = optionalId(payload.id);
  const reason = text(payload.reason);
  if (!saleId || !reason) {
    throw new Response("Venda e motivo do cancelamento são obrigatórios.", {
      status: 400,
    });
  }
  const sale = await db()
    .prepare("SELECT * FROM sales WHERE id = ?")
    .bind(saleId)
    .first<{ id: number; number: string; status: string }>();
  if (!sale) throw new Response("Venda não encontrada.", { status: 404 });
  if (["cancelada", "expedido", "entregue"].includes(sale.status)) {
    throw new Response("Esta venda não pode ser cancelada diretamente.", {
      status: 409,
    });
  }
  const items = (
    await db()
      .prepare(
        `SELECT si.product_id, si.quantity, p.name, p.current_stock
         FROM sale_items si JOIN products p ON p.id = si.product_id
         WHERE si.sale_id = ?`,
      )
      .bind(saleId)
      .all<{
        product_id: number;
        quantity: number;
        name: string;
        current_stock: number;
      }>()
  ).results;
  const statements = [
    db()
      .prepare(
        "UPDATE sales SET status = 'cancelada', notes = notes || ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      )
      .bind(`\nCancelamento: ${reason}`, saleId),
  ];
  for (const item of items) {
    const previous = Number(item.current_stock);
    const next = previous + Number(item.quantity);
    statements.push(
      db()
        .prepare(
          "UPDATE products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        )
        .bind(next, item.product_id),
      db()
        .prepare(
          `INSERT INTO movements
           (product_id, type, quantity, previous_stock, new_stock, origin,
            destination, reason, reference, user_email)
           VALUES (?, 'cancelamento', ?, ?, ?, 'Cliente', 'Estoque', ?, ?, ?)`,
        )
        .bind(
          item.product_id,
          item.quantity,
          previous,
          next,
          reason,
          sale.number,
          actor.email,
        ),
    );
  }
  statements.push(
    auditStatement(
      actor,
      "CANCEL",
      "vendas",
      saleId,
      `Venda ${sale.number} cancelada. Motivo: ${reason}`,
      sale,
      { status: "cancelada", reason },
    ),
  );
  await db().batch(statements);
}

type PurchasePayloadItem = {
  product_id?: unknown;
  quantity?: unknown;
  unit_cost?: unknown;
};

async function createPurchase(actor: Actor, payload: JsonObject) {
  const rawItems = Array.isArray(payload.items)
    ? (payload.items as PurchasePayloadItem[])
    : [];
  if (!rawItems.length) throw new Response("Inclua ao menos um item na compra.", { status: 400 });
  const items = [];
  let total = 0;
  for (const raw of rawItems) {
    const productId = optionalId(raw.product_id);
    const quantity = numberValue(raw.quantity);
    const unitCost = numberValue(raw.unit_cost);
    if (!productId || quantity <= 0 || unitCost < 0) {
      throw new Response("Revise os produtos, quantidades e custos da compra.", {
        status: 400,
      });
    }
    const product = await db()
      .prepare(
        "SELECT id, name, current_stock, active, purchase_blocked FROM products WHERE id = ?",
      )
      .bind(productId)
      .first<{
        id: number;
        name: string;
        current_stock: number;
        active: number;
        purchase_blocked: number;
      }>();
    if (!product || !product.active || product.purchase_blocked) {
      throw new Response("Um dos produtos está inativo ou bloqueado para compra.", {
        status: 409,
      });
    }
    const itemTotal = quantity * unitCost;
    total += itemTotal;
    items.push({ product, quantity, unitCost, itemTotal });
  }

  const purchaseNumber = actionNumber("CMP");
  const inserted = await db()
    .prepare(
      `INSERT INTO purchases
       (number, supplier_id, document, total, status, responsible_email, notes)
       VALUES (?, ?, ?, ?, 'recebida', ?, ?)`,
    )
    .bind(
      purchaseNumber,
      optionalId(payload.supplier_id),
      text(payload.document),
      total,
      actor.email,
      text(payload.notes),
    )
    .run();
  const purchaseId = Number(inserted.meta.last_row_id);
  const statements = [];
  for (const item of items) {
    const previous = Number(item.product.current_stock);
    const next = previous + item.quantity;
    statements.push(
      db()
        .prepare(
          `INSERT INTO purchase_items
           (purchase_id, product_id, quantity, unit_cost, total)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(
          purchaseId,
          item.product.id,
          item.quantity,
          item.unitCost,
          item.itemTotal,
        ),
      db()
        .prepare(
          "UPDATE products SET current_stock = ?, cost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        )
        .bind(next, item.unitCost, item.product.id),
      db()
        .prepare(
          `INSERT INTO movements
           (product_id, type, quantity, previous_stock, new_stock, origin,
            destination, reason, reference, user_email)
           VALUES (?, 'entrada', ?, ?, ?, 'Fornecedor', 'Estoque', 'Recebimento de compra', ?, ?)`,
        )
        .bind(
          item.product.id,
          item.quantity,
          previous,
          next,
          purchaseNumber,
          actor.email,
        ),
    );
  }
  statements.push(
    auditStatement(
      actor,
      "CREATE",
      "compras",
      purchaseId,
      `Compra ${purchaseNumber} recebida no valor de ${total.toFixed(2)}.`,
      {},
      { purchaseNumber, total, items: items.length },
    ),
  );
  await db().batch(statements);
}

async function updateOrderStatus(actor: Actor, payload: JsonObject) {
  const saleId = optionalId(payload.id);
  const nextStatus = text(payload.status);
  if (!saleId) throw new Response("Pedido inválido.", { status: 400 });
  const sale = await db()
    .prepare("SELECT * FROM sales WHERE id = ?")
    .bind(saleId)
    .first<{ id: number; number: string; status: string }>();
  if (!sale) throw new Response("Pedido não encontrado.", { status: 404 });
  const transitions: Record<string, string[]> = {
    aberta: ["em_separacao"],
    em_separacao: ["separado"],
    separado: ["conferido", "expedido"],
    conferido: ["expedido"],
    expedido: ["entregue"],
  };
  if (!transitions[sale.status]?.includes(nextStatus)) {
    throw new Response(
      `Não é permitido alterar o pedido de ${sale.status} para ${nextStatus}.`,
      { status: 409 },
    );
  }

  const statements = [
    db()
      .prepare(
        "UPDATE sales SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      )
      .bind(nextStatus, saleId),
    db()
      .prepare(
        `INSERT INTO status_history
         (entity_type, entity_id, previous_status, new_status, observation, user_email)
         VALUES ('pedido', ?, ?, ?, ?, ?)`,
      )
      .bind(String(saleId), sale.status, nextStatus, text(payload.occurrence), actor.email),
  ];
  if (nextStatus === "expedido") {
    const carrier = text(payload.carrier);
    if (!carrier) {
      throw new Response("Informe a transportadora para expedir o pedido.", {
        status: 400,
      });
    }
    statements.push(
      db()
        .prepare(
          `INSERT INTO shipments
           (sale_id, carrier, tracking_code, status, responsible_email, occurrence)
           VALUES (?, ?, ?, 'expedido', ?, ?)`,
        )
        .bind(
          saleId,
          carrier,
          text(payload.tracking_code),
          actor.email,
          text(payload.occurrence),
        ),
    );
  }
  if (nextStatus === "entregue") {
    statements.push(
      db()
        .prepare(
          "UPDATE shipments SET status = 'entregue' WHERE sale_id = ?",
        )
        .bind(saleId),
    );
  }
  statements.push(
    auditStatement(
      actor,
      "STATUS",
      nextStatus === "expedido" ? "expedicao" : "separacao",
      saleId,
      `Pedido ${sale.number}: ${sale.status} → ${nextStatus}.`,
      { status: sale.status },
      { status: nextStatus },
    ),
  );
  await db().batch(statements);
}

async function createInventory(actor: Actor, payload: JsonObject) {
  const productId = optionalId(payload.product_id);
  const countedStock = numberValue(payload.counted_stock, Number.NaN);
  if (!productId || !Number.isFinite(countedStock) || countedStock < 0) {
    throw new Response("Selecione o produto e informe a contagem física.", {
      status: 400,
    });
  }
  const product = await db()
    .prepare("SELECT id, name, current_stock FROM products WHERE id = ? AND active = 1")
    .bind(productId)
    .first<{ id: number; name: string; current_stock: number }>();
  if (!product) throw new Response("Produto não encontrado ou inativo.", { status: 404 });
  const expected = Number(product.current_stock);
  const difference = countedStock - expected;
  const inventoryNumber = actionNumber("INV");
  const inserted = await db()
    .prepare(
      `INSERT INTO inventories (number, status, counter_email, notes)
       VALUES (?, 'pendente', ?, ?)`,
    )
    .bind(inventoryNumber, actor.email, text(payload.notes))
    .run();
  const inventoryId = Number(inserted.meta.last_row_id);
  await db().batch([
    db()
      .prepare(
        `INSERT INTO inventory_items
         (inventory_id, product_id, expected_stock, counted_stock, difference)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(inventoryId, productId, expected, countedStock, difference),
    auditStatement(
      actor,
      "COUNT",
      "inventario",
      inventoryId,
      `Inventário ${inventoryNumber}: ${product.name}, diferença ${difference}.`,
      { expected },
      { countedStock, difference },
    ),
  ]);
}

async function applyInventory(actor: Actor, payload: JsonObject) {
  const inventoryId = optionalId(payload.id);
  if (!inventoryId) throw new Response("Inventário inválido.", { status: 400 });
  const inventory = await db()
    .prepare(
      `SELECT i.id, i.number, i.status, ii.product_id, ii.expected_stock,
              ii.counted_stock, ii.difference, p.name
       FROM inventories i
       JOIN inventory_items ii ON ii.inventory_id = i.id
       JOIN products p ON p.id = ii.product_id WHERE i.id = ?`,
    )
    .bind(inventoryId)
    .first<{
      id: number;
      number: string;
      status: string;
      product_id: number;
      expected_stock: number;
      counted_stock: number;
      difference: number;
      name: string;
    }>();
  if (!inventory || inventory.status !== "pendente") {
    throw new Response("O inventário já foi concluído ou não existe.", {
      status: 409,
    });
  }
  await db().batch([
    db()
      .prepare(
        "UPDATE products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      )
      .bind(inventory.counted_stock, inventory.product_id),
    db()
      .prepare(
        `UPDATE inventories SET status = 'concluido', approver_email = ?,
         completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      )
      .bind(actor.email, inventoryId),
    db()
      .prepare(
        `INSERT INTO movements
         (product_id, type, quantity, previous_stock, new_stock, origin,
          destination, reason, reference, user_email)
         VALUES (?, 'inventario', ?, ?, ?, 'Estoque', 'Estoque',
         'Ajuste pós-inventário', ?, ?)`,
      )
      .bind(
        inventory.product_id,
        inventory.difference,
        inventory.expected_stock,
        inventory.counted_stock,
        inventory.number,
        actor.email,
      ),
    auditStatement(
      actor,
      "APPROVE",
      "inventario",
      inventoryId,
      `Inventário ${inventory.number} aprovado e saldo de ${inventory.name} ajustado.`,
      { stock: inventory.expected_stock },
      { stock: inventory.counted_stock },
    ),
  ]);
}

const entityConfig = {
  categories: {
    table: "categories",
    module: "categorias",
    fields: ["name", "description"],
  },
  brands: {
    table: "brands",
    module: "marcas",
    fields: ["name", "description"],
  },
  suppliers: {
    table: "suppliers",
    module: "fornecedores",
    fields: [
      "name",
      "document",
      "phone",
      "email",
      "address",
      "contact_person",
      "lead_time_days",
      "notes",
    ],
  },
  clients: {
    table: "clients",
    module: "clientes",
    fields: [
      "name",
      "document",
      "phone",
      "email",
      "address",
      "client_type",
    ],
  },
  warehouses: {
    table: "warehouses",
    module: "armazens",
    fields: ["name", "code", "address", "description"],
  },
} as const;

async function saveEntity(actor: Actor, payload: JsonObject) {
  const entity = text(payload.entity) as keyof typeof entityConfig;
  const config = entityConfig[entity];
  if (!config) throw new Response("Cadastro inválido.", { status: 400 });
  const id = optionalId(payload.id);
  const name = text(payload.name);
  if (!name) throw new Response("O nome é obrigatório.", { status: 400 });
  const values = config.fields.map((field) => {
    if (field === "lead_time_days") return numberValue(payload[field]);
    return text(payload[field]);
  });
  if (id) {
    const before = await db()
      .prepare(`SELECT * FROM ${config.table} WHERE id = ?`)
      .bind(id)
      .first();
    if (!before) throw new Response("Registro não encontrado.", { status: 404 });
    const assignments = config.fields.map((field) => `${field} = ?`).join(", ");
    await db().batch([
      db()
        .prepare(
          `UPDATE ${config.table} SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        )
        .bind(...values, id),
      auditStatement(
        actor,
        "UPDATE",
        config.module,
        id,
        `${name} atualizado.`,
        before,
        payload,
      ),
    ]);
    return;
  }
  const placeholders = config.fields.map(() => "?").join(", ");
  const inserted = await db()
    .prepare(
      `INSERT INTO ${config.table} (${config.fields.join(", ")})
       VALUES (${placeholders})`,
    )
    .bind(...values)
    .run();
  await auditStatement(
    actor,
    "CREATE",
    config.module,
    Number(inserted.meta.last_row_id),
    `${name} cadastrado.`,
    {},
    payload,
  ).run();
}

async function toggleEntity(actor: Actor, payload: JsonObject) {
  const entity = text(payload.entity) as keyof typeof entityConfig;
  const config = entityConfig[entity];
  const id = optionalId(payload.id);
  if (!config || !id) throw new Response("Cadastro inválido.", { status: 400 });
  const before = await db()
    .prepare(`SELECT id, name, active FROM ${config.table} WHERE id = ?`)
    .bind(id)
    .first<{ id: number; name: string; active: number }>();
  if (!before) throw new Response("Registro não encontrado.", { status: 404 });
  const active = before.active ? 0 : 1;
  await db().batch([
    db()
      .prepare(
        `UPDATE ${config.table} SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      )
      .bind(active, id),
    auditStatement(
      actor,
      active ? "REACTIVATE" : "INACTIVATE",
      config.module,
      id,
      `${before.name} ${active ? "reativado" : "inativado"}.`,
      before,
      { active },
    ),
  ]);
}

async function saveUser(actor: Actor, payload: JsonObject) {
  const email = text(payload.email).toLowerCase();
  const fullName = text(payload.full_name);
  const role = text(payload.role) as Role;
  const status = text(payload.status) || "ativo";
  if (
    !email.includes("@") ||
    !fullName ||
    ![
      "administrador",
      "gestor",
      "gerente",
      "operador",
      "comprador",
      "vendedor",
      "separador",
      "conferente",
      "expedidor",
      "financeiro",
      "auditor",
    ].includes(role)
  ) {
    throw new Response("Informe nome, e-mail e perfil válidos.", { status: 400 });
  }
  const before = await db()
    .prepare("SELECT * FROM user_profiles WHERE email = ?")
    .bind(email)
    .first();
  await db().batch([
    db()
      .prepare(
        `INSERT INTO user_profiles (email, full_name, role, status)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET full_name=excluded.full_name,
         role=excluded.role, status=excluded.status, updated_at=CURRENT_TIMESTAMP`,
      )
      .bind(email, fullName, role, status),
    auditStatement(
      actor,
      before ? "UPDATE" : "CREATE",
      "usuarios",
      email,
      `Acesso de ${fullName} configurado como ${role}.`,
      before,
      payload,
    ),
  ]);
}

async function saveSettings(actor: Actor, payload: JsonObject) {
  const allowedKeys = [
    "company_name",
    "company_document",
    "document_prefix",
    "default_min_stock",
    "allow_negative_stock",
    "max_discount_percent",
    "expiry_alert_days",
    "cost_method",
    "purchase_approval_limit",
    "reservation_expiry_hours",
    "picking_strategy",
    "blind_inventory",
    "notification_email",
    "backup_retention_days",
    "session_timeout_minutes",
  ];
  const statements = [];
  for (const key of allowedKeys) {
    if (!(key in payload)) continue;
    const value =
      ["allow_negative_stock", "blind_inventory"].includes(key)
        ? String(boolValue(payload[key]))
        : text(payload[key]);
    statements.push(
      db()
        .prepare(
          `INSERT INTO settings (key, value, updated_by, updated_at)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(key) DO UPDATE SET value=excluded.value,
           updated_by=excluded.updated_by, updated_at=CURRENT_TIMESTAMP`,
        )
        .bind(key, value, actor.email),
    );
  }
  statements.push(
    auditStatement(
      actor,
      "UPDATE",
      "configuracoes",
      "geral",
      "Configurações gerais atualizadas.",
      {},
      payload,
    ),
  );
  await db().batch(statements);
}

async function saveWorkflowRecord(actor: Actor, payload: JsonObject) {
  const workflowModule = text(payload.module);
  const title = text(payload.title);
  const code =
    text(payload.code) ||
    actionNumber(workflowModule.slice(0, 3).toUpperCase());
  const status = text(payload.status) || "pendente";
  if (!workflowModules.has(workflowModule) || !title) {
    throw new Response("Módulo e título são obrigatórios.", { status: 400 });
  }
  const inserted = await db()
    .prepare(
      `INSERT INTO workflow_records
       (module, code, title, record_type, product_id, quantity, origin,
        destination, status, priority, responsible_email, due_at, amount,
        reference, notes, metadata_json, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      workflowModule,
      code,
      title,
      text(payload.record_type) || "registro",
      optionalId(payload.product_id),
      Math.max(0, numberValue(payload.quantity)),
      text(payload.origin),
      text(payload.destination),
      status,
      text(payload.priority) || "normal",
      text(payload.responsible_email) || actor.email,
      text(payload.due_at) || null,
      Math.max(0, numberValue(payload.amount)),
      text(payload.reference),
      text(payload.notes),
      json(payload.metadata ?? { detalhes: text(payload.metadata_json) }),
      actor.email,
    )
    .run();
  const recordId = Number(inserted.meta.last_row_id);
  await db().batch([
    db()
      .prepare(
        `INSERT INTO status_history
         (entity_type, entity_id, previous_status, new_status, observation, user_email)
         VALUES (?, ?, '', ?, 'Registro criado', ?)`,
      )
      .bind(workflowModule, String(recordId), status, actor.email),
    auditStatement(
      actor,
      "CREATE",
      workflowModule,
      recordId,
      `${title} cadastrado.`,
      {},
      payload,
    ),
  ]);
}

async function updateWorkflowStatus(actor: Actor, payload: JsonObject) {
  const id = optionalId(payload.id);
  const nextStatus = text(payload.status);
  if (!id || !nextStatus) {
    throw new Response("Registro e status são obrigatórios.", { status: 400 });
  }
  const before = await db()
    .prepare("SELECT * FROM workflow_records WHERE id = ?")
    .bind(id)
    .first<Record<string, unknown>>();
  if (!before) throw new Response("Registro não encontrado.", { status: 404 });
  const workflowModule = text(before.module);
  const previousStatus = text(before.status);
  const observation = text(payload.observation);
  if (!workflowModules.has(workflowModule) || previousStatus === nextStatus) return;
  await db().batch([
    db()
      .prepare(
        `UPDATE workflow_records SET status=?, responsible_email=?,
         notes=CASE WHEN ?='' THEN notes ELSE notes || char(10) || ? END,
         updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      )
      .bind(nextStatus, actor.email, observation, observation, id),
    db()
      .prepare(
        `INSERT INTO status_history
         (entity_type, entity_id, previous_status, new_status, observation, user_email)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(workflowModule, String(id), previousStatus, nextStatus, observation, actor.email),
    auditStatement(
      actor,
      "STATUS",
      workflowModule,
      id,
      `${text(before.title)}: ${previousStatus} → ${nextStatus}.`,
      before,
      { status: nextStatus, reason: observation },
    ),
  ]);
}

async function bulkImportProducts(actor: Actor, payload: JsonObject) {
  const rows = Array.isArray(payload.rows)
    ? (payload.rows as Array<Record<string, unknown>>)
    : [];
  if (!rows.length || rows.length > 500) {
    throw new Response("Envie de 1 a 500 produtos.", { status: 400 });
  }
  const codes = new Set<string>();
  const skus = new Set<string>();
  const statements = [];
  for (const [index, row] of rows.entries()) {
    const code = text(row.code).trim();
    const sku = text(row.sku).trim();
    const name = text(row.name).trim();
    if (!code || !sku || !name || codes.has(code) || skus.has(sku)) {
      throw new Response(
        `Linha ${index + 2}: código, SKU e nome devem ser válidos e únicos.`,
        { status: 409 },
      );
    }
    codes.add(code);
    skus.add(sku);
    statements.push(
      db()
        .prepare(
          `INSERT INTO products
           (code, sku, barcode, name, description, location, unit, cost, price,
            min_stock, current_stock, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
           ON CONFLICT(code) DO UPDATE SET sku=excluded.sku,
             barcode=excluded.barcode, name=excluded.name,
             description=excluded.description, location=excluded.location,
             unit=excluded.unit, cost=excluded.cost, price=excluded.price,
             min_stock=excluded.min_stock, updated_at=CURRENT_TIMESTAMP`,
        )
        .bind(
          code, sku, text(row.barcode) || null, name, text(row.description),
          text(row.location), text(row.unit) || "UN",
          Math.max(0, numberValue(row.cost)), Math.max(0, numberValue(row.price)),
          Math.max(0, numberValue(row.min_stock)),
          Math.max(0, numberValue(row.current_stock)),
        ),
    );
  }
  statements.push(
    auditStatement(
      actor,
      "IMPORT",
      "produtos",
      actionNumber("IMP"),
      `${rows.length} produto(s) importado(s) ou atualizado(s).`,
      {},
      { rows: rows.length, document: text(payload.filename) },
    ),
  );
  await db().batch(statements);
}

async function parsePayload(request: Request) {
  try {
    return (await request.json()) as { action?: string; payload?: JsonObject };
  } catch {
    throw new Response("Corpo da requisição inválido.", { status: 400 });
  }
}

async function errorResponse(error: unknown) {
  if (error instanceof Response) {
    const message = await error.text();
    return Response.json(
      { error: message || "Não foi possível concluir a operação." },
      { status: error.status },
    );
  }
  const message =
    error instanceof Error ? error.message : "Não foi possível concluir a operação.";
  return Response.json({ error: message }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const externalResponse = await proxyExternal(request);
    if (externalResponse) return externalResponse;
    await ensureSchema();
    const actor = await actorFromRequest(request);
    if (new URL(request.url).searchParams.get("backup") === "native") {
      if (!["administrador", "gestor"].includes(actor.role)) {
        throw new Response("Seu perfil não possui permissão para gerar backup.", {
          status: 403,
        });
      }
      return backupResponse(await createD1Backup(), "sql", "application/sql; charset=utf-8");
    }
    await seedIfEmpty(actor);
    await seedEnterpriseIfEmpty();
    return Response.json(await getSnapshot(actor));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const externalResponse = await proxyExternal(request);
    if (externalResponse) return externalResponse;
    await ensureSchema();
    const actor = await actorFromRequest(request);
    const { action = "", payload = {} } = await parsePayload(request);
    requireAction(actor, action);

    if (action === "save_product") await saveProduct(actor, payload);
    else if (action === "toggle_product") await toggleProduct(actor, payload);
    else if (action === "create_movement") await createMovement(actor, payload);
    else if (action === "create_sale") await createSale(actor, payload);
    else if (action === "cancel_sale") await cancelSale(actor, payload);
    else if (action === "create_purchase") await createPurchase(actor, payload);
    else if (action === "update_order_status") {
      await updateOrderStatus(actor, payload);
    } else if (action === "create_inventory") {
      await createInventory(actor, payload);
    } else if (action === "apply_inventory") {
      await applyInventory(actor, payload);
    } else if (action === "save_entity") await saveEntity(actor, payload);
    else if (action === "toggle_entity") await toggleEntity(actor, payload);
    else if (action === "save_user") await saveUser(actor, payload);
    else if (action === "save_settings") await saveSettings(actor, payload);
    else if (action === "save_workflow_record") {
      await saveWorkflowRecord(actor, payload);
    } else if (action === "update_workflow_status") {
      await updateWorkflowStatus(actor, payload);
    } else if (action === "bulk_import_products") {
      await bulkImportProducts(actor, payload);
    }
    else throw new Response("Ação não reconhecida.", { status: 400 });

    return Response.json({ ok: true, snapshot: await getSnapshot(actor) });
  } catch (error) {
    return errorResponse(error);
  }
}

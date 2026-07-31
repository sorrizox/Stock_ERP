"use client";

import {
  FormEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";
import {
  EnterpriseModule,
  EnterpriseModuleKey,
  enterpriseMeta,
  enterpriseModuleKeys,
} from "./enterprise-modules";

type User = {
  displayName: string;
  email: string;
  fullName: string | null;
};

type ModuleKey =
  | "dashboard"
  | "products"
  | "sales"
  | "purchases"
  | "movements"
  | "inventory"
  | "separation"
  | "shipping"
  | "reports"
  | "categories"
  | "brands"
  | "suppliers"
  | "clients"
  | "warehouses"
  | "users"
  | "audit"
  | "backup"
  | "settings"
  | EnterpriseModuleKey;

type Row = Record<string, unknown> & { id?: number };

type Profile = {
  email: string;
  fullName: string;
  role: string;
  status: string;
};

type Snapshot = {
  profile: Profile;
  products: Row[];
  movements: Row[];
  sales: Row[];
  purchases: Row[];
  inventories: Row[];
  shipments: Row[];
  categories: Row[];
  brands: Row[];
  suppliers: Row[];
  clients: Row[];
  warehouses: Row[];
  users: Row[];
  audit: Row[];
  workflows: Row[];
  statusHistory: Row[];
  settings: Record<string, string>;
  dataSource?: {
    mode: "d1" | "external-api";
    label: string;
    status: "connected" | "error";
  };
};

type ModalState =
  | { kind: "product"; record?: Row }
  | { kind: "movement" }
  | { kind: "sale" }
  | { kind: "purchase" }
  | { kind: "inventory" }
  | { kind: "shipment"; record: Row }
  | { kind: "cancel-sale"; record: Row }
  | {
      kind: "entity";
      entity: "categories" | "brands" | "suppliers" | "clients" | "warehouses";
      record?: Row;
    }
  | { kind: "user"; record?: Row };

const navigation: Array<{
  label: string;
  items: Array<{ key: ModuleKey; label: string; icon: string }>;
}> = [
  {
    label: "Início",
    items: [{ key: "dashboard", label: "Menu inicial", icon: "⌂" }],
  },
  {
    label: "Operação",
    items: [
      { key: "products", label: "Produtos", icon: "□" },
      { key: "sales", label: "Vendas", icon: "◫" },
      { key: "purchases", label: "Compras", icon: "⇣" },
      { key: "movements", label: "Movimentações", icon: "⇄" },
      { key: "inventory", label: "Inventário", icon: "▦" },
      { key: "separation", label: "Separação", icon: "✓" },
      { key: "shipping", label: "Expedição", icon: "➜" },
      { key: "reports", label: "Relatórios", icon: "⌁" },
    ],
  },
  {
    label: "Fluxos avançados",
    items: [
      { key: "reservations", label: "Reservas", icon: "◌" },
      { key: "receiving", label: "Recebimento", icon: "⇣" },
      { key: "conference", label: "Conferência", icon: "✓" },
      { key: "packaging", label: "Volumes", icon: "▣" },
      { key: "transfers", label: "Transferências", icon: "⇄" },
      { key: "returns", label: "Devoluções e trocas", icon: "↶" },
      { key: "losses", label: "Perdas e avarias", icon: "!" },
    ],
  },
  {
    label: "Rastreabilidade",
    items: [
      { key: "traceability", label: "Lotes e séries", icon: "⌗" },
      { key: "kits", label: "Kits e composição", icon: "⊞" },
      { key: "production", label: "Produção", icon: "⚒" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { key: "planning", label: "Planejamento", icon: "⌁" },
      { key: "finance", label: "Financeiro", icon: "$" },
      { key: "approvals", label: "Aprovações", icon: "✓" },
      { key: "notifications", label: "Alertas", icon: "!" },
    ],
  },
  {
    label: "Automação",
    items: [
      { key: "integrations", label: "Integrações", icon: "◎" },
      { key: "import_export", label: "Importar e exportar", icon: "⇅" },
      { key: "labels", label: "Etiquetas e QR", icon: "▤" },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { key: "catalogs", label: "Cadastros avançados", icon: "▦" },
      { key: "categories", label: "Categorias", icon: "◇" },
      { key: "brands", label: "Marcas", icon: "◆" },
      { key: "suppliers", label: "Fornecedores", icon: "▱" },
      { key: "clients", label: "Clientes", icon: "♙" },
      { key: "warehouses", label: "Armazéns", icon: "⌂" },
      { key: "locations", label: "Mapa de locais", icon: "⌖" },
    ],
  },
  {
    label: "Administração",
    items: [
      { key: "users", label: "Usuários e acessos", icon: "♚" },
      { key: "audit", label: "Auditoria", icon: "◉" },
      { key: "security", label: "Segurança e permissões", icon: "◈" },
      { key: "backup", label: "Backup", icon: "⇩" },
      { key: "settings", label: "Configurações", icon: "⚙" },
    ],
  },
];

const coreModuleMeta: Record<
  Exclude<ModuleKey, EnterpriseModuleKey>,
  { eyebrow: string; title: string; description: string; action?: string }
> = {
  dashboard: {
    eyebrow: "Visão geral",
    title: "Menu inicial",
    description: "Indicadores atualizados da operação.",
  },
  products: {
    eyebrow: "Cadastro",
    title: "Produtos",
    description: "Saldos, preços, localização e status em um só lugar.",
    action: "Novo produto",
  },
  sales: {
    eyebrow: "Operação",
    title: "Vendas",
    description: "Pedidos com validação de saldo e desconto.",
    action: "Nova venda",
  },
  purchases: {
    eyebrow: "Operação",
    title: "Compras e encomendas",
    description: "Recebimento e atualização automática do estoque.",
    action: "Nova compra",
  },
  movements: {
    eyebrow: "Estoque",
    title: "Movimentações",
    description: "Entradas, saídas, transferências e ajustes rastreáveis.",
    action: "Nova movimentação",
  },
  inventory: {
    eyebrow: "Conferência",
    title: "Inventário",
    description: "Contagem física, divergências e aprovação de ajustes.",
    action: "Novo inventário",
  },
  separation: {
    eyebrow: "Pedidos",
    title: "Fila de separação",
    description: "Priorize, confira e registre o responsável por cada pedido.",
  },
  shipping: {
    eyebrow: "Logística",
    title: "Expedição",
    description: "Envios, transportadora, rastreio e ocorrências.",
  },
  reports: {
    eyebrow: "Gestão",
    title: "Relatórios",
    description: "Dados confiáveis para acompanhar estoque e operação.",
  },
  categories: {
    eyebrow: "Cadastro",
    title: "Categorias",
    description: "Classificação padronizada dos produtos.",
    action: "Nova categoria",
  },
  brands: {
    eyebrow: "Cadastro",
    title: "Marcas",
    description: "Gerencie as marcas vinculadas aos produtos.",
    action: "Nova marca",
  },
  suppliers: {
    eyebrow: "Cadastro",
    title: "Fornecedores",
    description: "Contatos, documentos e histórico de compras.",
    action: "Novo fornecedor",
  },
  clients: {
    eyebrow: "Cadastro",
    title: "Clientes",
    description: "Dados comerciais e histórico de vendas.",
    action: "Novo cliente",
  },
  warehouses: {
    eyebrow: "Estrutura",
    title: "Armazéns e locais",
    description: "Depósitos, corredores, prateleiras e setores.",
    action: "Novo armazém",
  },
  users: {
    eyebrow: "Administração",
    title: "Usuários e acessos",
    description: "Papéis e permissões de cada função.",
    action: "Adicionar usuário",
  },
  audit: {
    eyebrow: "Segurança",
    title: "Auditoria",
    description: "Histórico imutável das ações relevantes.",
  },
  backup: {
    eyebrow: "Administração",
    title: "Backup e recuperação",
    description: "Exporte uma cópia completa e restaurável do banco de dados.",
  },
  settings: {
    eyebrow: "Administração",
    title: "Configurações",
    description: "Regras de estoque, desconto e alertas.",
  },
};

const moduleMeta = {
  ...coreModuleMeta,
  ...Object.fromEntries(
    enterpriseModuleKeys.map((key) => [
      key,
      {
        eyebrow: enterpriseMeta[key].eyebrow,
        title: enterpriseMeta[key].title,
        description: enterpriseMeta[key].description,
      },
    ]),
  ),
} as Record<
  ModuleKey,
  { eyebrow: string; title: string; description: string; action?: string }
>;

const roleNames: Record<string, string> = {
  administrador: "Administrador",
  gestor: "Gestor de estoque",
  gerente: "Gerente",
  operador: "Operador de estoque",
  comprador: "Comprador",
  vendedor: "Vendedor",
  separador: "Separador",
  conferente: "Conferente",
  expedidor: "Expedidor",
  financeiro: "Financeiro",
  auditor: "Auditor",
};

function str(value: unknown) {
  return value == null ? "" : String(value);
}

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function jsonRecord(value: unknown): Record<string, unknown> {
  try {
    return JSON.parse(str(value) || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

function isActive(value: unknown) {
  return value === 1 || value === true || value === "1";
}

function currency(value: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num(value));
}

function dateTime(value: unknown) {
  if (!value) return "—";
  const date = new Date(`${str(value).replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return str(value);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(value: unknown) {
  return str(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value: unknown) {
  const status = str(value);
  if (["ativo", "concluido", "entregue", "recebida", "entrada"].includes(status)) {
    return "badge-success";
  }
  if (["cancelada", "inativo", "critico", "saida"].includes(status)) {
    return "badge-danger";
  }
  if (["pendente", "em_separacao", "ajuste"].includes(status)) {
    return "badge-warning";
  }
  return "badge-info";
}

function rowMatches(row: Row, query: string) {
  if (!query) return true;
  const statusMatch = query.match(/\[status:([^\]]+)\]/);
  const textQuery = query.replace(/\[status:[^\]]+\]/, "").trim().toLowerCase();
  const rawStatus = str(row.status) || (isActive(row.active) ? "ativo" : "inativo");
  return (!statusMatch || rawStatus === statusMatch[1]) &&
    (!textQuery || Object.values(row).join(" ").toLowerCase().includes(textQuery));
}

function newItemKey() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function StockApp({ initialUser }: { initialUser: User }) {
  const [active, setActive] = useState<ModuleKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const meta = moduleMeta[active];

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/erp", { cache: "no-store" });
      const data = (await response.json()) as Snapshot & { error?: string };
      if (!response.ok) throw new Error(data.error || "Falha ao carregar o ERP.");
      setSnapshot(data);
      setLastUpdated(new Date());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar os dados.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function runAction(
    action: string,
    payload: Record<string, unknown>,
    success: string,
  ) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/erp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const data = (await response.json()) as {
        error?: string;
        snapshot?: Snapshot;
      };
      if (!response.ok) throw new Error(data.error || "A operação não foi concluída.");
      if (data.snapshot) {
        setSnapshot(data.snapshot);
        setLastUpdated(new Date());
      }
      setModal(null);
      setToast(success);
      window.setTimeout(() => setToast(""), 3200);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "A operação não foi concluída.",
      );
    } finally {
      setBusy(false);
    }
  }

  function navigate(key: ModuleKey) {
    setActive(key);
    setQuery("");
    setSidebarOpen(false);
    setError("");
  }

  function openPrimaryAction() {
    if (active === "products") setModal({ kind: "product" });
    else if (active === "sales") setModal({ kind: "sale" });
    else if (active === "purchases") setModal({ kind: "purchase" });
    else if (active === "movements") setModal({ kind: "movement" });
    else if (active === "inventory") setModal({ kind: "inventory" });
    else if (
      ["categories", "brands", "suppliers", "clients", "warehouses"].includes(
        active,
      )
    ) {
      setModal({
        kind: "entity",
        entity: active as
          | "categories"
          | "brands"
          | "suppliers"
          | "clients"
          | "warehouses",
      });
    } else if (active === "users") setModal({ kind: "user" });
  }

  const profile = snapshot?.profile;
  const displayName =
    profile?.fullName ?? initialUser.fullName ?? initialUser.displayName;
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const criticalCount =
    snapshot?.products.filter(
      (product) =>
        isActive(product.active) &&
        num(product.current_stock) <= num(product.min_stock),
      ).length ?? 0;
  const workflowAlertCount =
    snapshot?.workflows.filter(
      (record) =>
        record.module === "notifications" &&
        !["resolvida", "ignorada"].includes(str(record.status)),
    ).length ?? 0;
  const totalNotifications = criticalCount + workflowAlertCount;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo" aria-hidden="true">SE</div>
          <div>
            <strong>Stock ERP</strong>
            <span>Controle de estoque</span>
          </div>
          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            ×
          </button>
        </div>
        <nav aria-label="Navegação principal">
          {navigation.map((section) => (
            <div className="nav-section" key={section.label}>
              <p>{section.label}</p>
              {section.items.map((item) => (
                <button
                  className={active === item.key ? "nav-item active" : "nav-item"}
                  key={item.key}
                  onClick={() => navigate(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="status-dot" />
          {snapshot?.dataSource?.label ?? "Banco local"} conectado
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar menu lateral"
        />
      )}

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              ☰
            </button>
            <span className="system-pill">
              <span className="status-dot" />
              API operacional
            </span>
            <span className="system-pill desktop-only">
              Atualizado {lastUpdated ? dateTime(lastUpdated.toISOString()) : "—"}
            </span>
          </div>
          <div className="topbar-user">
            <button
              className="notification-button"
              aria-label={`${totalNotifications} alertas operacionais`}
              onClick={() => setNotificationsOpen((value) => !value)}
            >
              !
              {totalNotifications > 0 && <span>{totalNotifications}</span>}
            </button>
            {notificationsOpen && (
              <div className="notification-popover">
                <header><strong>Pendências da operação</strong><button onClick={() => setNotificationsOpen(false)}>×</button></header>
                <button onClick={() => { navigate("products"); setNotificationsOpen(false); }}>
                  <strong>{criticalCount} produto(s) abaixo do mínimo</strong>
                  <small>Revisar saldo e necessidade de compra</small>
                </button>
                <button onClick={() => { navigate("notifications"); setNotificationsOpen(false); }}>
                  <strong>{workflowAlertCount} alerta(s) em tratamento</strong>
                  <small>Validade, atrasos, integrações e segurança</small>
                </button>
              </div>
            )}
            <div className="avatar">{initials || "AD"}</div>
            <div className="user-copy">
              <strong>{displayName}</strong>
              <span>{roleNames[profile?.role ?? "administrador"]}</span>
            </div>
          </div>
        </header>

        <main className="content">
          <section className="page-heading">
            <div>
              {meta.eyebrow && <p className="eyebrow">{meta.eyebrow}</p>}
              <h1>{meta.title}</h1>
              <p>{meta.description}</p>
            </div>
            {meta.action && (
              <button
                className="button button-primary"
                onClick={openPrimaryAction}
                disabled={!snapshot}
              >
                ＋ {meta.action}
              </button>
            )}
          </section>

          {error && (
            <div className="alert alert-error" role="alert">
              <span>!</span>
              <div>
                <strong>Não foi possível concluir</strong>
                <p>{error}</p>
              </div>
              <button onClick={() => setError("")} aria-label="Fechar erro">
                ×
              </button>
            </div>
          )}

          {loading ? (
            <LoadingState />
          ) : snapshot ? (
            <ModuleContent
              active={active}
              snapshot={snapshot}
              query={query}
              setQuery={setQuery}
              navigate={navigate}
              setModal={setModal}
              runAction={runAction}
              busy={busy}
            />
          ) : (
            <ErrorState onRetry={loadData} />
          )}
        </main>
      </div>

      {toast && (
        <div className="toast" role="status">
          <span>✓</span> {toast}
        </div>
      )}

      {modal && snapshot && (
        <Modal
          title={modalTitle(modal)}
          onClose={() => !busy && setModal(null)}
        >
          <ModalContent
            modal={modal}
            snapshot={snapshot}
            runAction={runAction}
            busy={busy}
          />
        </Modal>
      )}
    </div>
  );
}

function ModuleContent({
  active,
  snapshot,
  query,
  setQuery,
  navigate,
  setModal,
  runAction,
  busy,
}: {
  active: ModuleKey;
  snapshot: Snapshot;
  query: string;
  setQuery: (value: string) => void;
  navigate: (key: ModuleKey) => void;
  setModal: (modal: ModalState) => void;
  runAction: (
    action: string,
    payload: Record<string, unknown>,
    success: string,
  ) => Promise<void>;
  busy: boolean;
}) {
  if (active === "dashboard") {
    return <Dashboard snapshot={snapshot} navigate={navigate} />;
  }
  if (active === "products") {
    return (
      <ProductsTable
        snapshot={snapshot}
        query={query}
        setQuery={setQuery}
        setModal={setModal}
        runAction={runAction}
      />
    );
  }
  if (active === "sales") {
    return (
      <SalesTable
        rows={snapshot.sales}
        query={query}
        setQuery={setQuery}
        setModal={setModal}
      />
    );
  }
  if (active === "purchases") {
    return (
      <PurchasesTable
        rows={snapshot.purchases}
        query={query}
        setQuery={setQuery}
      />
    );
  }
  if (active === "movements") {
    return (
      <MovementsTable
        rows={snapshot.movements}
        query={query}
        setQuery={setQuery}
      />
    );
  }
  if (active === "inventory") {
    return (
      <InventoriesTable
        rows={snapshot.inventories}
        query={query}
        setQuery={setQuery}
        runAction={runAction}
        busy={busy}
      />
    );
  }
  if (active === "separation") {
    return (
      <OrderQueue
        mode="separation"
        rows={snapshot.sales}
        runAction={runAction}
        setModal={setModal}
        busy={busy}
      />
    );
  }
  if (active === "shipping") {
    return (
      <OrderQueue
        mode="shipping"
        rows={snapshot.sales}
        shipments={snapshot.shipments}
        runAction={runAction}
        setModal={setModal}
        busy={busy}
      />
    );
  }
  if (active === "reports") return <Reports snapshot={snapshot} />;
  if (enterpriseModuleKeys.includes(active as EnterpriseModuleKey)) {
    return (
      <EnterpriseModule
        moduleKey={active as EnterpriseModuleKey}
        workflows={snapshot.workflows ?? []}
        products={snapshot.products}
        warehouses={snapshot.warehouses}
        users={snapshot.users}
        query={query}
        setQuery={setQuery}
        runAction={runAction}
        busy={busy}
      />
    );
  }
  if (
    ["categories", "brands", "suppliers", "clients", "warehouses"].includes(
      active,
    )
  ) {
    const entity = active as
      | "categories"
      | "brands"
      | "suppliers"
      | "clients"
      | "warehouses";
    return (
      <EntityTable
        entity={entity}
        rows={snapshot[entity] as Row[]}
        query={query}
        setQuery={setQuery}
        setModal={setModal}
        runAction={runAction}
      />
    );
  }
  if (active === "users") {
    return (
      <UsersTable
        rows={snapshot.users}
        query={query}
        setQuery={setQuery}
        setModal={setModal}
      />
    );
  }
  if (active === "audit") {
    return (
      <AuditTable
        rows={snapshot.audit}
        statusHistory={snapshot.statusHistory ?? []}
        query={query}
        setQuery={setQuery}
      />
    );
  }
  if (active === "backup") {
    return <BackupPanel snapshot={snapshot} />;
  }
  return (
    <SettingsPanel
      snapshot={snapshot}
      runAction={runAction}
      busy={busy}
    />
  );
}

function Dashboard({
  snapshot,
  navigate,
}: {
  snapshot: Snapshot;
  navigate: (key: ModuleKey) => void;
}) {
  const [referenceTime] = useState(() => Date.now());
  const activeProducts = snapshot.products.filter((product) =>
    isActive(product.active),
  );
  const critical = activeProducts
    .filter(
      (product) => num(product.current_stock) <= num(product.min_stock),
    )
    .sort(
      (a, b) =>
        num(a.current_stock) - num(a.min_stock) -
        (num(b.current_stock) - num(b.min_stock)),
    );
  const stockValue = activeProducts.reduce(
    (sum, product) => sum + num(product.current_stock) * num(product.cost),
    0,
  );
  const openOrders = snapshot.sales.filter(
    (sale) => !["cancelada", "entregue"].includes(str(sale.status)),
  );
  const today = new Date().toISOString().slice(0, 10);
  const todayMovements = snapshot.movements.filter((movement) =>
    str(movement.created_at).startsWith(today),
  );
  const entries = todayMovements
    .filter((movement) =>
      ["entrada", "cancelamento"].includes(str(movement.type)),
    )
    .reduce((sum, movement) => sum + Math.max(0, num(movement.quantity)), 0);
  const outputs = Math.abs(
    todayMovements
      .filter((movement) => ["saida", "venda"].includes(str(movement.type)))
      .reduce((sum, movement) => sum + num(movement.quantity), 0),
  );
  const awaitingSeparation = openOrders.filter((sale) => sale.status === "aberta").length;
  const awaitingShipping = openOrders.filter((sale) =>
    ["separado", "conferido"].includes(str(sale.status)),
  ).length;
  const lastMovement = snapshot.movements[0]?.created_at;
  const physicalStock = activeProducts.reduce((sum, product) => sum + num(product.current_stock), 0);
  const reservedStock = activeProducts.reduce((sum, product) => sum + num(product.reserved_stock), 0);
  const blockedStock = activeProducts.reduce((sum, product) => sum + num(jsonRecord(product.extra_data).blocked_stock), 0);
  const transitStock = activeProducts.reduce((sum, product) => sum + num(jsonRecord(product.extra_data).transit_stock), 0);
  const availableStock = physicalStock - reservedStock - blockedStock;
  const expiryLimit = new Date(referenceTime);
  expiryLimit.setDate(expiryLimit.getDate() + num(snapshot.settings.expiry_alert_days || 30));
  const expiredProducts = activeProducts.filter((product) =>
    product.expiry_date && new Date(str(product.expiry_date)).getTime() < referenceTime,
  ).length;
  const expiringProducts = activeProducts.filter((product) => {
    if (!product.expiry_date) return false;
    const expiry = new Date(str(product.expiry_date)).getTime();
    return expiry >= referenceTime && expiry <= expiryLimit.getTime();
  }).length;
  const pendingApprovals = snapshot.workflows.filter(
    (record) => record.module === "approvals" && ["pendente", "em_analise"].includes(str(record.status)),
  ).length;

  const cards = [
    {
      label: "Produtos cadastrados",
      value: String(snapshot.products.length),
      note: `${activeProducts.length} ativos`,
      tone: "teal",
    },
    {
      label: "Valor em estoque",
      value: currency(stockValue),
      note: "Custo atual calculado",
      tone: "blue",
    },
    {
      label: "Pedidos em aberto",
      value: String(openOrders.length),
      note: `${openOrders.filter((sale) => sale.status === "aberta").length} para separar`,
      tone: "violet",
    },
    {
      label: "Produtos em alerta",
      value: String(critical.length),
      note: critical.length ? "Reposição recomendada" : "Estoque saudável",
      tone: "red",
    },
  ];

  return (
    <>
      <section className="operation-strip">
        <div><span>Para separar</span><strong>{awaitingSeparation}</strong></div>
        <div><span>Aguardando expedição</span><strong>{awaitingShipping}</strong></div>
        <div><span>Inventários pendentes</span><strong>{snapshot.inventories.filter((item) => str(item.status) === "pendente").length}</strong></div>
        <div><span>Última movimentação</span><strong>{lastMovement ? dateTime(lastMovement) : "Sem registro"}</strong></div>
      </section>
      <section className="stock-balance-strip">
        <div><span>Estoque físico</span><strong>{physicalStock}</strong></div>
        <div><span>Disponível</span><strong>{availableStock}</strong></div>
        <div><span>Reservado</span><strong>{reservedStock}</strong></div>
        <div><span>Bloqueado</span><strong>{blockedStock}</strong></div>
        <div><span>Em trânsito</span><strong>{transitStock}</strong></div>
        <div><span>Validade</span><strong>{expiredProducts} vencido(s) · {expiringProducts} próximo(s)</strong></div>
        <button onClick={() => navigate("approvals")}><span>Aprovações pendentes</span><strong>{pendingApprovals}</strong></button>
      </section>
      <section className="metric-grid">
        {cards.map((card) => (
          <article className={`metric-card tone-${card.tone}`} key={card.label}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.note}</span>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel panel-wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Estoque</p>
              <h2>Produtos que precisam de atenção</h2>
            </div>
            <button className="text-button" onClick={() => navigate("products")}>
              Ver produtos →
            </button>
          </div>
          {critical.length ? (
            <div className="attention-list">
              {critical.slice(0, 4).map((product) => (
                <div className="attention-row" key={str(product.id)}>
                  <span className="product-initial">{str(product.name)[0]}</span>
                  <div>
                    <strong>{str(product.name)}</strong>
                    <span>
                      {str(product.sku)} · {str(product.warehouse_name)} ·{" "}
                      {str(product.location)}
                    </span>
                  </div>
                  <div className="stock-copy">
                    <strong>
                      {num(product.current_stock)} {str(product.unit)}
                    </strong>
                    <span>Mínimo: {num(product.min_stock)}</span>
                  </div>
                  <span className="badge badge-danger">Crítico</span>
                </div>
              ))}
            </div>
          ) : (
            <SmallEmpty text="Nenhum produto crítico no momento." />
          )}
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Fluxo</p>
              <h2>Resumo de hoje</h2>
            </div>
          </div>
          <div className="flow-list">
            <div>
              <span className="flow-icon in">↙</span>
              <span>Entradas</span>
              <strong>{entries} un.</strong>
            </div>
            <div>
              <span className="flow-icon out">↗</span>
              <span>Saídas</span>
              <strong>{outputs} un.</strong>
            </div>
            <div>
              <span className="flow-icon reserve">◎</span>
              <span>Reservado</span>
              <strong>
                {activeProducts.reduce(
                  (sum, product) => sum + num(product.reserved_stock),
                  0,
                )}{" "}
                un.
              </strong>
            </div>
          </div>
          <button
            className="button button-secondary button-block"
            onClick={() => navigate("movements")}
          >
            Abrir movimentações
          </button>
        </article>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Histórico</p>
            <h2>Últimas movimentações</h2>
          </div>
          <button className="text-button" onClick={() => navigate("movements")}>
            Ver histórico →
          </button>
        </div>
        <MovementRows rows={snapshot.movements.slice(0, 6)} />
      </section>
    </>
  );
}

function ProductsTable({
  snapshot,
  query,
  setQuery,
  setModal,
  runAction,
}: {
  snapshot: Snapshot;
  query: string;
  setQuery: (value: string) => void;
  setModal: (modal: ModalState) => void;
  runAction: (
    action: string,
    payload: Record<string, unknown>,
    success: string,
  ) => Promise<void>;
}) {
  const rows = snapshot.products.filter((row) => rowMatches(row, query));
  return (
    <section className="panel">
      <FilterBar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar produto, SKU, código ou local"
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Local</th>
              <th>Estoque</th>
              <th>Preço</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => {
              const critical =
                isActive(product.active) &&
                num(product.current_stock) <= num(product.min_stock);
              return (
                <tr key={str(product.id)}>
                  <td>
                    <div className="product-cell">
                      <span className="product-initial">
                        {str(product.name)[0]}
                      </span>
                      <div>
                        <strong>{str(product.name)}</strong>
                        <span>
                          {str(product.sku)} · {str(product.code)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>{str(product.category_name) || "Sem categoria"}</td>
                  <td>
                    {str(product.warehouse_name) || "Não definido"}
                    <span className="cell-note">{str(product.location)}</span>
                  </td>
                  <td>
                    <strong>{num(product.current_stock)}</strong>{" "}
                    {str(product.unit)}
                    <span className="cell-note">
                      Mín. {num(product.min_stock)}
                    </span>
                  </td>
                  <td>{currency(product.price)}</td>
                  <td>
                    <span
                      className={`badge ${
                        !isActive(product.active)
                          ? "badge-neutral"
                          : critical
                            ? "badge-danger"
                            : "badge-success"
                      }`}
                    >
                      {!isActive(product.active)
                        ? "Inativo"
                        : critical
                          ? "Crítico"
                          : "Ativo"}
                    </span>
                  </td>
                  <td>
                    <div className="action-group">
                      <button
                        className="table-action"
                        onClick={() => setModal({ kind: "product", record: product })}
                      >
                        Editar
                      </button>
                      <button
                        className="table-action"
                        onClick={() =>
                          void runAction(
                            "toggle_product",
                            { id: product.id },
                            `Produto ${isActive(product.active) ? "inativado" : "reativado"}.`,
                          )
                        }
                      >
                        {isActive(product.active) ? "Inativar" : "Reativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TableFooter count={rows.length} label="produtos" />
    </section>
  );
}

function SalesTable({
  rows,
  query,
  setQuery,
  setModal,
}: {
  rows: Row[];
  query: string;
  setQuery: (value: string) => void;
  setModal: (modal: ModalState) => void;
}) {
  const filtered = rows.filter((row) => rowMatches(row, query));
  return (
    <section className="panel">
      <FilterBar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar venda, cliente, status ou vendedor"
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Venda</th>
              <th>Cliente</th>
              <th>Data</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Status</th>
              <th>Vendedor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sale) => (
              <tr key={str(sale.id)}>
                <td>
                  <strong>{str(sale.number)}</strong>
                </td>
                <td>{str(sale.client_name) || "Venda balcão"}</td>
                <td>{dateTime(sale.created_at)}</td>
                <td>{num(sale.item_count)}</td>
                <td>{currency(sale.total)}</td>
                <td>
                  <span className={`badge ${statusClass(sale.status)}`}>
                    {statusLabel(sale.status)}
                  </span>
                </td>
                <td>{str(sale.seller_email)}</td>
                <td>
                  {!["cancelada", "expedido", "entregue"].includes(
                    str(sale.status),
                  ) && (
                    <button
                      className="table-action danger-text"
                      onClick={() => setModal({ kind: "cancel-sale", record: sale })}
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TableFooter count={filtered.length} label="vendas" />
    </section>
  );
}

function PurchasesTable({
  rows,
  query,
  setQuery,
}: {
  rows: Row[];
  query: string;
  setQuery: (value: string) => void;
}) {
  const filtered = rows.filter((row) => rowMatches(row, query));
  return (
    <section className="panel">
      <FilterBar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar compra, documento ou fornecedor"
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Compra</th>
              <th>Fornecedor</th>
              <th>Documento</th>
              <th>Recebimento</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Status</th>
              <th>Responsável</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((purchase) => (
              <tr key={str(purchase.id)}>
                <td>
                  <strong>{str(purchase.number)}</strong>
                </td>
                <td>{str(purchase.supplier_name) || "Não informado"}</td>
                <td>{str(purchase.document) || "—"}</td>
                <td>{dateTime(purchase.received_at)}</td>
                <td>{num(purchase.item_count)}</td>
                <td>{currency(purchase.total)}</td>
                <td>
                  <span className={`badge ${statusClass(purchase.status)}`}>
                    {statusLabel(purchase.status)}
                  </span>
                </td>
                <td>{str(purchase.responsible_email)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TableFooter count={filtered.length} label="compras" />
    </section>
  );
}

function MovementsTable({
  rows,
  query,
  setQuery,
}: {
  rows: Row[];
  query: string;
  setQuery: (value: string) => void;
}) {
  const filtered = rows.filter((row) => rowMatches(row, query));
  return (
    <section className="panel">
      <FilterBar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar produto, tipo, motivo ou referência"
      />
      <MovementRows rows={filtered} />
      <TableFooter count={filtered.length} label="movimentações" />
    </section>
  );
}

function MovementRows({ rows }: { rows: Row[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Saldo</th>
            <th>Referência</th>
            <th>Responsável</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((movement) => (
            <tr key={str(movement.id)}>
              <td>{dateTime(movement.created_at)}</td>
              <td>
                <span className={`badge ${statusClass(movement.type)}`}>
                  {statusLabel(movement.type)}
                </span>
              </td>
              <td>
                <strong>{str(movement.product_name)}</strong>
                <span className="cell-note">{str(movement.product_sku)}</span>
              </td>
              <td className={num(movement.quantity) < 0 ? "negative" : "positive"}>
                {num(movement.quantity) > 0 ? "+" : ""}
                {num(movement.quantity)}
              </td>
              <td>{num(movement.new_stock)}</td>
              <td>
                {str(movement.reference) || "—"}
                <span className="cell-note">{str(movement.reason)}</span>
              </td>
              <td>{str(movement.user_email)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InventoriesTable({
  rows,
  query,
  setQuery,
  runAction,
  busy,
}: {
  rows: Row[];
  query: string;
  setQuery: (value: string) => void;
  runAction: (
    action: string,
    payload: Record<string, unknown>,
    success: string,
  ) => Promise<void>;
  busy: boolean;
}) {
  const filtered = rows.filter((row) => rowMatches(row, query));
  return (
    <section className="panel">
      <FilterBar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar inventário, produto ou responsável"
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Inventário</th>
              <th>Produto</th>
              <th>Esperado</th>
              <th>Contado</th>
              <th>Divergência</th>
              <th>Responsável</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inventory) => (
              <tr key={str(inventory.id)}>
                <td>
                  <strong>{str(inventory.number)}</strong>
                  <span className="cell-note">{dateTime(inventory.created_at)}</span>
                </td>
                <td>{str(inventory.product_name)}</td>
                <td>{num(inventory.expected_stock)}</td>
                <td>{num(inventory.counted_stock)}</td>
                <td
                  className={
                    num(inventory.difference) === 0
                      ? ""
                      : num(inventory.difference) > 0
                        ? "positive"
                        : "negative"
                  }
                >
                  {num(inventory.difference) > 0 ? "+" : ""}
                  {num(inventory.difference)}
                </td>
                <td>{str(inventory.counter_email)}</td>
                <td>
                  <span className={`badge ${statusClass(inventory.status)}`}>
                    {statusLabel(inventory.status)}
                  </span>
                </td>
                <td>
                  {inventory.status === "pendente" && (
                    <button
                      disabled={busy}
                      className="table-action"
                      onClick={() =>
                        void runAction(
                          "apply_inventory",
                          { id: inventory.id },
                          "Inventário aprovado e saldo ajustado.",
                        )
                      }
                    >
                      Aprovar ajuste
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TableFooter count={filtered.length} label="inventários" />
    </section>
  );
}

function OrderQueue({
  mode,
  rows,
  shipments = [],
  runAction,
  setModal,
  busy,
}: {
  mode: "separation" | "shipping";
  rows: Row[];
  shipments?: Row[];
  runAction: (
    action: string,
    payload: Record<string, unknown>,
    success: string,
  ) => Promise<void>;
  setModal: (modal: ModalState) => void;
  busy: boolean;
}) {
  const allowed =
    mode === "separation"
      ? ["aberta", "em_separacao", "separado", "conferido"]
      : ["separado", "conferido", "expedido", "entregue"];
  const queue = rows.filter((sale) => allowed.includes(str(sale.status)));
  return (
    <section className="panel">
      <div className="queue-summary">
        <div>
          <span className="status-dot" />
          {queue.length} pedido(s) nesta etapa
        </div>
        <span>Fluxo controlado: aberto → separação → conferido → expedido</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Data</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Status</th>
              <th>Próxima ação</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((sale) => {
              const status = str(sale.status);
              const shipment = shipments.find(
                (item) => num(item.sale_id) === num(sale.id),
              );
              return (
                <tr key={str(sale.id)}>
                  <td>
                    <strong>{str(sale.number)}</strong>
                  </td>
                  <td>{str(sale.client_name) || "Venda balcão"}</td>
                  <td>{dateTime(sale.created_at)}</td>
                  <td>{num(sale.item_count)}</td>
                  <td>{currency(sale.total)}</td>
                  <td>
                    <span className={`badge ${statusClass(status)}`}>
                      {statusLabel(status)}
                    </span>
                    {shipment && (
                      <span className="cell-note">
                        {str(shipment.carrier)} · {str(shipment.tracking_code)}
                      </span>
                    )}
                  </td>
                  <td>
                    {mode === "separation" && status === "aberta" && (
                      <StepButton
                        busy={busy}
                        label="Iniciar separação"
                        onClick={() =>
                          runAction(
                            "update_order_status",
                            { id: sale.id, status: "em_separacao" },
                            "Separação iniciada.",
                          )
                        }
                      />
                    )}
                    {mode === "separation" && status === "em_separacao" && (
                      <StepButton
                        busy={busy}
                        label="Marcar separado"
                        onClick={() =>
                          runAction(
                            "update_order_status",
                            { id: sale.id, status: "separado" },
                            "Pedido separado.",
                          )
                        }
                      />
                    )}
                    {mode === "separation" && status === "separado" && (
                      <StepButton
                        busy={busy}
                        label="Confirmar conferência"
                        onClick={() =>
                          runAction(
                            "update_order_status",
                            { id: sale.id, status: "conferido" },
                            "Pedido conferido.",
                          )
                        }
                      />
                    )}
                    {mode === "shipping" &&
                      ["separado", "conferido"].includes(status) && (
                        <button
                          className="button button-primary button-small"
                          onClick={() =>
                            setModal({ kind: "shipment", record: sale })
                          }
                        >
                          Expedir pedido
                        </button>
                      )}
                    {mode === "shipping" && status === "expedido" && (
                      <StepButton
                        busy={busy}
                        label="Confirmar entrega"
                        onClick={() =>
                          runAction(
                            "update_order_status",
                            { id: sale.id, status: "entregue" },
                            "Entrega concluída.",
                          )
                        }
                      />
                    )}
                    {mode === "shipping" && status === "entregue" && (
                      <span className="positive">Entrega concluída</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!queue.length && <SmallEmpty text="Nenhum pedido nesta etapa." />}
    </section>
  );
}

function Reports({ snapshot }: { snapshot: Snapshot }) {
  const activeProducts = snapshot.products.filter((row) => isActive(row.active));
  const stockValue = activeProducts.reduce(
    (sum, row) => sum + num(row.current_stock) * num(row.cost),
    0,
  );
  const salesTotal = snapshot.sales
    .filter((sale) => sale.status !== "cancelada")
    .reduce((sum, sale) => sum + num(sale.total), 0);
  const critical = activeProducts.filter(
    (row) => num(row.current_stock) <= num(row.min_stock),
  );
  const abcRows: Array<Row & { stockValue: number }> = [...activeProducts]
    .map((product): Row & { stockValue: number } => ({
      ...product,
      stockValue: num(product.current_stock) * num(product.cost),
    }))
    .sort((a, b) => b.stockValue - a.stockValue);
  const maxStockValue = abcRows[0]?.stockValue || 1;

  function exportCsv() {
    const header = ["Produto", "SKU", "Saldo", "Mínimo", "Custo", "Preço", "Status"];
    const lines = snapshot.products.map((product) => [
      str(product.name),
      str(product.sku),
      str(product.current_stock),
      str(product.min_stock),
      str(product.cost),
      str(product.price),
      isActive(product.active) ? "Ativo" : "Inativo",
    ]);
    download(
      "relatorio-produtos-stock-erp.csv",
      [header, ...lines]
        .map((line) => line.map((value) => `"${value.replaceAll('"', '""')}"`).join(";"))
        .join("\n"),
      "text/csv;charset=utf-8",
    );
  }

  return (
    <>
      <section className="mini-metric-grid report-metrics">
        <article className="mini-metric">
          <span>Produtos monitorados</span>
          <strong>{activeProducts.length}</strong>
        </article>
        <article className="mini-metric">
          <span>Valor do estoque</span>
          <strong>{currency(stockValue)}</strong>
        </article>
        <article className="mini-metric">
          <span>Vendas registradas</span>
          <strong>{currency(salesTotal)}</strong>
        </article>
        <article className="mini-metric">
          <span>Itens críticos</span>
          <strong>{critical.length}</strong>
        </article>
      </section>
      <section className="report-actions">
        <div><strong>Relatórios gerenciais</strong><span>Base atualizada do estoque e da operação</span></div>
        <div>
          <button className="button button-secondary" onClick={() => window.print()}>Imprimir / PDF</button>
          <button className="button button-primary" onClick={exportCsv}>Exportar CSV</button>
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Relatório crítico</p>
            <h2>Produtos abaixo do estoque mínimo</h2>
          </div>
          <span className="report-context">{critical.length} item(ns) exigem análise</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>SKU</th>
                <th>Saldo</th>
                <th>Mínimo</th>
                <th>Reposição sugerida</th>
                <th>Fornecedor</th>
              </tr>
            </thead>
            <tbody>
              {critical.map((product) => (
                <tr key={str(product.id)}>
                  <td>
                    <strong>{str(product.name)}</strong>
                  </td>
                  <td>{str(product.sku)}</td>
                  <td className="negative">{num(product.current_stock)}</td>
                  <td>{num(product.min_stock)}</td>
                  <td>
                    {Math.max(
                      0,
                      num(product.min_stock) * 2 - num(product.current_stock),
                    )}
                  </td>
                  <td>{str(product.supplier_name) || "Sem fornecedor"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel abc-report">
        <div className="panel-heading"><div><h2>Curva de valor estocado</h2><p>Itens de maior impacto financeiro no saldo atual</p></div></div>
        <div>
          {abcRows.slice(0, 8).map((product, index) => (
            <article key={str(product.id)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{str(product.name)}</strong><small>{str(product.sku)} · {num(product.current_stock)} {str(product.unit)}</small></div>
              <div className="report-bar"><span style={{ width: `${product.stockValue / maxStockValue * 100}%` }} /></div>
              <strong>{currency(product.stockValue)}</strong>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function EntityTable({
  entity,
  rows,
  query,
  setQuery,
  setModal,
  runAction,
}: {
  entity: "categories" | "brands" | "suppliers" | "clients" | "warehouses";
  rows: Row[];
  query: string;
  setQuery: (value: string) => void;
  setModal: (modal: ModalState) => void;
  runAction: (
    action: string,
    payload: Record<string, unknown>,
    success: string,
  ) => Promise<void>;
}) {
  const filtered = rows.filter((row) => rowMatches(row, query));
  return (
    <section className="panel">
      <FilterBar
        query={query}
        setQuery={setQuery}
        placeholder={`Buscar em ${moduleMeta[entity].title.toLowerCase()}`}
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              {["suppliers", "clients"].includes(entity) && <th>Documento</th>}
              {["suppliers", "clients"].includes(entity) && <th>Contato</th>}
              {entity === "warehouses" && <th>Código</th>}
              <th>Descrição / Endereço</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={str(row.id)}>
                <td>
                  <strong>{str(row.name)}</strong>
                </td>
                {["suppliers", "clients"].includes(entity) && (
                  <td>{str(row.document) || "—"}</td>
                )}
                {["suppliers", "clients"].includes(entity) && (
                  <td>
                    {str(row.phone) || "—"}
                    <span className="cell-note">{str(row.email)}</span>
                  </td>
                )}
                {entity === "warehouses" && <td>{str(row.code) || "—"}</td>}
                <td>{str(row.description) || str(row.address) || "—"}</td>
                <td>
                  <span
                    className={`badge ${
                      isActive(row.active) ? "badge-success" : "badge-neutral"
                    }`}
                  >
                    {isActive(row.active) ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td>
                  <div className="action-group">
                    <button
                      className="table-action"
                      onClick={() =>
                        setModal({ kind: "entity", entity, record: row })
                      }
                    >
                      Editar
                    </button>
                    <button
                      className="table-action"
                      onClick={() =>
                        void runAction(
                          "toggle_entity",
                          { entity, id: row.id },
                          `Registro ${isActive(row.active) ? "inativado" : "reativado"}.`,
                        )
                      }
                    >
                      {isActive(row.active) ? "Inativar" : "Reativar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TableFooter count={filtered.length} label={moduleMeta[entity].title.toLowerCase()} />
    </section>
  );
}

function UsersTable({
  rows,
  query,
  setQuery,
  setModal,
}: {
  rows: Row[];
  query: string;
  setQuery: (value: string) => void;
  setModal: (modal: ModalState) => void;
}) {
  const filtered = rows.filter((row) => rowMatches(row, query));
  return (
    <>
      <section className="role-grid">
        {[
          ["Administrador", "Acesso total e configurações"],
          ["Gerente", "Operação, indicadores e aprovações"],
          ["Operador", "Movimentações e inventários"],
          ["Comprador", "Cotações, compras e fornecedores"],
          ["Vendedor", "Vendas e consulta de produtos"],
          ["Separador", "Fila FIFO, leitura e divergências"],
          ["Conferente", "Conferência cega e qualidade"],
          ["Expedidor", "Volumes, expedição e entrega"],
          ["Financeiro", "Contas, caixa e conciliação"],
          ["Auditor", "Relatórios e trilha de auditoria"],
        ].map(([title, description]) => (
          <article key={title}>
            <span>{title[0]}</span>
            <div>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </section>
      <section className="panel">
        <FilterBar
          query={query}
          setQuery={setQuery}
          placeholder="Buscar usuário, e-mail ou perfil"
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Último acesso</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={str(user.email)}>
                  <td>
                    <strong>{str(user.full_name)}</strong>
                  </td>
                  <td>{str(user.email)}</td>
                  <td>{roleNames[str(user.role)] || str(user.role)}</td>
                  <td>{dateTime(user.last_access)}</td>
                  <td>
                    <span className={`badge ${statusClass(user.status)}`}>
                      {statusLabel(user.status)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="table-action"
                      onClick={() => setModal({ kind: "user", record: user })}
                    >
                      Editar acesso
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function AuditTable({
  rows,
  statusHistory,
  query,
  setQuery,
}: {
  rows: Row[];
  statusHistory: Row[];
  query: string;
  setQuery: (value: string) => void;
}) {
  const filtered = rows.filter((row) => rowMatches(row, query));
  return (
    <>
    <section className="panel">
      <FilterBar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar ação, módulo, usuário ou descrição"
      />
      <div className="audit-notice">
        <span>◉</span>
        <div>
          <strong>Trilha de auditoria protegida</strong>
          <p>
            Os registros abaixo são somente leitura e preservam usuário, data,
            módulo e alteração realizada.
          </p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Ação</th>
              <th>Módulo</th>
              <th>Descrição</th>
              <th>Origem / destino</th>
              <th>Contexto</th>
              <th>Usuário</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={str(log.id)}>
                <td>{dateTime(log.created_at)}</td>
                <td>
                  <span className="badge badge-neutral">{str(log.action)}</span>
                </td>
                <td>{statusLabel(log.module)}</td>
                <td>{str(log.description)}<span className="cell-note">Registro {str(log.record_id) || "—"} · {str(log.result) || "sucesso"}</span></td>
                <td>{str(log.origin) || "—"}<span className="cell-note">{str(log.destination) ? `→ ${str(log.destination)}` : "Sem destino"}</span></td>
                <td>{str(log.document_reference) || "Sem documento"}<span className="cell-note">IP {str(log.ip_address) || "não informado"} · {str(log.endpoint) || "/api/erp"}</span></td>
                <td>{str(log.user_email)}<span className="cell-note" title={str(log.device)}>{str(log.device).slice(0, 38) || "Dispositivo não informado"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TableFooter count={filtered.length} label="eventos" />
    </section>
    <section className="panel">
      <div className="panel-heading"><div><p className="eyebrow">Linha do tempo</p><h2>Histórico de status</h2><p>Status anterior, novo status, responsável e observação.</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>Registro</th><th>Anterior</th><th>Novo status</th><th>Responsável / observação</th></tr></thead><tbody>
        {statusHistory.slice(0, 100).map((item) => <tr key={str(item.id)}>
          <td>{dateTime(item.created_at)}</td><td>{statusLabel(item.entity_type)}</td><td>{str(item.entity_id)}</td><td>{statusLabel(item.previous_status) || "Criação"}</td>
          <td><span className={`badge ${statusClass(item.new_status)}`}>{statusLabel(item.new_status)}</span></td>
          <td>{str(item.user_email)}<span className="cell-note">{str(item.observation) || "Sem observação"}</span></td>
        </tr>)}
      </tbody></table></div>
    </section>
    </>
  );
}

function SettingsPanel({
  snapshot,
  runAction,
  busy,
}: {
  snapshot: Snapshot;
  runAction: (
    action: string,
    payload: Record<string, unknown>,
    success: string,
  ) => Promise<void>;
  busy: boolean;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void runAction(
      "save_settings",
      {
        company_name: form.get("company_name"),
        company_document: form.get("company_document"),
        document_prefix: form.get("document_prefix"),
        default_min_stock: form.get("default_min_stock"),
        max_discount_percent: form.get("max_discount_percent"),
        expiry_alert_days: form.get("expiry_alert_days"),
        allow_negative_stock: form.get("allow_negative_stock") === "on",
        cost_method: form.get("cost_method"),
        purchase_approval_limit: form.get("purchase_approval_limit"),
        reservation_expiry_hours: form.get("reservation_expiry_hours"),
        picking_strategy: form.get("picking_strategy"),
        blind_inventory: form.get("blind_inventory") === "on",
        notification_email: form.get("notification_email"),
        backup_retention_days: form.get("backup_retention_days"),
        session_timeout_minutes: form.get("session_timeout_minutes"),
      },
      "Configurações atualizadas.",
    );
  }

  return (
    <div className="settings-grid">
      <form className="panel settings-form" onSubmit={submit}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Regras da empresa</p>
            <h2>Estoque e vendas</h2>
          </div>
        </div>
        <div className="form-body form-grid">
          <Field label="Nome da empresa" className="field-span-2">
            <input
              name="company_name"
              defaultValue={snapshot.settings.company_name}
              required
            />
          </Field>
          <Field label="CNPJ / documento"><input name="company_document" defaultValue={snapshot.settings.company_document} /></Field>
          <Field label="Prefixo de documentos"><input name="document_prefix" defaultValue={snapshot.settings.document_prefix || "STK"} /></Field>
          <Field label="Estoque mínimo padrão">
            <input
              type="number"
              min="0"
              name="default_min_stock"
              defaultValue={snapshot.settings.default_min_stock}
              required
            />
          </Field>
          <Field label="Desconto máximo (%)">
            <input
              type="number"
              min="0"
              max="100"
              name="max_discount_percent"
              defaultValue={snapshot.settings.max_discount_percent}
              required
            />
          </Field>
          <Field label="Alerta de validade (dias)">
            <input
              type="number"
              min="0"
              name="expiry_alert_days"
              defaultValue={snapshot.settings.expiry_alert_days}
              required
            />
          </Field>
          <Field label="Método de custo"><select name="cost_method" defaultValue={snapshot.settings.cost_method || "medio"}><option value="medio">Custo médio</option><option value="ultimo">Último custo</option><option value="fifo">FIFO</option><option value="lote">Por lote</option></select></Field>
          <Field label="Limite de compra sem aprovação"><input type="number" min="0" step="0.01" name="purchase_approval_limit" defaultValue={snapshot.settings.purchase_approval_limit || "3000"} /></Field>
          <Field label="Validade da reserva (horas)"><input type="number" min="1" name="reservation_expiry_hours" defaultValue={snapshot.settings.reservation_expiry_hours || "48"} /></Field>
          <Field label="Estratégia de separação"><select name="picking_strategy" defaultValue={snapshot.settings.picking_strategy || "FIFO"}><option value="FIFO">FIFO</option><option value="FEFO">FEFO</option><option value="rota">Rota por localização</option></select></Field>
          <Field label="E-mail para alertas" className="field-span-2"><input type="email" name="notification_email" defaultValue={snapshot.settings.notification_email} /></Field>
          <Field label="Retenção de backup (dias)"><input type="number" min="1" name="backup_retention_days" defaultValue={snapshot.settings.backup_retention_days || "30"} /></Field>
          <Field label="Expiração de sessão (min)"><input type="number" min="5" name="session_timeout_minutes" defaultValue={snapshot.settings.session_timeout_minutes || "60"} /></Field>
          <label className="check-card field-span-2">
            <input
              type="checkbox"
              name="allow_negative_stock"
              defaultChecked={snapshot.settings.allow_negative_stock === "true"}
            />
            <span>
              <strong>Permitir estoque negativo</strong>
              <small>
                Operações continuam sendo registradas e auditadas. Recomenda-se
                manter desativado.
              </small>
            </span>
          </label>
          <label className="check-card field-span-2">
            <input type="checkbox" name="blind_inventory" defaultChecked={snapshot.settings.blind_inventory !== "false"} />
            <span><strong>Inventário cego</strong><small>Oculta o saldo esperado do contador.</small></span>
          </label>
        </div>
        <div className="form-actions">
          <button className="button button-primary" disabled={busy}>
            {busy ? "Salvando…" : "Salvar configurações"}
          </button>
        </div>
      </form>
    </div>
  );
}

function BackupPanel({ snapshot }: { snapshot: Snapshot }) {
  const [backupBusy, setBackupBusy] = useState(false);

  async function exportBackup() {
    setBackupBusy(true);
    try {
      const response = await fetch("/api/erp?backup=native", { cache: "no-store" });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(result?.error || "Não foi possível gerar o backup.");
      }
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename =
        disposition.match(/filename="?([^";]+)"?/i)?.[1] ??
        `backup-stock-erp-${new Date().toISOString().slice(0, 10)}.sql`;
      downloadBlob(filename, await response.blob());
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Não foi possível gerar o backup.",
      );
    } finally {
      setBackupBusy(false);
    }
  }

  return (
    <div className="settings-grid">
      <section className="panel backup-card">
        <div>
          <span className="backup-icon">⇩</span>
          <p className="eyebrow">Backup e recuperação</p>
          <h2>Exportar cópia dos dados</h2>
          <p>
            Gere uma cópia completa e restaurável no formato do banco conectado
            (.sql para MySQL, PostgreSQL e SQLite/D1; .bacpac para SQL Server).
          </p>
        </div>
        <button
          className="button button-secondary"
          onClick={() => void exportBackup()}
          disabled={backupBusy}
        >
          {backupBusy ? "Gerando backup…" : "Gerar backup agora"}
        </button>
      </section>
      <section className="panel backup-card">
        <div>
          <span className="backup-icon">⌁</span>
          <p className="eyebrow">Fonte de dados</p>
          <h2>{snapshot.dataSource?.label ?? "Banco interno"}</h2>
          <p>
            {snapshot.dataSource?.mode === "external-api"
              ? "O Stock ERP está conectado ao adaptador seguro do banco de dados existente."
              : "O sistema está usando o banco interno. Para conectar MySQL, PostgreSQL ou SQL Server, configure o adaptador incluído no pacote do projeto."}
          </p>
        </div>
        <span
          className={`badge ${
            snapshot.dataSource?.status === "error"
              ? "badge-danger"
              : "badge-success"
          }`}
        >
          {snapshot.dataSource?.status === "error" ? "Erro" : "Conectado"}
        </span>
      </section>
    </div>
  );
}

function ModalContent({
  modal,
  snapshot,
  runAction,
  busy,
}: {
  modal: ModalState;
  snapshot: Snapshot;
  runAction: (
    action: string,
    payload: Record<string, unknown>,
    success: string,
  ) => Promise<void>;
  busy: boolean;
}) {
  if (modal.kind === "product") {
    return (
      <ProductForm
        record={modal.record}
        snapshot={snapshot}
        busy={busy}
        onSubmit={(payload) =>
          runAction(
            "save_product",
            payload,
            modal.record ? "Produto atualizado." : "Produto cadastrado.",
          )
        }
      />
    );
  }
  if (modal.kind === "movement") {
    return (
      <MovementForm
        products={snapshot.products}
        warehouses={snapshot.warehouses}
        busy={busy}
        onSubmit={(payload) =>
          runAction("create_movement", payload, "Movimentação registrada.")
        }
      />
    );
  }
  if (modal.kind === "sale") {
    return (
      <ItemsOperationForm
        mode="sale"
        snapshot={snapshot}
        busy={busy}
        onSubmit={(payload) =>
          runAction("create_sale", payload, "Venda finalizada e estoque atualizado.")
        }
      />
    );
  }
  if (modal.kind === "purchase") {
    return (
      <ItemsOperationForm
        mode="purchase"
        snapshot={snapshot}
        busy={busy}
        onSubmit={(payload) =>
          runAction(
            "create_purchase",
            payload,
            "Compra recebida e estoque atualizado.",
          )
        }
      />
    );
  }
  if (modal.kind === "inventory") {
    return (
      <InventoryForm
        products={snapshot.products}
        busy={busy}
        onSubmit={(payload) =>
          runAction(
            "create_inventory",
            payload,
            "Contagem registrada para aprovação.",
          )
        }
      />
    );
  }
  if (modal.kind === "shipment") {
    return (
      <ShipmentForm
        sale={modal.record}
        busy={busy}
        onSubmit={(payload) =>
          runAction(
            "update_order_status",
            { ...payload, id: modal.record.id, status: "expedido" },
            "Pedido expedido.",
          )
        }
      />
    );
  }
  if (modal.kind === "cancel-sale") {
    return (
      <CancelSaleForm
        sale={modal.record}
        busy={busy}
        onSubmit={(payload) =>
          runAction(
            "cancel_sale",
            { ...payload, id: modal.record.id },
            "Venda cancelada e itens devolvidos ao estoque.",
          )
        }
      />
    );
  }
  if (modal.kind === "entity") {
    return (
      <EntityForm
        entity={modal.entity}
        record={modal.record}
        busy={busy}
        onSubmit={(payload) =>
          runAction(
            "save_entity",
            { ...payload, entity: modal.entity, id: modal.record?.id },
            modal.record ? "Cadastro atualizado." : "Cadastro concluído.",
          )
        }
      />
    );
  }
  return (
    <UserForm
      record={modal.record}
      busy={busy}
      onSubmit={(payload) =>
        runAction("save_user", payload, "Acesso do usuário atualizado.")
      }
    />
  );
}

function ProductForm({
  record,
  snapshot,
  onSubmit,
  busy,
}: {
  record?: Row;
  snapshot: Snapshot;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  const extra = jsonRecord(record?.extra_data);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = Object.fromEntries(form.entries());
    payload.id = record?.id;
    payload.active = form.get("active") === "on";
    payload.lot_control = form.get("lot_control") === "on";
    payload.serial_control = form.get("serial_control") === "on";
    payload.allow_negative = form.get("allow_negative") === "on";
    payload.sale_blocked = form.get("sale_blocked") === "on";
    payload.purchase_blocked = form.get("purchase_blocked") === "on";
    void onSubmit(payload);
  }
  return (
    <form onSubmit={submit}>
      <div className="form-body form-grid">
        <Field label="Código interno">
          <input name="code" defaultValue={str(record?.code)} required />
        </Field>
        <Field label="SKU">
          <input name="sku" defaultValue={str(record?.sku)} required />
        </Field>
        <Field label="Código de barras">
          <input name="barcode" defaultValue={str(record?.barcode)} />
        </Field>
        <Field label="Nome do produto" className="field-span-2">
          <input name="name" defaultValue={str(record?.name)} required />
        </Field>
        <Field label="Unidade">
          <select name="unit" defaultValue={str(record?.unit) || "UN"}>
            <option value="UN">Unidade (UN)</option>
            <option value="CX">Caixa (CX)</option>
            <option value="KG">Quilo (KG)</option>
            <option value="L">Litro (L)</option>
            <option value="PAR">Par (PAR)</option>
          </select>
        </Field>
        <Field label="Categoria">
          <select
            name="category_id"
            defaultValue={str(record?.category_id)}
            required
          >
            <option value="">Selecione</option>
            {snapshot.categories
              .filter((row) => isActive(row.active))
              .map((row) => (
                <option key={str(row.id)} value={str(row.id)}>
                  {str(row.name)}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Marca">
          <select name="brand_id" defaultValue={str(record?.brand_id)}>
            <option value="">Sem marca</option>
            {snapshot.brands
              .filter((row) => isActive(row.active))
              .map((row) => (
                <option key={str(row.id)} value={str(row.id)}>
                  {str(row.name)}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Fornecedor">
          <select name="supplier_id" defaultValue={str(record?.supplier_id)}>
            <option value="">Sem fornecedor</option>
            {snapshot.suppliers
              .filter((row) => isActive(row.active))
              .map((row) => (
                <option key={str(row.id)} value={str(row.id)}>
                  {str(row.name)}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Armazém">
          <select name="warehouse_id" defaultValue={str(record?.warehouse_id)}>
            <option value="">Selecione</option>
            {snapshot.warehouses
              .filter((row) => isActive(row.active))
              .map((row) => (
                <option key={str(row.id)} value={str(row.id)}>
                  {str(row.name)}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Local interno">
          <input
            name="location"
            defaultValue={str(record?.location)}
            placeholder="Ex.: A-01"
          />
        </Field>
        <Field label="Custo">
          <input
            type="number"
            min="0"
            step="0.01"
            name="cost"
            defaultValue={str(record?.cost) || "0"}
            required
          />
        </Field>
        <Field label="Preço de venda">
          <input
            type="number"
            min="0"
            step="0.01"
            name="price"
            defaultValue={str(record?.price) || "0"}
            required
          />
        </Field>
        <Field label="Estoque mínimo">
          <input
            type="number"
            min="0"
            step="0.01"
            name="min_stock"
            defaultValue={
              str(record?.min_stock) ||
              snapshot.settings.default_min_stock ||
              "0"
            }
            required
          />
        </Field>
        {!record && (
          <Field label="Estoque inicial">
            <input
              type="number"
              min="0"
              step="0.01"
              name="current_stock"
              defaultValue="0"
              required
            />
          </Field>
        )}
        <Field label="Data de validade">
          <input
            type="date"
            name="expiry_date"
            defaultValue={str(record?.expiry_date)}
          />
        </Field>
        <Field label="URL da imagem">
          <input name="image_url" defaultValue={str(record?.image_url)} />
        </Field>
        <Field label="Descrição" className="field-span-3">
          <textarea
            name="description"
            rows={3}
            defaultValue={str(record?.description)}
          />
        </Field>
        <div className="form-section-title field-span-3"><strong>Identificação avançada</strong><span>Classificação comercial e apresentação.</span></div>
        <Field label="Subcategoria"><input name="subcategory" defaultValue={str(extra.subcategory)} /></Field>
        <Field label="Fabricante"><input name="manufacturer" defaultValue={str(extra.manufacturer)} /></Field>
        <Field label="Modelo"><input name="model" defaultValue={str(extra.model)} /></Field>
        <Field label="Tipo do produto"><select name="product_type" defaultValue={str(extra.product_type) || "simples"}><option value="simples">Simples</option><option value="composto">Composto</option><option value="kit">Kit</option><option value="variacao">Variação</option><option value="materia_prima">Matéria-prima</option><option value="produto_final">Produto final</option></select></Field>
        <Field label="Descrição resumida" className="field-span-2"><input name="short_description" defaultValue={str(extra.short_description)} /></Field>
        <Field label="Descrição completa" className="field-span-3"><textarea name="full_description" rows={2} defaultValue={str(extra.full_description)} /></Field>
        <div className="form-section-title field-span-3"><strong>Preços, margem e reposição</strong><span>Custos históricos, limites comerciais e políticas de estoque.</span></div>
        <Field label="Custo médio"><input type="number" min="0" step="0.01" name="average_cost" defaultValue={str(extra.average_cost) || str(record?.cost) || "0"} /></Field>
        <Field label="Último custo"><input type="number" min="0" step="0.01" name="last_purchase_cost" defaultValue={str(extra.last_purchase_cost) || "0"} /></Field>
        <Field label="Preço mínimo"><input type="number" min="0" step="0.01" name="minimum_price" defaultValue={str(extra.minimum_price) || "0"} /></Field>
        <Field label="Desconto máximo (%)"><input type="number" min="0" max="100" step="0.01" name="maximum_discount" defaultValue={str(extra.maximum_discount) || "0"} /></Field>
        <Field label="Comissão (%)"><input type="number" min="0" max="100" step="0.01" name="commission" defaultValue={str(extra.commission) || "0"} /></Field>
        <Field label="Tabela de preços"><input name="price_table" defaultValue={str(extra.price_table)} /></Field>
        <Field label="Promoção" className="field-span-3"><input name="promotion" defaultValue={str(extra.promotion)} /></Field>
        <Field label="Estoque bloqueado"><input type="number" min="0" step="0.01" name="blocked_stock" defaultValue={str(extra.blocked_stock) || "0"} /></Field>
        <Field label="Estoque em trânsito"><input type="number" min="0" step="0.01" name="transit_stock" defaultValue={str(extra.transit_stock) || "0"} /></Field>
        <Field label="Estoque máximo"><input type="number" min="0" step="0.01" name="maximum_stock" defaultValue={str(extra.maximum_stock) || "0"} /></Field>
        <Field label="Ponto de reposição"><input type="number" min="0" step="0.01" name="reorder_point" defaultValue={str(extra.reorder_point) || "0"} /></Field>
        <Field label="Compra ideal"><input type="number" min="0" step="0.01" name="ideal_purchase_quantity" defaultValue={str(extra.ideal_purchase_quantity) || "0"} /></Field>
        <Field label="Reposição (dias)"><input type="number" min="0" name="lead_time_days" defaultValue={str(extra.lead_time_days) || "0"} /></Field>
        <Field label="Curva ABC"><select name="abc_class" defaultValue={str(extra.abc_class)}><option value="">Automática</option><option value="A">Classe A</option><option value="B">Classe B</option><option value="C">Classe C</option></select></Field>
        <Field label="Grade / variações" className="field-span-2"><input name="grade" defaultValue={str(extra.grade)} placeholder="Cor, tamanho, voltagem" /></Field>
        <div className="form-section-title field-span-3"><strong>Dados físicos e fiscais</strong><span>Cubagem, embalagem e documentos fiscais.</span></div>
        <Field label="Peso (kg)"><input type="number" min="0" step="0.001" name="weight" defaultValue={str(extra.weight) || "0"} /></Field>
        <Field label="Altura (cm)"><input type="number" min="0" step="0.01" name="height" defaultValue={str(extra.height) || "0"} /></Field>
        <Field label="Largura (cm)"><input type="number" min="0" step="0.01" name="width" defaultValue={str(extra.width) || "0"} /></Field>
        <Field label="Comprimento (cm)"><input type="number" min="0" step="0.01" name="length" defaultValue={str(extra.length) || "0"} /></Field>
        <Field label="Volume"><input type="number" min="0" step="0.001" name="volume" defaultValue={str(extra.volume) || "0"} /></Field>
        <Field label="Embalagem"><input name="package_type" defaultValue={str(extra.package_type)} /></Field>
        <Field label="Qtd. por caixa"><input type="number" min="0" name="units_per_box" defaultValue={str(extra.units_per_box) || "0"} /></Field>
        <Field label="Qtd. por pacote"><input type="number" min="0" name="units_per_package" defaultValue={str(extra.units_per_package) || "0"} /></Field>
        <Field label="NCM"><input name="ncm" defaultValue={str(extra.ncm)} /></Field>
        <Field label="CEST"><input name="cest" defaultValue={str(extra.cest)} /></Field>
        <Field label="Origem fiscal"><input name="fiscal_origin" defaultValue={str(extra.fiscal_origin)} /></Field>
        <Field label="CFOP padrão"><input name="default_cfop" defaultValue={str(extra.default_cfop)} /></Field>
        <Field label="Tributação" className="field-span-2"><input name="taxation" defaultValue={str(extra.taxation)} placeholder="Validar com o contador" /></Field>
        <div className="check-grid field-span-3">
          <Check name="active" label="Produto ativo" checked={record ? isActive(record.active) : true} />
          <Check name="lot_control" label="Controlar lote" checked={isActive(record?.lot_control)} />
          <Check name="serial_control" label="Controlar número de série" checked={isActive(record?.serial_control)} />
          <Check name="allow_negative" label="Permitir estoque negativo" checked={isActive(extra.allow_negative)} />
          <Check name="sale_blocked" label="Bloquear venda" checked={isActive(record?.sale_blocked)} />
          <Check name="purchase_blocked" label="Bloquear compra" checked={isActive(record?.purchase_blocked)} />
        </div>
      </div>
      <FormActions busy={busy} submitLabel={record ? "Salvar alterações" : "Cadastrar produto"} />
    </form>
  );
}

function MovementForm({
  products,
  warehouses,
  onSubmit,
  busy,
}: {
  products: Row[];
  warehouses: Row[];
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  const [type, setType] = useState("entrada");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void onSubmit(Object.fromEntries(form.entries()));
  }
  return (
    <form onSubmit={submit}>
      <div className="form-body form-grid">
        <Field label="Tipo da movimentação">
          <select name="type" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="ajuste">Ajuste manual</option>
            <option value="transferencia">Transferência</option>
          </select>
        </Field>
        <Field label="Produto" className="field-span-2">
          <select name="product_id" required>
            <option value="">Selecione um produto</option>
            {products
              .filter((row) => isActive(row.active))
              .map((row) => (
                <option key={str(row.id)} value={str(row.id)}>
                  {str(row.name)} · saldo {num(row.current_stock)} {str(row.unit)}
                </option>
              ))}
          </select>
        </Field>
        {type === "ajuste" ? (
          <Field label="Novo saldo">
            <input type="number" min="0" step="0.01" name="new_stock" required />
          </Field>
        ) : (
          <Field label="Quantidade">
            <input
              type="number"
              min={type === "transferencia" ? "0" : "0.01"}
              step="0.01"
              name="quantity"
              required={type !== "transferencia"}
            />
          </Field>
        )}
        <Field label="Origem">
          <select name="origin" required={type === "transferencia"}>
            <option value="">Selecione</option>
            {warehouses.map((row) => (
              <option key={str(row.id)} value={str(row.name)}>
                {str(row.name)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Destino">
          <select name="destination" required={type === "transferencia"}>
            <option value="">Selecione</option>
            {warehouses.map((row) => (
              <option key={str(row.id)} value={str(row.name)}>
                {str(row.name)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={type === "ajuste" ? "Justificativa obrigatória" : "Motivo"} className="field-span-2">
          <textarea name="reason" rows={3} required={type === "ajuste"} />
        </Field>
        <Field label="Referência">
          <input name="reference" placeholder="Documento, pedido ou observação" />
        </Field>
      </div>
      <FormActions busy={busy} submitLabel="Registrar movimentação" />
    </form>
  );
}

function ItemsOperationForm({
  mode,
  snapshot,
  onSubmit,
  busy,
}: {
  mode: "sale" | "purchase";
  snapshot: Snapshot;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  const [items, setItems] = useState([
    { key: newItemKey(), product_id: "", quantity: "1", value: "" },
  ]);
  function updateItem(key: string, field: string, value: string) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void onSubmit({
      [mode === "sale" ? "client_id" : "supplier_id"]: form.get(
        mode === "sale" ? "client_id" : "supplier_id",
      ),
      discount: form.get("discount"),
      payment_method: form.get("payment_method"),
      document: form.get("document"),
      notes: form.get("notes"),
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        [mode === "sale" ? "unit_price" : "unit_cost"]: item.value,
      })),
    });
  }
  const total = items.reduce(
    (sum, item) => sum + num(item.quantity) * num(item.value),
    0,
  );
  return (
    <form onSubmit={submit}>
      <div className="form-body">
        <div className="form-grid">
          <Field label={mode === "sale" ? "Cliente" : "Fornecedor"} className="field-span-2">
            <select name={mode === "sale" ? "client_id" : "supplier_id"}>
              <option value="">
                {mode === "sale" ? "Venda balcão" : "Selecione o fornecedor"}
              </option>
              {(mode === "sale" ? snapshot.clients : snapshot.suppliers)
                .filter((row) => isActive(row.active))
                .map((row) => (
                  <option key={str(row.id)} value={str(row.id)}>
                    {str(row.name)}
                  </option>
                ))}
            </select>
          </Field>
          {mode === "sale" ? (
            <Field label="Pagamento informativo">
              <select name="payment_method">
                <option value="pix">PIX</option>
                <option value="cartao">Cartão</option>
                <option value="boleto">Boleto</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </Field>
          ) : (
            <Field label="Documento do fornecedor">
              <input name="document" />
            </Field>
          )}
        </div>
        <div className="items-header">
          <div>
            <p className="eyebrow">Itens</p>
            <h3>{mode === "sale" ? "Produtos da venda" : "Produtos recebidos"}</h3>
          </div>
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={() =>
              setItems((current) => [
                ...current,
                {
                  key: newItemKey(),
                  product_id: "",
                  quantity: "1",
                  value: "",
                },
              ])
            }
          >
            ＋ Adicionar item
          </button>
        </div>
        <div className="item-lines">
          {items.map((item, index) => {
            const selected = snapshot.products.find(
              (product) => str(product.id) === item.product_id,
            );
            return (
              <div className="item-line" key={item.key}>
                <span className="item-number">{index + 1}</span>
                <select
                  aria-label={`Produto do item ${index + 1}`}
                  value={item.product_id}
                  required
                  onChange={(event) => {
                    const product = snapshot.products.find(
                      (row) => str(row.id) === event.target.value,
                    );
                    updateItem(item.key, "product_id", event.target.value);
                    updateItem(
                      item.key,
                      "value",
                      str(mode === "sale" ? product?.price : product?.cost),
                    );
                  }}
                >
                  <option value="">Selecione o produto</option>
                  {snapshot.products
                    .filter((row) => isActive(row.active))
                    .map((row) => (
                      <option key={str(row.id)} value={str(row.id)}>
                        {str(row.name)} · saldo {num(row.current_stock)}
                      </option>
                    ))}
                </select>
                <input
                  aria-label={`Quantidade do item ${index + 1}`}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  required
                  onChange={(event) =>
                    updateItem(item.key, "quantity", event.target.value)
                  }
                />
                <input
                  aria-label={`${mode === "sale" ? "Preço" : "Custo"} do item ${index + 1}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.value}
                  required
                  onChange={(event) =>
                    updateItem(item.key, "value", event.target.value)
                  }
                />
                <strong>{currency(num(item.quantity) * num(item.value))}</strong>
                <button
                  type="button"
                  className="remove-item"
                  aria-label={`Remover item ${index + 1}`}
                  disabled={items.length === 1}
                  onClick={() =>
                    setItems((current) =>
                      current.filter((currentItem) => currentItem.key !== item.key),
                    )
                  }
                >
                  ×
                </button>
                {mode === "sale" && selected && (
                  <small>Disponível: {num(selected.current_stock)} {str(selected.unit)}</small>
                )}
              </div>
            );
          })}
        </div>
        <div className="operation-summary">
          {mode === "sale" && (
            <Field label="Desconto total (R$)">
              <input name="discount" type="number" min="0" step="0.01" defaultValue="0" />
            </Field>
          )}
          <Field label="Observações" className="field-span-2">
            <textarea name="notes" rows={2} />
          </Field>
          <div className="operation-total">
            <span>Total estimado</span>
            <strong>{currency(total)}</strong>
          </div>
        </div>
      </div>
      <FormActions
        busy={busy}
        submitLabel={mode === "sale" ? "Finalizar venda" : "Receber compra"}
      />
    </form>
  );
}

function InventoryForm({
  products,
  onSubmit,
  busy,
}: {
  products: Row[];
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()));
  }
  return (
    <form onSubmit={submit}>
      <div className="form-body form-grid">
        <Field label="Produto" className="field-span-2">
          <select name="product_id" required>
            <option value="">Selecione o produto contado</option>
            {products
              .filter((row) => isActive(row.active))
              .map((row) => (
                <option key={str(row.id)} value={str(row.id)}>
                  {str(row.name)} · sistema: {num(row.current_stock)} {str(row.unit)}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Quantidade física">
          <input type="number" min="0" step="0.01" name="counted_stock" required />
        </Field>
        <Field label="Observações" className="field-span-3">
          <textarea
            name="notes"
            rows={3}
            placeholder="Informe condições da contagem ou divergências encontradas"
          />
        </Field>
      </div>
      <FormActions busy={busy} submitLabel="Registrar contagem" />
    </form>
  );
}

function ShipmentForm({
  sale,
  onSubmit,
  busy,
}: {
  sale: Row;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()));
  }
  return (
    <form onSubmit={submit}>
      <div className="modal-callout">
        Pedido <strong>{str(sale.number)}</strong> ·{" "}
        {str(sale.client_name) || "Venda balcão"} · {currency(sale.total)}
      </div>
      <div className="form-body form-grid">
        <Field label="Transportadora" className="field-span-2">
          <input name="carrier" required placeholder="Nome da transportadora" />
        </Field>
        <Field label="Código de rastreio">
          <input name="tracking_code" />
        </Field>
        <Field label="Ocorrência / observação" className="field-span-3">
          <textarea name="occurrence" rows={3} />
        </Field>
      </div>
      <FormActions busy={busy} submitLabel="Confirmar expedição" />
    </form>
  );
}

function CancelSaleForm({
  sale,
  onSubmit,
  busy,
}: {
  sale: Row;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()));
  }
  return (
    <form onSubmit={submit}>
      <div className="modal-callout warning-callout">
        Ao cancelar <strong>{str(sale.number)}</strong>, todos os itens serão
        devolvidos automaticamente ao estoque e a ação ficará registrada.
      </div>
      <div className="form-body">
        <Field label="Motivo obrigatório">
          <textarea name="reason" rows={4} required />
        </Field>
      </div>
      <FormActions busy={busy} submitLabel="Confirmar cancelamento" danger />
    </form>
  );
}

function EntityForm({
  entity,
  record,
  onSubmit,
  busy,
}: {
  entity: "categories" | "brands" | "suppliers" | "clients" | "warehouses";
  record?: Row;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()));
  }
  const detailed = ["suppliers", "clients"].includes(entity);
  return (
    <form onSubmit={submit}>
      <div className="form-body form-grid">
        <Field label="Nome / razão social" className={detailed ? "field-span-2" : "field-span-3"}>
          <input name="name" defaultValue={str(record?.name)} required />
        </Field>
        {entity === "warehouses" && (
          <Field label="Código">
            <input name="code" defaultValue={str(record?.code)} />
          </Field>
        )}
        {detailed && (
          <>
            <Field label="CPF / CNPJ">
              <input name="document" defaultValue={str(record?.document)} />
            </Field>
            <Field label="Telefone">
              <input name="phone" defaultValue={str(record?.phone)} />
            </Field>
            <Field label="E-mail">
              <input type="email" name="email" defaultValue={str(record?.email)} />
            </Field>
            <Field label="Endereço" className="field-span-2">
              <input name="address" defaultValue={str(record?.address)} />
            </Field>
          </>
        )}
        {entity === "clients" && (
          <Field label="Tipo de cliente">
            <select name="client_type" defaultValue={str(record?.client_type) || "empresa"}>
              <option value="empresa">Empresa</option>
              <option value="pessoa">Pessoa física</option>
            </select>
          </Field>
        )}
        {entity === "suppliers" && (
          <>
            <Field label="Pessoa de contato">
              <input name="contact_person" defaultValue={str(record?.contact_person)} />
            </Field>
            <Field label="Prazo médio (dias)">
              <input type="number" min="0" name="lead_time_days" defaultValue={str(record?.lead_time_days) || "0"} />
            </Field>
          </>
        )}
        {!detailed && (
          <Field label={entity === "warehouses" ? "Endereço" : "Descrição"} className="field-span-3">
            <textarea
              name={entity === "warehouses" ? "address" : "description"}
              rows={3}
              defaultValue={str(
                entity === "warehouses" ? record?.address : record?.description,
              )}
            />
          </Field>
        )}
        {entity === "warehouses" && (
          <input type="hidden" name="description" value={str(record?.description)} />
        )}
        {entity === "suppliers" && (
          <Field label="Observações" className="field-span-3">
            <textarea name="notes" rows={3} defaultValue={str(record?.notes)} />
          </Field>
        )}
      </div>
      <FormActions busy={busy} submitLabel={record ? "Salvar alterações" : "Cadastrar"} />
    </form>
  );
}

function UserForm({
  record,
  onSubmit,
  busy,
}: {
  record?: Row;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()));
  }
  return (
    <form onSubmit={submit}>
      <div className="form-body form-grid">
        <Field label="Nome completo" className="field-span-2">
          <input name="full_name" defaultValue={str(record?.full_name)} required />
        </Field>
        <Field label="E-mail de acesso">
          <input
            type="email"
            name="email"
            defaultValue={str(record?.email)}
            readOnly={Boolean(record)}
            required
          />
        </Field>
        <Field label="Perfil de acesso" className="field-span-2">
          <select name="role" defaultValue={str(record?.role) || "operador"}>
            {Object.entries(roleNames).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={str(record?.status) || "ativo"}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </Field>
      </div>
      <FormActions busy={busy} submitLabel="Salvar acesso" />
    </form>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">Stock ERP</p>
            <h2>{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar janela">
            ×
          </button>
        </header>
        <div className="modal-scroll">{children}</div>
      </section>
    </div>
  );
}

function modalTitle(modal: ModalState) {
  if (modal.kind === "product") {
    return modal.record ? "Editar produto" : "Novo produto";
  }
  if (modal.kind === "movement") return "Nova movimentação";
  if (modal.kind === "sale") return "Nova venda";
  if (modal.kind === "purchase") return "Nova compra";
  if (modal.kind === "inventory") return "Novo inventário";
  if (modal.kind === "shipment") return "Expedir pedido";
  if (modal.kind === "cancel-sale") return "Cancelar venda";
  if (modal.kind === "user") return modal.record ? "Editar acesso" : "Adicionar usuário";
  return `${modal.record ? "Editar" : "Novo cadastro"} · ${moduleMeta[modal.entity].title}`;
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Check({
  name,
  label,
  checked,
}: {
  name: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="check-line">
      <input type="checkbox" name={name} defaultChecked={checked} />
      <span>{label}</span>
    </label>
  );
}

function FormActions({
  busy,
  submitLabel,
  danger = false,
}: {
  busy: boolean;
  submitLabel: string;
  danger?: boolean;
}) {
  return (
    <div className="form-actions">
      <span>Campos marcados como obrigatórios são validados antes de salvar.</span>
      <button
        className={`button ${danger ? "button-danger" : "button-primary"}`}
        disabled={busy}
      >
        {busy ? "Processando…" : submitLabel}
      </button>
    </div>
  );
}

function FilterBar({
  query,
  setQuery,
  placeholder,
}: {
  query: string;
  setQuery: (value: string) => void;
  placeholder: string;
}) {
  const status = query.match(/\[status:([^\]]+)\]/)?.[1] ?? "";
  const textQuery = query.replace(/\[status:[^\]]+\]/, "").trim();
  const update = (text: string, nextStatus = status) =>
    setQuery(`${text.trim()}${nextStatus ? ` [status:${nextStatus}]` : ""}`.trim());
  return (
    <div className="filter-row">
      <label className="search-field">
        <span aria-hidden="true">⌕</span>
        <input
          value={textQuery}
          onChange={(event) => update(event.target.value)}
          placeholder={placeholder}
          aria-label="Pesquisar registros"
        />
      </label>
      <select value={status} onChange={(event) => update(textQuery, event.target.value)} aria-label="Filtrar por status">
        <option value="">Todos os status</option>
        <option value="ativo">Ativo</option>
        <option value="inativo">Inativo</option>
        <option value="pendente">Pendente</option>
        <option value="concluido">Concluído</option>
        <option value="cancelada">Cancelado</option>
      </select>
      {(textQuery || status) && <button className="button button-secondary" onClick={() => setQuery("")}>Limpar filtros</button>}
    </div>
  );
}

function TableFooter({ count, label }: { count: number; label: string }) {
  return (
    <div className="table-footer">
      <span>
        {count} {label}
      </span>
      <strong>Exibindo {count} registro{count === 1 ? "" : "s"}</strong>
    </div>
  );
}

function StepButton({
  label,
  onClick,
  busy,
}: {
  label: string;
  onClick: () => Promise<void>;
  busy: boolean;
}) {
  return (
    <button
      className="button button-secondary button-small"
      disabled={busy}
      onClick={() => void onClick()}
    >
      {label}
    </button>
  );
}

function SmallEmpty({ text }: { text: string }) {
  return (
    <div className="small-empty">
      <span>✓</span>
      <p>{text}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="loading-grid" aria-label="Carregando dados">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => Promise<void> }) {
  return (
    <section className="panel empty-state">
      <span className="empty-icon">!</span>
      <h2>Não foi possível abrir a base de dados</h2>
      <p>Verifique a conexão e tente novamente.</p>
      <button className="button button-primary" onClick={() => void onRetry()}>
        Tentar novamente
      </button>
    </section>
  );
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

"use client";

import { ChangeEvent, FormEvent, ReactNode, useMemo, useState } from "react";

export type EnterpriseModuleKey =
  | "catalogs" | "locations" | "reservations" | "receiving" | "conference"
  | "packaging" | "transfers" | "traceability" | "kits" | "returns"
  | "losses" | "production" | "finance" | "approvals" | "integrations"
  | "import_export" | "labels" | "notifications" | "security" | "planning";

type Row = Record<string, unknown> & { id?: number };
type RunAction = (
  action: string,
  payload: Record<string, unknown>,
  success: string,
) => Promise<void>;
type Choice = [string, string];
type ModuleConfig = {
  eyebrow: string;
  title: string;
  description: string;
  flow: string;
  types: Choice[];
  statuses: Choice[];
};

function choices(value: string): Choice[] {
  return value.split("|").map((item) => {
    const [key, label] = item.split(":");
    return [key, label];
  });
}

function config(
  eyebrow: string,
  title: string,
  description: string,
  flow: string,
  types: string,
  statuses: string,
): ModuleConfig {
  return { eyebrow, title, description, flow, types: choices(types), statuses: choices(statuses) };
}

export const enterpriseModuleKeys: EnterpriseModuleKey[] = [
  "catalogs", "locations", "reservations", "receiving", "conference",
  "packaging", "transfers", "traceability", "kits", "returns", "losses",
  "production", "finance", "approvals", "integrations", "import_export",
  "labels", "notifications", "security", "planning",
];

export const enterpriseMeta: Record<EnterpriseModuleKey, ModuleConfig> = {
  catalogs: config("Cadastros", "Cadastros avançados", "Subcategorias, fabricantes, modelos, unidades, embalagens, famílias, linhas, variações e atributos.", "Cadastro → validação → ativação → histórico", "subcategoria:Subcategoria|fabricante:Fabricante|modelo:Modelo|unidade:Unidade|embalagem:Embalagem|grupo:Grupo|familia:Família|linha:Linha|variacao:Variação|atributo:Atributo", "ativo:Ativo|inativo:Inativo"),
  locations: config("Estrutura física", "Mapa de locais e depósitos", "Empresa, filial, depósito, setor, rua, coluna, nível e posição com capacidade e QR.", "Empresa → filial → depósito → setor → rua → coluna → nível → posição", "empresa:Empresa|filial:Filial|deposito:Depósito|setor:Setor|rua:Rua|coluna:Coluna|nivel:Nível|posicao:Posição", "ativo:Ativo|bloqueado:Bloqueado|inativo:Inativo"),
  reservations: config("Disponibilidade", "Reservas de estoque", "Saldo físico, reservado, bloqueado e disponível com prazo e cancelamento.", "Solicitação → validação de saldo → reserva → separação/cancelamento", "reserva:Reserva de pedido", "ativa:Ativa|atendida:Atendida|vencida:Vencida|cancelada:Cancelada"),
  receiving: config("Compras", "Recebimento de compras", "Compare quantidades solicitadas, enviadas, recebidas, aprovadas e recusadas.", "Pedido → recebimento → conferência → entrada → contas a pagar", "recebimento:Recebimento|devolucao_fornecedor:Devolução ao fornecedor", "aguardando:Aguardando|recebendo:Recebendo|aguardando_conferencia:Aguardando conferência|recebido_parcial:Recebido parcialmente|recebido:Recebido|recusado:Recusado"),
  conference: config("Qualidade", "Conferência de pedidos", "Nova leitura de produto, quantidade, lote, série, peso e embalagem.", "Separado → leitura cega → validação → embalagem", "conferencia:Conferência|recontagem:Recontagem", "pendente:Pendente|em_conferencia:Em conferência|aprovada:Aprovada|divergente:Divergente|devolvida_separacao:Devolvida à separação"),
  packaging: config("Expedição", "Embalagem e volumes", "Volumes, dimensões, peso real/cubado, lacres, etiquetas, fotos e rastreio.", "Conferência → embalagem → lacre → etiqueta → doca", "volume:Volume|embalagem:Embalagem", "aberto:Aberto|embalando:Embalando|lacrado:Lacrado|pronto:Pronto"),
  transfers: config("Logística interna", "Transferências completas", "Entre posições, depósitos, filiais, empresas e estoques físicos/virtuais.", "Solicitação → aprovação → separação → trânsito → recebimento", "posicao:Entre posições|deposito:Entre depósitos|filial:Entre filiais|empresa:Entre empresas|virtual:Físico ↔ virtual", "solicitada:Solicitada|aprovada:Aprovada|em_separacao:Em separação|em_conferencia:Em conferência|em_transito:Em trânsito|recebida_parcial:Recebida parcialmente|recebida:Recebida|recusada:Recusada|cancelada:Cancelada"),
  traceability: config("Rastreabilidade", "Lotes, validade e números de série", "Histórico individual, garantia, bloqueio, FEFO/FIFO, fornecedor e localização.", "Entrada → localização → reserva → venda → garantia/devolução", "lote:Lote|numero_serie:Número de série|garantia:Garantia", "ativo:Ativo|bloqueado:Bloqueado|vendido:Vendido|assistencia:Em assistência|vencido:Vencido"),
  kits: config("Composição", "Kits e composição", "Kits, combos, cestas, componentes, matéria-prima e baixa automática.", "Composição → saldo → ativação → baixa dos componentes", "kit:Kit|combo:Combo|cesta:Cesta|composto:Produto composto", "rascunho:Rascunho|ativo:Ativo|inativo:Inativo"),
  returns: config("Pós-venda", "Devoluções e trocas", "Cliente, fornecedor, troca, não entrega, defeito, avaria e destino do item.", "Solicitação → análise → destino → ajuste/estorno → conclusão", "devolucao_cliente:Devolução de cliente|devolucao_fornecedor:Devolução ao fornecedor|troca:Troca|nao_entregue:Não entregue", "solicitada:Solicitada|em_analise:Em análise|quarentena:Quarentena|aprovada:Aprovada|recusada:Recusada|concluida:Concluída"),
  losses: config("Controle de perdas", "Perdas, avarias e descarte", "Valor perdido, motivo, imagens, aprovação, destino e documento.", "Ocorrência → evidência → aprovação → baixa → descarte", "avaria:Avaria|vencimento:Vencimento|furto:Furto|extravio:Extravio|umidade:Umidade|descarte:Descarte|uso_interno:Uso interno", "registrada:Registrada|aguardando_aprovacao:Aguardando aprovação|aprovada:Aprovada|descartada:Descartada|recusada:Recusada"),
  production: config("Manufatura", "Produção e montagem", "Ordens, materiais, consumo, perdas, etapas, qualidade, tempo e custo.", "Planejamento → materiais → produção → qualidade → produto acabado", "ordem_producao:Ordem de produção|montagem:Montagem|desmontagem:Desmontagem", "planejada:Planejada|liberada:Liberada|em_producao:Em produção|qualidade:Qualidade|concluida:Concluída|cancelada:Cancelada"),
  finance: config("Financeiro", "Financeiro e rentabilidade", "Contas, caixa, conciliação, parcelas, centros de custo, comissões e margens.", "Origem operacional → lançamento → conciliação → baixa", "conta_pagar:Conta a pagar|conta_receber:Conta a receber|receita:Receita|despesa:Despesa|comissao:Comissão|conciliacao:Conciliação", "pendente:Pendente|parcial:Parcial|pago:Pago|recebido:Recebido|vencido:Vencido|cancelado:Cancelado"),
  approvals: config("Governança", "Central de aprovações", "Ajustes, compras, descontos, descartes, devoluções, custos, inventários e exclusões.", "Solicitante → impacto → aprovador → decisão → execução", "ajuste_estoque:Ajuste de estoque|compra:Compra|desconto:Desconto|descarte:Descarte|devolucao:Devolução|custo:Custo|inventario:Inventário|exclusao:Exclusão", "pendente:Pendente|em_analise:Em análise|aprovada:Aprovada|recusada:Recusada|cancelada:Cancelada"),
  integrations: config("Ecossistema", "Integrações e saúde das APIs", "Marketplaces, transportadoras, bancos, pagamentos, fiscal, endereço, BI e webhooks.", "Configuração → teste → sincronização → monitoramento → reprocessamento", "marketplace:Marketplace|transportadora:Transportadora|financeiro:Banco/pagamento|fiscal:Fiscal/contábil|endereco:Endereço|bi:BI|webhook:Webhook|equipamento:Equipamento", "configurando:Configurando|conectado:Conectado|atencao:Atenção|erro:Erro|inativo:Inativo"),
  import_export: config("Dados em massa", "Importação e exportação", "Produtos, preços, estoque inicial, fornecedores e clientes com pré-validação.", "Arquivo → pré-validação → correção → processamento → auditoria", "importacao:Importação|exportacao:Exportação|atualizacao_precos:Atualização de preços", "recebido:Recebido|validando:Validando|validado:Validado|processado:Processado|com_erros:Com erros"),
  labels: config("Automação", "Código de barras, QR e etiquetas", "Etiquetas de produtos, locais e volumes para impressão, coleta e conferência.", "Seleção → modelo → prévia → impressão → leitura", "produto:Produto|local:Local|volume:Volume|qr:QR", "rascunho:Rascunho|pronto:Pronto|impresso:Impresso|cancelado:Cancelado"),
  notifications: config("Monitoramento", "Central de alertas", "Estoque, validade, atrasos, reservas, inventários, perdas, integrações e segurança.", "Detecção → notificação → responsável → tratamento → resolução", "estoque_minimo:Estoque mínimo|validade:Validade|pedido_atrasado:Pedido atrasado|compra_atrasada:Compra atrasada|reserva:Reserva|inventario:Inventário|integracao:Integração|seguranca:Segurança", "aberta:Aberta|em_tratamento:Em tratamento|resolvida:Resolvida|ignorada:Ignorada"),
  security: config("Segurança", "Segurança, sessões e permissões", "Políticas, perfis, escopos por empresa/filial/depósito e logs.", "Política → perfil → escopo → sessão → auditoria", "politica:Política|perfil:Perfil|escopo:Escopo|sessao:Sessão|backup:Backup", "ativo:Ativo|revisao:Em revisão|inativo:Inativo"),
  planning: config("Inteligência", "Planejamento e reposição", "Curva ABC, giro, cobertura, ruptura, demanda, estoque parado e compra sugerida.", "Indicadores → previsão → sugestão → aprovação → compra", "reposicao:Reposição|demanda:Demanda|curva_abc:Curva ABC|estoque_parado:Estoque parado|ruptura:Ruptura", "sugerida:Sugerida|em_analise:Em análise|aprovada:Aprovada|convertida_compra:Convertida em compra|descartada:Descartada"),
};

const str = (value: unknown) => (value == null ? "" : String(value));
const num = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const currency = (value: unknown) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num(value));
const dateTime = (value: unknown) => {
  if (!value) return "—";
  const date = new Date(str(value));
  return Number.isNaN(date.getTime()) ? str(value) : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
};
const statusClass = (value: unknown) => {
  const status = str(value);
  if (/(ativo|aprovad|conclu|conectado|recebido|pago|pronto|resolvida)/.test(status)) return "badge-success";
  if (/(erro|vencid|recusad|cancelad|bloqueado|divergente)/.test(status)) return "badge-danger";
  if (/(pendente|aguardando|aberta)/.test(status)) return "badge-warning";
  return "badge-neutral";
};
const metadata = (value: unknown) => {
  try { return JSON.parse(str(value) || "{}") as Record<string, unknown>; }
  catch { return { detalhes: str(value) }; }
};
function download(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

export function EnterpriseModule({
  moduleKey, workflows, products, warehouses, users, query, setQuery, runAction, busy,
}: {
  moduleKey: EnterpriseModuleKey; workflows: Row[]; products: Row[];
  warehouses: Row[]; users: Row[]; query: string;
  setQuery: (value: string) => void; runAction: RunAction; busy: boolean;
}) {
  const cfg = enterpriseMeta[moduleKey];
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [referenceTime] = useState(() => Date.now());
  const rows = useMemo(() => workflows.filter((row) => str(row.module) === moduleKey), [moduleKey, workflows]);
  const filtered = useMemo(() => rows.filter((row) => {
    if (statusFilter && str(row.status) !== statusFilter) return false;
    const search = query.toLocaleLowerCase("pt-BR").trim();
    return !search || Object.values(row).some((value) => str(value).toLocaleLowerCase("pt-BR").includes(search));
  }), [query, rows, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 8));
  const visible = filtered.slice((page - 1) * 8, page * 8);
  const attention = rows.filter((row) => /(pendente|aguardando|erro|vencid|diverg|bloque)/.test(str(row.status))).length;
  const dueSoon = rows.filter((row) => {
    const due = new Date(str(row.due_at)).getTime();
    return Number.isFinite(due) && due <= referenceTime + 3 * 86_400_000;
  }).length;
  const amount = rows.reduce((sum, row) => sum + num(row.amount), 0);
  const statusName = (value: unknown) =>
    cfg.statuses.find(([key]) => key === str(value))?.[1] ?? str(value).replaceAll("_", " ");

  function exportCsv() {
    const header = ["Código", "Tipo", "Título", "Produto", "Quantidade", "Origem", "Destino", "Status", "Prioridade", "Responsável", "Prazo", "Valor", "Referência", "Observações"];
    const data = filtered.map((row) => [row.code, row.record_type, row.title, row.product_name, row.quantity, row.origin, row.destination, statusName(row.status), row.priority, row.responsible_email, row.due_at, row.amount, row.reference, row.notes].map(str));
    download(`${moduleKey}-stock-erp.csv`, [header, ...data].map((line) => line.map((item) => `"${item.replaceAll('"', '""')}"`).join(";")).join("\n"));
  }

  function saveFilter() {
    localStorage.setItem(`stock-filter-${moduleKey}`, JSON.stringify({ query, statusFilter }));
  }
  function loadFilter() {
    try {
      const saved = JSON.parse(localStorage.getItem(`stock-filter-${moduleKey}`) || "{}") as { query?: string; statusFilter?: string };
      setQuery(saved.query ?? ""); setStatusFilter(saved.statusFilter ?? ""); setPage(1);
    } catch { localStorage.removeItem(`stock-filter-${moduleKey}`); }
  }

  return (
    <>
      <section className="enterprise-summary">
        {[["Registros", rows.length, "Histórico preservado"], ["Exigem atenção", attention, "Pendências e divergências"], ["Prazo próximo", dueSoon, "Próximos 3 dias"], ["Impacto financeiro", currency(amount), "Valor do módulo"]].map(([label, value, note]) => (
          <article key={str(label)}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>
        ))}
      </section>
      <section className="workflow-banner"><span>Fluxo recomendado</span><strong>{cfg.flow}</strong></section>
      {moduleKey === "import_export" && <ImportPanel runAction={runAction} busy={busy} />}
      {moduleKey === "labels" && <LabelPanel products={products} />}
      {moduleKey === "security" && <PermissionMatrix />}
      <section className="panel enterprise-panel">
        <div className="enterprise-toolbar">
          <label className="search-field"><span>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar código, SKU, documento ou responsável" /></label>
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="">Todos os status</option>{cfg.statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <button className="button button-secondary" onClick={saveFilter}>Salvar filtro</button>
          <button className="button button-secondary" onClick={loadFilter}>Filtro favorito</button>
          {(query || statusFilter) && <button className="button button-secondary" onClick={() => { setQuery(""); setStatusFilter(""); }}>Limpar</button>}
          <button className="button button-secondary" onClick={exportCsv}>Exportar CSV</button>
          <button className="button button-secondary" onClick={() => window.print()}>Imprimir / PDF</button>
          <button className="button button-primary" onClick={() => setShowForm(!showForm)}>＋ Novo registro</button>
        </div>
        {showForm && <WorkflowForm moduleKey={moduleKey} cfg={cfg} products={products} warehouses={warehouses} users={users} busy={busy} onCancel={() => setShowForm(false)} onSubmit={async (payload) => {
          await runAction("save_workflow_record", { ...payload, module: moduleKey }, "Registro salvo com auditoria.");
          setShowForm(false);
        }} />}
        <div className="table-wrap">
          <table>
            <thead><tr><th>Código / tipo</th><th>Registro</th><th>Produto</th><th>Origem / destino</th><th>Qtd. / valor</th><th>Prazo / responsável</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>{visible.map((row) => {
              const details = metadata(row.metadata_json);
              return <tr key={str(row.id)}>
                <td><strong>{str(row.code)}</strong><span className="cell-note">{cfg.types.find(([key]) => key === str(row.record_type))?.[1] ?? str(row.record_type)}</span></td>
                <td><strong>{str(row.title)}</strong><span className="cell-note">{str(row.reference) || "Sem documento"}</span>{detailId === row.id && <div className="record-details">{Object.entries(details).map(([key, value]) => <small key={key}><b>{key.replaceAll("_", " ")}:</b> {typeof value === "object" ? JSON.stringify(value) : str(value)}</small>)}</div>}</td>
                <td>{str(row.product_name) || "—"}<span className="cell-note">{str(row.product_sku)}</span></td>
                <td>{str(row.origin) || "—"}<span className="cell-note">{str(row.destination) ? `→ ${str(row.destination)}` : "Sem destino"}</span></td>
                <td><strong>{num(row.quantity) || "—"}</strong><span className="cell-note">{num(row.amount) ? currency(row.amount) : "Sem valor"}</span></td>
                <td>{dateTime(row.due_at)}<span className="cell-note">{str(row.responsible_email) || "Não atribuído"}</span></td>
                <td><span className={`badge ${statusClass(row.status)}`}>{statusName(row.status)}</span><span className="cell-note">Prioridade {str(row.priority) || "normal"}</span></td>
                <td><div className="action-group"><select value={str(row.status)} disabled={busy} onChange={(event) => void runAction("update_workflow_status", { id: row.id, status: event.target.value, observation: `Alteração pela central ${cfg.title}.` }, "Status atualizado e registrado.")}>{cfg.statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="table-action" onClick={() => setDetailId(detailId === row.id ? null : (row.id ?? null))}>{detailId === row.id ? "Ocultar" : "Detalhes"}</button></div></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        {!visible.length && <div className="small-empty"><span>✓</span><p>Nenhum registro encontrado.</p></div>}
        <div className="table-footer"><span>{filtered.length} registro(s) · página {page} de {totalPages}</span><div><button className="button button-secondary button-small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button><button className="button button-secondary button-small" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próxima</button></div></div>
      </section>
    </>
  );
}

function WorkflowForm({ moduleKey, cfg, products, warehouses, users, busy, onCancel, onSubmit }: {
  moduleKey: EnterpriseModuleKey; cfg: ModuleConfig; products: Row[]; warehouses: Row[];
  users: Row[]; busy: boolean; onCancel: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = Object.fromEntries(form.entries());
    payload.metadata = {
      detalhes: str(form.get("metadata_json")), lote: str(form.get("lot")),
      validade: str(form.get("expiry_date")), serie: str(form.get("serial_number")),
      documento: str(form.get("document")), capacidade: str(form.get("capacity")),
      peso: str(form.get("weight")), dimensoes: str(form.get("dimensions")),
      motorista: str(form.get("driver")), placa: str(form.get("plate")),
    };
    void onSubmit(payload);
  }
  const logistics = ["locations", "reservations", "receiving", "conference", "packaging", "transfers", "traceability", "returns", "losses", "production", "planning"].includes(moduleKey);
  return <form className="inline-workflow-form" onSubmit={submit}><div className="form-grid">
    <Field label="Tipo"><select name="record_type">{cfg.types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
    <Field label="Código"><input name="code" placeholder="Automático se vazio" /></Field>
    <Field label="Título" wide><input name="title" required /></Field>
    <Field label="Status"><select name="status">{cfg.statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
    <Field label="Prioridade"><select name="priority" defaultValue="normal"><option value="baixa">Baixa</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="critica">Crítica</option></select></Field>
    <Field label="Produto" wide><select name="product_id"><option value="">Sem produto específico</option>{products.map((row) => <option key={str(row.id)} value={str(row.id)}>{str(row.name)} · {str(row.sku)}</option>)}</select></Field>
    <Field label="Quantidade"><input type="number" min="0" step="0.01" name="quantity" /></Field>
    <Field label="Valor (R$)"><input type="number" min="0" step="0.01" name="amount" /></Field>
    {logistics && <><Field label="Origem"><input name="origin" list="workflow-warehouses" /></Field><Field label="Destino"><input name="destination" list="workflow-warehouses" /></Field><datalist id="workflow-warehouses">{warehouses.map((row) => <option key={str(row.id)} value={str(row.name)} />)}</datalist></>}
    <Field label="Responsável"><select name="responsible_email"><option value="">Usuário atual</option>{users.map((row) => <option key={str(row.email)} value={str(row.email)}>{str(row.full_name)}</option>)}</select></Field>
    <Field label="Prazo"><input type="datetime-local" name="due_at" /></Field>
    <Field label="Referência"><input name="reference" /></Field><Field label="Documento"><input name="document" /></Field>
    {["receiving", "traceability"].includes(moduleKey) && <><Field label="Lote"><input name="lot" /></Field><Field label="Validade"><input type="date" name="expiry_date" /></Field><Field label="Número de série"><input name="serial_number" /></Field></>}
    {moduleKey === "locations" && <Field label="Capacidade / peso"><input name="capacity" /></Field>}
    {["packaging", "receiving"].includes(moduleKey) && <><Field label="Peso"><input name="weight" /></Field><Field label="Dimensões"><input name="dimensions" /></Field></>}
    {moduleKey === "transfers" && <><Field label="Motorista"><input name="driver" /></Field><Field label="Veículo / placa"><input name="plate" /></Field></>}
    <Field label="Detalhes complementares" full><textarea name="metadata_json" rows={2} /></Field>
    <Field label="Observações" full><textarea name="notes" rows={2} /></Field>
  </div><div className="inline-form-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancelar</button><button className="button button-primary" disabled={busy}>{busy ? "Salvando…" : "Salvar com auditoria"}</button></div></form>;
}

function Field({ label, children, wide = false, full = false }: { label: string; children: ReactNode; wide?: boolean; full?: boolean }) {
  return <label className={`field ${full ? "field-span-3" : wide ? "field-span-2" : ""}`}><span>{label}</span>{children}</label>;
}

function ImportPanel({ runAction, busy }: { runAction: RunAction; busy: boolean }) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [error, setError] = useState("");
  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; setRows([]); setError(""); if (!file) return;
    setFileName(file.name);
    const lines = (await file.text()).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const separator = lines[0]?.includes(";") ? ";" : ",";
    const header = (lines[0] || "").split(separator).map((item) => item.trim());
    if (!["code", "sku", "name"].every((key) => header.includes(key))) { setError("O cabeçalho precisa conter code, sku e name."); return; }
    setRows(lines.slice(1, 501).map((line) => Object.fromEntries(line.split(separator).map((value, index) => [header[index], value.trim().replace(/^"|"$/g, "").replace(",", ".")]))));
  }
  function template() {
    download("modelo-importacao-produtos.csv", "code;sku;barcode;name;description;location;unit;cost;price;min_stock;current_stock\n0006;EXEMPLO-001;7890000000000;Produto exemplo;Descrição;A-01;UN;10,00;19,90;5;10");
  }
  return <section className="panel import-panel"><div><p className="eyebrow">Importação segura</p><h2>Pré-validar produtos por CSV</h2><p>Até 500 linhas, com rejeição de códigos e SKUs inválidos.</p></div><div className="import-actions"><button className="button button-secondary" onClick={template}>Baixar modelo</button><label className="button button-secondary file-button">Selecionar CSV<input type="file" accept=".csv,text/csv" onChange={readFile} /></label><button className="button button-primary" disabled={busy || !rows.length} onClick={() => void runAction("bulk_import_products", { rows, filename: fileName }, `${rows.length} produto(s) processado(s).`)}>Validar e importar</button>{error && <span className="negative">{error}</span>}{rows.length > 0 && <small>{fileName}: {rows.length} linha(s) pronta(s).</small>}</div></section>;
}

function LabelPanel({ products }: { products: Row[] }) {
  const [productId, setProductId] = useState(str(products[0]?.id));
  const [copies, setCopies] = useState(1);
  const product = products.find((row) => str(row.id) === productId);
  return <section className="panel label-studio"><div className="label-controls"><div><p className="eyebrow">Prévia</p><h2>Etiqueta de produto</h2></div><select value={productId} onChange={(event) => setProductId(event.target.value)}>{products.map((row) => <option key={str(row.id)} value={str(row.id)}>{str(row.name)}</option>)}</select><input aria-label="Cópias" type="number" min="1" max="500" value={copies} onChange={(event) => setCopies(Math.max(1, num(event.target.value)))} /><button className="button button-primary" onClick={() => window.print()}>Imprimir {copies} cópia(s)</button></div><div className="label-preview"><span>STOCK ERP</span><strong>{str(product?.name) || "Selecione um produto"}</strong><small>SKU {str(product?.sku)} · Local {str(product?.location) || "—"}</small><div className="barcode-bars" /><b>{str(product?.barcode) || str(product?.code)}</b></div></section>;
}

function PermissionMatrix() {
  const rows = [
    ["Administrador", "Todos", "Todas as empresas/filiais", "Todas as ações"],
    ["Gerente", "Operação e gestão", "Filiais autorizadas", "Criar, editar, aprovar e exportar"],
    ["Comprador", "Compras", "Empresa atribuída", "Solicitar, cotar e comprar"],
    ["Vendedor", "Vendas", "Filiais autorizadas", "Orçar e vender"],
    ["Operador", "Estoque", "Depósitos autorizados", "Movimentar e contar"],
    ["Separador", "Separação", "Depósitos autorizados", "Ler, pausar e apontar divergência"],
    ["Conferente", "Conferência", "Depósitos autorizados", "Conferir e devolver"],
    ["Expedidor", "Expedição", "Docas autorizadas", "Embalar, expedir e entregar"],
    ["Financeiro", "Financeiro", "Empresas autorizadas", "Lançar, conciliar e baixar"],
    ["Auditor", "Relatórios/auditoria", "Escopo de auditoria", "Consultar e exportar"],
  ];
  return <section className="panel permission-panel"><div className="panel-heading"><div><p className="eyebrow">RBAC por escopo</p><h2>Matriz de perfis e permissões</h2><p>Por módulo, ação, empresa, filial e depósito.</p></div></div><div className="table-wrap"><table><thead><tr><th>Perfil</th><th>Módulos</th><th>Escopo</th><th>Ações</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div></section>;
}

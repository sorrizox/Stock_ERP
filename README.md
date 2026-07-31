# Stock ERP

Plataforma web de gestão operacional para estoque, compras, vendas, inventário,
separação, expedição e governança de acesso.

## Funcionalidades

- Produtos, categorias, marcas, fornecedores, clientes e armazéns.
- Entradas, saídas, compras, vendas e inventário.
- Bloqueio de venda sem saldo e baixa automática.
- Separação, conferência, expedição e rastreio.
- Usuários, perfis, auditoria, notificações e exportação portátil.
- Relatório de reposição, curva de valor, CSV e impressão em PDF.
- Banco interno ou integração segura com banco existente.

## Executar o site

Requisitos: Node.js 22 ou superior.

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env.local` quando quiser alterar a fonte de dados.

## Banco existente

Consulte `docs/CONTRATO-BANCO-EXISTENTE.md` e a pasta
`database-connector`. O conector suporta MySQL, PostgreSQL e SQL Server.

## Validar para produção

```bash
npm run lint
npm run build
npm test
```

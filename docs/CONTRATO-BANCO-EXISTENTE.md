# Contrato para integração com banco existente

## Arquitetura

O navegador chama `/api/erp` no próprio Stock ERP. O servidor encaminha a
operação ao conector usando HTTPS e uma chave privada. O conector acessa o banco
MySQL, PostgreSQL ou SQL Server na rede da empresa.

Essa arquitetura evita colocar usuário e senha do banco no JavaScript do site.

## Tabelas esperadas

O conector trabalha com as seguintes entidades:

- `user_profiles`
- `categories`
- `brands`
- `suppliers`
- `clients`
- `warehouses`
- `products`
- `movements`
- `sales` e `sale_items`
- `purchases` e `purchase_items`
- `inventories` e `inventory_items`
- `shipments`
- `audit_logs`
- `settings`

Os nomes podem ser alterados em
`database-connector/config/table-map.json`. As colunas seguem os nomes usados em
`db/schema.ts`.

## Banco legado com colunas diferentes

Há duas opções seguras:

1. Criar *views* no banco legado com os nomes de colunas esperados pelo Stock
   ERP. Essa opção preserva o sistema antigo e facilita a manutenção.
2. Adaptar `database-connector/src/server.mjs` para traduzir cada coluna.

Antes de ativar gravações, faça um backup e valide em um banco de homologação.

## Variáveis do site

```env
ERP_DATA_SOURCE=external-api
EXTERNAL_ERP_API_URL=https://erp-api.suaempresa.com/api/erp
EXTERNAL_ERP_API_TOKEN=uma-chave-longa-e-aleatoria
```

Para voltar ao banco interno:

```env
ERP_DATA_SOURCE=d1
```

## Checklist de produção

- HTTPS válido no conector.
- Porta do banco fechada para a internet.
- Usuário do banco com somente as permissões necessárias.
- `CONNECTOR_TOKEN` forte e armazenado como segredo.
- Backup validado antes da primeira sincronização.
- Testes de venda, cancelamento, compra, inventário e expedição em homologação.

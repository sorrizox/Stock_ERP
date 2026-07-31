# Conector de banco existente

Este serviço fica entre o Stock ERP e o banco da empresa. A senha do banco nunca
é enviada ao navegador. O conector aceita MySQL, PostgreSQL e SQL Server.

## Uso

1. Copie `.env.example` para `.env` e preencha `DB_CLIENT`, `DATABASE_URL` e
   `CONNECTOR_TOKEN`.
2. Ajuste `config/table-map.json` quando as tabelas existentes tiverem outros
   nomes.
3. Execute `npm install` e depois `npm start`.
4. Teste `GET http://localhost:3333/health`.
5. No site, defina:
   - `ERP_DATA_SOURCE=external-api`
   - `EXTERNAL_ERP_API_URL=https://endereco-do-conector/api/erp`
   - `EXTERNAL_ERP_API_TOKEN` com a mesma chave do conector.

## Compatibilidade

O mapeamento altera nomes de tabelas. As colunas precisam seguir o contrato
documentado em `../docs/CONTRATO-BANCO-EXISTENTE.md`. Quando o banco legado usa
nomes de colunas diferentes, crie *views* compatíveis no próprio banco ou adapte
as consultas deste conector.

Não publique o conector sem HTTPS, firewall e uma chave forte.

## Backup restaurável

O botão **Gerar backup agora** usa a ferramenta oficial do banco configurado:

- MySQL: `mysqldump`, gerando `.sql`;
- PostgreSQL: `pg_dump`, gerando `.sql`;
- SQL Server: `sqlpackage`, gerando `.bacpac`.

Instale a ferramenta correspondente no mesmo servidor do conector e deixe o
executável disponível no `PATH`. No MySQL e PostgreSQL, a senha é passada por
variável de ambiente. Restrinja o acesso à lista de processos do servidor,
especialmente ao usar `sqlpackage`. Apenas administradores e gestores podem
gerar o arquivo.

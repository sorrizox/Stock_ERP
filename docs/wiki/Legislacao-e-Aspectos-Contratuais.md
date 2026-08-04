# 8. Legislação e Aspectos Contratuais

## Sumário

- [8.1 Introdução](#81-introdução)
- [8.2 Legislação municipal](#82-legislação-municipal)
- [8.3 Legislação estadual](#83-legislação-estadual)
- [8.4 Legislação federal](#84-legislação-federal)
- [8.5 Normas ISO e ABNT](#85-normas-iso-e-abnt)
- [8.6 Impactos no Stock ERP](#86-impactos-no-stock-erp)
- [8.7 Documentos contratuais](#87-documentos-contratuais)
- [Referências](#referências)

---

## 8.1 Introdução

O Stock ERP deverá respeitar normas relacionadas à proteção de dados, segurança da informação, propriedade do software, direitos do consumidor, prestação de serviços e movimentação de mercadorias. Essas regras influenciam o cadastro de usuários, o armazenamento de informações, o controle de permissões, os registros de auditoria e as futuras integrações fiscais.

O sistema tem como foco a gestão de estoque. Portanto, não substitui o trabalho de contadores, advogados ou profissionais fiscais. Funcionalidades tributárias somente deverão ser implantadas após validação especializada.

## 8.2 Legislação municipal

Em Mogi Guaçu, o Código Tributário Municipal e suas alterações tratam das obrigações relacionadas ao ISSQN. Essas regras poderão ser aplicadas à futura empresa responsável pelo Stock ERP quando forem prestados serviços de desenvolvimento, implantação, licenciamento, hospedagem, suporte ou manutenção.

A empresa poderá precisar de inscrição municipal, emissão de nota fiscal de serviço e recolhimento dos tributos correspondentes. Caso o sistema receba integração com a NFS-e, deverá seguir o padrão e a documentação técnica oficial em vigor.

## 8.3 Legislação estadual

No Estado de São Paulo, as normas do ICMS e da NF-e são relevantes porque os clientes do sistema poderão registrar compras, vendas, devoluções, transferências e outras movimentações de mercadorias.

A responsabilidade fiscal pertence à empresa contribuinte. O Stock ERP deverá auxiliar no registro correto de informações como produto, quantidade, valor, data, origem, destino, cliente, fornecedor, responsável e documento fiscal relacionado.

Uma integração direta com NF-e somente deverá ser implementada depois da análise dos leiautes, das regras de autorização, do armazenamento de arquivos digitais e dos procedimentos de contingência.

## 8.4 Legislação federal

### LGPD

A Lei Geral de Proteção de Dados Pessoais influencia diretamente o projeto. O Stock ERP poderá armazenar nomes, telefones, e-mails, documentos, cargos e registros de usuários, clientes e fornecedores.

Para proteger essas informações, deverão ser adotadas medidas como:

- controle de acesso por perfil;
- proteção das senhas;
- registros de auditoria;
- backups;
- restrição de acesso aos dados pessoais;
- política de retenção e exclusão;
- comunicação e tratamento de incidentes.

Os dados deverão ser coletados apenas quando necessários e utilizados para finalidades legítimas e informadas.

### Marco Civil da Internet

Caso o Stock ERP funcione pela internet ou seja oferecido em nuvem, deverão ser observadas as regras relacionadas à privacidade, à segurança e aos registros de acesso à aplicação.

O registro de acesso à plataforma é diferente do histórico de movimentações. O primeiro identifica o uso da aplicação; o segundo registra ações realizadas dentro do sistema.

### Lei do Software

A Lei do Software protege o código-fonte desenvolvido pela equipe. O grupo deverá definir quem será o titular do sistema e como ocorrerá o licenciamento.

Também deverão ser respeitadas as licenças de bibliotecas, imagens, ícones, fontes, pacotes e outros componentes de terceiros.

### Código Civil e Código de Defesa do Consumidor

Os contratos deverão apresentar de forma clara:

- serviço contratado;
- funcionalidades incluídas;
- preço e pagamento;
- prazos;
- responsabilidades;
- suporte;
- cancelamento;
- propriedade intelectual;
- proteção de dados.

A divulgação do sistema não poderá prometer funções inexistentes nem ocultar limitações importantes.

### Acessibilidade

A interface deverá considerar navegação por teclado, contraste adequado, identificação dos campos, compatibilidade com leitores de tela, mensagens de erro compreensíveis e informações que não dependam apenas de cores.

### SPED e Reforma Tributária

Os dados de estoque poderão ser utilizados em inventários, relatórios e integrações com sistemas fiscais e contábeis. Por isso, precisam ser completos, consistentes e rastreáveis.

Caso sejam criados módulos fiscais, a arquitetura deverá permitir atualização de campos, regras e tributos sem reconstrução completa do sistema.

## 8.5 Normas ISO e ABNT

As normas ISO e ABNT podem ser usadas como referências de qualidade, segurança e privacidade. A adoção dessas práticas não significa que o Stock ERP possui certificação.

As principais referências consideradas são:

- **ABNT NBR ISO/IEC 27001:** gestão da segurança da informação;
- **ABNT NBR ISO/IEC 27002:** controles e boas práticas de segurança;
- **ABNT NBR ISO/IEC 27701:** gestão da privacidade;
- **ISO/IEC 25010:** avaliação da qualidade de produtos de software.

## 8.6 Impactos no Stock ERP

| Tema | Impacto no sistema | Medida prevista |
|---|---|---|
| LGPD | Tratamento de dados pessoais | Controle de acesso, retenção e transparência |
| Segurança | Risco de acesso indevido ou perda | Proteção de senhas, backups e auditoria |
| ICMS e NF-e | Registro de movimentações | Dados completos e documentos relacionados |
| ISS e NFS-e | Prestação de serviços | Emissão fiscal conforme a regra aplicável |
| Lei do Software | Proteção do código | Definição de autoria, titularidade e licenças |
| CDC | Transparência na oferta | Informações claras sobre preço e limitações |
| Acessibilidade | Uso por pessoas com deficiência | Teclado, contraste, rótulos e leitores de tela |
| Contratos | Definição de responsabilidades | Documentos claros e separados por finalidade |

## 8.7 Documentos contratuais

Os modelos foram separados em páginas próprias para evitar que esta página fique excessivamente longa.

### Contrato de Prestação de Serviços

Define escopo, entregas, valores, prazos e responsabilidades durante desenvolvimento, implantação ou personalização.

[Consultar modelo](Contrato-de-Prestacao-de-Servicos.md)

### Termo de Uso

Estabelece as regras de acesso e utilização do Stock ERP pelos usuários.

[Consultar modelo](Termo-de-Uso.md)

### Política de Privacidade

Explica como os dados pessoais são coletados, utilizados, armazenados, compartilhados e protegidos.

[Consultar modelo](Politica-de-Privacidade.md)

### Contrato Cliente-Fornecedor

Organiza o fornecimento ou licenciamento do sistema, incluindo plano, pagamento, acesso e responsabilidades.

[Consultar modelo](Contrato-Cliente-Fornecedor.md)

### Contrato de Suporte

Define canais, horários, prioridades, prazos de resposta e serviços incluídos no suporte técnico.

[Consultar modelo](Contrato-de-Suporte.md)

### Acordo de Confidencialidade — NDA

Protege código-fonte, documentos, dados, estratégias e demais informações confidenciais.

[Consultar modelo](Acordo-de-Confidencialidade-NDA.md)

## Referências

- Lei Complementar nº 116/2003 — ISS.
- Decreto nº 6.022/2007 — SPED.
- Lei nº 13.709/2018 — LGPD.
- Lei nº 12.965/2014 — Marco Civil da Internet.
- Lei nº 9.609/1998 — Lei do Software.
- Lei nº 10.406/2002 — Código Civil.
- Lei nº 8.078/1990 — Código de Defesa do Consumidor.
- Lei nº 13.146/2015 — Lei Brasileira de Inclusão.
- Lei Complementar nº 214/2025 — Reforma Tributária.
- Código Tributário Municipal de Mogi Guaçu.
- Legislação paulista do ICMS e da NF-e.
- ABNT NBR ISO/IEC 27001, 27002 e 27701.
- ISO/IEC 25010.

> Os modelos são acadêmicos e deverão ser revisados por profissional jurídico antes de uso comercial real.

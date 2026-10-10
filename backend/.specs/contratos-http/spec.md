# Contratos HTTP

Estado: base implementada; adoção de erro/sucesso autorizada em todos os
endpoints backend na [spec de adoção](../adocao-http/spec.md). Paginação não aplicada.
Detalhes HTTP abaixo aprovados; catálogo de erros e detalhes de BE-10
**Aguardando resposta** no [registro](../STATE.md).

## Problema e escopo

Respostas usam `message`, `error`, `success`, `data`, `plan` e `plans` sem
contrato comum. Empresas pode retornar 200 para falha SQL ou 404 para erro
interno. Listagens não têm paginação. Não há handler global de erros/404.

Fontes: `src/server.ts`, `src/routes/empresaRoute.ts`,
`src/services/empresaService.ts`, `src/controller/plan.controller.ts` e
`src/middlewares/auth.ts`.

Definir três contratos separados, com tipos compartilhados, exemplos e
aplicação nos endpoints existentes. Planejar migração dos consumidores
frontend. Não redesenhar autenticação, permissões ou regras comerciais.

## Requisitos

- ERR-01: Quando ocorrer falha esperada, retornar código de erro estável,
  mensagem pública e status HTTP coerente, conforme catálogo aprovado.
- ERR-02: Em produção, retornar apenas status e mensagem pública, sem stack
  ou diagnóstico. Nos demais ambientes, retornar stack trace e detalhes de
  código. Sanitizar senhas, tokens e credenciais; preservar diagnóstico útil.
- ERR-03: Erros de validação, autenticação, autorização, recurso inexistente,
  conflito e infraestrutura devem ser distinguíveis. Definir detalhes por
  campo, política de mensagens e tratamento de rota inexistente.
- RES-01: Todo sucesso JSON segue um formato único aprovado; definir também
  criação, resultado vazio, lista vazia e respostas sem corpo (204).
- RES-02: Services retornam dados/resultados de negócio; controllers fazem
  a tradução HTTP. Middlewares seguem o mesmo contrato de erro.
- PAG-01: Toda listagem abrangida recebe limites validados e retorna dados
  e metadados de paginação conforme o formato aprovado.
- PAG-02: Ordenação usa desempate estável por identificador; filtros são
  aplicados antes da paginação e da contagem.
- PAG-03: Definir resposta a valores negativos, fracionários, não numéricos,
  limite excedido, lista vazia e página além do fim.

## Contratos aprovados e detalhes pendentes

Sucesso `{ data, meta? }`; erro em produção `{ status, message }`, usando o
mesmo status HTTP; fora de produção acrescentar `code`, `details`, `requestId`
e `stack`, sanitizando credenciais. Este formato substitui o envelope de erro
anterior. Paginação `page`/`pageSize`, base 1, padrão 20 e máximo 100,
com total e ordem estável. Adaptação conjunta do frontend aprovada.
Validação e paginação inválida: 400. Criação: 201 com data. Operações sem
corpo: 204. Lista vazia e página além do fim: sucesso com `data: []`.
Metadados da paginação: `page`, `pageSize`, `total`, `totalPages`.
Manter `/api/v1` e adaptar consumidores juntos. Para empresas, ordenar por
nome e ID. Nomes concretos de campos seguem a convenção em inglês.
Decidir quais listagens serão paginadas, incluindo planos e catálogo.
Campos adicionais de ordenação e comportamento de filtros aguardam
resposta, assim como códigos de erro e formato de details/requestId.
Não transformar indiscriminadamente toda exceção em 400 ou 404.

## Tarefas e aceite

Escopo inicial histórico: criar/exportar base sem conectar ao servidor.
Escopo atual: HTTP-04 adota erro/sucesso no backend; frontend está adiado.
Testes usam aplicações isoladas; paginação permanece sem aplicação ao banco.
HTTP-05 atualiza a documentação principal já nesta implementação.

- [ ] HTTP-01: Aprovar schemas, exemplos e catálogo de erros/status.
  Aceite: exemplos para sucesso, criação, validação, 401/403/404/409/500,
  lista vazia e resposta sem corpo; registrar exceções necessárias.
- [x] HTTP-02: Criar tipos/utilitários e tratamento central de erros.
  Aceite: falha inesperada produz 500 sanitizado; falha esperada preserva
  status/código; rota desconhecida segue o contrato; logs omitem segredos.
- [x] HTTP-03: Implementar entrada e saída da paginação.
  Aceite: testar limites aprovados, entradas inválidas, vazio, última página,
  além do fim, contagem com filtros e desempate de registros equivalentes.
- [ ] HTTP-04: Adoção backend em andamento; consumidores frontend adiados.
  Aceite: inventário endpoint → consumidor; nenhuma falha SQL vira 200/404;
  frontend trata sucesso, erro e metadados sem depender dos envelopes antigos.
- [x] HTTP-05: Atualizar `docs/api.md` e decisões com exemplos definitivos.
  Aceite: documentação coincide com os contratos e verificações executadas.

Verificação futura: testes de contrato/integracão HTTP sem banco remoto,
usando dependências controladas, mais typecheck dos consumidores afetados.
Histórico da base inicial: 14 testes passaram e typecheck dos contratos passou. Aplicação HTTP isolada usada nos testes; server.ts e consumidores legados não alterados. Ordenação, contagem filtrada e lista além do fim no banco serão verificadas na adoção; os helpers validam parâmetros/metadados, sem executar consultas.

Adoção atual: ErrorCode centralizado e handler global após routers/404.
Exceções/cause chegam ao serializer; produção status/message, demais
ambientes stack/details/code sanitizados. Verificação atual na entrega;
os 14 testes registrados acima referem-se à base inicial.

# Leads da empresa

**Estado:** casos de uso parcialmente aprovados; API, persistência e implementação
pendentes. Data das decisões: 2026-11-02.
Dependências: identidade/sessão, autorização por empresa, dashboard e
definições de domínio P07/P08.
Contrato canônico: [decisions.md](../../roadmaps/dashboards/decisions.md),
DASH-D10–D18.

## Caso de uso: criar lead a partir do contato com uma empresa

- **Ator:** usuário cliente, sem dashboard empresarial nesta entrega.
- **Entrada:** contato iniciado no perfil público de uma empresa; dados mínimos
  de identidade do cliente, mensagem e telefone opcional.
- **Pré-condições:** empresa existe e aceita contatos; usuário cliente está
  cadastrado; a empresa do perfil é determinada pelo recurso consultado.
- **Validação:** validar identidade/mensagem e existência/estado da empresa.
  Limites de tamanho, duplicidade, consentimento e antiabuso aguardam contrato.
- **Ação permitida:** criar um lead vinculado à empresa contatada. Usuários da
  equipe não são leads. Cadastro promocional não cria lead.
- **Persistência:** relação do lead com a empresa e o usuário cliente; mensagem,
  telefone opcional, origem, data, status, prioridade, observações, atribuição e
  estado de arquivamento conforme contratos a aprovar. Cadastro cliente não
  concede dashboard ou sessão autenticada.
- **Retorno/erros:** envelope de sucesso `{ data, meta? }`; erros públicos
  existentes usam status/message. Status de validação, duplicidade,
  indisponibilidade e política anti-enumeração precisam ser conciliados com os
  contratos de contato/autenticação antes de expor a rota.

## Caso de uso: consultar e administrar leads

- **Ator:** admin_empresa ou atendente autenticado.
- **Pré-condições:** identidade, papel, vínculo e estado atual confirmados pelo
  backend; company_id vem do vínculo persistido, nunca de body/query.
- **Validação/escopo:** cada listagem, busca, detalhe, alteração e exportação é
  limitada à empresa do ator. Atendente só altera/exporta/arquiva lead
  atribuído ou assumido por ele. Item disponível pode ser assumido; somente
  atendentes ativos da mesma empresa podem receber atribuição.
- **Ações do dono:** consultar todos, editar, atribuir, atualizar status,
  exportar e arquivar logicamente. Exclusão física não é permitida.
- **Ações do atendente:** consultar atribuídos e disponíveis, assumir
  disponíveis, editar contato, atualizar status, registrar observação/
  prioridade, atribuir/transferir itens atribuídos ou assumidos dentro da
  empresa, exportar e arquivar logicamente apenas itens atribuídos/assumidos.
- **Persistência:** atribuição e arquivamento preservam histórico; remoção de
  atendente não exclui lead. Atribuição/transferência deve validar o vínculo e
  estado ativo do destino na mesma operação.
- **Retorno/erros:** resposta de sucesso e erros devem seguir contratos
  existentes. Política 403/404 para recurso de outra empresa, estados HTTP
  finais, paginação, filtros, ordenação e formato da exportação aguardam
  aprovação canônica (P07).

## Aguardando resposta antes de implementar

- Catálogo de status e transições permitidas; catálogo de prioridade.
- Duplicidade: cada envio cria novo lead ou contatos repetidos reutilizam lead.
- Se o primeiro contato também abre conversa e grava a mensagem como primeira
  mensagem; estados/canais e operações de fechar/reabrir.
- Limites de campos, consentimento, antiabuso e validações de identidade.
- Rotas, DTOs, paginação, formato/limites da exportação e política 403/404.
- Migration/índices/constraints e estratégia de concorrência da atribuição.

Não há módulo de leads, endpoint privado ou persistência dedicada no baseline
inspecionado. As decisões funcionais não equivalem a prova E2E; não implementar
ou marcar o fluxo entregue até aprovar contratos e provar duas empresas.

# 04 — Autorização e isolamento

Estado: planejada, sem implementação. Data: 2026-10-12.
Dependências: 01/02/03.
[Plano](../../roadmaps/dashboards/README.md),
[decisões](../../roadmaps/dashboards/decisions.md) e
[contratos](../../roadmaps/dashboards/contracts.md).
Par E2E: [frontend](../../../../frontend/.specs/features/tenant-authorization/spec.md).

Contrato: CT-04-AUTHZ. Guard frontend organiza a experiência; servidor decide.

## Baseline e fluxo

[Auth](../../../src/middlewares/auth.ts) não verifica vínculo/estado. Há checagem
pontual de role empresa no cadastro/seleção de plano, sem política por recurso.
GETs públicos do catálogo não são automaticamente IDOR.

Autenticar → resolver identidade/vínculo atual → verificar ação → limitar
recurso à empresa → verificar atribuição pertinente → responder. Contexto ou
permissão ausente não amplia escopo. companyId/role enviados pelo cliente não
são prova. IDs aleatórios, menu escondido ou token válido não substituem autorização.

Proteger leitura/criação/mutação/exclusão, listas, buscas, contagens, exports
e campos editáveis. Services/repositories recebem escopo útil explícito;
consultas e mutações incluem ID+empresa, sem filtrar somente depois na UI.
Superadministrador não tem bypass global para mensagens/prompts/conversas.
Criar empresa/convidar dono é ação de plataforma com ator verificado, sem
exigir vínculo prévio com a empresa ainda inexistente.

## Tarefas

- [ ] BE-04-01: Implementar matriz aprovada/contexto validado, negando por padrão.
- [ ] BE-04-02: Passar escopo aos services/repositories sem interface genérica de SQL.
- [ ] BE-04-03: Proteger rotas privadas/projeções/contagens/mutações e filtros.
- [ ] BE-04-04: Verificar ator/destino da mesma empresa nas atribuições futuras.
- [ ] BE-04-05: Testar troca de IDs, filtro removido, role falsa e acesso entre empresas.
- [ ] BE-04-06: Registrar negativas tipadas/sanitizadas, integrar CT-04 e atualizar docs.

## Aceite E2E

Duas empresas com donos/atendentes e gestor Civix: B não lê/altera dados
privados A por chamada direta de API. Atendente A não vê atendimento de outro.
Superadministrador não recebe mensagem via endpoint, busca ou export. Público
continua público. Bloqueio/mudança de vínculo revoga poder do token antigo.

Fixtures nesta entrega não comprovam módulo de conversas ainda ausente.
07 repete cenários de atribuição com recursos reais em JSON/PostgreSQL.

## Aguardando resposta

P01/P06/P07 e política 403/404 para ocultar existência. RLS PostgreSQL é
opção adicional ainda não escolhida, não substituto das verificações da aplicação.

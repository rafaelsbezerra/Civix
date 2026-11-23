# Autorização e isolamento por empresa

**Estado:** planejada, não implementada. Autorização somente para documentar.
**Ordem:** 04. Tarefas novas permanecem abertas.

## Baseline observada

Não há guard de dashboard. Bearer/role empresa protege parte da API, mas
profile não entrega vínculo/permissões; isolamento tenant não é demonstrado.
Ocultar um menu não protege o endpoint contra acesso direto.

## Dependências e referências

Depende de etapas 01/02 e [sessão](../authentication-session/spec.md).
Referência CT-04-AUTHZ; habilita etapas 05 a 08.
[Identidade](../identity-access-model/spec.md) é o modelo comum do bootstrap.
[Spec backend pareada](../../../../backend/.specs/features/tenant-authorization/spec.md).
[Contrato canônico](../../../../backend/.specs/roadmaps/dashboards/contracts.md).
Fontes: [rotas](../../../src/routes/AppRoute.tsx), [API](../../../src/lib/api.ts) e [login](../../../src/pages/login.tsx).

## Escopo confirmado

- Dono/atendente operam em uma única empresa determinada pelo backend.
- Atendente só vê o que lhe foi atribuído.
- Superadmin nunca recebe conversas, detalhes ou mensagens.
- Distinguir falta de permissão/contexto de lista legitimamente vazia.
- Limpar estado privado ao sair/trocar sessão; não restaurar cache antigo.

## Contrato frontend/backend

O bootstrap evolui GET /api/v1/users/profile; campos dependem de CT-04-AUTHZ.
Não conceder acesso com companyId/role fornecido pelo navegador.
As rotas privadas das próximas etapas ainda são propostas.
A semântica/status de negação vem do backend; não duplicar decisão em UI.
Sucesso usa { data, meta? }; erro público em produção usa status/message.
Não depender de code/stack/details em produção nem exibi-los ao usuário.
Paginação só quando necessária; caminhos/identificadores/DTOs novos
são propostas, **Aguardando resposta**, até sua aprovação canônica.

## Fluxo e provas E2E

1. Usar login/profile reais e fixtures isoladas do modelo/política da etapa 04.
2. Provar negativas para os recursos existentes, sem exigir módulo futuro.
3. Política de atribuição usa fixture isolada, sem expor endpoint fake;
   atendimento/mensagens reais e suas negativas serão provados na etapa 07.
4. Sair/entrar com outra identidade não restaura o conteúdo anterior.
A 04 não depende da 07 para concluir sua política/guard; repetir o E2E real
de conversas após implementar a 07, sem declarar esse módulo já comprovado.
Planejar navegador → frontend → backend real → armazenamento isolado →
resposta/UI. Mock do frontend sozinho não comprova essa comunicação.
Não acessar produção; dados/e-mails de teste são isolados.

## Tarefas planejadas

- [ ] FE-04-01: Implementar guard e estados de bootstrap/permissão.
- [ ] FE-04-02: Adaptar menu/controles às capacidades retornadas pelo backend.
- [ ] FE-04-03: Implementar limpeza e atualização de estado privado.
- [ ] FE-04-04: Testar bootstrap/negações reais e política isolada; repetir conversas reais na 07.

## Aceite

- Backend é autoridade; UI não promove permissão por parâmetro local.
- Negação dos recursos existentes não carrega dados de outro tenant em tela/cache.
- URL direta não contorna o guard/decisão backend.
- Dono/atendente não possuem seletor de outras empresas.

## Definições pendentes

**Aguardando resposta:** campos/capacidades do bootstrap e semântica de
negação conforme contrato. Matriz de atribuir/transferir permanece na etapa 07;
a visibilidade de um botão não aprova a ação.

Não houve implementação ou execução de teste ao criar esta spec.

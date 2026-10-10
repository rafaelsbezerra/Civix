# Adoção dos contratos HTTP e tipos de auth

Estado: aprovado em 2026-10-10. Documentação antes da implementação.

## Escopo e decisões

- Extrair JwtInvitePayload/UserRow/tipos de consulta do controller auth para
  arquivos próprios, preservando consultas e regras de primeiro acesso.
- Adotar AppError e sucesso { data, meta? } em todos os endpoints atuais do
  backend (usuários, auth, empresas, planos, root e middleware). Admin mantém
  router desmontado; adequar seu contrato sem expor novas rotas.
- Enum ErrorCode: VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND,
  CONFLICT e INTERNAL_ERROR. Sem LoginFailure/reason/switch por situação.
- Falhas esperadas lançam AppError; inesperadas chegam ao handler global
  como 500. Causa original preservada, com stack/diagnóstico sanitizados
  fora de production; production contém somente status/message.
- Frontend explicitamente adiado: documentar consumidores incompatíveis.
- Repositories continuam apenas interfaces; SQL/regras comerciais atuais
  mantidos. Paginação, schema, migração de dados e autenticação nova fora.
- Seguir identação/espaçamento corrigidos pelo usuário; separar blocos,
  usar guards legíveis e evitar código compactado.

## Critérios de aceite

1. Auth controller sem interfaces locais; imports tipados resolvem.
2. Sucesso JSON retorna somente data/meta; criação usa201, semcorpo204.
3. AppError atravessa handlers Express5 e middleware; 404 global registrado
   depois dos routers, error handler por último. Não perder causa/stack.
4. Falha SQL de empresas usa500, nunca200/404; ausência usa404.
5. Login não possui reason nem switch; service retorna dados ou lança erro.
6. Validar contratos, usuários, empresas, auth, planos e middleware, com
   mocks de persistência/e-mail; production sem stack e staging com stack.
7. Docs API, padrões, operação e AGENTS atualizados. Frontend permanece
   sem alterações; compatibilidade dos consumidores não é alegada.

## Consumidores para a próxima etapa

lib/api.ts exige success; login lê token no topo; FirstAccess lê email no
corpo de sucesso. Login/ForgotPassword/ResetPassword/FirstAccess leem error,
que será message. Catálogo/perfil/planos dependem de lib/api.ts. Adaptação
necessária antes de considerar frontend integrado ao novo backend.

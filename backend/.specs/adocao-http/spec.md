# Adoção dos contratos HTTP e tipos de auth

Estado: implementado, verificado na entrega e integrado em staging via PRs
#13/#14, referência bedb73a. Documentação base registrada antes do código.

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
- Na adoção inicial, frontend foi adiado. A integração posterior adapta
  consumidores existentes, exceto login explicitamente excluído.
- Na adoção HTTP inicial, repositories ficaram apenas como interfaces.
  Em 2026-10-12, o modo local autorizou adapters JSON/PostgreSQL e services
  auth/admin. Regras existentes e schema preservados; paginação sob demanda.
- Seguir identação/espaçamento corrigidos pelo usuário; separar blocos,
  usar guards legíveis e evitar código compactado.

## Critérios de aceite

1. Auth controller sem interfaces locais; imports tipados resolvem.
2. Sucesso JSON retorna somente data/meta; criação usa 201; resposta sem corpo usa 204.
3. AppError atravessa handlers Express 5 e middleware; 404 global registrado
   depois dos routers, error handler por último. Não perder causa/stack.
   JSON inválido retorna 400; corpo acima do limite retorna 413, ambos
   classificados como VALIDATION_ERROR.
4. Falha SQL de empresas usa 500, nunca 200/404; ausência usa 404.
5. Login não possui reason nem switch; service retorna dados ou lança erro.
6. Validar contratos, usuários, empresas, auth, planos e middleware, com
   mocks de persistência/e-mail; production sem stack e staging com stack.
7. Na adoção inicial, docs API/padrões/operação e AGENTS foram atualizados;
   frontend permaneceu sem alterações. Na integração posterior, atualizar
   docs afetados sem editar AGENTS e sem alegar compatibilidade de login excluído.

## Integração posterior dos consumidores — 2026-10-12

Na branch codex/frontend-backend-integration, dependente do PR #16,
lib/api.ts extrai data, apresenta message e centraliza a origem/prefixos.
Catálogo/perfil/planos, recuperação/reset e primeiro acesso usam esse contrato;
busca e campos snake_case corrigidos. Login permanece intacto, lendo token
no topo e error, por exclusão explícita. HTTP-04-B continua parcialmente completo.

Pré-validação e ativação verificam o mesmo JWT de convite, perfil/status e
users.invite_token. Consulta de reset/ResetTokenRow retirados da pré-validação;
reenvio/reset divergente continua pendente. Sem páginas/rotas novas ou schema.
A entrega registrou 25 testes direcionados frontend, 60 backend e typechecks
frontend/foundation/contratos/Vite aprovados. Build completo falha em assets
Sobre históricos; lint em SignSelect preexistente. AD-002 permanece.
Ver [spec frontend](../../../frontend/.specs/features/backend-integration/spec.md).

## Verificação da adoção — 2026-10-10

Executado pela tarefa de implementação: npm run test:foundation passou com
36 testes; npm run typecheck:foundation e npm run typecheck:contracts passaram.
Suíte isolada cobre contratos, usuários, empresas, auth, planos, middleware,
404, JSON inválido (400) e corpo acima do limite (413), com persistência/e-mail
simulados. Produção omite diagnóstico; staging preserva stack/cause sanitizados.
Na entrega original, o typecheck completo estava bloqueado por TS2353 em prisma.config.ts (CLI 6/configuração 7); o tooling Prisma 7 integrado da staging corrigiu esse bloqueio. Não houve banco remoto, envio real
de e-mail, migration, dependência nova ou adaptação frontend.

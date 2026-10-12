# Histórico documental e verificações

## Entrega original do guia

# Dados locais persistidos em JSON

Implementado em 2026-10-12; entrega pela branch codex/json-postgres-repositories, com PR destinado à staging.

## Verificação

npm run test:local usa diretório temporário próprio e simuladores de banco/e-mail.
Cobre reinício em outro processo, cadastro HTTP nos dois modos, permissões,
validação, senha/hash/JWT, recuperação, caixa de saída, plano, convite/ativação,
gravações concorrentes, bloqueio alheio e arquivo inválido.

npm run test:foundation também inclui esses testes. Seu runner define false
para as suítes SQL simuladas; a suíte local seleciona true no próprio processo.
Assim, o .env do desenvolvedor não altera o modo das suítes.

Resultados da entrega anterior à unificação de users: 50 testes de foundation,
incluindo 14 do modo local, e typechecks
foundation/contratos aprovados. TypeScript completo validado em fixture com
Prisma 7.10.0; a instalação desta checkout ainda possui CLI 6.12.0, sem
alteração ou instalação de dependências nesta tarefa.

Referências: [spec](spec.md),
[API](../../../docs/api.md) e [pendências atuais](../reviews/revisao-pendencias-specs.md).

## Verificação da unificação de users — 2026-10-12

58 testes de foundation aprovados e typechecks foundation/contratos passaram.
O code review independente exigiu proteger reconvites contra ativação concorrente;
a correção e os testes correspondentes foram revisados e aprovados antes da entrega.
Na entrega da unificação, os protocolos de tokens e o schema/banco real
continuavam pendentes. A integração posterior alinha convite/ativação;
reenvio/reset divergente e schema permanecem pendentes.

O JSON local anterior estava ausente. Por confirmação do usuário, foi recriado
com cinco empresas e três planos fictícios, users vazio e sem legacyUsers.
Os registros de demonstração permanecem fora do Git. Reinicie o backend para
carregar as alterações; use mock:user:create para preparar um usuário local.

## Consumo no frontend — 2026-10-12

Na integração posterior, catálogo/perfil/planos, recuperação/reset e primeiro
acesso leem data/message com configuração comum. USE_MOCK_DATA continua
exclusivamente no backend; falhas da API não são substituídas por mocks do
frontend. A pré-validação do convite usa o mesmo token/identidade/status da
ativação, enquanto reenvio ainda possui protocolo divergente.
Login foi excluído e permanece incompatível; não há dashboard/cadastro novo.
Ver [integração frontend/backend](../../../docs/frontend-backend.md).

## Persistência local — 2026-10-12

USE_MOCK_DATA=true foi implementado para empresas/usuários/auth/planos e caixa
local de e-mails. false mantém consultas PostgreSQL e Resend. SQL fica nos
adapters, e auth/admin usam services. O adiamento anterior de repositories foi
substituído pela autorização desta tarefa. Admin permanece sem montagem.
Ver [configuração e cadastro](../../../docs/dados-locais.md).

Verificação atual: 50 testes de foundation aprovados, typecheck foundation e
contratos aprovados. TypeScript completo passou em fixture temporária com
Prisma 7.10.0 já instalado em outra worktree, sem modificar dependências.
A node_modules desta checkout ainda tem CLI 6.12.0: o typecheck completo nela
falha pela configuração Prisma preexistente. Os testes da API não usam Prisma.
Sem banco real, envio externo, execução de migrations ou instalação.

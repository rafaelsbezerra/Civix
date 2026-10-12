# Histórico documental e verificações

## Validação histórica da extração de usuários e repositories

No backend, npm run test:users verifica login, recuperação, reset e rotas
protegidas com persistência/e-mail simulados. npm run test:foundation reúne
contratos, empresas e usuários: 27 testes passaram.
npm run typecheck:foundation cobre src, servidor, interfaces e esses testes
sem incluir prisma.config.ts. Na extração inicial, CLI6/configuração7 ainda
causava incompatibilidade; esse bloqueio foi corrigido pelo tooling Prisma 7.
Nenhuma dependência nova ou acesso externo naquela extração.

Na extração histórica, repositories continha apenas interfaces e SQL ficava
nos services. A entrega posterior do PR #16 criou/adotou os adapters
JSON/PostgreSQL; SQL fica em persistence/postgres. Nenhuma migration aplicada.

## Histórico da extração: usuários e repositories

Interfaces de persistência por módulo ficarão em backend/src/repositories.
Somente interfaces de repositories foram aprovadas; implementações ficam
para depois. A extração anterior afetou apenas userController/userRoute; a adoção
atual adequa erro/sucesso também em auth/admin, preservando regras. SQL permanece
nos services atuais. Ver
[spec](spec.md).
Sempre perguntar diante de dúvida antes de implementar a parte afetada.

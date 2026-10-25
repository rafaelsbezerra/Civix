# Baseline de usuários e empresas

Data: 2026-10-25. Criação das migrations autorizada; aplicação não autorizada.

## Decisões e escopo

- Preservar integralmente as duas migrations de planos existentes.
- Acrescentar migrations de `users` e `empresas` depois delas.
- `users.id` usa UUID gerado pelo banco para suportar convites sem ID explícito.
- `empresas.id` usa UUID, como o `randomUUID()` do cadastro existente.
- E-mail único em cada tabela, independentemente de maiúsculas/minúsculas,
  por índice único em `LOWER(email)`. O valor original permanece armazenado.
- CNPJ único pelo valor armazenado. Não adicionar normalização de pontuação.
- Criar `users.plan_id` BIGINT nullable com FK para `plans`, `ON DELETE SET NULL`
  e índice. A migration antiga não cria esse vínculo em um banco vazio.
- Usar campos exigidos pelas entidades e adapters atuais. Não implementar
  vínculo empresarial, novos perfis, PrismaClient ou conversão dos dados JSON.

## Compatibilidade

Convites inserem somente e-mail, papel, status e token. Nome e senha aceitam
NULL; o ID tem geração padrão. Status de usuário aceita NULL para preservar
o tratamento de contas antigas, sem limitar o campo aos dois estados usados
atualmente. Papéis continuam `empresa` e `cliente`.

Empresas preservam campos em português/snake_case, campos obrigatórios e
valores enumerados da entidade. Contatos e demais campos opcionais aceitam
NULL, inclusive quando enviado explicitamente pelo adapter. Datas usam
TIMESTAMPTZ; textos não ganham limites de tamanho ausentes no contrato.

As novas criações falham se as tabelas já existirem: não usar IF NOT EXISTS
para declarar um schema desconhecido como compatível. Não converter bancos
legados, IDs numéricos ou tabelas existentes automaticamente. O destino é
o PostgreSQL novo já aprovado; banco legado exige inspeção e plano separado.

## Limites e recuperação

Não executar migrations na inicialização, testes desta entrega, banco remoto
ou produção. Não instalar dependências. `schema.prisma` continua sem models;
este trabalho entrega SQL nativo, sem autorização para gerar diff destrutivo.

Após aplicação concluída, eventual reversão exige nova migration inversa,
revisada e criada somente quando solicitada. Não versionar DROP na sequência
ativa agora. Remover empresas antes de usuários, sem CASCADE, preservando
plans e suas migrations; avaliar backup e perda de dados antes da inversa.

Restrições SQL não alteram a API ou os adapters JSON. Violação de unicidade
ainda chega ao handler como falha inesperada; mapeamento para 409, consultas
de e-mail sem distinção de caixa e validação de UUID nas rotas são evoluções
separadas. Unicidade em LOWER(email) não normaliza buscas atuais com `=`.

## Verificação

- Conferir campos com entidades e SQL dos quatro adapters PostgreSQL.
- Verificar ordem, FK de planos e preservação dos arquivos históricos.
- Revisar SQL independentemente e executar verificações offline disponíveis.
- Registrar limites: checagem offline não comprova aplicação nem constraints
  em PostgreSQL. Ciclo em banco temporário continua **Aguardando resposta**.

Esta baseline não conclui a [spec 02](../identity-data-model/spec.md): vínculo,
permissões e migração do legado permanecem dependentes das decisões E2E.

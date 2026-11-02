# Usuários — papéis, vínculo e sessão

Atualização: 2026-11-01. Implementação e testes locais concluídos; aplicação e
homologação em PostgreSQL/R2 reais pendentes de autorização específica.
Branch feat/storage-module; sem commit nesta tarefa.

## Decisões confirmadas

| Papel | Dashboard futuro | Login | Vínculo |
| --- | --- | --- | --- |
| admin_empresa | Empresa | Senha obrigatória | Uma company existente |
| super_admin | Civix | Senha obrigatória | company_id nulo |
| atendente | Atendimento | Senha obrigatória | Uma company existente |
| cliente | Nenhum | Negado | company_id nulo |

Cliente permanece em backlog, sem área privada, cadastro funcional novo ou
casos de uso antecipados. Os dashboards não foram implementados nesta entrega.
A API mantém Bearer de uma hora, sem cookies/refresh. Tokens anteriores são
rejeitados; novo login é obrigatório.

Usuário confirmou banco completamente vazio, sem tabelas. O CHECK da criação
de users foi atualizado para os quatro papéis. A migration posterior
20261101000100_user_company_scope adiciona FK/índice company_id e CHECK de
escopo após companies existir. Nenhuma migration foi aplicada. O UPDATE
empresa → admin_empresa está previsto no SQL incremental; se houver dados
empresariais não associados, o CHECK falha sem descartar dados. Não aplicar
em banco legado sem mapear vínculos e reavaliar o plano.

## Implementação

- UserRole, DTOs, schemas JSON, logs, login e convites alinhados.
- Login aceita email/password e role opcional somente como filtro; identidade
  e papel vêm do registro persistido. Cliente recebe 403, papel inválido 400,
  senha/identidade inválida 401. Ausência de credenciais retorna 400.
- Os três perfis autenticáveis exigem hash válido, senha correta e conta
  active ou legado sem status. Pending/bloqueado/removido não autentica.
- JWT inclui id/email/role/companyId/tokenVersion=2. Middleware valida assinatura,
  formato e versão, consulta usuário atual e verifica papel/vínculo/estado.
  Alteração de papel, empresa ou remoção invalida os acessos subsequentes.
- Empresa ausente/inativa ou vínculo empresarial inválido impede autenticação.
  Super_admin com vínculo empresarial é rejeitado.
- Profile retorna data.user (id/name/email/role/companyId) e data.permissions;
  não inclui hashes ou tokens de convite.
- Cadastro de empresa passa a exigir super_admin. A seleção existente de
  plano continua vinculada ao próprio usuário, agora admin_empresa; não
  introduz cobrança nem altera a decisão futura de planos por empresa.
- Convites empresariais exigem empresa existente e perfil admin_empresa ou
  atendente, com finalidade invite e vínculo no JWT. Não transferem conta
  ativa ou convite para outro papel/empresa. Reenvio renova convite, não reset.
  Router admin continua desmontado: este trabalho não publica seu endpoint.
- Primeiro super_admin: comando restrito ao terminal user:bootstrap-super-admin,
  sem endpoint público nem promoção de e-mail já cadastrado.
- Frontend pede email/senha, sem seleção de perfil ou entrada cliente. Identidade
  vem da API. Após login retorna à Home enquanto dashboards não existem.
  ProtectedRoute é reutilizável para as futuras rotas e valida sessão no servidor;
  não há dashboard fictício ou nova área privada montada.

## Dados locais e legado

mock:user:create aceita os quatro papéis, exigindo senha para os três
operacionais e companyId para admin/atendente. É ferramenta local, não um
cadastro público de cliente. companyId deve existir no JSON.

mock:roles:migrate recebe opcionalmente o caminho de um objeto JSON
{ "userId": "companyUuid" }. Converte empresa → admin_empresa somente por
execução explícita, preserva clientes sem acesso e exige vínculo válido.
Valida tudo antes da escrita; cria backup byte a byte e usa bloqueio/arquivo
temporário. Não rodar automaticamente ao ler os dados. Nenhum JSON real foi
convertido nesta tarefa. Dados inconsistentes são preservados e rejeitados.

## Relações

[Storage](../storage/spec.md) usa usuário/vínculo vigentes para permitir capa
ao admin da própria empresa e ao super_admin. Atendente/cliente não enviam.
Leitura pública é independente: empresa devolve URL assinada de 300 segundos.

[Identidade](../identity-access-model/spec.md), [sessão](../authentication-session/spec.md)
e [autorização](../tenant-authorization/spec.md) mantêm as demais regras do
produto, sem acesso do super_admin a conversas. Poderes de equipe/conversas,
refresh, MFA, dashboards e demais módulos não são implicitamente entregues.

## Validação e limites

Testes cobrem três logins com senha, cliente negado, tentativa de elevar
papel, tokens antigos, conta/vínculo alterados, duas empresas, bootstrap e
migração explícita com backup. Ver [tarefas/evidências](task.md).

Falta homologação do histórico/constraints em PostgreSQL temporário e
integração real R2. Não declarar rollout de produção concluído. SQL, código
e testes simulados não comprovam execução no banco real.

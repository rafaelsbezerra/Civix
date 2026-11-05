# Postman da API Civix

Esta pasta documenta e exercita os endpoints efetivamente montados no backend. A collection cobre rotas públicas, autenticação, perfil, planos, empresas, storage e administração da plataforma.

## Formatos disponíveis

- `collections/civix-api/`: fonte Git-native Postman v3, adequada para revisão por arquivo e Postman CLI.
- `environments/`: environments v3 para Local e Staging.
- `import/`: collection e environments JSON v2.1 prontos para importar no Postman Desktop.
- `ROUTES.md`: inventário dos endpoints incluídos e das rotas deliberadamente ausentes.
- `fixtures/company-cover.png`: imagem mínima e inofensiva para validar o multipart local.
- `scripts/`: gerador e validação estrutural local.

Nenhuma credencial real é versionada. Preencha segredos somente no Postman ou em uma cópia local ignorada pelo Git.

## Importação no Postman Desktop

1. Abra **Import** no Postman.
2. Importe `postman/import/Civix API.postman_collection.json`.
3. Importe `postman/import/Civix Local.postman_environment.json` ou o environment de Staging.
4. Selecione o environment importado.
5. Preencha `superAdminEmail` e `superAdminPassword` no valor local/current do Postman.
6. Execute as requests a partir da raiz do repositório. O upload usa `postman/fixtures/company-cover.png`; no Desktop, selecione esse arquivo manualmente caso o Postman não resolva o caminho relativo.

O backend local usa `http://localhost:3000` por padrão. A URL de Staging não está documentada no repositório; por segurança, o environment usa `https://staging.example.invalid` até a equipe substituir o valor localmente.

## Compartilhamento com a equipe

Versione e compartilhe a pasta `postman/` junto com o repositório. Cada integrante importa a mesma collection JSON e cria sua própria cópia do environment, mantendo credenciais e e-mails apenas nos valores locais/current. Arquivos com os sufixos `.local.environment.yaml` e `.local.postman_environment.json` são ignorados pelo Git.

Nenhum workspace Postman Cloud foi escolhido ou publicado nesta entrega. Vincular e enviar a collection para um workspace exige uma decisão posterior sobre workspace, visibilidade e responsáveis; até lá, o JSON versionado é o meio oficial de compartilhamento.

## Autenticação

O comportamento observado no código atual grava o JWT no cookie HttpOnly `sessao`; o JSON de resposta não contém o token. O Postman mantém esse cookie automaticamente no cookie jar. O middleware também aceita Bearer e a variável `accessToken` permanece disponível para preenchimento manual.

Isso diverge da orientação geral do projeto que ainda descreve apenas Bearer. A collection reproduz o backend executável, mas não transforma essa divergência em decisão arquitetural aprovada.

O login de superadmin é o fluxo padrão. Os logins de admin da empresa e atendente começam bloqueados por `allowRoleSwitch=false`, pois substituem a sessão atual. Eles ficam nas pastas `60` e `65`, depois do fluxo superadmin. A pasta `60` faz login como `admin_empresa` imediatamente antes de selecionar o plano; a pasta `65` apenas valida a sessão de atendente. A última sessão no cookie jar é usada prioritariamente pelo backend.

O papel `cliente` possui um caso negativo próprio na pasta `90`: o backend deve responder 403 porque esse perfil não tem área logada.

Se uma execução for interrompida antes do logout, limpe manualmente o cookie `sessao` no cookie jar do domínio usado. O `accessToken` vazio não invalida um cookie que permaneceu armazenado.

## Proteção contra alterações acidentais

Toda escrita exige simultaneamente:

- `allowWrites=true`;
- `confirmedWriteBaseUrl` exatamente igual a `baseUrl`.

Além disso, cada categoria exige sua própria autorização:

- `allowAdministrativeWrites`: empresas, planos, usuários e vendas;
- `allowEmails`: recuperação e convites;
- `allowIdentityWrites`: definição ou redefinição de senha;
- `allowStorage`: envio de arquivo ao storage;
- `allowProfileUpdate`: alteração do próprio perfil;
- `allowRoleSwitch`: login com outro papel;
- `allowDestructive`: suspensões, arquivamentos e exclusões.

Uma request bloqueada é ignorada por `pm.execution.skipRequest()` e informa o motivo no console. Confirme sempre o environment selecionado, especialmente em Staging. Não compartilhe um environment já habilitado: cada integrante deve importar uma cópia própria e manter credenciais apenas no valor local/current.

Convites e recuperação de senha podem disparar e-mails. Uploads podem gravar no Cloudflare R2. Exclusão de venda é definitiva.

## Ordem recomendada

1. `00 - Sistema / Health check`.
2. `20 - Catálogo público / Listar planos ativos`; escolha o plano de teste e preencha `planId` manualmente.
3. `10 - Autenticação / Login superadmin`.
4. `30 - Conta autenticada / Consultar perfil`.
5. Confirme `confirmedWriteBaseUrl`, habilite `allowWrites` e `allowAdministrativeWrites`.
6. `50 - Plataforma / Criar empresa e venda inicial`, que captura `companyId` e `initialSaleId`.
7. Consultar e editar a empresa.
8. Enviar a capa e consultar sua URL assinada.
9. Convidar e administrar usuários empresariais.
10. Convidar e administrar outro superadmin.
11. Criar, consultar e, se desejado, excluir uma venda manual.
12. Executar `55 - Operações destrutivas` somente após convites, uploads e vendas dependentes da empresa. A restauração mantém a empresa inativa até reativação explícita.
13. Se necessário, habilitar `allowRoleSwitch` e executar `60 - Fluxo admin da empresa`; essa pasta autentica o admin imediatamente antes da seleção do plano.
14. Executar `65 - Fluxo atendente` somente quando quiser substituir a sessão pelo atendente.
15. Voltar a autenticar o superadmin antes de qualquer operação administrativa posterior.
16. Atualizar o próprio e-mail somente no fim, pois a resposta pode exigir novo login.
17. `99 - Encerrar sessão / Logout`.

IDs retornados por criações são armazenados automaticamente no environment. Requests dependentes são ignoradas quando seus IDs obrigatórios estão vazios. Listagens não sobrescrevem IDs, evitando que uma mutação posterior atinja o primeiro registro real por acidente. Cada variante de venda possui seu próprio `operationId`; repetir o mesmo payload e identificador permite validar idempotência.

## Upload de imagem

O fluxo implementado aceita somente capa de empresa:

- `module=companies`
- `resourceId={{companyId}}`
- `purpose=cover`
- PNG, JPG ou WEBP real
- máximo de 10.000.000 bytes

Apesar de interfaces e testes antigos mencionarem `logo`, o serviço atual rejeita esse propósito. Por isso não há uma request de sucesso para upload de logo.

## Primeiro acesso e recuperação de senha

`inviteToken` e `resetToken` não são retornados pelas APIs. Eles precisam ser obtidos pelo canal de e-mail/outbox configurado e preenchidos localmente no environment.

Esses tokens também aparecem em query string no fluxo de validação. Evite compartilhar histórico, console ou URLs exportadas depois de preenchê-los e limpe os valores ao terminar.

As rotas de primeiro acesso estão atualmente montadas com o prefixo duplicado:

```text
/api/v1/auth/auth/validate-token
/api/v1/auth/auth/first-access
/api/v1/auth/auth/resend-invite-email
```

A collection usa esses paths porque são os realmente executáveis pelo bootstrap atual. Testes e frontend ainda contêm caminhos divergentes; a collection não mascara essa inconsistência.

## Paginação e filtros

Listagens administrativas usam `page` e `limit`, com padrão 1/20 e limite máximo de 100. A resposta contém `data` e `meta` com `page`, `pageSize`, `total` e `totalPages`.

Filtros adicionais documentados nas descriptions:

- empresas: `q`, `status`, `planId`;
- usuários: `q`, `role`, `status`;
- vendas: `companyId`, `planId`, `origin`, `from`, `to`.

## Validação local

Regere e valide os artefatos depois de alterar o manifesto:

```powershell
node postman/scripts/generate.mjs
node postman/scripts/validate.mjs
postman collection lint postman/collections/civix-api
postman environment lint postman/environments
```

O lint do Postman CLI valida o schema v3. O script local também confirma que v3 e JSON v2.1 possuem a mesma quantidade de requests, que as variáveis secretas estão vazias e que não foram exportados JWTs, URLs de banco com credenciais ou caminhos pessoais do Windows.

Esta estrutura foi validada com Postman CLI 1.76.0. A execução dos bloqueios requer uma versão do runtime que suporte `pm.execution.skipRequest()`.

## Execução pela CLI

Com o backend local iniciado:

```powershell
postman collection run "postman/import/Civix API.postman_collection.json" -e "postman/import/Civix Local.postman_environment.json"
```

O CLI 1.76.0 faz lint da estrutura Git-native v3, mas a execução local usa a exportação JSON v2.1. Com as flags padrão, mutações são ignoradas. Algumas leituras dependem de IDs e sessão, portanto a collection completa não representa um único cenário E2E verde. Para um fluxo com escrita, prefira selecionar apenas a pasta ou request necessária no Desktop e habilite as flags mínimas em uma cópia local do environment. Não execute a collection inteira com todas as autorizações ligadas.

Exemplo de execução segura de uma request específica; com as flags padrão, ela será ignorada antes de acessar a rede:

```powershell
postman collection run "postman/import/Civix API.postman_collection.json" -e "postman/import/Civix Local.postman_environment.json" -i "Criar plano"
```

## Rotas não incluídas

`backend/src/routes/admin.routes.ts` declara `/admin/invite`, mas esse router não é montado em `app.ts`. Portanto, ele não é chamável e não aparece como request funcional.

Também não existem endpoints montados para pagamentos, assinaturas, trials, configurações globais ou métricas dedicadas de dashboard.

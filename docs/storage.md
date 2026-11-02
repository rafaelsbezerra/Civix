# Usuários e capas de empresas

Implementação local de usuários e storage. Consulte as [specs de usuários](../backend/.specs/features/users-roles/spec.md) e [storage](../backend/.specs/features/storage/spec.md) para contratos e decisões completos.

## Acesso

Os papéis são admin_empresa, super_admin, atendente e cliente. Os três primeiros autenticam com e-mail e senha; cliente não recebe sessão e não possui área logada. Admin e atendente têm um company_id obrigatório; superadmin e cliente têm vínculo nulo.

O JWT Bearer dura uma hora e inclui tokenVersion 2 e companyId. Tokens anteriores exigem novo login. O middleware consulta a identidade persistida em cada chamada e rejeita mudanças de papel, vínculo ou estado. Não há refresh ou cookies de sessão.

O frontend valida o contrato de login, consulta o perfil para proteção de rotas e retorna à Home após autenticar. Dashboards continuam em tarefas próprias; o guard está disponível para elas.

## Upload e leitura

POST /api/v1/storage/images recebe multipart/form-data com quatro partes:

| Parte | Valor |
| --- | --- |
| file | Um arquivo PNG, JPEG ou WEBP |
| module | companies |
| resourceId | UUID da empresa |
| purpose | cover |

O limite é 10.000.000 bytes. O servidor verifica a assinatura binária e o MIME declarado. Admin altera apenas a própria empresa; superadmin pode alterar qualquer empresa existente. Atendente e cliente não enviam imagens. Identidade e papel vêm da sessão validada, nunca de campos do formulário.

A operação armazena o arquivo no R2, cria os metadados images e troca companies.cover_key pelo service de empresas. Atualizações concorrentes usam comparação com a chave anterior: uma operação perde com 409 e desfaz seus recursos. A imagem anterior só é removida depois da nova referência confirmada. Falhas de limpeza são registradas; uma capa confirmada é preservada.

As consultas públicas de empresas retornam cover_image_url, com URL assinada de 300 segundos. Sem capa vigente o campo é nulo. A resposta de empresa não inclui cover_image_url_expires_in. A rota pública GET /api/v1/storage/images/:imageId/url também retorna a URL da capa atual. Não permite consultar uma chave arbitrária ou uma capa substituída. URLs já emitidas podem continuar utilizáveis até expirar, se o objeto ainda existir.

cover_key e logo_key não são expostos na resposta pública. Logo tem somente estrutura reservada, sem upload funcional. O formulário de upload no frontend está fora desta entrega.

## Preparação e operação

1. Configure R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY no ambiente privado do backend, conforme .env.example. O bucket deve ser privado. Não salve credenciais no repositório.
2. Em PostgreSQL vazio, as migrations versionadas seguem a ordem dos diretórios: planos, localização dos planos, usuários, empresas, images, user_company_scope, company_administration e create_sales. A migration de vínculo acrescenta FK e restrições dos quatro papéis. Nenhuma foi executada nesta entrega; aplicação exige ambiente e autorização próprios.
3. Para dados locais, defina USE_MOCK_DATA=true e execute npm run mock:user:create no backend, escolhendo super_admin. O comando não promove contas existentes. Em PostgreSQL, prepare a primeira conta por seed ou procedimento administrativo controlado; não existe comando de bootstrap nesta base.
4. Faça login com esse usuário. Criação de empresa exige super_admin. O router admin permanece desmontado; não existe novo endpoint público de convite. A entrega de administração dos demais usuários continua separada.
5. Dados legados precisam de preparação explícita dos papéis e vínculos antes da autenticação. Não existe comando automático de conversão nesta base; usuários empresariais precisam de company_id válido.

Para falha de limpeza com metadados existentes, uma operação interna pode repetir deleteReplacedImage, que verifica referências antes da exclusão. Não há varredura automática de bucket: uma falha de compensação anterior ao cadastro de metadados requer inspeção operacional. Nunca remova uma chave ainda referenciada.

## Verificações e limites

Na verificação histórica da entrega de storage, passaram 124 testes backend, 35 testes frontend, TypeScript backend/frontend, lint frontend e três testes offline do tooling Prisma. Os testes de upload usam HTTP local, persistência JSON e substituto do provedor R2; não comprovam credenciais, bucket ou constraints em PostgreSQL real.

Permanecem pendentes a aplicação autorizada das migrations e a homologação PostgreSQL/R2. O build completo frontend encontra a verificação preexistente de dashboard.png ausente; TypeScript e bundle Vite passaram. A auditoria npm reporta quatro alertas altos transitivos do tooling Prisma fixado; a atualização não foi aplicada.

## Elegibilidade após gestão administrativa

Empresa inativa ou arquivada não aparece no catálogo, detalhe público ou
rota de capa, e não aceita upload, inclusive por superadmin. As referências
e objetos existentes são preservados. A gravação de chave também revalida
elegibilidade para recusar uma suspensão concorrente ao upload.
Restaurar mantém a empresa inativa até reativação explícita. Sessões dos
usuários vinculados são revogadas, sem reativar contas bloqueadas individualmente.
URLs já assinadas seguem seu prazo de cinco minutos; o backend não promete
revogar um arquivo já baixado. Consultas de empresa não incluem
cover_image_url_expires_in.

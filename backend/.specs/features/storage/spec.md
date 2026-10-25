# Storage de imagens — estrutura inicial

Referência: US-54. Escopo autorizado: estrutura, SQL, interfaces, rotas e
declarações; não implementar upload, autorização ou persistência nesta fase.
Trabalho na branch feat/storage-module, preservando alterações já existentes,
sem commit e sem aplicação de migrations.

## Contratos e responsabilidades

Rotas declaradas para montagem futura em `/api/v1/storage`:

- `POST /images`: autenticada, multipart/form-data; campo `file` e campos de
  destino `module`, `resourceId`, `purpose`. Parser multipart ainda pendente.
- `GET /images/:imageId/url`: obtenção pública da URL assinada, futuramente
  limitada à capa vigente de empresa. Não aceitar uma chave arbitrária do R2.

Router não montado em app.ts: handlers vazios não respondem nem autorizam.
Funções vazias usam Promise<void> como retorno provisório de scaffold, não
como resposta final da API. StorageRepository declara os contratos futuros
com retorno de imagens; implementações reais permanecem pendentes.

Entrada do frontend identifica módulo/recurso/finalidade e envia arquivo.
Não é autorização para escolher tabela, função, bucket, chave, autor ou papel.
Inicialmente o destino tipado é `companies` e as finalidades estruturais são
`cover` e `logo`. A entrega funcional US-54 continua limitada à capa; logo tem
somente coluna e assinatura reservadas nesta etapa.

Fluxo futuro: entrada → parse/validação de arquivo e metadados → identidade
e vínculo confirmados no servidor → existência da empresa → autorização
admin da empresa ou superadmin → R2 → metadados images → companyService
atualiza a chave → resposta HTTP. Não fazer dispatch de função/tabela a
partir de texto livre enviado pelo frontend.

Arquivo: PNG/JPEG/WEBP; limite estrutural definido em 10.000.000 bytes (10 MB
decimais). Nome, MIME e tamanho do frontend precisam ser conferidos/derivados
do arquivo no backend. URLs de leitura com 300 segundos; não armazenar URL
assinada no banco nem registrá-la nos logs.

## SQL e interfaces

A criação de companies ganha `cover_key` e `logo_key`, ambos TEXT nullable.
O campo legado `logo` permanece, sem conversão ou preenchimento automático.
Reeditar esta criação segue o pedido atual; se já aplicada, uma migration de
alteração separada deverá ser discutida antes de executar qualquer mudança.

Nova migration posterior cria images:

| Coluna SQL | Tipo | Interface Image |
| --- | --- | --- |
| id | UUID gerado, PK | string |
| object_key | TEXT obrigatório e único | string |
| original_name | TEXT obrigatório | string |
| mime_type | TEXT, PNG/JPEG/WEBP | ImageMimeType |
| size_bytes | INTEGER, 1 até 10000000 | number |
| module | TEXT obrigatório | string |
| resource_id | UUID obrigatório | string |
| purpose | TEXT obrigatório | string |
| uploaded_by | UUID, FK users, obrigatório | string |
| created_at | TIMESTAMPTZ obrigatório com NOW() | Date |

Image representa a linha PostgreSQL, não um retorno HTTP pronto. Datas serão
serializadas no DTO HTTP na implementação. CreateImageInput exclui id/data
gerados no banco. Chave é gerada pelo servidor dentro do bucket configurado.
Módulo e finalidade em SQL permitem evolução; o DTO atual limita destinos a
companies/cover/logo. `resource_id` polimórfico não oferece FK de propriedade.

Após criar images, FKs de companies.cover_key/logo_key referenciam object_key,
sem CASCADE: metadados de imagem referenciada não podem ser removidos sem
desvincular primeiro. A FK não verifica módulo, empresa ou finalidade; isso
continua responsabilidade do caso de uso. uploaded_by também não tem CASCADE.

## Outros módulos

- Company: campos opcionais cover_key/logo_key na entidade e schema local;
  omitidos do DTO de cadastro para impedir vínculo arbitrário de objetos.
- Company service: updateCompanyCoverKey/updateCompanyLogoKey declaradas.
- CompanyRepository: contratos updateCoverKey/updateLogoKey; adapters JSON
  e PostgreSQL recebem somente métodos vazios, sem UPDATE implementado.
- Auth: login já assina `{ id, email, role }`; middleware já verifica JWT e
  preenche req.userId/req.userRole. Nenhuma alteração necessária nesta fase.
- R2StorageService: corrigir imports de AppError/ErrorCode, preservar causa
  e usar o contrato de erro existente; não duplicar logs do handler HTTP.

## Decisões e integrações pendentes — Aguardando resposta

- Identificadores dos novos papéis e origem persistida do vínculo empresarial.
  Role empresa legado não comprova admin; o JWT não substitui consulta de
  vínculo/estado atual. Não aceitar role ou usuário declarado no multipart.
- Modelo atual UserId permite string/number; uploaded_by exige UUID. Validar
  a identidade antes de persistir, sem converter IDs antigos silenciosamente.
- Estratégia final para recursos de outros módulos e evolução do registro
  tipado de destinos. A estrutura não libera upload genérico irrestrito.
- Alinhamento do adapter atual empresas/campos portugueses com companies SQL.
- Aplicação em PostgreSQL e migração de banco já existente; nenhuma execução
  automática. Nova migration inversa somente quando solicitada.

Substituição e limpeza: armazenar/vincular nova imagem antes de excluir a
anterior, proteger contra concorrência e nunca apagar a capa vigente. URL
pública deve resolver referência vigente; registro histórico não autoriza
assinatura. Política pública de logo não está aprovada.

## Fora do escopo desta estrutura

Instalação de pacotes, frontend, execução SQL, implementação de R2 adicional,
parser multipart, validação real, fluxo de upload/assinatura/substituição,
autorização completa, novos perfis e persistência efetiva. Os arquivos R2 e
dependências já iniciados pelo usuário são preservados, salvo correção pedida.

## Verificação

Conferir tipos, rotas e SQL sem acessar R2/banco. Typecheck inicial já falha
por imports ausentes no r2.service.ts e chamadas inválidas de AppLogger em
testes de logging. Separar correção R2 de falhas históricas remanescentes.
Registrar resultados reais em task.md, sem marcar funcionalidades entregues.

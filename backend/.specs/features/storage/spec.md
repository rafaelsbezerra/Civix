# Storage — upload e leitura pública da capa

Atualização: 2026-11-01. Backend implementado e testado com R2 simulado.
Referência: US-54. Homologação R2/PostgreSQL reais ainda não executada.

## API

- POST /api/v1/storage/images: Bearer autenticado, multipart/form-data.
  Um arquivo no campo file; campos module=companies, resourceId=UUID da
  empresa e purpose=cover. Outros metadados são rejeitados.
- GET /api/v1/storage/images/:imageId/url: público, retorna data.url e
  data.expiresInSeconds=300 somente para capa vigente de empresa disponível.
  Endpoint adicional preservado da estrutura, com as mesmas verificações.
- Consultas públicas de empresas (detalhe, busca, filtros e listagem) retornam
  cover_image_url e cover_image_url_expires_in; sem capa ambos são null.
  Não retornam cover_key/logo_key. Nenhuma autenticação é exigida para leitura.

Upload retorna 201 com data.imageId e data.target. Campos e nomes existentes
do catálogo são preservados por mapeamento dos SQL em inglês.

## Validação e autorização

PNG, JPEG e WEBP; máximo 10.000.000 bytes, tamanho estritamente positivo.
Multer limita memória/quantidade de partes e file-type verifica assinatura
binária e compatibilidade com MIME declarado. Isso verifica tipo reconhecido,
não executa transformação, antivírus ou decodificação integral da imagem.

Admin_empresa altera só a própria empresa; super_admin altera empresa
existente. Atendente/cliente são negados; sem Bearer válido retorna 401.
O destino identifica recurso, não autorização. Papel/autor/bucket/chave não
são escolhas do frontend; o servidor gera chave nova com UUID e consulta a
identidade/vínculo vigente. Veja [papéis](../users-roles/spec.md).

Logo tem campo e contrato estrutural reservados, mas upload de logo não está
liberado. Não existe galeria, upload direto no navegador ou destino arbitrário.

## Fluxo de escrita e consistência

1. Autenticar, validar destino e permissão.
2. Conferir arquivo, assinatura, MIME e tamanho.
3. Ler capa anterior e gerar nova chave, nunca reutilizando chave histórica.
4. Enviar objeto ao R2 e persistir metadados images.
5. Revalidar permissão/vínculo e chamar companyService.updateCompanyCoverKey.
6. Atualizar companies por compare-and-swap contra a chave anterior; mudança
   concorrente retorna 409. Não confiar somente em bloqueio no processo Node.
7. Após confirmação, limpar imagem anterior apenas se não mais referenciada.
8. Na falha, compensar objeto/metadados novos sem excluir uma imagem vigente.

Falha de limpeza posterior mantém a capa nova e registra diagnóstico para
recuperação; deleteReplacedImage permite repetir a limpeza de metadado órfão.
Se a compensação falhar antes de persistir metadados, o objeto pode permanecer
órfão no R2: requer inspeção operacional, não há varredura automática de bucket.
Nunca apagar objetos sem confirmar que não são usados. Logging é best-effort
e não substitui erro original nem uma atualização já confirmada.

## SQL e persistência

images: id UUID gerado, object_key único, original_name, mime_type,
size_bytes INTEGER de 1 a 10000000, module, resource_id UUID, purpose,
uploaded_by UUID FK users e created_at TIMESTAMPTZ. Interface Image representa
essa linha, com created_at Date; JSON usa ISO e converte na leitura.

companies.cover_key/logo_key são nullable e referenciam images.object_key
sem cascata. A criação empresarial não aceita essas chaves no payload.
SQL/adapters atuais usam companies e mapeiam para os campos públicos antigos.
Repositories JSON/PostgreSQL implementados; métodos de empresa verificam a
chave esperada e não são mais placeholders.

resource_id polimórfico não tem FK para cada módulo; o service valida existência
e propriedade. Autor vem da identidade autenticada. Papel/vínculo não são
deduzidos do identificador do recurso nem de metadados de multipart.

## R2 e leitura

R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY vêm do ambiente.
Cliente criado sob demanda: catálogo sem capa não exige configuração R2.
Bucket deve ser privado; não criar URL pública permanente. R2StorageService
preserva causa em AppError sem diagnóstico sensível na resposta de produção.

Assinatura GET de 300 segundos por objeto vigente; renovar pela consulta
pública ou endpoint de URL. Cache e consumidor não devem pressupor URL eterna.
Uma troca concorrente pode tornar a imagem temporariamente indisponível, sem
fazer a consulta de empresa existente retornar 404. A expiração da assinatura
não apaga cópias que já tenham sido baixadas.

Referências técnicas: [SDK S3 v3 no R2](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/)
e [URLs assinadas](https://developers.cloudflare.com/r2/api/s3/presigned-urls/).

## Fora do escopo

Frontend de upload/exibição, dashboards, armazenamento de outros módulos,
transformações de imagem, bucket público, histórico de versões e execução
automática de migrations. O cliente não escolhe credenciais ou caminhos livres.

## Verificação

Ver [tarefas e evidências](task.md). Testes locais exercitam HTTP multipart,
R2 simulado, compensação, concorrência e leitura pública. Não houve upload
real, aplicação de migrations, acesso a PostgreSQL remoto ou publicação.
A integração de produção permanece pendente de homologação autorizada.

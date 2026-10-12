# Integração do frontend com o backend

Contratos e configuração dos consumidores existentes. O frontend acessa
HTTP; a seleção de JSON/PostgreSQL pertence ao backend.

## Consumidores adaptados

Os consumidores existentes leem data no sucesso e message nos
erros. O backend determina se os registros vêm do JSON ou PostgreSQL; o
frontend continua consumindo HTTP e não acessa arquivos locais diretamente.

| Consumidor existente | Endpoint do backend |
| --- | --- |
| Catálogo e Home | GET /api/v1/empresas |
| Busca | GET /api/v1/empresas/buscar?q=termo |
| Categoria/estado/tamanho/verificadas | GETs existentes em /api/v1/empresas |
| Perfil público | GET /api/v1/empresas/:id |
| Planos exibidos | GET /api/v1/plans |
| Helper de seleção já existente | POST /api/v1/plans/selection, Bearer JWT |
| Recuperação | POST /api/v1/users/esqueci-senha |
| Redefinição | POST /api/v1/users/redefinir-senha |
| Pré-validação de convite | GET /api/auth/validate-token?token=convite |
| Primeiro acesso | POST /api/auth/first-access |

A pré-validação passa a conferir o JWT de convite e users.invite_token,
conforme a mesma identidade/perfil e status utilizados na ativação. Isso não
altera o fluxo de reenvio que ainda usa token de recuperação.

## Configuração

No ambiente do frontend:

```env
VITE_API_URL=http://localhost:3000
```

A configuração comum também aceita a forma anterior com /api/v1 ao final.
Os consumidores incluídos na adaptação evitam duplicar esse prefixo; o auth
legado continua no prefixo real /api/auth. A aplicação deve ser reiniciada
quando a configuração mudar.

## Fluxos disponíveis e limites

Login ainda lê o envelope antigo e utiliza Axios; sua adaptação não está
concluída. Não há dashboard nem formulário de cadastro de empresas no frontend.
Plans.tsx não possui rota; PlanCard conserva seu link existente. Campos de
empresa seguem snake_case, incluindo descricao_detalhada.

A [spec de integração](../frontend/.specs/features/backend-integration/spec.md)
registra escopo/tarefas e a [validação](../frontend/.specs/features/backend-integration/validation.md)
preserva as evidências e limites das verificações.

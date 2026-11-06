# Inventário de rotas da collection

Total: **53 endpoints montados** em **63 requests**. Logins por papel, variantes de venda e casos negativos reutilizam algumas rotas. O inventário reflete o bootstrap em `backend/src/app.ts`.

| Método | Path | Acesso | Efeito | Sucesso esperado |
| --- | --- | --- | --- | --- |
| GET | `/` | Pública | Leitura | 200 |
| POST | `/api/v1/users/login` | Pública | Leitura | 200 |
| POST | `/api/v1/users/login` | Pública | Leitura | 200 |
| POST | `/api/v1/users/login` | Pública | Leitura | 200 |
| POST | `/api/v1/users/forgot-password` | Pública | Escrita | 200 |
| POST | `/api/v1/users/esqueci-senha` | Pública | Escrita | 200 |
| POST | `/api/v1/users/reset-password` | Pública | Escrita | 200 |
| POST | `/api/v1/users/redefinir-senha` | Pública | Escrita | 200 |
| GET | `/api/v1/auth/auth/validate-token` | Pública | Leitura | 200 |
| POST | `/api/v1/auth/auth/first-access` | Pública | Escrita | 200 |
| POST | `/api/v1/auth/auth/resend-invite-email` | Pública | Escrita | 200 |
| GET | `/api/v1/plans` | Pública | Leitura | 200 |
| GET | `/api/v1/empresas` | Pública | Leitura | 200 |
| GET | `/api/v1/empresas/verificadas/todas` | Pública | Leitura | 200 |
| GET | `/api/v1/empresas/buscar` | Pública | Leitura | 200 |
| GET | `/api/v1/empresas/categoria/{{category}}` | Pública | Leitura | 200 |
| GET | `/api/v1/empresas/estado/{{state}}` | Pública | Leitura | 200 |
| GET | `/api/v1/empresas/tamanho/{{companySize}}` | Pública | Leitura | 200 |
| GET | `/api/v1/empresas/{{companyId}}` | Pública | Leitura | 200 |
| GET | `/api/v1/users/profile` | Autenticada | Leitura | 200 |
| PUT | `/api/v1/users/profile` | Autenticada | Escrita | 200 |
| POST | `/api/v1/users/home` | Autenticada | Leitura | 200 |
| POST | `/api/v1/plans/selection` | Autenticada | Escrita | 200 |
| POST | `/api/v1/empresas` | Autenticada | Escrita | 201 |
| POST | `/api/v1/storage/images` | Autenticada | Escrita | 201 |
| GET | `/api/v1/storage/images/{{imageId}}/url` | Pública | Leitura | 200 |
| GET | `/api/v1/platform/plans` | Autenticada | Leitura | 200 |
| GET | `/api/v1/platform/plans/{{planId}}` | Autenticada | Leitura | 200 |
| POST | `/api/v1/platform/plans` | Autenticada | Escrita | 201 |
| PUT | `/api/v1/platform/plans/{{planId}}` | Autenticada | Escrita | 200 |
| POST | `/api/v1/platform/plans/{{planId}}/activation` | Autenticada | Escrita | 200 |
| GET | `/api/v1/platform/companies` | Autenticada | Leitura | 200 |
| GET | `/api/v1/platform/companies/{{companyId}}` | Autenticada | Leitura | 200 |
| POST | `/api/v1/platform/companies` | Autenticada | Escrita | 201 |
| PUT | `/api/v1/platform/companies/{{companyId}}` | Autenticada | Escrita | 200 |
| POST | `/api/v1/platform/companies/{{companyId}}/suspension` | Autenticada | Destrutiva | 200 |
| POST | `/api/v1/platform/companies/{{companyId}}/reactivation` | Autenticada | Escrita | 200 |
| DELETE | `/api/v1/platform/companies/{{companyId}}` | Autenticada | Destrutiva | 204 |
| POST | `/api/v1/platform/companies/{{companyId}}/restoration` | Autenticada | Destrutiva | 200 |
| GET | `/api/v1/platform/companies/{{companyId}}/users` | Autenticada | Leitura | 200 |
| POST | `/api/v1/platform/companies/{{companyId}}/users/invitations` | Autenticada | Escrita | 201 |
| PUT | `/api/v1/platform/companies/{{companyId}}/users/{{companyUserId}}` | Autenticada | Escrita | 200 |
| POST | `/api/v1/platform/companies/{{companyId}}/users/{{companyUserId}}/suspension` | Autenticada | Destrutiva | 200 |
| POST | `/api/v1/platform/companies/{{companyId}}/users/{{companyUserId}}/reactivation` | Autenticada | Escrita | 200 |
| DELETE | `/api/v1/platform/companies/{{companyId}}/users/{{companyUserId}}` | Autenticada | Destrutiva | 204 |
| GET | `/api/v1/platform/administrators` | Autenticada | Leitura | 200 |
| POST | `/api/v1/platform/administrators/invitations` | Autenticada | Escrita | 201 |
| PUT | `/api/v1/platform/administrators/{{administratorId}}` | Autenticada | Escrita | 200 |
| POST | `/api/v1/platform/administrators/{{administratorId}}/suspension` | Autenticada | Destrutiva | 200 |
| POST | `/api/v1/platform/administrators/{{administratorId}}/reactivation` | Autenticada | Escrita | 200 |
| GET | `/api/v1/platform/sales` | Autenticada | Leitura | 200 |
| GET | `/api/v1/platform/sales/{{saleId}}` | Autenticada | Leitura | 200 |
| POST | `/api/v1/platform/sales` | Autenticada | Escrita | 201 |
| POST | `/api/v1/platform/sales` | Autenticada | Escrita | 201 |
| DELETE | `/api/v1/platform/sales/{{saleId}}` | Autenticada | Destrutiva | 204 |
| POST | `/api/v1/users/login` | Pública | Leitura | 400 |
| POST | `/api/v1/users/login` | Pública | Leitura | 403 |
| GET | `/api/v1/users/profile` | Pública | Leitura | 401 |
| GET | `/api/v1/empresas/buscar` | Pública | Leitura | 400 |
| GET | `/api/v1/empresas/tamanho/invalido` | Pública | Leitura | 400 |
| GET | `/api/v1/storage/images/id-invalido/url` | Pública | Leitura | 400 |
| GET | `/api/v1/platform/companies` | Pública | Leitura | 401 |
| POST | `/api/v1/users/logout` | Pública | Leitura | 200 |

## Rotas deliberadamente ausentes

- `backend/src/routes/admin.routes.ts` não é montado em `app.ts`; portanto, `/api/v1/admin/invite` não é executável.
- Não existem rotas montadas de pagamentos, assinaturas, trials, configurações globais ou métricas dedicadas.
- Upload de logo não é fluxo de sucesso: o serviço atual aceita somente `purpose=cover`.

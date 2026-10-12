# Integração do frontend com o backend

Implementação autorizada em 2026-10-12 na branch codex/frontend-backend-integration,
derivada do PR #16. Consumidores do escopo adaptados; verificações direcionadas concluídas.
Entrega publicada no [PR #17](https://github.com/rafaelsbe/Civix/pull/17),
aberto para staging e dependente do [PR #16](https://github.com/rafaelsbe/Civix/pull/16).

## Consumidores adaptados

Os consumidores já implementados passam a ler data no sucesso e message nos
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

## Escopo preservado

Login e seus destinos permanecem intactos por orientação explícita do usuário;
a leitura de token/erro no login ainda está pendente para outra etapa.
Não há dashboard, novas rotas, formulário de cadastro ou UI nova de seleção.
Plans.tsx permanece sem rota; PlanCard continua com seu link atual.
Empresas mantêm os nomes retornados pelo backend, como descricao_detalhada.

Nenhuma biblioteca foi instalada e nenhuma animação foi implementada nesta entrega. O planejamento
do site está em [plano de animações](plano-animacoes.md).

## Verificação

Baseline anterior à implementação: 42/54 testes frontend aprovados; doze falhas
históricas em layout, rotas, assets e localStorage do Node 25. Lint aponta
set-state-in-effect em SignSelect; build aponta a caixa do import ResetPassword.
Após os ajustes, os 25 testes direcionados de contratos/consumidores frontend e
os 60 testes foundation backend passaram. Os typechecks backend, TypeScript e
Vite frontend passaram. O import de ResetPassword foi corrigido; o build completo
continua falhando no gate histórico do asset dashboard.png de Sobre. Lint mantém
o erro preexistente react-hooks/set-state-in-effect em SignSelect. Esses limites
não autorizam restaurar os requisitos históricos de Home/Sobre (AD-002).
A suíte completa frontend terminou em 65/77, mantendo as mesmas doze falhas
históricas da baseline em sete arquivos, sem novas falhas.

Smoke HTTP real: nove verificações aprovadas com Express e JSON temporário
isolado. No navegador, catálogo exibiu duas empresas, busca por “Ação + Saúde”
retornou uma, perfil apresentou descricao_detalhada e a Home carregou empresas
e um plano da API sem login. A verificação cobriu dados/sucesso; os estados de
erro/cancelamento dos formulários foram cobertos pelos testes direcionados.
Servidores e fixture foram temporários; o JSON local real foi preservado.
Nenhum banco remoto, envio externo de e-mail ou instalação foi utilizado.

Spec: [integração](../frontend/.specs/features/backend-integration/spec.md).

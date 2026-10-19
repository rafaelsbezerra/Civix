# Integração dos consumidores existentes com o backend

Estado: implementação autorizada em 2026-10-12, na branch codex/frontend-backend-integration,
criada a partir de e229843 (PR #16). Entrega para staging, dependente do PR #16.

## Escopo histórico confirmado — 2026-10-12

- Adaptar os consumidores já existentes de empresas, planos, recuperação,
  redefinição de senha e primeiro acesso ao sucesso { data, meta? } e erro
  { status, message, ...diagnóstico fora de produção }.
- Corrigir URLs, prefixos, codificação de parâmetros e campos de empresas
  para os contratos efetivamente retornados pelo backend.
- Corrigir a pré-validação do convite no backend: validar o mesmo JWT,
  identidade/perfil, status e invite_token usados na ativação.
- Preservar login.tsx, seus destinos e fluxos. Não criar dashboard, páginas,
  rotas novas, cadastro de empresa no frontend ou UI nova de seleção de plano.
- Apenas corrigir a caixa do import de ResetPassword e o link de recuperação
  para a rota já existente. Manter Home/Sobre sob AD-002.
- Documentar proposta de animações separadamente; não instalar bibliotecas
  nem implementar animações nesta etapa.

## Contratos e limites

API de empresas/planos/usuários: /api/v1. Primeiro acesso: /api/auth.
VITE_API_URL aponta para a origem do backend; manter compatibilidade com
configuração anterior terminada em /api/v1 sem duplicar prefixos.
Nenhum mock do frontend substitui falhas da API; USE_MOCK_DATA pertence ao backend.

A entidade de empresa recebida mantém snake_case, incluindo
descricao_detalhada e data_cadastro. Erros apresentam message; não depender
de success, error string ou reason. Primeiro acesso aceita os formatos de
token já declarados nas rotas (query e parâmetro).

Login permanece incompatível com o envelope por exclusão explícita do usuário.
PlanCard mantém seu link existente; o helper selectPlan é adaptado sem criar
uma interface nova. /planos continua sem rota. Reenvio de convite/recuperação
ainda exige alinhamento específico de protocolo, fora desta pré-validação.

## Aceite histórico — 2026-10-12

- Catálogo, filtros, detalhe e planos leem data de respostas HTTP reais.
- Busca utiliza /empresas/buscar e parâmetros são codificados.
- Recuperação/redefinição e primeiro acesso utilizam a configuração de API
  comum e exibem a mensagem pública do backend.
- Convites válidos passam na pré-validação e ativação; tokens inválidos,
  expirados, consumidos ou de outro perfil são rejeitados.
- Nenhum diff em login.tsx, nenhum novo destino ou biblioteca.
- Verificar testes de contrato/consumidores, tipagem, build e regressões,
  distinguindo falhas históricas de problemas introduzidos.

## Adoção HTTP no frontend — 2026-10-19

Autorizado incluir o login na integração, superando sua exclusão histórica.
Cada service de API extrai `data` do envelope `{ data, meta? }`; o transporte
comum valida o envelope e trata erros públicos por `message` e status HTTP.
Não haverá interceptor que remova o envelope. Telas recebem dados de domínio,
sem depender de `code`, `details` ou `stack`, ausentes em produção.

Login envia email, role e password quando empresa a `/api/v1/users/login`.
O service retorna `{ user: { id, name, email, role }, token }`. A tela grava
o token somente após sucesso válido e mantém os destinos existentes. Não
criar dashboard, sessão nova, refresh token, endpoints ou paginação. Falhas de
rede, JSON inválido e resposta sem envelope devem resultar em erro legível.

Verificação prevista: contratos dos services, login de ambos os perfis,
mensagens públicas, falhas de rede/envelope, TypeScript e lint. Registrar os
resultados efetivamente executados na entrega, sem reutilizar provas antigas.

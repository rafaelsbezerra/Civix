# Leads da empresa — frontend

**Estado:** integração planejada; API e contratos pendentes.
Data das decisões: 2026-11-02.
Par backend: [spec](../../../../backend/.specs/features/company-leads/spec.md).
Contrato canônico:
[decisions.md](../../../../backend/.specs/roadmaps/dashboards/decisions.md),
DASH-D10–D18.

## Casos de uso aprovados

- Home do dashboard sem métricas até que fontes e indicadores sejam aprovados.
- Contato no perfil público de empresa cria lead para a empresa contatada.
  Conta cliente não recebe dashboard; contato promocional não é lead.
- Dono consulta/administra todos os leads da empresa; atendente consulta
  atribuídos e disponíveis e pode assumir disponíveis.
- Status, edição, observação/prioridade, exportação, arquivamento e atribuição
  respeitam DASH-D12/D13. Escopo vem do backend e não de parâmetros visuais.

## Fluxos a documentar na implementação

### Criar contato

1. Identificar empresa a partir do perfil consultado.
2. Validar dados e enviar a operação real, sem fabricar confirmação.
3. Exibir loading, sucesso ou erro do contrato público.
4. Não transformar cadastro promocional em conta/leads; não criar sessão
   cliente ou dashboard.

### Listar e operar leads

1. Obter sessão/perfil confirmados pelo backend.
2. Consumir lista e permissões reais, sem aceitar companyId local.
3. Distinguir carregando, lista vazia, indisponibilidade e acesso negado.
4. Atualizar estado somente após confirmação da API; mostrar arquivados/
   exportação conforme filtros e contrato aprovados.

## Aguardando resposta

- Rotas e DTOs, estados/filtros/paginação, conteúdo e formato de exportação.
- Campos e mensagens de validação; feedback de duplicidade/antiabuso.
- Relação entre contato inicial e criação de conversa.
- Política visual para 403/404 sem revelar recurso fora do escopo.

Não criar fixtures de leads como se fossem dados reais. O teste de componente
não substitui E2E com frontend/backend e persistência isolada de duas empresas.

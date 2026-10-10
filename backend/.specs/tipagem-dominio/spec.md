# Entidades, interfaces e DTOs

Estado: planejamento; **Aguardando resposta** para BE-04/05/06/09/10.

## Problema e escopo

`Empresa` e wrappers HTTP estão no service; `Plan`/`PlanRow` também.
Tipos de usuário aparecem nos controllers. Linhas SQL são usadas como
contrato público, embora frontend espere nomes diferentes.

Criar arquivos próprios para modelos, entradas/saídas e interfaces dos
módulos existentes. Não inventar entidades completas de leads, conversas,
vendas ou dashboards ainda não especificados.

## Requisitos

- TYP-01: Entidades expressam identidade e invariantes aprovadas do domínio;
  não dependem do Express, de envelopes HTTP ou do cliente de banco.
- TYP-02: DTOs definem dados de entrada/saída; tipos de persistência definem
  linhas/modelos do adapter. Mappers explicitam diferenças de nomes e null.
- TYP-03: Inputs externos recebem validação em runtime; uma asserção de
  TypeScript não comprova validade de ID, enum ou payload.
- TYP-04: Interfaces de acesso aos dados, se aprovadas, têm implementação
  controlada para testes sem banco. Ela não representa persistência durável.
- TYP-05: Evitar `any`, casts para esconder diferenças e duplicação de tipos
  canônicos. Usar `unknown` para erros não classificados e estreitar tipos.

## Tarefas e aceite

Nesta etapa, criar tipos/interfaces/DTOs separados e mappers testáveis.
Empresas pode consumir os tipos extraídos, mantendo seu contrato atual.
Não alterar outros services/controllers existentes. Migração dos consumidores
e modelo canônico de identidade permanecem para a adoção posterior.

- [ ] TYP-01: Aprovar modelo mínimo de empresas, planos e identidade.
  Aceite: campos, obrigatoriedade, enums, IDs/datas, vínculos e invariantes
  registrados; `user`/`users` resolvido antes de definir baseline de banco.
- [ ] TYP-02: Extrair entidades, DTOs e tipos de persistência para arquivos.
  Aceite: services/controllers consomem tipos próprios; saída pública não
  expõe senha/hash/token ou campos internos de usuário.
- [ ] TYP-03: Criar interfaces e adapter de teste, se BE-06 aprovado.
  Aceite: service testável sem conexão; comportamento de vazio, ausência e
  falha simulada coerente com os contratos HTTP.
- [ ] TYP-04: Implementar mapeamento e validação aprovados.
  Aceite: nomes camelCase/snake_case, null/ausente, datas e enums são tratados
  explicitamente; entradas inválidas falham antes de executar o caso de uso.
- [ ] TYP-05: Atualizar documentação de modelo e arquitetura.
  Aceite: exemplos distinguem entidade, DTO e persistência sem burocracia.

Verificação futura: typecheck; testes de mappers, validação e invariantes
aprovadas. Não criar testes para getters sem comportamento relevante.

# Specs do backend

Planejamento inicial de SDD leve + DDD leve, em 2026-10-09, na `staging`.
Etapa atual: implementar a base descrita pelas specs, sem ativá-la nos fluxos
existentes. Commit documental antes do código; branches/worktrees por tarefa,
branch de integração para dependências e todos os PRs destinados à `staging`.
Atualizar a documentação principal em cada tarefa.

## Grupos de trabalho

1. [Contratos HTTP: erro, resposta e paginação](contratos-http/spec.md).
2. [Estrutura e convenções; adequação de empresas](estrutura-modulos/spec.md).
3. [Entidades, interfaces e DTOs](tipagem-dominio/spec.md).
4. [Migrations executáveis](migrations/spec.md).

As [decisões](STATE.md) distinguem instruções confirmadas de propostas.
Itens com **Aguardando resposta** não autorizam escolha ou implementação.
Checkbox marcado exige evidência. Base HTTP e extração de empresas têm implementação e testes; adoção e execução de migrations em banco permanecem pendentes.

## Como trabalhar

- Confirmar as decisões necessárias ao grupo antes de implementar.
- Atualizar sua spec com a resposta e um exemplo concreto do comportamento.
- Implementar tarefas pequenas e verificar seus critérios de aceite.
- Atualizar `/docs`; a migração de consumidores ocorrerá na etapa de adoção.
- Usar subagentes nas tarefas secundárias e informar função e modelo.
- Perguntar quando surgir dúvida ou decisão nova; registrá-la como pendente.

DDD leve significa organizar responsabilidades por domínio, separar os
modelos de negócio dos contratos HTTP e da persistência, e explicitar as
interfaces necessárias. Não exige microserviços, CQRS, event sourcing ou
uma camada de abstração sem necessidade concreta.

Implementação atual: contratos reutilizáveis, estrutura e tipos separados. Tooling de migrations usa Prisma 7.10.0 com SQL nativo; schema e execução em banco permanecem pendentes. Não registrar novos handlers no servidor,
alterar rotas existentes, trocar consultas ou adaptar o frontend agora.
Exceção aprovada: reorganizar empresas por camadas e extrair tipos, mantendo
seu contrato atual. Demais módulos e consumers serão a próxima etapa.

## Outros padrões sugeridos

Antes de implementar os contratos, definir validação de entradas,
serialização de datas/IDs/null, ordenação/filtros e configuração do ambiente.
Rastreabilidade de erros exige decidir o `requestId` e logs sem segredos.
Autorização e isolamento por empresa exigem uma spec própria antes de
novos módulos privados. Nenhum desses padrões foi aprovado implicitamente.

Referências: [diagnóstico](../../docs/diagnostico.md),
[API atual](../../docs/api.md) e [pendências gerais](../../docs/decisoes.md).

## Extração de usuários e repositories

[Spec de usuários e persistência](usuarios-repositories/spec.md): somente
interfaces de repositories e reorganização de userController/userRoute;
convites/primeiro acesso preservados. Implementações e adoção dos
repositories são posteriores.

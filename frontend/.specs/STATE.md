# STATE

## Decisions

### AD-001
- **Decision**: A Civix será tratada como uma plataforma híbrida que combina descoberta de serviços para clientes e automação comercial para empresas.
- **Reason**: O posicionamento concilia o formulário de busca, o catálogo de empresas e os planos de automação presentes no Figma.
- **Trade-off**: A comunicação precisa atender dois públicos sem transformar cada tela em uma explicação completa do produto.
- **Scope**: Todas as features de produto, conteúdo e navegação da Civix.
- **Date**: 2026-08-20
- **Status**: active

## Handoff

- **Feature**: Tela Sobre / `.specs/features/about-page/`
- **Phase / Task**: Execute / Complete
- **Completed**: tela Sobre em `/sobre`, responsividade derivada, seis exports locais, testes unitários/browser/build e validação independente PASS 15/15
- **In-progress** (file:line): none
- **Next step**: revisão/release da branch; alteração externa em `src/pages/Home.tsx` permanece fora dos commits da feature
- **Blockers**: none
- **Uncommitted files**: `src/pages/Home.tsx` (alteração externa preservada; não pertence ao trabalho validado)
- **Branch**: `feature/about-page`

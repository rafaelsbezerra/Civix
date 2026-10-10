# STATE

## Decisions

### AD-001
- **Decision**: A Civix será tratada como uma plataforma híbrida que combina descoberta de serviços para clientes e automação comercial para empresas.
- **Reason**: O posicionamento concilia o formulário de busca, o catálogo de empresas e os planos de automação presentes no Figma.
- **Trade-off**: A comunicação precisa atender dois públicos sem transformar cada tela em uma explicação completa do produto.
- **Scope**: Todas as features de produto, conteúdo e navegação da Civix.
- **Date**: 2026-08-20
- **Status**: active

## Handoff atual — auditoria de 2026-10-10

- **Feature**: home-hero e about-page.
- **Phase / Task**: auditoria documental; requisitos vigentes **Aguardando resposta**.
- **Implementado observado**: componentes de hero/About, tokens/fontes, formulário,
  menu responsivo, metadados, testes e scripts de verificação.
- **Divergências**: /sobre não está registrada; About é seção da Home com main/h1
  adicionais. Dois assets históricos de About estão ausentes e o notebook mudou.
  Header usa destinos de aplicação, incluindo /planos sem rota registrada.
- **Next step**: confirmar se os requisitos históricos continuam obrigatórios
  ou se as alterações atuais devem ser incorporadas às specs; não escolher isso
  automaticamente. Adaptação frontend aos contratos backend segue adiada.
- **Verificação atual**: leitura de source/config/testes e existência de arquivos;
  sem execução de teste, lint, build, navegador, CLS, zoom ou contraste.
- **Referência**: [revisão consolidada](../../docs/revisao-pendencias-specs.md).

## Handoff histórico — não representa aprovação da versão atual

A entrega da branch feature/about-page registrou PASS 15/15 e gates em agosto
de 2026 (ver validation.md de cada feature). Os checkboxes originais foram
preservados como histórico. Esse resultado não prova rota, assets ou integração
da versão atual. LESSONS.md/lessons.json permanecem registros históricos sem
edição ou promoção de candidatos nesta auditoria.

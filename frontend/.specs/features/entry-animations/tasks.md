# Animações de entrada — tarefas

**Status:** implementação, instalação e verificação executadas no escopo.
Motion 14.1.0 fixado; todas as telas de acesso preservadas. A5 fora de escopo;
A7 executado com limitações registradas.
Referências: [spec](spec.md) e [mapa completo](design.md).

## Concluído nesta entrega

- [x] Ler rotas, páginas, componentes, efeitos existentes e manifest.
- [x] Mapear todo o site por local, elemento, gatilho, sequência e propriedades.
- [x] Distinguir seções/componentes existentes de rotas e funcionalidades ausentes.
- [x] Registrar estados API, mobile, reduced motion, teclado, Lenis e performance.
- [x] Comparar Motion/CSS/GSAP com fontes primárias atuais e registrar recomendação.
- [x] Documentar critérios e autorização de implementação/instalação, com login excluído.

## Navbar: implementação autorizada

- [x] NAV-01: Navbar fixa com espaço de 106 px e fundo claro após rolagem.
- [x] NAV-02: Item ativo por seção visível, desktop/mobile, com âncoras compensadas.
- [x] NAV-03: Ordem de sobreposição abaixo do modal e verificação responsiva.

- [x] NAV-04: Unificar navbar públicas; preservar login/formulários de acesso.
- [x] NAV-05: Empresas /#empresas e Planos /#planos; catálogo pelo botão Ver todas.
- [x] NAV-06: Preservar Contato /#contato sem criar destino/ID ausente.

Navbar implementada e coberta por testes direcionados. Login e todos os
formulários permanecem intactos, sem motor ou navbar. Aceite de runtime/
viewports está registrado em A7/validation, com limitações explícitas.

## Animações: execução autorizada

| Tarefa | Entrega | Critérios |
| --- | --- | --- |
| A1 | Registrar autorização de Motion 14.1.0, escopo e exclusão total de login | Decisões da spec |
| A2 | Presets/observação/fallback visível e tratamento reduced motion/Lenis | ANIM-02/03/07 |
| A3 | Home: hero/busca, About, empresas, planos, FAQ/CTA, header/footer/modal | ANIM-01/04/05/06 |
| A4 | Catálogo, perfil e Plans quando houver rota | ANIM-01/04/05/07 |
| A5 | Fora do escopo: login, primeiro acesso, recuperação e redefinição integralmente preservados | Não concluir nem implementar nesta entrega |
| A6 | Ajuda, documentos legais, 404 e navegação | ANIM-01/06/07 |
| A7 | Validar comportamento, bundle, viewports e atualizar docs/specs | ANIM-03 a ANIM-08 |

- [x] A1 — implementação/instalação autorizadas; Motion 14.1.0 e login excluído.
- [x] A1-INSTALL — Motion 14.1.0 instalado e fixado no manifest/lockfile.
- [x] A2 — presets, fallback, foco, cleanup e reduced motion/Lenis implementados.
- [x] A3 — Home/seções/modal implementados; foco/dialog cobertos nos testes.
- [x] A4 — catálogo/perfil implementados; Plans sem rota permanece fora do escopo.
- **A5 — fora do escopo**, não concluído: preservar todos os componentes/fluxos de acesso.
- [x] A6 — ajuda, documentos legais e 404 implementados; conteúdo legal preservado.
- [x] A7 — navegador nas cinco larguras, API lenta/erro, âncoras, modal/menu e bundle verificados; limites registrados.

## Verificações da execução

Revisar os scripts existentes antes de executar. Atualmente `npm run test`,
`npm run lint`, `npm run build` e `npm run test:e2e` estão no manifest frontend;
o último cobre About e não substitui a validação do mapa completo.

Verificar viewport/reentrada, foco antes da animação terminar, Escape/retorno de
foco e dialog, API lenta/erro/vazio, novas listas por filtro, IDs estáveis,
navegação/hash, Strict Mode, reduced motion inicialmente e alterado em runtime.
Capturar os cinco viewports da spec, verificar overflow e layout estável e medir
o bundle antes/depois. Adicionar testes para comportamento útil, evitando testes
que apenas copiam números de duração ou detalhes internos da biblioteca.


Evidências: [validation.md](validation.md). Logs não ficam nos guias gerais.

# Animações de entrada — tarefas

**Status:** proposta documentada; implementação **Aguardando resposta**.
Referências: [spec](spec.md) e [mapa completo](../../../../docs/plano-animacoes.md).

## Concluído nesta entrega

- [x] Ler rotas, páginas, componentes, efeitos existentes e manifest.
- [x] Mapear todo o site por local, elemento, gatilho, sequência e propriedades.
- [x] Distinguir seções/componentes existentes de rotas e funcionalidades ausentes.
- [x] Registrar estados API, mobile, reduced motion, teclado, Lenis e performance.
- [x] Comparar Motion/CSS/GSAP com fontes primárias atuais e registrar recomendação.
- [x] Documentar critérios simples e decisões que aguardam aprovação.

## Execução futura, após aprovação

| Tarefa | Entrega | Critérios |
| --- | --- | --- |
| A1 | Confirmar biblioteca, autorização de instalação e escopo visual | Decisões da spec |
| A2 | Presets/observação/fallback visível e tratamento reduced motion/Lenis | ANIM-02/03/07 |
| A3 | Home: hero/busca, About, empresas, planos, FAQ/CTA, header/footer/modal | ANIM-01/04/05/06 |
| A4 | Catálogo, perfil e Plans quando houver rota | ANIM-01/04/05/07 |
| A5 | Login, primeiro acesso, recuperação/redefinição e estados | ANIM-01/04/06 |
| A6 | Ajuda, documentos legais, 404 e navegação | ANIM-01/06/07 |
| A7 | Validar comportamento, bundle, viewports e atualizar docs/specs | ANIM-03 a ANIM-08 |

- [ ] A1 — **Aguardando resposta**; não instalar bibliotecas nesta entrega.
- [ ] A2 — aguarda A1; nenhuma animação criada nesta entrega.
- [ ] A3 — aguarda A2; confirmar foco/semântica de dialog antes da animação.
- [ ] A4 — aguarda A2 e integração backend; verificar rotas no código final.
- [ ] A5 — aguarda A2 e integração dos contratos de autenticação.
- [ ] A6 — aguarda A2; preservar leitura imediata dos documentos legais.
- [ ] A7 — executar sobre código com animações, sem reutilizar PASS histórico.

## Verificações da execução futura

Revisar os scripts existentes antes de executar. Atualmente `npm run test`,
`npm run lint`, `npm run build` e `npm run test:e2e` estão no manifest frontend;
o último cobre About e não substitui a validação do mapa completo.

Verificar viewport/reentrada, foco antes da animação terminar, Escape/retorno de
foco e dialog, API lenta/erro/vazio, novas listas por filtro, IDs estáveis,
navegação/hash, Strict Mode, reduced motion inicialmente e alterado em runtime.
Capturar os cinco viewports da spec, verificar overflow e layout estável e medir
o bundle antes/depois. Adicionar testes para comportamento útil, evitando testes
que apenas copiam números de duração ou detalhes internos da biblioteca.

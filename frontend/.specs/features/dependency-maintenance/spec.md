# Manutenção das dependências frontend

Estado: limpeza de manifest/lockfile implementada; sem instalação ou download.
Escopo autorizado separado do planejamento de navbar/animações.

## Alteração

- Remover 13 dependências diretas sem uso no frontend: bcrypt, cors, dotenv,
  express, jsonwebtoken, pg, @neondatabase/serverless, @types/bcrypt,
  @types/cors, @types/express, @types/jsonwebtoken, @types/pg e tsx.
- Mover @tailwindcss/vite, tailwindcss e shadcn para devDependencies.
- Preservar fontes, Axios, bibliotecas de CSS/classes e versões retidas.
- Remover start que apontava para backend/src/server.ts dentro do frontend.
- Ajustar o script de navegador para importar chromium de @playwright/test
  já declarado, sem acrescentar uma dependência.

Essa manutenção não implementa navbar/animações, não altera AGENTS, backend
ou schema, nem instala Motion. [Manifest e execução](../../../../docs/operacao.md).

## Verificação registrada

O lockfile foi sincronizado offline por Arborist/npm virtual, sem download;
75 nós foram retirados (665 → 590), preservando as versões dos nós retidos.
A tentativa anterior com npm offline falhou por cache de WASM opcional ausente;
npm ci não foi executado. Não declarar instalação limpa comprovada.

Passaram 25 testes direcionados frontend, TypeScript e Vite. Build completo
continua falhando no gate histórico de assets Sobre; lint mantém o erro
preexistente em SignSelect. Essas falhas não autorizam restaurar layout/rotas
históricos, conforme AD-002. Não houve migration, banco real ou dependência nova.

## Tarefas

- [x] Analisar dependências por imports e configurações existentes.
- [x] Limpar manifest e sincronizar lockfile offline, preservando versões.
- [x] Ajustar script de navegador à dependência já declarada.
- [x] Verificar testes direcionados, tipagem e Vite; registrar limites de gates.
- [x] Atualizar guia geral e este registro de manutenção.
- [ ] Comprovar npm ci em ambiente com cache/rede disponível, quando autorizado.

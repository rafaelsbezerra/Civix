# Estrutura dos módulos e convenções

Estado: planejamento; inglês e pastas globais por função confirmados.
Nomenclatura detalhada e abrangência **Aguardando resposta** (BE-04/05).
A cadeia routes → controller → service está confirmada.

## Problema e escopo

`src/routes/empresaRoute.ts` possui handlers e acessa diretamente
`src/services/empresaService.ts`; empresas não possui controller.
Há nomes em português/inglês, camelCase/sufixos e `controller` no singular.
Controllers de user/auth/admin também contêm SQL e regras de aplicação.

Definir um padrão único e adequar empresas primeiro. Inventariar os demais
módulos; execução de MOD-04 aguarda confirmação de abrangência.
Manter pastas como `src/routes`, `src/controllers` e `src/services`, sem
introduzir `src/modules`. Pastas de entities/interfaces/dtos dependem da
confirmação de nomes; não duplicar estruturas por domínio.
Não criar CRUD ou módulos
comerciais ausentes durante esta refatoração.

## Responsabilidades

- Routes: registrar URL/método e compor middlewares/controller.
- Controller: receber entrada validada, chamar service e traduzir resultado
  para HTTP; sem SQL ou regras comerciais.
- Service: coordenar caso de uso e regras existentes; sem Request/Response
  do Express ou construção de envelopes HTTP.
- Persistência: localização/adapter depende de BE-06; não colocar SQL em
  routes/controllers para resolver essa pendência.

## Tarefas e aceite

Nesta etapa, definir estrutura reutilizável e executar MOD-02/03 somente
para empresas, mantendo rotas/envelopes e regras atuais. Não aplicar os
contratos novos. MOD-04 permanece para adoção posterior.

- [ ] MOD-01: Aprovar idioma, nomes, pastas e um exemplo de módulo.
  Aceite: registrar regras de arquivos, exports/imports, funções/classes,
  tipos e constantes. Decidir estilo funcional versus classes.
- [ ] MOD-02: Extrair controller de empresas e ajustar service/routes.
  Depende dos contratos HTTP e tipos aprovados.
  Aceite: handlers separados, erros preservam sua natureza, routes sem
  lógica de negócio e service sem dependência de HTTP.
- [ ] MOD-03: Renomear/mover arquivos conforme o padrão aprovado.
  Aceite: imports ESM resolvem e casing funciona em Linux; endpoints mantidos
  ou alterados somente com decisão e atualização dos consumidores.
- [ ] MOD-04: Inventariar e adequar user/auth/admin/plans ao mesmo padrão.
  Aceite: nenhum SQL em routes/controllers, nenhuma duplicação de contratos;
  mudanças de regras de autenticação ficam fora desta tarefa.
- [ ] MOD-05: Documentar convenções e atualizar arquitetura/diagnóstico.
  Aceite: novo módulo pode seguir exemplo curto com responsabilidades claras.

Verificação futura: typecheck e testes HTTP dos caminhos existentes de
empresas (listar, detalhe, filtros e busca), cobrindo ausência e falha de
persistência. Comparar inventário de rotas antes/depois; não considerar
regressões atuais como comportamento desejado.

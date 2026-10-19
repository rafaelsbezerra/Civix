# Spec portátil — contrato de resposta de sucesso

Data: 2026-10-13. Contrato extraído da implementação da Civix.
Destino: outro projeto. Este documento é autossuficiente; não exige copiar
pastas, domínio, bibliotecas ou convenções Git da Civix.
Estado: referência para implementação no destino, não implementação realizada.

## Objetivo

Padronizar sucesso HTTP sem misturar data, result, success ou recursos soltos
na raiz. Manter erros em seu contrato próprio, sem envolver erro em data.
Não mudar regra de negócio, autenticação, banco ou URLs por causa do envelope.
Este contrato cobre respostas JSON: arquivos, streams e outros protocolos
exigem escopo próprio no destino; não envolver seus bytes em data automaticamente.

## Contrato obrigatório

O corpo JSON de sucesso tem data obrigatório e meta opcional:

~~~typescript
interface SuccessResponse<T, M = never> {
  data: T;
  meta?: M;
}
~~~

- data contém o resultado público serializável: objeto, array, valor ou null,
  conforme o contrato do endpoint. Não devolver undefined como resultado JSON.
- Sem metadados, omitir meta: não acrescentar meta: null ou meta: {} por padrão.
- Se meta for explicitamente fornecido, preservá-lo; tipar por operação.
- Não adicionar success/status/code/message na raiz deste envelope.
- Mensagem de sucesso, quando necessária, pertence a data.message.
- Não duplicar envelope: { data: { data: resultado } } não é o padrão.
- Retornar DTO público; não expor senha, hash ou credenciais dentro de data.

Os helpers de referência empacotam dados; não fazem validação runtime geral
nem serialização canônica de datas, IDs ou valores monetários. Essas políticas
pertencem aos DTOs e ao projeto de destino; não inventá-las nesta adoção.

## Status e exemplos

| Caso | HTTP | Corpo |
| --- | --- | --- |
| Consulta ou operação concluída com resultado | 200 | { data: resultado } |
| Recurso criado | 201 | { data: recursoCriado } |
| Operação concluída sem conteúdo | 204 | Nenhum corpo, nem null nem {} |
| Lista sem registros | 200 | { data: [] } |

Exemplo de criação, HTTP 201:

~~~json
{ "data": { "id": "record-1", "name": "Registro de exemplo" } }
~~~

Exemplo de mensagem de sucesso, HTTP 200:

~~~json
{ "data": { "message": "Operação concluída." } }
~~~

Uma consulta unitária ausente segue a regra aprovada do endpoint, normalmente
404 pelo contrato de erro; não transformar toda ausência em sucesso null.
Não converter falha de persistência em 200 ou lista vazia.

## Responsabilidades e consumidores

Service/use case retorna dados ou lança erro. Controller/adapter HTTP escolhe
status e usa o envelope. O serializer de sucesso não captura nem converte erros.

Implementar equivalentes de createSuccessResponse, sendSuccess (200),
sendCreated (201) e sendNoContent (204), adaptados ao framework existente.
Esses nomes são referências úteis, não exigência de um framework ou factory.

Frontend lê body.data e body.meta. Em Axios, normalmente response.data.data;
com fetch, normalmente (await response.json()).data. Esses acessos dependem
apenas da biblioteca existente, sem exigir uma nova dependência.
Para 204, não chamar response.json(). Em falha, ler status HTTP e body.message,
não body.data.message. Dados paginados continuam um array em data.

## Instruções ao agente implementador

1. Ler regras do repositório destino e inventariar endpoints/consumidores.
2. Confirmar abrangência da adoção e política de compatibilidade antes de
   alterar endpoints já consumidos. Não instalar dependências para criar helpers.
3. Criar tipo/helpers centrais coerentes com a estrutura existente.
4. Migrar controllers e consumidores no escopo aprovado, sem duplo envelope.
5. Executar verificações pertinentes disponíveis e atualizar documentação.

Tarefas no destino, ainda não concluídas:

- [ ] RES-01: Inventariar formatos atuais e confirmar endpoints a adaptar.
- [ ] RES-02: Implementar tipos/helpers e projeções públicas por endpoint.
- [ ] RES-03: Aplicar 200/201/204 preservando semântica do domínio.
- [ ] RES-04: Adaptar consumidores e tratar 204 sem tentar parsear JSON.
- [ ] RES-05: Testar contratos exatos e documentar compatibilidade/limites.

## Aceite

Testar objeto, array, lista vazia, null permitido e meta fornecido/omitido.
Comparar chaves exatas: sem meta quando ausente, sem success/status na raiz.
201 mantém envelope; 204 tem corpo vazio. Mensagem de sucesso fica em data.
Erros não são embrulhados nem convertidos em resultados de sucesso.
Validar pelo menos um fluxo HTTP real e seu consumidor após a integração.

## Aguardando resposta no projeto de destino

Endpoints abrangidos, compatibilidade/versionamento, DTOs e casos válidos
para null/204. Essas decisões locais não mudam o envelope definido aqui.
Companheiras opcionais: [erro](error.spec.md) e [paginação](pagination.spec.md).

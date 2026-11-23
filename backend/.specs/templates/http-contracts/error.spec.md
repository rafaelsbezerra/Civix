# Spec portátil — contrato de erro HTTP

Data: 2026-10-13. Contrato extraído da implementação da Civix.
Destino: outro projeto. Documento autossuficiente, sem exigir Express,
Pino, Zod, banco, nomes de rotas ou estrutura de pastas da Civix.
Estado: referência para implementação; nenhuma aplicação destino foi alterada.

## Objetivo

Representar falhas esperadas por uma classe central e serializar todas as
falhas HTTP num único handler. Não retornar erro com HTTP 200, envolver erro
em data/error, criar reason por situação ou interpretar mensagem por switch.

## Erro da aplicação

~~~typescript
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
interface AppErrorOptions {
  status: number;
  code: ErrorCode;
  message: string;
  details?: unknown;
  cause?: unknown;
}
~~~

AppError estende Error, preserva stack/cause e expõe status/code/details.
Validar status como inteiro entre 400 e 599; code pertence ao enum; message
não pode ser vazia ou só espaços. Invalidar a construção de forma explícita
(RangeError para status inválido; TypeError para code/message na referência).
Não transformar erro de programação no construtor em erro de entrada do cliente.

message é mensagem pública em português, não texto técnico bruto do banco.
code e identificadores permanecem em inglês. details descreve diagnóstico;
cause preserva exceção original. Service lança erro ou retorna resultado;
controller/adapter HTTP encaminha ao handler, sem duplicar serialização.

| Situação habitual | HTTP | Código |
| --- | --- | --- |
| Entrada inválida | 400 | VALIDATION_ERROR |
| Credencial/sessão ausente ou inválida | 401 | UNAUTHORIZED |
| Ação não permitida | 403 | FORBIDDEN |
| Recurso/rota ausente | 404 | NOT_FOUND |
| Conflito de estado ou unicidade | 409 | CONFLICT |
| Corpo acima do limite configurado | 413 | VALIDATION_ERROR |
| Falha interna inesperada | 500 | INTERNAL_ERROR |

A tabela guia a escolha no ponto da falha; enum/classe não calculam status
automaticamente. Não criar um switch universal de code → status ou de mensagens.
Reconhecer erros específicos de parser/framework pelo tipo/protocolo confiável,
sem inventar mapeamento de todo erro do banco para 400/404.

## Resposta em produção

Produção é environment === 'production', com exatamente esse valor na
referência Node. Contexto explícito prevalece sobre NODE_ENV; ausência de
contexto usa NODE_ENV. Adaptar a origem dessa configuração à linguagem destino,
sem aceitar parâmetro do cliente para escolher exposição de diagnóstico.

Corpo contém apenas status e message; status HTTP deve ser igual ao campo.
Falha inesperada, HTTP 500:

~~~json
{ "status": 500, "message": "Erro interno do servidor" }
~~~

Falha esperada de validação, HTTP 400:

~~~json
{ "status": 400, "message": "Campo inválido." }
~~~

Não retornar code/details/stack/requestId/cause/name em produção. AppError
mantém seu status e mensagem pública sanitizada; não converter todos os erros
esperados em 500. Exceção desconhecida sempre usa 500/mensagem genérica,
mesmo se um objeto lançado possuir propriedades status/message.

## Resposta nos demais ambientes

development, test, staging, preview, valor vazio e ausência de ambiente são
fora de produção na referência. Retornar status/message/code/details/stack,
com requestId opcional somente quando fornecido ao contexto do serializador.

Exemplo ilustrativo de AppError, HTTP 400:

~~~json
{
  "status": 400,
  "message": "Campo inválido.",
  "code": "VALIDATION_ERROR",
  "details": { "details": { "field": "email" }, "cause": null },
  "stack": "AppError: Campo inválido.\n    at validateInput (...)",
  "requestId": "request-example"
}
~~~

No AppError, details externo contém exatamente o diagnóstico
{ details: payloadSanitizadoOuNull, cause: causaSanitizadaOuNull }.
A camada aninhada não é erro de exemplo: reproduz o serializer atual.
Em erro inesperado, details é a sanitização da exceção original, sem exigir
essa camada; status/code são 500/INTERNAL_ERROR e message continua genérica.

Se o lançamento não for uma instância de Error, preservar o valor sanitizado
em details e gerar pilha diagnóstica de uma exceção equivalente; não tratá-lo
como AppError por ter propriedades semelhantes. Falta de pilha usa
"[Pilha indisponível]". A pilha do exemplo é ilustrativa, não um valor fixo.

requestId é omitido se não fornecido/útil; sanitizá-lo quando existir. Gerar
um ID nos logs não o acrescenta automaticamente à resposta ou aos headers.
Não exigir middleware de rastreabilidade, header X-Request-Id ou Pino para
implementar este contrato; qualquer integração deve ser explícita no destino.

## Sanitização e serialização

Sanitizar mensagem pública, stack, details, cause e requestId. A referência
mascara valores em chaves que correspondam, sem diferenciar maiúsculas, a
password/passwd/secret/token/authorization/cookie/credential/api[-_]?key,
substituindo por "[REMOVIDO]". Texto também remove Bearer, credenciais em URLs
HTTP/PostgreSQL e atribuições reconhecidas pelo padrão textual, inclusive JSON com
aspas/escapes. O padrão textual de atribuições cobre password, passwd, secret,
token, authorization, cookie e api[-_]?key; credential é tratado por chave,
não por esse padrão de texto livre. Testar nomes/formatos adicionais do destino.

Serializar Error como name/message/stack/cause sanitizados. undefined vira
null em diagnóstico. Tratar arrays, referências repetidas/circulares e
acessores sem executar getters da aplicação. Usar marcadores "[Circular]",
"[Acessor]" e "[Limite de profundidade]" (a partir de profundidade 8 na
referência). Ler a pilha nativa com cuidado; não alterar protótipos ao copiar
chaves. O resultado precisa permitir serialização JSON segura.

Essa sanitização não é uma garantia universal: texto/segredo que não case
com os padrões exige política adicional. Evitar incluir bodies, credenciais
ou dados privados desnecessários no diagnóstico, mesmo fora de produção.
Não confundir o limite de recursão do serializador com limite de bytes dos logs.

## Handler global e integração

1. Instalar tratamento de rota desconhecida após as rotas: AppError 404,
   NOT_FOUND e "Recurso não encontrado".
2. Instalar handler global depois de routers/parsers, segundo o framework.
3. Adaptar JSON inválido de parser para 400/VALIDATION_ERROR/"JSON inválido";
   corpo excessivo para 413/VALIDATION_ERROR/"Corpo da requisição excede o
   limite permitido", preservando cause original.
4. Serializar uma vez e enviar response.status(body.status).json(body), ou equivalente.
5. Se headers/corpo já começaram, não enviar um segundo JSON; encaminhar/
   finalizar a conexão conforme o framework e registrar a falha internamente.

Se houver logger estruturado, registrar diagnóstico sanitizado em todos os
ambientes, inclusive produção. Falha do logger não altera resposta/erro
original. Na referência, falhas 4xx usam warn e 5xx error. Instalação de
biblioteca/infra de logs não faz parte da adoção obrigatória deste contrato.

Consumidor lê status HTTP e body.message. Não exigir body.error, reason ou
code para tratar erro em produção. Campos diagnósticos são para investigação,
não para substituir mensagens públicas ou controlar autorização no frontend.

## Tarefas e aceite no destino

- [ ] ERR-01: Inventariar erros/framework/ambientes e confirmar escopo de adoção.
- [ ] ERR-02: Implementar AppError/enum, preservação de causa e serializer central.
- [ ] ERR-03: Implementar sanitização segura com testes de segredos e estruturas hostis.
- [ ] ERR-04: Integrar handler/404/parser e preservar resposta já iniciada.
- [ ] ERR-05: Migrar falhas esperadas/inesperadas e consumidores sem alterar negócio.
- [ ] ERR-06: Validar HTTP real, documentar operação e limites da sanitização.

Comparar chaves exatas de produção para erros esperados e inesperados.
Nos demais ambientes, provar stack/diagnóstico sanitizado e requestId
fornecido/omitido. Testar todos os códigos, status inválido, code desconhecido,
message vazia, lançamento de string/null/objeto com status falsificado,
causa aninhada, ciclos, arrays, getters que lançam e segredos com escapes.

Provar 400 JSON inválido, 413 corpo excessivo, 404 global e 500 inesperado.
Falha de persistência não vira 404/200. Exercitar headers já enviados sem
dupla resposta e falha do logger sem substituir o resultado HTTP.
Não afirmar que esse contrato implementa autenticação, autorização ou IDOR.

## Aguardando resposta no projeto de destino

Framework/pontos de integração, escopo de endpoints, mensagens públicas do
domínio, configuração correta de produção e integração opcional de logs/ID.
Não inventar essas decisões nem instalar bibliotecas sem autorização local.
Companheiras opcionais: [resposta](response.spec.md) e [paginação](pagination.spec.md).

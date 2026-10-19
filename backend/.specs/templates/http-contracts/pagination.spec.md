# Spec portátil — contrato de paginação

Data: 2026-10-13. Contrato extraído da implementação da Civix.
Documento autossuficiente para outro projeto, sem dependência de tabelas,
ORM ou estrutura de pastas da Civix. Paginação é adotada só quando necessária.
Estado: referência de implementação; nenhum endpoint destino foi alterado.

## Objetivo e limites

Disponibilizar validação, cálculo de offset e metadados. Os helpers não
consultam banco, não contam registros e não recortam listas automaticamente.
Na Civix, a base existe; isso não comprova paginação SQL adotada nos endpoints.

## Entrada e validação exatas

Parâmetros: page e pageSize. Somente ausência (undefined) usa padrão.

| Campo | Padrão | Regra |
| --- | --- | --- |
| page | 1 | Inteiro seguro maior que zero |
| pageSize | 20 | Inteiro seguro de 1 a 100 |

Aceitar número inteiro positivo seguro ou string decimal que corresponda a
/^[1-9]\d*$/, convertida para número inteiro seguro. Não usar parseInt
permissivo, arredondar, aplicar trim ou limitar silenciosamente o valor.

Rejeitar null, boolean, array, objeto, vazio, 0, negativos, frações, NaN,
Infinity e números acima de Number.MAX_SAFE_INTEGER (9.007.199.254.740.991).
Em outra linguagem, conservar esse limite de interoperabilidade JSON/JavaScript. Strings como 01, +1,
1.0, 1e2 e espaços em torno de 1 também são inválidas. Parâmetro repetido que
o framework entregue como array é inválido; não escolher o primeiro valor.

Entrada inválida: AppError com status 400, code VALIDATION_ERROR e message
"Paginação inválida". Em produção, HTTP 400 retorna:

~~~json
{ "status": 400, "message": "Paginação inválida" }
~~~

## Cálculos e tipos de referência

~~~typescript
interface PaginationInput {
  page: number;
  pageSize: number;
  offset: number;
}
interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
~~~

offset = (page - 1) * pageSize; o resultado precisa ser inteiro seguro.
Não existe um máximo fixo de page além dos limites numéricos acima.
createPaginationMeta revalida page/pageSize e exige offset coerente.

total é a contagem inteira segura e não negativa dos registros autorizados
que atendem aos filtros, antes de paginar; não é data.length nem total global
sem os mesmos filtros/escopo. totalPages = Math.ceil(total / pageSize).

Total inválido ou offset interno incoerente é falha de programação/integração
(RangeError na referência), não validação 400 do usuário. Pelo contrato de
erro inesperado, vira 500 com mensagem pública genérica, sem detalhes em produção.

## Saída HTTP e exemplo

Sucesso 200: data é array e meta contém diretamente os quatro campos acima.
Não criar meta.pagination, results ou items na raiz para substituir o contrato.
Exemplo: page=2, pageSize=20, total=21, offset=20:

~~~json
{
  "data": [{ "id": "record-21", "name": "Último registro" }],
  "meta": { "page": 2, "pageSize": 20, "total": 21, "totalPages": 2 }
}
~~~

Vazio: data: [], total: 0, totalPages: 0; manter page/pageSize solicitados.
Página além do fim: data: [], total/totalPages verdadeiros; não retornar 404,
não reduzir page para a última e não inventar totalPages: 1 quando total=0.
Offset é dado interno e não integra esses metadados HTTP.

## Adoção em consultas

1. Validar entrada no limite HTTP e passar o input tipado ao service.
2. Aplicar escopo de autorização e filtros tanto na contagem quanto na consulta.
3. Ordenar de forma estável com desempate único, por exemplo name + id se
   forem campos válidos do domínio; não impor nomes de colunas da Civix.
4. Buscar com limite pageSize e deslocamento offset por queries parametrizadas
   ou API equivalente do ORM; não concatenar valores/ordenação livre do cliente.
5. Montar meta com o total filtrado e devolver { data, meta }.

Offset não garante snapshot consistente entre requisições com alterações
concorrentes. Se isso importar no destino, definir política de consistência
antes de adotar transações/snapshot/cursor; não afirmar garantia inexistente.

## Tarefas e aceite no destino

- [ ] PAG-01: Escolher listagens que realmente precisam de paginação.
- [ ] PAG-02: Implementar parser estrito e metadados reutilizáveis.
- [ ] PAG-03: Integrar filtros/escopo/contagem e ordenação estável nas consultas escolhidas.
- [ ] PAG-04: Adaptar consumidor a data/meta e página além do fim.
- [ ] PAG-05: Testar helpers, consulta real e contrato HTTP/consumidor; atualizar docs.

Testar defaults; page=2/pageSize=100 com offset=100; pageSize=100 aceito e
101 rejeitado; todas as entradas inválidas acima e overflow de offset.
Testar total=0; total=21/pageSize=20 => totalPages=2; page=3 => data: [].
Testar total negativo/fracionário/inseguro e offset inconsistente como falha interna.
Testar dados com o mesmo valor no primeiro campo de ordenação e desempate
único, filtros
e o isolamento de acesso aplicável ao domínio de destino. Teste de helper sozinho não comprova integração SQL.

## Aguardando resposta no projeto de destino

Quais endpoints, filtros e chaves de ordenação; limites de desempenho/consistência
e necessidade de paginação. A base não obriga paginar todos os endpoints.
Companheiras opcionais: [resposta](response.spec.md) e [erro](error.spec.md).

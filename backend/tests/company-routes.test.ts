import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import express from 'express';
import type { Company } from '../src/entities/company.js';
import type { CompanyQuery } from '../src/interfaces/company-query.js';
import { createCompanyRouter } from '../src/routes/company-routes.js';

const company: Company = {
  id: 'catalog-id', nome: 'Construtora', cnpj: '123', descricao: 'Resumo',
  descricao_detalhada: 'Detalhe', categoria: 'Obras', cidade: 'Fortaleza',
  estado: 'CE', status: 'ativo', verificado: true, tamanho: 'media', logo: null,
};

async function withCatalog(queryClient: CompanyQuery, run: (url: string) => Promise<void>) {
  const app = express();
  app.use('/api/v1/empresas', createCompanyRouter(queryClient));
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    await run('http://127.0.0.1:' + address.port + '/api/v1/empresas');
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test('catalog endpoints preserve payloads, route order and parameterized queries', async () => {
  const calls: { query: string; values?: string[] }[] = [];
  await withCatalog({ async query(query, values) { calls.push({ query, values }); return { rows: [company] }; } }, async url => {
    const cases = [
      ['', 'SELECT * FROM "empresas"', undefined, 'Empresas carregadas com sucesso'],
      ['/verificadas/todas', 'SELECT * FROM "empresas" WHERE verificado = TRUE', undefined, '1 empresas verificadas encontradas'],
      ['/buscar?q=Obra%27', 'SELECT * FROM "empresas" WHERE nome ILIKE $1', ["%Obra'%"], `1 empresas encontradas para a busca "Obra'"`],
      ['/categoria/Obras', 'SELECT * FROM "empresas" WHERE LOWER(categoria) = LOWER($1)', ['Obras'], '1 empresas encontradas na categoria Obras'],
      ['/estado/ce', 'SELECT * FROM "empresas" WHERE UPPER(estado) = UPPER($1)', ['ce'], '1 empresas encontradas em ce'],
      ['/tamanho/media', 'SELECT * FROM "empresas" WHERE tamanho = $1', ['media'], '1 empresas medias encontradas'],
      ['/catalog-id', 'SELECT * FROM "empresas" WHERE id = $1', ['catalog-id'], 'Empresa carregada com sucesso'],
    ] as const;
    for (const [path, query, values, message] of cases) {
      const response = await fetch(url + path);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { success: true, data: path === '/catalog-id' ? company : [company], message });
      assert.deepEqual(calls.at(-1), { query, values });
    }
  });
});

test('invalid inputs fail before persistence', async () => {
  let calls = 0;
  await withCatalog({ async query() { calls++; return { rows: [] }; } }, async url => {
    for (const [path, message] of [
      ['/buscar', 'Termo de busca é obrigatório'],
      ['/buscar?q=%20', 'Termo de busca é obrigatório'],
      ['/buscar?q[]=x', 'Termo de busca é obrigatório'],
      ['/categoria/%20', 'Categoria é obrigatória'],
      ['/estado/%20', 'Estado é obrigatório'],
      ['/tamanho/invalid', 'Tamanho inválido. Use: pequena, media ou grande'],
      ['/%20', 'ID da empresa é obrigatório'],
    ]) {
      const response = await fetch(url + path);
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { success: false, error: message });
    }
    assert.equal(calls, 0);
  });
});

test('empty lists and missing company retain their existing outcomes', async () => {
  await withCatalog({ async query() { return { rows: [] }; } }, async url => {
    const list = await fetch(url);
    assert.equal(list.status, 200);
    assert.deepEqual(await list.json(), { success: true, data: [], message: 'Empresas carregadas com sucesso' });
    const detail = await fetch(url + '/missing');
    assert.equal(detail.status, 404);
    assert.deepEqual(await detail.json(), { success: false, error: 'Empresa com ID missing não encontrada' });
  });
});

test('database failures retain legacy statuses until coordinated contract adoption', async t => {
  t.mock.method(console, 'error', () => {});
  await withCatalog({ async query() { throw new Error('simulated database failure'); } }, async url => {
    for (const [path, status, message] of [
      ['', 500, 'Erro ao buscar empresas no banco de dados'],
      ['/catalog-id', 404, 'Erro ao buscar empresa no banco de dados'],
      ['/verificadas/todas', 200, 'Erro ao buscar empresas verificadas'],
      ['/buscar?q=Obras', 200, 'Erro ao buscar empresas no banco de dados'],
      ['/categoria/Obras', 200, 'Erro ao buscar empresas por categoria'],
      ['/estado/CE', 200, 'Erro ao buscar empresas por estado'],
      ['/tamanho/media', 200, 'Erro ao buscar empresas por tamanho'],
    ] as const) {
      const response = await fetch(url + path);
      assert.equal(response.status, status);
      assert.deepEqual(await response.json(), { success: false, error: message });
    }
  });
});

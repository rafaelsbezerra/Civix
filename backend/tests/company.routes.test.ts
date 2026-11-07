import assert from 'node:assert/strict';
import { once } from 'node:events';
import test, { type TestContext } from 'node:test';
import { db } from '../src/shared/config/data.js';
import companyRoutes from '../src/routes/company.routes.js';
import express from 'express';
import {
  createErrorHandler,
  createNotFoundHandler,
} from '../src/middlewares/error.handler.js';
import type { Company } from '../src/entities/company.entity.js';

const company: Company = {
  id: 'catalog-id',
  nome: 'Construtora',
  cnpj: '123',
  descricao: 'Resumo',
  descricao_detalhada: 'Detalhe',
  categoria: 'Obras',
  cidade: 'Fortaleza',
  estado: 'CE',
  status: 'ativo',
  verificado: true,
  tamanho: 'media',
  faixa_preco: '100-300',
  logo: null,
};

async function withCatalog(
  t: TestContext,
  query: (text: string, values?: string[]) => Promise<{ rows: Company[] }>,
  run: (url: string, baseUrl: string) => Promise<void>,
) {
  t.mock.method(db, 'query', query);
  const app = express();
  app.use('/api/v1/empresas', companyRoutes);
  app.use('/api/v1/companies', companyRoutes);
  app.use(createNotFoundHandler());
  app.use(createErrorHandler({ environment: 'production' }));
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const baseUrl = 'http://127.0.0.1:' + address.port;
    await run(baseUrl + '/api/v1/empresas', baseUrl);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

test('Endpoints do catálogo preservam respostas, ordem das rotas e consultas parametrizadas', async (t) => {
  const calls: { query: string; values?: string[] }[] = [];
  await withCatalog(
    t,
    async (query, values) => {
      calls.push({ query, values });
      return { rows: [company] };
    },
    async (url, baseUrl) => {
      const cases = [
        ['', ' FROM companies', undefined],
        ['/verificadas/todas', ' FROM companies WHERE is_verified = TRUE', undefined],
        ['/buscar?q=Obra%27', ' FROM companies WHERE name ILIKE $1', ["%Obra'%"]],
        [
          '/search?uf=CE&priceRange=100-300',
          " FROM companies WHERE deleted_at IS NULL AND UPPER(status::text) <> 'INATIVO' AND UPPER(state) = UPPER($1) AND price_range IS NOT NULL AND price_range && $2::numrange ORDER BY name, id",
          ['CE', '[100,300]'],
        ],
        [
          '/search?q=Construtora&uf=sp&priceRange=500-plus',
          " FROM companies WHERE deleted_at IS NULL AND UPPER(status::text) <> 'INATIVO' AND name ILIKE $1 AND UPPER(state) = UPPER($2) AND price_range IS NOT NULL AND price_range && $3::numrange ORDER BY name, id",
          ['%Construtora%', 'SP', '[500,)'],
        ],
        [
          '/categoria/Obras',
          ' FROM companies WHERE LOWER(category) = LOWER($1)',
          ['Obras'],
        ],
        ['/estado/ce', ' FROM companies WHERE UPPER(state) = UPPER($1)', ['ce']],
        ['/tamanho/media', ' FROM companies WHERE size = $1', ['media']],
        ['/catalog-id', ' FROM companies WHERE id = $1', ['catalog-id']],
      ] as const;
      for (const [path, query, values] of cases) {
        const response = await fetch(url + path);
        assert.equal(response.status, 200);
        const presented = { ...company, cover_image_url: null };
        assert.deepEqual(await response.json(), {
          data: path === '/catalog-id' ? presented : [presented],
        });
        const lastCall = calls.at(-1)!;
        assert.ok(lastCall.query.startsWith('SELECT '));
        assert.ok(lastCall.query.endsWith(query));
        assert.ok(lastCall.query.includes('name AS nome'));
        assert.ok(lastCall.query.includes('cnpj'));
        assert.deepEqual(lastCall.values, values);
      }

      const englishSearchResponse = await fetch(
        baseUrl + '/api/v1/companies/search?uf=CE&priceRange=0-100',
      );
      assert.equal(englishSearchResponse.status, 200);
      assert.deepEqual(await englishSearchResponse.json(), {
        data: [{ ...company, cover_image_url: null }],
      });
      assert.deepEqual(calls.at(-1)?.values, ['CE', '[0,100]']);
    },
  );
});

test('Entradas inválidas falham antes de consultar o banco', async (t) => {
  let calls = 0;
  await withCatalog(
    t,
    async () => {
      calls++;
      return { rows: [] };
    },
    async (url) => {
      for (const [path, message] of [
        ['/buscar', 'Termo de busca é obrigatório'],
        ['/buscar?q=%20', 'Termo de busca é obrigatório'],
        ['/buscar?q[]=x', 'Termo de busca é obrigatório'],
        [
          '/search?uf=CE',
          'A busca por região e preço exige que UF e faixa de preço sejam informados juntos.',
        ],
        [
          '/search?priceRange=100-300',
          'A busca por região e preço exige que UF e faixa de preço sejam informados juntos.',
        ],
        ['/categoria/%20', 'Categoria é obrigatória'],
        ['/estado/%20', 'Estado é obrigatório'],
        ['/tamanho/invalid', 'Tamanho inválido. Use: pequena, media ou grande'],
        ['/%20', 'ID da empresa é obrigatório'],
      ]) {
        const response = await fetch(url + path);
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { status: 400, message });
      }
      assert.equal(calls, 0);
    },
  );
});

test('Listas vazias e empresas ausentes mantêm as respostas existentes', async (t) => {
  await withCatalog(
    t,
    async () => {
      return { rows: [] };
    },
    async (url) => {
      const list = await fetch(url);
      assert.equal(list.status, 200);
      assert.deepEqual(await list.json(), { data: [] });
      const detail = await fetch(url + '/missing');
      assert.equal(detail.status, 404);
      assert.deepEqual(await detail.json(), {
        status: 404,
        message: 'Empresa com ID missing não encontrada',
      });
    },
  );
});

test('Falhas SQL em todos os endpoints do catálogo retornam 500 sem detalhes em produção', async (t) => {
  await withCatalog(
    t,
    async () => {
      throw new Error('Falha simulada no banco de dados');
    },
    async (url) => {
      for (const path of [
        '',
        '/catalog-id',
        '/verificadas/todas',
        '/buscar?q=Obras',
        '/search?uf=CE&priceRange=100-300',
        '/categoria/Obras',
        '/estado/CE',
        '/tamanho/media',
      ]) {
        const response = await fetch(url + path);
        assert.equal(response.status, 500);
        assert.deepEqual(await response.json(), {
          status: 500,
          message: 'Erro interno do servidor',
        });
      }
    },
  );
});

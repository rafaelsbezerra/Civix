import assert from 'node:assert/strict';
import { once } from 'node:events';
import test, { type TestContext } from 'node:test';
import express from 'express';
import {
  createErrorHandler,
  createNotFoundHandler,
} from '../src/middlewares/error.handler.js';
import type { companies, Prisma } from '../src/generated/prisma/client.js';

Object.assign(process.env, {
  USE_MOCK_DATA: 'false',
  DATABASE_URL: 'postgresql://localhost:1/civix_test',
});
const { getPrisma } = await import('../src/shared/config/prisma.js');
const { default: companyRoutes } = await import('../src/routes/company.routes.js');
const prisma = getPrisma();

const date = new Date('2026-11-02T12:00:00Z');
const row: companies = {
  id: 'catalog-id',
  name: 'Construtora',
  cnpj: '123',
  description: 'Resumo',
  detailed_description: 'Detalhe',
  category: 'Obras',
  city: 'Fortaleza',
  state: 'CE',
  status: 'ATIVO',
  size: 'media',
  createdAt: date,
  updatedAt: date,
  logo: null,
  cover_key: null,
  logo_key: null,
  address: null,
  phone: null,
  email: null,
  website: null,
  whatsapp: null,
  additional_description: null,
  tone: null,
  plan_id: null,
  deleted_at: null,
  deactivation_reason: null,
  deactivated_at: null,
  deactivated_by: null,
};

const presented = {
  id: row.id,
  nome: row.name,
  cnpj: row.cnpj,
  descricao: row.description,
  descricao_detalhada: row.detailed_description,
  categoria: row.category,
  cidade: row.city,
  estado: row.state,
  status: 'ativo',
  verificado: true,
  tamanho: row.size,
  faixa_preco: '100-300',
  logo: null,
  data_cadastro: date.toISOString(),
  createdAt: date.toISOString(),
  updatedAt: date.toISOString(),
  endereco: null,
  telefone: null,
  email: null,
  website: null,
  whatsapp: null,
  descritivo: null,
  tone: null,
  cover_image_url: null,
};

function mockCatalog(t: TestContext, rows: () => companies[]) {
  const tx = {
    companies: {
      findMany: t.mock.fn(async (_args: Prisma.companiesFindManyArgs) => rows()),
      findUnique: t.mock.fn(
        async (_args: Prisma.companiesFindUniqueArgs) => rows()[0] ?? null,
      ),
    },
    $queryRaw: t.mock.fn(async (query: TemplateStringsArray, ..._values: unknown[]) => {
      const companies = rows();
      if (query.join('?').includes('price_range &&')) {
        return companies.map(({ id }) => ({ id }));
      }
      return companies.map(({ id }) => ({ id, price_range: '100-300' }));
    }),
  };
  const original = prisma.$transaction;
  const transaction = t.mock.fn(
    async (
      run: (client: typeof tx) => Promise<unknown>,
      _options: { isolationLevel: string },
    ) => run(tx),
  );
  prisma.$transaction = transaction as unknown as typeof prisma.$transaction;
  t.after(() => {
    prisma.$transaction = original;
  });
  return { tx, transaction };
}

async function withCatalog(run: (url: string, baseUrl: string) => Promise<void>) {
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

test('Endpoints do catálogo preservam respostas, ordem das rotas e filtros do Prisma', async (t) => {
  const { tx, transaction } = mockCatalog(t, () => [row]);
  const insensitive = 'insensitive' as const;
  const publicWhere = {
    deleted_at: null,
    status: { not: 'INATIVO' },
    id: { in: [row.id] },
  };
  const sort = [{ name: 'asc' }, { id: 'asc' }];

  await withCatalog(async (url, baseUrl) => {
    const cases = [
      { path: '', where: {} },
      { path: '/verificadas/todas', where: {} },
      {
        path: '/buscar?q=Obra%27',
        where: { name: { contains: "Obra'", mode: insensitive } },
      },
      {
        path: '/search?uf=CE&priceRange=100-300',
        where: { ...publicWhere, state: { equals: 'CE', mode: insensitive } },
        range: '[100,300]',
      },
      {
        path: '/search?q=Construtora&uf=sp&priceRange=500-plus',
        where: {
          ...publicWhere,
          name: { contains: 'Construtora', mode: insensitive },
          state: { equals: 'SP', mode: insensitive },
        },
        range: '[500,)',
      },
      {
        path: '/categoria/Obras',
        where: { category: { equals: 'Obras', mode: insensitive } },
      },
      { path: '/estado/ce', where: { state: { equals: 'ce', mode: insensitive } } },
      { path: '/tamanho/media', where: { size: 'media' } },
      {
        path: '/api/v1/companies/search?uf=CE&priceRange=0-100',
        englishAlias: true,
        where: { ...publicWhere, state: { equals: 'CE', mode: insensitive } },
        range: '[0,100]',
      },
    ];
    for (const { path, where, range, englishAlias } of cases) {
      const rawCalls = tx.$queryRaw.mock.callCount();
      const response = await fetch((englishAlias ? baseUrl : url) + path);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { data: [presented] });
      assert.deepEqual(tx.companies.findMany.mock.calls.at(-1)?.arguments[0], {
        where,
        orderBy: range ? sort : undefined,
      });
      assert.deepEqual(transaction.mock.calls.at(-1)?.arguments[1], {
        isolationLevel: 'RepeatableRead',
      });
      const [rangeLookup, priceLookup] = tx.$queryRaw.mock.calls.slice(rawCalls);
      if (range) {
        const [query, value] = rangeLookup.arguments;
        assert.match(
          query.join('?'),
          /price_range IS NOT NULL AND price_range && \?::numrange/,
        );
        assert.equal(value, range);
      }
      const [query, ids] = (range ? priceLookup : rangeLookup).arguments;
      assert.match(query.join('?'), /WHERE id = ANY\(\?::uuid\[\]\)/);
      assert.deepEqual(ids, [row.id]);
    }

    const detail = await fetch(url + '/catalog-id');
    assert.equal(detail.status, 200);
    assert.deepEqual(await detail.json(), { data: presented });
    assert.deepEqual(tx.companies.findUnique.mock.calls[0].arguments[0], {
      where: { id: 'catalog-id' },
    });
  });
});

test('Entradas inválidas falham antes de consultar o banco', async (t) => {
  const { transaction } = mockCatalog(t, () => []);
  await withCatalog(async (url) => {
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
    assert.equal(transaction.mock.callCount(), 0);
  });
});

test('Listas vazias e empresas ausentes mantêm as respostas existentes', async (t) => {
  mockCatalog(t, () => []);
  await withCatalog(async (url) => {
    const list = await fetch(url);
    assert.equal(list.status, 200);
    assert.deepEqual(await list.json(), { data: [] });
    const detail = await fetch(url + '/missing');
    assert.equal(detail.status, 404);
    assert.deepEqual(await detail.json(), {
      status: 404,
      message: 'Empresa com ID missing não encontrada',
    });
  });
});

test('Falhas de persistência em todos os endpoints do catálogo retornam 500 sem detalhes em produção', async (t) => {
  mockCatalog(t, () => {
    throw new Error('Falha simulada no banco de dados');
  });
  await withCatalog(async (url) => {
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
  });
});

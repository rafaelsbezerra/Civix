import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
Object.assign(process.env, { USE_MOCK_DATA: 'true', LOG_LEVEL: 'fatal' });
const { db } = await import('../src/shared/config/data.js');
const { companyPostgresRepository } =
  await import('../src/persistence/postgres/company.repository.js');
const company = {
  id: randomUUID(),
  nome: 'Empresa sintética',
  cnpj: '12345678000190',
  descricao: '',
  descricao_detalhada: '',
  categoria: 'Tecnologia',
  cidade: 'Fortaleza',
  estado: 'CE',
  status: 'ativo' as const,
  verificado: false,
  tamanho: 'pequena' as const,
};
const input = {
  company,
  planId: '9007199254740993123',
  actorId: randomUUID(),
  operationId: randomUUID(),
  fingerprint: 'a'.repeat(64),
};
const plan = {
  id: input.planId,
  name: 'Plano sintético',
  price: '39.90',
  billing_period: 'monthly',
  is_active: true,
};

test('adapter PostgreSQL de cadastro usa somente conexão transacional simulada', async (t) => {
  t.mock.method(db, 'query', () => {
    throw new Error('Query fora da transação não permitida.');
  });
  for (const scenario of [
    'new',
    'replay',
    'conflict',
    'missing-sale',
    'inactive',
    'revoked',
    'insert-failure',
    'unique-failure',
  ] as const) {
    await t.test(scenario, async (sub) => {
      const queries: { text: string; values?: unknown[] }[] = [];
      const events: string[] = [];
      const failure = new Error('Falha sintética na venda');
      const saleId = randomUUID();
      const fake = {
        async query(text: string, values?: unknown[]) {
          queries.push({ text, values });
          if (text.includes('FROM company_registration_operations')) {
            return {
              rows: ['replay', 'conflict', 'missing-sale'].includes(scenario)
                ? [
                    {
                      fingerprint:
                        scenario === 'conflict' ? 'b'.repeat(64) : input.fingerprint,
                      company_id: company.id,
                      sale_id: saleId,
                    },
                  ]
                : [],
            };
          }
          if (text.includes('FROM users')) {
            return {
              rows: [
                {
                  role: scenario === 'revoked' ? 'admin_empresa' : 'super_admin',
                  status: 'active',
                },
              ],
            };
          }
          if (text.includes('FROM plans')) {
            return { rows: [{ ...plan, is_active: scenario !== 'inactive' }] };
          }
          if (text.includes('FROM companies')) {
            return { rows: [company] };
          }
          if (text.includes('FROM sales')) {
            return {
              rows:
                scenario === 'missing-sale'
                  ? []
                  : [
                      {
                        id: saleId,
                        company_id: company.id,
                        plan_id: plan.id,
                        origin: 'company_creation',
                        pricing_mode: 'company_plan',
                        plan_name: plan.name,
                        plan_price: '39.90',
                        plan_billing_period: 'monthly',
                        amount: '39.90',
                        currency: 'BRL',
                        description: null,
                        sold_at: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        created_by: input.actorId,
                      },
                    ],
            };
          }
          if (
            text.startsWith('INSERT INTO companies') &&
            scenario === 'unique-failure'
          ) {
            throw Object.assign(new Error('Duplicidade sintética'), { code: '23505' });
          }
          if (text.startsWith('INSERT INTO sales') && scenario === 'insert-failure') {
            throw failure;
          }
          return { rows: [] };
        },
      };
      // A fronteira transacional é simulada; este teste não comprova o driver PostgreSQL.
      sub.mock.method(
        db,
        'transaction',
        async (
          run: (
            client: Parameters<Parameters<typeof db.transaction>[0]>[0],
          ) => Promise<unknown>,
        ) => {
          events.push('BEGIN');
          try {
            const result = await run(fake as never);
            events.push('COMMIT');
            return result;
          } catch (error) {
            events.push('ROLLBACK');
            throw error;
          }
        },
      );
      if (scenario === 'new' || scenario === 'replay') {
        const result =
          await companyPostgresRepository.createCompanyWithInitialSale(input);
        assert.equal(result.replayed, scenario === 'replay');
        assert.equal(result.sale!.amount, '39.90');
        assert.equal(result.sale!.planId, input.planId);
        assert.deepEqual(events, ['BEGIN', 'COMMIT']);
      } else {
        await assert.rejects(
          companyPostgresRepository.createCompanyWithInitialSale(input),
          (error) =>
            scenario === 'insert-failure'
              ? error === failure
              : (error as { status: number }).status ===
                (scenario === 'inactive' ? 400 : scenario === 'revoked' ? 403 : 409),
        );
        assert.deepEqual(events, ['BEGIN', 'ROLLBACK']);
      }
      assert.match(queries[0].text, /pg_advisory_xact_lock/);
      assert.deepEqual(queries[0].values, [input.actorId + ':' + input.operationId]);
      assert.match(queries[1].text, /FROM company_registration_operations/);
      const inserts = queries.filter((query) => query.text.startsWith('INSERT'));
      if (scenario === 'new') {
        assert.deepEqual(
          inserts.map((query) => query.text.match(/^INSERT INTO (\w+)/)![1]),
          ['companies', 'sales', 'company_registration_operations'],
        );
        assert.equal(inserts[0].values?.[20], input.planId);
        assert.equal(inserts[1].values?.[8], '39.90');
        assert.equal(inserts[2].values?.[4], inserts[1].values?.[0]);
        assert.ok(
          queries
            .filter((query) => /FROM (users|plans)/.test(query.text))
            .every((query) => /FOR SHARE/.test(query.text)),
        );
      } else if (!['insert-failure', 'unique-failure'].includes(scenario)) {
        assert.equal(inserts.length, 0);
      }
      if (scenario === 'insert-failure') {
        assert.ok(
          !queries.some((query) =>
            query.text.startsWith('INSERT INTO company_registration_operations'),
          ),
        );
      }
    });
  }
});

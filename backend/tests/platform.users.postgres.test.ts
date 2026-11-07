import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test, { type TestContext } from 'node:test';
import type { User } from '../src/entities/user.entity.js';
import type { UserAdministrationChange } from '../src/dtos/user.auth.dto.js';

Object.assign(process.env, { USE_MOCK_DATA: 'true', LOG_LEVEL: 'fatal' });
const { db } = await import('../src/shared/config/data.js');
const { userPostgresRepository } =
  await import('../src/persistence/postgres/user.repository.js');
const { authPostgresRepository } =
  await import('../src/persistence/postgres/auth.repository.js');

const actorId = randomUUID();
const targetId = randomUUID();
const companyId = randomUUID();
const anotherUserId = randomUUID();
const changedAt = '2026-11-02T12:00:00.000Z';

type UserWithResetFields = User & {
  reset_password_token?: string | null;
  reset_password_expires?: string | null;
};

function makeUser(overrides: Partial<UserWithResetFields> = {}): UserWithResetFields {
  return {
    id: targetId,
    email: 'target@example.test',
    name: 'Pessoa Alvo',
    role: 'admin_empresa',
    company_id: companyId,
    password_hash: 'hash-sintetico',
    status: 'active',
    deleted_at: null,
    deactivation_reason: null,
    tokens_revoked_at: '2026-11-01T12:00:00.000Z',
    invite_token: 'convite-antigo',
    reset_password_token: 'reset-antigo',
    reset_password_expires: '2026-11-03T12:00:00.000Z',
    ...overrides,
  };
}

function superAdmin(id = actorId): User {
  return makeUser({
    id,
    email: `super-${id}@example.test`,
    name: 'Superadmin',
    role: 'super_admin',
    company_id: null,
  });
}

function change(
  overrides: Partial<UserAdministrationChange> = {},
): UserAdministrationChange {
  return {
    actorId,
    companyId,
    userId: targetId,
    action: 'suspend',
    reason: 'Motivo sintético',
    changedAt,
    ...overrides,
  };
}

function mockTransaction(
  context: TestContext,
  client: { query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[] }> },
  events: string[] = [],
) {
  context.mock.method(db, 'query', () => {
    throw new Error('Consulta fora da transação não permitida.');
  });
  context.mock.method(
    db,
    'transaction',
    async (
      run: (
        client: Parameters<Parameters<typeof db.transaction>[0]>[0],
      ) => Promise<unknown>,
    ) => {
      events.push('BEGIN');
      try {
        const result = await run(client as never);
        events.push('COMMIT');
        return result;
      } catch (error) {
        events.push('ROLLBACK');
        throw error;
      }
    },
  );
}

test('adapter PostgreSQL de usuários usa SQL e transações simulados', async (t) => {
  await t.test(
    'listas parametrizam escopo, busca, status e paginação; histórico da empresa não depende do estado',
    async (sub) => {
      let statement = '';
      let values: unknown[] | undefined;
      const row = makeUser({ role: 'atendente', status: 'blocked' });
      sub.mock.method(db, 'query', async (text: string, parameters?: unknown[]) => {
        statement = text;
        values = parameters;
        return { rows: [{ items: [row], total: 9 }] } as never;
      });

      const companyResult = await userPostgresRepository.getUsersForAdministration(
        companyId,
        {
          q: 'ana%_',
          role: 'atendente',
          status: 'blocked',
          pageSize: 5,
          offset: 10,
        },
      );
      assert.match(statement, /deleted_at IS NULL/);
      assert.match(
        statement,
        /company_id=\$1 AND role IN \('admin_empresa','atendente'\)/,
      );
      assert.match(statement, /email ILIKE \$2 OR COALESCE\(name,''\) ILIKE \$2/);
      assert.match(statement, /role=\$3/);
      assert.match(statement, /COALESCE\(status,'active'\)=\$4/);
      assert.match(statement, /ORDER BY email,id LIMIT \$5 OFFSET \$6/);
      assert.deepEqual(values, [
        companyId,
        '%ana\\%\\_%',
        'atendente',
        'blocked',
        5,
        10,
      ]);
      assert.equal(companyResult.total, 9);

      const global = await userPostgresRepository.getUsersForAdministration(null, {
        pageSize: 20,
        offset: 0,
      });
      assert.match(statement, /deleted_at IS NULL/);
      assert.match(statement, /role='super_admin' AND company_id IS NULL/);
      assert.doesNotMatch(statement, /company_id=\$1/);
      assert.deepEqual(values, [20, 0]);
      assert.equal(global.total, 9);
    },
  );

  await t.test(
    'revalida ator e alvo sob lock, suspende e preserva histórico de token',
    async (sub) => {
      const queries: { text: string; values?: unknown[] }[] = [];
      const events: string[] = [];
      const target = makeUser({ role: 'super_admin', company_id: null });
      const activeAdmins = [superAdmin(actorId), target];
      const client = {
        async query(text: string, values?: unknown[]) {
          queries.push({ text, values });
          if (text.includes('pg_advisory_xact_lock')) {
            return { rows: [] };
          }
          if (text.includes('FROM users WHERE id=$1 FOR UPDATE')) {
            return { rows: [values?.[0] === actorId ? superAdmin(actorId) : target] };
          }
          if (text.includes("role='super_admin'")) {
            return { rows: activeAdmins };
          }
          if (text.includes('FROM users WHERE id=$1')) {
            return { rows: [target] };
          }
          if (text.startsWith('UPDATE users SET')) {
            return {
              rows: [
                makeUser({
                  ...target,
                  status: 'blocked',
                  deactivation_reason: 'Motivo sintético',
                }),
              ],
            };
          }
          return { rows: [] };
        },
      };
      mockTransaction(sub, client, events);

      const result = await userPostgresRepository.changeUserAdministration(
        change({ companyId: null, action: 'suspend', userId: targetId }),
      );
      assert.equal(result.status, 'blocked');
      assert.deepEqual(events, ['BEGIN', 'COMMIT']);
      assert.match(queries[0].text, /pg_advisory_xact_lock/);
      assert.match(queries[1].text, /FROM users WHERE id=\$1 FOR UPDATE/);
      assert.deepEqual(queries[1].values, [actorId]);
      assert.match(queries[2].text, /FROM users WHERE id=\$1 FOR UPDATE/);
      assert.deepEqual(queries[2].values, [targetId]);
      assert.match(queries[3].text, /role='super_admin'.*FOR UPDATE/);
      const update = queries.at(-1)!;
      assert.match(
        update.text,
        /^UPDATE users SET status=\$1,deactivation_reason=\$2,tokens_revoked_at=GREATEST\(\$3::timestamptz,date_trunc\('milliseconds',clock_timestamp\(\)\),COALESCE\(tokens_revoked_at,'epoch'::timestamptz\)\+INTERVAL '2 milliseconds'\),invite_token=\$4,reset_password_token=\$5,reset_password_expires=\$6 WHERE id=\$7 RETURNING \*$/,
      );
      assert.deepEqual(update.values?.slice(0, 2), ['blocked', 'Motivo sintético']);
      assert.ok(Number.isFinite(Date.parse(String(update.values?.[2]))));
      assert.ok(
        Date.parse(String(update.values?.[2])) >
          Date.parse(String(target.tokens_revoked_at)),
      );
      assert.deepEqual(update.values?.slice(3), [null, null, null, targetId]);
      assert.equal(
        queries.some((query) => query.text.startsWith('DELETE FROM users')),
        false,
      );
      assert.equal(activeAdmins.length, 2);
    },
  );

  await t.test(
    'protege o último superadmin ativo e recusa o ator desatualizado',
    async (sub) => {
      for (const scenario of ['last-active', 'stale-actor'] as const) {
        await sub.test(scenario, async (nested) => {
          const queries: string[] = [];
          const events: string[] = [];
          const client = {
            async query(text: string, values?: unknown[]) {
              queries.push(text);
              if (text.includes('pg_advisory_xact_lock')) {
                return { rows: [] };
              }
              if (text.includes('FROM users WHERE id=$1 FOR UPDATE')) {
                return {
                  rows: [
                    values?.[0] === actorId
                      ? scenario === 'stale-actor'
                        ? makeUser({
                            id: actorId,
                            email: 'changed@example.test',
                            role: 'admin_empresa',
                            company_id: companyId,
                          })
                        : superAdmin(actorId)
                      : superAdmin(targetId),
                  ],
                };
              }
              if (text.includes("role='super_admin'")) {
                return { rows: [superAdmin(actorId)] };
              }
              if (text.includes('FROM users WHERE id=$1')) {
                return { rows: [superAdmin(targetId)] };
              }
              return { rows: [] };
            },
          };
          mockTransaction(nested, client, events);
          const target = scenario === 'last-active' ? targetId : actorId;
          await assert.rejects(
            userPostgresRepository.changeUserAdministration(
              change({
                companyId: null,
                userId: target,
                action: 'suspend',
                reason: 'Motivo sintético',
              }),
            ),
            (error) =>
              (error as { status: number }).status ===
              (scenario === 'last-active' ? 409 : 403),
          );
          assert.deepEqual(events, ['BEGIN', 'ROLLBACK']);
          assert.match(queries[0]!, /pg_advisory_xact_lock/);
          assert.match(queries[1]!, /FOR UPDATE/);
          if (scenario === 'last-active') {
            const activeCheck = queries.find((query) =>
              query.includes("role='super_admin'"),
            )!;
            assert.match(activeCheck, /deleted_at IS NULL/);
            assert.match(activeCheck, /FOR UPDATE/);
          } else {
            assert.equal(
              queries.some((query) => query.includes("role='super_admin'")),
              false,
            );
          }
          assert.equal(
            queries.some((query) => query.startsWith('UPDATE users SET')),
            false,
          );
        });
      }
    },
  );

  await t.test(
    'exclui atendente com soft delete mantendo vínculo e motivo',
    async (sub) => {
      const queries: { text: string; values?: unknown[] }[] = [];
      const events: string[] = [];
      const attendant = makeUser({ role: 'atendente', company_id: companyId });
      const client = {
        async query(text: string, values?: unknown[]) {
          queries.push({ text, values });
          if (text.includes('pg_advisory_xact_lock')) {
            return { rows: [] };
          }
          if (text.includes('FROM users WHERE id=$1 FOR UPDATE')) {
            return {
              rows: [values?.[0] === actorId ? superAdmin(actorId) : attendant],
            };
          }
          if (text.includes('FROM companies')) {
            return { rows: [{ status: 'ativo', deleted_at: null }] };
          }
          if (text.includes('FROM users WHERE id=$1')) {
            return { rows: [attendant] };
          }
          if (text.startsWith('UPDATE users SET')) {
            return {
              rows: [
                makeUser({
                  ...attendant,
                  status: 'blocked',
                  deleted_at: String(values?.[6]),
                  deactivation_reason: 'Desligamento',
                }),
              ],
            };
          }
          return { rows: [] };
        },
      };
      mockTransaction(sub, client, events);

      const result = await userPostgresRepository.changeUserAdministration(
        change({
          action: 'delete',
          userId: targetId,
          reason: 'Desligamento',
          companyId,
        }),
      );
      assert.equal(result.status, 'blocked');
      assert.equal(result.deleted_at, queries.at(-1)!.values?.[6]);
      assert.ok(Math.abs(Date.parse(result.deleted_at!) - Date.now()) < 5000);
      assert.equal(result.company_id, companyId);
      assert.deepEqual(events, ['BEGIN', 'COMMIT']);
      assert.match(queries[2].text, /FROM companies WHERE id=\$1 FOR SHARE/);
      const update = queries.at(-1)!;
      assert.match(
        update.text,
        /status=\$1,deactivation_reason=\$2,tokens_revoked_at=GREATEST\(\$3::timestamptz/,
      );
      assert.match(
        update.text,
        /invite_token=\$4,reset_password_token=\$5,reset_password_expires=\$6,deleted_at=\$7 WHERE id=\$8/,
      );
      assert.deepEqual(update.values?.slice(0, 2), ['blocked', 'Desligamento']);
      assert.deepEqual(update.values?.slice(3, 6), [null, null, null]);
      assert.ok(Math.abs(Date.parse(String(update.values?.[2])) - Date.now()) < 5000);
      assert.ok(Number.isFinite(Date.parse(String(update.values?.[6]))));
      assert.equal(update.values?.[7], targetId);
      assert.equal(
        queries.some((query) => query.text.startsWith('DELETE FROM users')),
        false,
      );
    },
  );

  await t.test(
    'bloqueia alterações no tenant suspenso antes de consultar ou alterar usuário',
    async (sub) => {
      const queries: string[] = [];
      const events: string[] = [];
      const client = {
        async query(text: string) {
          queries.push(text);
          if (text.includes('pg_advisory_xact_lock')) {
            return { rows: [] };
          }
          if (text.includes('FROM users WHERE id=$1 FOR UPDATE')) {
            return { rows: [superAdmin(actorId)] };
          }
          if (text.includes('FROM companies')) {
            return { rows: [{ status: 'inativo', deleted_at: null }] };
          }
          return { rows: [] };
        },
      };
      mockTransaction(sub, client, events);

      await assert.rejects(
        userPostgresRepository.changeUserAdministration(change({ action: 'suspend' })),
        (error) => (error as { status: number }).status === 409,
      );
      assert.deepEqual(events, ['BEGIN', 'ROLLBACK']);
      assert.match(queries[2]!, /FROM companies WHERE id=\$1 FOR SHARE/);
      assert.equal(
        queries.filter((query) => query.includes('FROM users WHERE id=$1 FOR UPDATE'))
          .length,
        1,
      );
      assert.equal(
        queries.some((query) => query.startsWith('UPDATE users SET')),
        false,
      );
    },
  );

  await t.test(
    'reativação de conta sem senha vira pending e invalida token antigo',
    async (sub) => {
      const queries: { text: string; values?: unknown[] }[] = [];
      const events: string[] = [];
      const pending = makeUser({
        role: 'atendente',
        company_id: companyId,
        status: 'blocked',
        password_hash: undefined,
        invite_token: null,
      });
      const client = {
        async query(text: string, values?: unknown[]) {
          queries.push({ text, values });
          if (text.includes('pg_advisory_xact_lock')) {
            return { rows: [] };
          }
          if (text.includes('FROM users WHERE id=$1 FOR UPDATE')) {
            return {
              rows: [
                values?.[0] === actorId
                  ? superAdmin(actorId)
                  : makeUser({ ...pending, invite_token: 'token-antigo' }),
              ],
            };
          }
          if (text.includes('FROM companies')) {
            return { rows: [{ status: 'ativo', deleted_at: null }] };
          }
          if (text.startsWith('UPDATE users SET')) {
            return {
              rows: [makeUser({ ...pending, status: 'pending', invite_token: null })],
            };
          }
          return { rows: [] };
        },
      };
      mockTransaction(sub, client, events);

      const result = await userPostgresRepository.changeUserAdministration(
        change({ action: 'reactivate', reason: undefined }),
      );
      assert.equal(result.status, 'pending');
      assert.deepEqual(events, ['BEGIN', 'COMMIT']);
      const update = queries.at(-1)!;
      assert.match(
        update.text,
        /^UPDATE users SET status=\$1,invite_token=\$2 WHERE id=\$3 RETURNING \*$/,
      );
      assert.deepEqual(update.values, ['pending', null, targetId]);
      assert.equal(update.text.includes('tokens_revoked_at = NULL'), false);
    },
  );

  await t.test(
    'convite global parametriza superadmin sem vínculo e conflito de e-mail devolve 409',
    async (sub) => {
      const queries: { text: string; values?: unknown[] }[] = [];
      const events: string[] = [];
      const client = {
        async query(text: string, values?: unknown[]) {
          queries.push({ text, values });
          if (text.includes('pg_advisory_xact_lock')) {
            return { rows: [] };
          }
          if (text.includes('FROM users WHERE id=$1 FOR UPDATE')) {
            return { rows: [superAdmin(actorId)] };
          }
          if (text.includes('LOWER(email)')) {
            return { rows: [] };
          }
          if (text.startsWith('INSERT INTO users')) {
            return {
              rows: [
                makeUser({
                  id: anotherUserId,
                  email: 'novo-super@example.test',
                  role: 'super_admin',
                  company_id: null,
                  status: 'pending',
                  password_hash: undefined,
                  invite_token: 'token-sintetico',
                }),
              ],
            };
          }
          return { rows: [] };
        },
      };
      mockTransaction(sub, client, events);
      const result = await userPostgresRepository.changeUserAdministration(
        change({
          companyId: null,
          userId: undefined,
          action: 'invite',
          email: 'novo-super@example.test',
          name: 'Novo Super',
          role: 'super_admin',
          token: 'token-sintetico',
          reason: undefined,
        }),
      );
      assert.equal(result.role, 'super_admin');
      assert.equal(result.company_id, null);
      assert.deepEqual(events, ['BEGIN', 'COMMIT']);
      assert.match(queries[2].text, /LOWER\(email\)=LOWER\(\$1\) FOR UPDATE/);
      assert.deepEqual(queries[2].values, ['novo-super@example.test']);
      assert.equal(
        queries.some((query) => query.text.includes('FROM companies')),
        false,
      );
      const insert = queries.at(-1)!;
      assert.match(
        insert.text,
        /INSERT INTO users \(id,email,name,role,company_id,status,invite_token\)/,
      );
      assert.deepEqual(insert.values?.slice(1), [
        'novo-super@example.test',
        'Novo Super',
        'super_admin',
        null,
        'token-sintetico',
      ]);
    },
  );

  await t.test(
    'reconvite preparado antes da revogação retorna conflito sem sobrescrever o token novo',
    async (sub) => {
      const queries: { text: string; values?: unknown[] }[] = [];
      const events: string[] = [];
      const pending = makeUser({
        role: 'atendente',
        status: 'pending',
        tokens_revoked_at: '2026-11-02T12:00:00.010Z',
      });
      const client = {
        async query(text: string, values?: unknown[]) {
          queries.push({ text, values });
          if (text.includes('pg_advisory_xact_lock')) {
            return { rows: [] };
          }
          if (text.includes('FROM users WHERE id=$1 FOR UPDATE')) {
            return { rows: [values?.[0] === actorId ? superAdmin(actorId) : pending] };
          }
          if (text.includes('FROM companies')) {
            return { rows: [{ status: 'ativo', deleted_at: null }] };
          }
          if (text.includes('LOWER(email)')) {
            return { rows: [pending] };
          }
          return { rows: [] };
        },
      };
      mockTransaction(sub, client, events);

      await assert.rejects(
        userPostgresRepository.changeUserAdministration(
          change({
            action: 'invite',
            userId: undefined,
            email: pending.email,
            role: 'atendente',
            token: 'token-antigo-preparado',
            tokenIssuedAt: '2026-11-02T12:00:00.000Z',
            companyId,
          }),
        ),
        (error) => (error as { status: number }).status === 409,
      );
      assert.deepEqual(events, ['BEGIN', 'ROLLBACK']);
      assert.match(queries[0].text, /pg_advisory_xact_lock/);
      assert.match(queries[1].text, /FROM users WHERE id=\$1 FOR UPDATE/);
      assert.match(queries[2].text, /FROM companies WHERE id=\$1 FOR SHARE/);
      assert.match(queries[3].text, /LOWER\(email\)=LOWER\(\$1\) FOR UPDATE/);
      assert.equal(
        queries.some((query) =>
          query.text.startsWith('UPDATE users SET invite_token='),
        ),
        false,
      );
    },
  );

  await t.test(
    'primeiro acesso atualiza senha e convite em uma instrução com guardas de exclusão e empresa',
    async (sub) => {
      for (const scenario of ['eligible', 'company-unavailable'] as const) {
        await sub.test(scenario, async (nested) => {
          const queries: { text: string; values?: unknown[] }[] = [];
          const events: string[] = [];
          const client = {
            async query(text: string, values?: unknown[]) {
              queries.push({ text, values });
              if (text.includes('pg_advisory_xact_lock')) {
                return { rows: [] };
              }
              if (text.startsWith('UPDATE users')) {
                return { rows: [], rowCount: scenario === 'eligible' ? 1 : 0 };
              }
              return { rows: [] };
            },
          };
          mockTransaction(nested, client, events);

          const activated = await authPostgresRepository.activateUser(
            targetId,
            'hash-de-senha',
            'token-atual',
          );
          assert.equal(activated, scenario === 'eligible');
          assert.deepEqual(events, ['BEGIN', 'COMMIT']);
          assert.match(queries[0]!.text, /pg_advisory_xact_lock/);
          assert.equal(queries.length, 2);
          assert.match(queries[1]!.text, /invite_token\s*=\s*\$3/);
          assert.match(queries[1]!.text, /status = 'pending'/);
          assert.match(queries[1]!.text, /deleted_at IS NULL/);
          assert.match(queries[1]!.text, /companies\.status <> 'inativo'/);
          assert.match(queries[1]!.text, /companies\.deleted_at IS NULL/);
          assert.deepEqual(queries[1]!.values, [
            'hash-de-senha',
            'active',
            null,
            targetId,
            'token-atual',
          ]);
        });
      }
    },
  );
});

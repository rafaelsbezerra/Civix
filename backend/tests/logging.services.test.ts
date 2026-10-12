import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { Writable } from 'node:stream';
import test, { type TestContext } from 'node:test';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { createLogger, createRequestLogger } from '../src/shared/logging/log.logger.js';
import { runWithLogContext } from '../src/shared/logging/log.context.js';
import type { Company } from '../src/entities/company.entity.js';
import type { PlanRow } from '../src/interfaces/plan.row.js';

Object.assign(process.env, {
  USE_MOCK_DATA: 'false',
  NODE_ENV: 'test',
  DOTENV_CONFIG_PATH: join(tmpdir(), 'civix-logging-env-inexistente'),
  JWT_SECRET: 'segredo-jwt-exclusivo-deste-teste',
  JWT_INVITE_SECRET: 'segredo-convite-exclusivo-deste-teste',
  JWT_RESET_SECRET: 'segredo-reset-exclusivo-deste-teste',
  RESEND_API_KEY: 're_provedor_simulado',
  MAIL_FROM: 'Civix <noreply@example.test>',
  FRONTEND_URL: 'http://frontend.example.test',
});

const companyService = await import('../src/services/company.service.js');
const planService = await import('../src/services/plan.service.js');
const userService = await import('../src/services/user.service.js');
const authService = await import('../src/services/auth.service.js');
const adminService = await import('../src/services/admin.service.js');
const mailService = await import('../src/services/mail.service.js');
const { companyRepository } = await import('../src/persistence/company.repository.js');
const { planRepository } = await import('../src/persistence/plan.repository.js');
const { userRepository } = await import('../src/persistence/user.repository.js');
const { authRepository } = await import('../src/persistence/auth.repository.js');
const { db } = await import('../src/shared/config/data.js');

const privateEmail = 'pessoa-confidencial@example.test';
const privatePassword = 'senha-exclusiva-do-teste';
const passwordHash = await bcrypt.hash(privatePassword, 10);
const activeUser = {
  id: 'user-internal', email: privateEmail, role: 'empresa' as const,
  name: 'Nome confidencial', status: 'active', password_hash: passwordHash,
};
const companyInput = {
  nome: 'Empresa confidencial', cnpj: '12345678000190', descricao: 'Texto confidencial',
  descricao_detalhada: 'Detalhes confidenciais', categoria: 'Categoria confidencial',
  cidade: 'Fortaleza', estado: 'CE', tamanho: 'pequena' as const, email: privateEmail,
};
const planRow: PlanRow = {
  id: 7, name: 'Plano confidencial', slug: 'teste', description: 'Detalhes confidenciais',
  price: 19.9, billing_period: 'monthly', features: ['Recurso confidencial'], limits: { members: 3 },
  is_featured: false, is_active: true, display_order: 1,
};

type RecordLine = {
  event: string;
  level: string;
  module: string;
  requestId?: string;
  context?: Record<string, unknown>;
  error?: unknown;
};

class MemoryDestination extends Writable {
  text = '';

  _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    this.text += chunk.toString();
    callback();
  }

  records(): RecordLine[] {
    return this.text.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  }
}

function recording(t: TestContext) {
  const destination = new MemoryDestination();
  const logger = createLogger({ destination, level: 'debug', pretty: false });
  const requestId = '71865dbe-8c54-4e77-b60c-40b881ca9ced';
  t.after(() => logger.close());

  return {
    destination,
    records: () => destination.records(),
    run: <T>(callback: () => T) => runWithLogContext({
      requestId, logger: createRequestLogger(logger, requestId), active: true,
    }, callback),
  };
}

function assertPrivateDataAbsent(output: string, extra: string[] = []) {
  for (const sensitive of [privateEmail, privatePassword, passwordHash, activeUser.name, companyInput.nome, companyInput.cnpj, ...extra]) {
    assert.equal(output.includes(sensitive), false);
  }
}

test.beforeEach(t => {
  const context = t as TestContext;
  context.mock.method(db, 'query', async () => { throw new Error('Consulta externa não autorizada no teste.'); });
  context.mock.method(Resend.prototype, 'post', async () => { throw new Error('Envio externo não autorizado no teste.'); });
});

test('Empresa registra criação somente após persistência confirmada e preserva a instância de erro', async t => {
  const capture = recording(t);
  let resolvePersist!: (company: Company) => void;
  let savedCompany!: Company;
  t.mock.method(companyRepository, 'create', async (company: Company) => {
    savedCompany = company;
    return new Promise<Company>(resolve => { resolvePersist = resolve; });
  });

  const pending = capture.run(() => companyService.createCompany(companyInput));
  await Promise.resolve();
  assert.equal(capture.records().length, 0);
  resolvePersist({ ...savedCompany, id: 'persisted-company-internal' });
  const created = await pending;

  assert.equal(created.id, 'persisted-company-internal');
  assert.deepEqual(capture.records().map(record => record.event), ['company.created']);
  assert.deepEqual(capture.records()[0].context, { companyId: created.id, persistenceMode: 'postgres' });
  assertPrivateDataAbsent(capture.destination.text);

  const original = new Error('Falha simulada de persistência');
  t.mock.method(companyRepository, 'create', async () => { throw original; });
  await assert.rejects(capture.run(() => companyService.createCompany(companyInput)), error => error === original);
  assert.equal(capture.records().length, 1);
});

test('Consultas de empresas registram operação e contagem sem termos de busca nem objetos completos', async t => {
  const capture = recording(t);
  const company: Company = { ...companyInput, id: 'company-internal', status: 'ativo', verificado: false };
  t.mock.method(companyRepository, 'getAll', async () => [company]);
  t.mock.method(companyRepository, 'getVerified', async () => []);
  t.mock.method(companyRepository, 'getByCategory', async () => [company]);
  t.mock.method(companyRepository, 'getByState', async () => [company]);
  t.mock.method(companyRepository, 'getBySize', async () => [company]);
  t.mock.method(companyRepository, 'searchByName', async () => [company]);
  t.mock.method(companyRepository, 'getById', async () => company);

  await capture.run(async () => {
    await companyService.getCompanies();
    await companyService.getVerifiedCompanies();
    await companyService.getCompaniesByCategory('categoria-busca-privada');
    await companyService.getCompaniesByState('estado-busca-privado');
    await companyService.getCompaniesBySize('pequena');
    await companyService.searchCompanies('nome-busca-privado');
    await companyService.getCompanyById(company.id);
  });

  assert.deepEqual(capture.records().map(record => record.context?.operation), ['all', 'verified', 'category', 'state', 'size', 'search', 'get-by-id']);
  assert.ok(capture.records().every(record => record.level === 'debug' && record.event === 'company.queried'));
  assert.equal(capture.records()[1].context?.count, 0);
  assertPrivateDataAbsent(capture.destination.text, ['categoria-busca-privada', 'estado-busca-privado', 'nome-busca-privado']);
});

test('Plano atribuído exige plano existente e atualização confirmada; ausência e falhas não geram sucesso', async t => {
  const capture = recording(t);
  t.mock.method(planRepository, 'getActiveById', async () => undefined);
  const assignment = t.mock.method(userRepository, 'assignPlan', async () => true);
  assert.equal(await capture.run(() => planService.assignPlanToUser('user-internal', '7')), null);
  assert.equal(assignment.mock.callCount(), 0);

  t.mock.method(planRepository, 'getActiveById', async () => planRow);
  t.mock.method(userRepository, 'assignPlan', async () => false);
  assert.equal(await capture.run(() => planService.assignPlanToUser('user-internal', '7')), null);
  assert.equal(capture.records().length, 0);

  const original = new Error('Falha simulada da atribuição');
  t.mock.method(userRepository, 'assignPlan', async () => { throw original; });
  await assert.rejects(capture.run(() => planService.assignPlanToUser('user-internal', '7')), error => error === original);
  assert.equal(capture.records().length, 0);

  t.mock.method(userRepository, 'assignPlan', async () => true);
  assert.equal((await capture.run(() => planService.assignPlanToUser('user-internal', '7')))?.id, '7');
  assert.deepEqual(capture.records().map(record => record.event), ['plan.assigned']);
  assert.deepEqual(capture.records()[0].context, { userId: 'user-internal', planId: 7, persistenceMode: 'postgres' });
});

test('Listagem de planos registra apenas contagem após leitura confirmada', async t => {
  const capture = recording(t);
  t.mock.method(planRepository, 'getActive', async () => [planRow]);
  assert.equal((await capture.run(planService.listActivePlans)).length, 1);
  assert.deepEqual(capture.records()[0].context, { count: 1, persistenceMode: 'postgres' });
  assert.equal(capture.records()[0].event, 'plans.listed');
  assert.equal(capture.records()[0].level, 'debug');
  assertPrivateDataAbsent(capture.destination.text, [planRow.name, planRow.description]);
});

test('Login registra sucesso após credenciais e JWT; rejeições não registram identidade nem sucesso', async t => {
  const capture = recording(t);
  t.mock.method(userRepository, 'getByEmailAndRole', async () => undefined);
  await assert.rejects(capture.run(() => userService.login({ email: privateEmail, role: 'empresa', password: privatePassword })));
  t.mock.method(userRepository, 'getByEmailAndRole', async () => ({ ...activeUser, status: 'pending' }));
  await assert.rejects(capture.run(() => userService.login({ email: privateEmail, role: 'empresa', password: privatePassword })));
  t.mock.method(userRepository, 'getByEmailAndRole', async () => activeUser);
  await assert.rejects(capture.run(() => userService.login({ email: privateEmail, role: 'empresa', password: 'senha-incorreta' })));
  assert.equal(capture.records().length, 0);

  const result = await capture.run(() => userService.login({ email: privateEmail, role: 'empresa', password: privatePassword }));
  assert.equal(result.user.id, activeUser.id);
  assert.equal(typeof result.token, 'string');
  assert.deepEqual(capture.records().map(record => record.event), ['user.authenticated']);
  assertPrivateDataAbsent(capture.destination.text, [result.token]);
});

test('Recuperação ausente mantém silêncio e persistência que falha não registra preparação', async t => {
  const capture = recording(t);
  const original = new Error('Falha simulada do reset');
  t.mock.method(userRepository, 'getByEmail', async () => undefined);
  await capture.run(() => userService.forgotPassword(privateEmail));
  t.mock.method(userRepository, 'getByEmail', async () => activeUser);
  t.mock.method(userRepository, 'savePasswordResetToken', async () => { throw original; });
  await assert.rejects(capture.run(() => userService.forgotPassword(privateEmail)), error => error === original);
  assert.equal(capture.records().length, 0);
});

test('Preparação de reset permanece quando envio falha e não duplica erro nem declara aceite do provedor', async t => {
  const capture = recording(t);
  const providerFailure = new Error('Provedor simulado indisponível');
  let persistedHash = '';
  t.mock.method(userRepository, 'getByEmail', async () => activeUser);
  t.mock.method(userRepository, 'savePasswordResetToken', async (_id: unknown, hash: string) => { persistedHash = hash; });
  t.mock.method(Resend.prototype, 'post', async () => { throw providerFailure; });

  await assert.rejects(capture.run(() => userService.forgotPassword(privateEmail)), error => {
    assert.ok(error instanceof Error);
    assert.equal(error.cause, providerFailure);
    return true;
  });
  assert.equal(persistedHash.length, 64);
  assert.deepEqual(capture.records().map(record => record.event), ['user.password-reset.prepared']);
  assertPrivateDataAbsent(capture.destination.text, [persistedHash]);
});

test('Recuperação e troca de senha registram etapas confirmadas sem token ou hash', async t => {
  const capture = recording(t);
  let persistedHash = '';
  let changedHash = '';
  t.mock.method(userRepository, 'getByEmail', async () => activeUser);
  t.mock.method(userRepository, 'savePasswordResetToken', async (_id: unknown, hash: string) => { persistedHash = hash; });
  t.mock.method(Resend.prototype, 'post', async () => ({ data: { id: 'provider-private' }, error: null }));
  await capture.run(() => userService.forgotPassword(privateEmail));
  assert.deepEqual(capture.records().map(record => record.event), ['user.password-reset.prepared', 'mail.provider.accepted']);

  t.mock.method(userRepository, 'getByValidResetTokenHash', async () => ({ id: activeUser.id }));
  t.mock.method(userRepository, 'updatePasswordAndClearResetToken', async (_id: unknown, hash: string) => { changedHash = hash; });
  await capture.run(() => userService.resetPassword({ token: 'token-reset-privado', password: privatePassword }));
  assert.equal(await bcrypt.compare(privatePassword, changedHash), true);
  assert.equal(capture.records().at(-1)?.event, 'user.password.changed');
  assertPrivateDataAbsent(capture.destination.text, [persistedHash, changedHash, 'token-reset-privado', 'provider-private']);

  const original = new Error('Falha simulada da troca');
  const before = capture.records().length;
  t.mock.method(userRepository, 'updatePasswordAndClearResetToken', async () => { throw original; });
  await assert.rejects(capture.run(() => userService.resetPassword({ token: 'token-reset-privado', password: privatePassword })), error => error === original);
  assert.equal(capture.records().length, before);
});

test('Convite validado não equivale a ativação; primeiro acesso só conclui após atualização confirmada', async t => {
  const capture = recording(t);
  const token = jwt.sign({ email: privateEmail, role: 'empresa' }, process.env.JWT_INVITE_SECRET!, { expiresIn: '1h' });
  const pendingUser = { ...activeUser, status: 'pending', invite_token: token };
  t.mock.method(authRepository, 'getInviteUserByEmail', async () => pendingUser);
  t.mock.method(authRepository, 'activateUser', async () => false);

  assert.deepEqual(await capture.run(() => authService.validateToken(token)), { email: privateEmail });
  await assert.rejects(capture.run(() => authService.firstAccess(token, privatePassword)));
  assert.equal(capture.records().some(record => record.event === 'auth.first-access.completed'), false);

  t.mock.method(authRepository, 'activateUser', async () => true);
  await capture.run(() => authService.firstAccess(token, privatePassword));
  assert.equal(capture.records().at(-1)?.event, 'auth.first-access.completed');
  assert.equal(capture.records().filter(record => record.event === 'auth.first-access.completed').length, 1);
  assertPrivateDataAbsent(capture.destination.text, [token]);
});

test('Reenvio prepara reset após persistência e delegação de e-mail emite um único aceite', async t => {
  const capture = recording(t);
  t.mock.method(authRepository, 'getResetUserByEmail', async () => undefined);
  await capture.run(() => authService.resendInviteEmail(privateEmail));
  assert.equal(capture.records().length, 0);

  let savedToken = '';
  t.mock.method(authRepository, 'getResetUserByEmail', async () => activeUser);
  t.mock.method(authRepository, 'saveResetToken', async (_id: unknown, token: string) => { savedToken = token; });
  t.mock.method(Resend.prototype, 'post', async () => ({ data: { id: 'provider-private' }, error: null }));
  await capture.run(() => authService.resendInviteEmail(privateEmail));
  assert.deepEqual(capture.records().map(record => record.event), ['auth.password-reset.prepared', 'mail.provider.accepted']);
  assertPrivateDataAbsent(capture.destination.text, [savedToken]);
});

test('Convite administrativo registra preparação após persistir e separa a etapa de envio', async t => {
  const capture = recording(t);
  const original = new Error('Falha simulada do convite');
  t.mock.method(authRepository, 'getInviteUserByEmail', async () => undefined);
  t.mock.method(authRepository, 'saveInvite', async () => { throw original; });
  await assert.rejects(capture.run(() => adminService.inviteUser(privateEmail, 'empresa')), error => error === original);
  assert.equal(capture.records().length, 0);

  t.mock.method(authRepository, 'saveInvite', async () => {});
  t.mock.method(Resend.prototype, 'post', async () => ({ data: { id: 'provider-private' }, error: null }));
  await capture.run(() => adminService.inviteUser(privateEmail, 'empresa'));
  assert.deepEqual(capture.records().map(record => record.event), ['admin.invite.prepared', 'mail.provider.accepted']);
  assertPrivateDataAbsent(capture.destination.text, ['provider-private']);
});

test('Erro retornado pelo provedor não registra aceite e mantém sua causa no AppError', async t => {
  const capture = recording(t);
  t.mock.method(Resend.prototype, 'post', async () => ({ data: null, error: { message: 'Falha privada do provedor' } }));

  await assert.rejects(capture.run(() => mailService.sendInviteEmail({ email: privateEmail, role: 'empresa', token: 'token-convite-privado' })), error => {
    assert.ok(error instanceof Error);
    assert.ok(error.cause instanceof Error);
    assert.equal(error.cause.message, 'Falha privada do provedor');
    return true;
  });
  assert.equal(capture.records().length, 0);
});

test('Falha de escrita do logger não substitui retorno de empresa nem exceção de persistência', async t => {
  const logger = createLogger({ destination: { write() { throw new Error('Destino simulado indisponível'); } }, pretty: false });
  t.after(() => logger.close());
  const context = { requestId: '71865dbe-8c54-4e77-b60c-40b881ca9ced', logger, active: true };
  t.mock.method(companyRepository, 'create', async (company: Company) => company);
  const created = await runWithLogContext(context, () => companyService.createCompany(companyInput));
  assert.ok(created.id);

  const original = new Error('Exceção original da persistência');
  t.mock.method(companyRepository, 'create', async () => { throw original; });
  await assert.rejects(runWithLogContext(context, () => companyService.createCompany(companyInput)), error => error === original);
});

test('Modo JSON registra gravações confirmadas e caixa de saída isolada sem requestId nem dados privados', async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'civix-logging-services-'));
  try {
    const source = `
      import assert from 'node:assert/strict';
      import { writeFile, unlink } from 'node:fs/promises';
      import { basename, dirname, join } from 'node:path';
      import { createMockUser } from './src/services/mock.user.service.ts';
      import { createCompany } from './src/services/company.service.ts';
      import { sendInviteEmail, sendResetPasswordEmail, sendForgotPasswordEmail } from './src/services/mail.service.ts';
      import { readLocalData } from './src/persistence/json/local.store.ts';
      const user = await createMockUser({ email: 'local-private@example.test', role: 'empresa', name: 'Nome local privado', password: 'senha-local-privada' });
      const company = await createCompany(${JSON.stringify(companyInput)});
      await sendInviteEmail({ email: 'local-private@example.test', role: 'empresa', token: 'convite-local-privado' });
      await sendResetPasswordEmail({ email: 'local-private@example.test', resetUrl: 'http://frontend.example.test/reset?token=reset-local-privado' });
      await sendForgotPasswordEmail({ email: 'local-private@example.test', token: 'delegado-local-privado' });
      await assert.rejects(createMockUser({ email: 'local-private@example.test', role: 'empresa', password: 'senha-local-privada' }));
      const lock = join(process.env.MOCK_DATA_DIR, 'data.lock');
      await writeFile(lock, 'fixture');
      try { await assert.rejects(sendInviteEmail({ email: 'local-private@example.test', role: 'empresa', token: 'falha-local-privada' })); }
      finally { await unlink(lock); }
      const data = await readLocalData();
      assert.equal(data.users.length, 1);
      assert.equal(data.companies.length, 1);
      assert.equal(data.outbox.length, 3);
      assert.equal(data.users[0].id, user.id);
      assert.equal(data.companies[0].id, company.id);
    `;
    const child = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', source], {
      cwd: process.cwd(),
      env: { ...process.env, USE_MOCK_DATA: 'true', MOCK_DATA_DIR: fixtureRoot, LOG_LEVEL: 'debug', NODE_ENV: 'test', RESEND_API_KEY: '', MAIL_FROM: '' },
      encoding: 'utf8', timeout: 20000,
    });
    assert.equal(child.status, 0, child.stderr);
    const records: RecordLine[] = child.stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
    assert.deepEqual(records.map(record => record.event), ['mock.user.created', 'company.created', 'mail.outbox.saved', 'mail.outbox.saved', 'mail.outbox.saved']);
    assert.ok(records.every(record => !('requestId' in record)));
    assert.ok(records.every(record => record.context?.persistenceMode === 'json'));
    assertPrivateDataAbsent(child.stdout, ['local-private@example.test', 'Nome local privado', 'senha-local-privada', 'convite-local-privado', 'reset-local-privado', 'delegado-local-privado', 'falha-local-privada']);
  } finally {
    assert.equal(dirname(fixtureRoot), tmpdir());
    assert.ok(basename(fixtureRoot).startsWith('civix-logging-services-'));
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

test('Comando local com flag desativada emite um único erro JSON sanitizado sem requestId', () => {
  const child = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/mock.user.create.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, USE_MOCK_DATA: 'false', LOG_LEVEL: 'info', NODE_ENV: 'production' },
    encoding: 'utf8', timeout: 10000,
  });

  assert.equal(child.status, 1);
  assert.equal(child.stderr, '');
  const records: RecordLine[] = child.stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  assert.equal(records.length, 1);
  assert.equal(records[0].event, 'mock.user-command.failed');
  assert.equal(records[0].level, 'error');
  assert.equal('requestId' in records[0], false);
  assert.ok(records[0].error);
  assertPrivateDataAbsent(child.stdout);
});

test('Comando local interativo preserva stdout como JSON e envia perguntas para stderr', async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'civix-logging-services-'));
  try {
    const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/mock.user.create.ts'], {
      cwd: process.cwd(),
      env: { ...process.env, USE_MOCK_DATA: 'true', MOCK_DATA_DIR: fixtureRoot, LOG_LEVEL: 'info', NODE_ENV: 'test' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let answered = 0;
    const answers = [
      { prompt: 'E-mail do usuário local: ', value: 'cli-private@example.test' },
      { prompt: 'Perfil (empresa ou cliente): ', value: 'cliente' },
      { prompt: 'Nome (opcional): ', value: 'Nome cli privado' },
    ];
    const timeout = setTimeout(() => child.kill(), 10000);

    try {
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', chunk => { stdout += chunk; });
      child.stderr.on('data', chunk => {
        stderr += chunk;
        while (answered < answers.length && stderr.includes(answers[answered].prompt)) {
          child.stdin.write(answers[answered].value + '\n');
          answered++;
        }
      });
      const status = await new Promise<number | null>((resolve, reject) => {
        child.once('error', reject);
        child.once('close', resolve);
      });

      assert.equal(status, 0);
      assert.equal(answered, 3);
      const records: RecordLine[] = stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
      assert.equal(records.length, 1);
      assert.equal(records[0].event, 'mock.user.created');
      assert.equal(records[0].level, 'info');
      assert.equal('requestId' in records[0], false);
      assert.equal(records[0].context?.role, 'cliente');
      assert.equal(records[0].context?.persistenceMode, 'json');
      assertPrivateDataAbsent(stdout, ['cli-private@example.test', 'Nome cli privado']);
      const data = JSON.parse(await readFile(join(fixtureRoot, 'data.json'), 'utf8'));
      assert.equal(data.users.length, 1);
      assert.equal(data.users[0].email, 'cli-private@example.test');
      assert.equal(data.users[0].role, 'cliente');
    } finally {
      clearTimeout(timeout);
      if (child.exitCode == null && child.signalCode == null) child.kill();
    }
  } finally {
    assert.equal(dirname(fixtureRoot), tmpdir());
    assert.ok(basename(fixtureRoot).startsWith('civix-logging-services-'));
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

test('Comando local com flag inválida captura a falha de configuração como um único erro JSON', () => {
  const child = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/mock.user.create.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, USE_MOCK_DATA: 'valor-invalido', LOG_LEVEL: 'info', NODE_ENV: 'production' },
    encoding: 'utf8', timeout: 10000,
  });

  assert.equal(child.status, 1);
  assert.equal(child.stderr, '');
  const records: RecordLine[] = child.stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  assert.equal(records.length, 1);
  assert.equal(records[0].event, 'mock.user-command.failed');
  assert.equal(records[0].level, 'error');
  assert.equal(records[0].module, 'mock');
  assert.equal('requestId' in records[0], false);
  assert.ok(records[0].error);
  assertPrivateDataAbsent(child.stdout);
});

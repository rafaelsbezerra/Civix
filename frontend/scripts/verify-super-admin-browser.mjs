import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { chromium, expect } from '@playwright/test'
import { createServer } from 'vite'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const worktreeRoot = resolve(frontendRoot, '..')
const backendRoot = resolve(worktreeRoot, 'backend')
const fixtureRoot = await mkdtemp(join(tmpdir(), 'civix-super-admin-e2e-fixture-'))
const artifactRoot = await mkdtemp(join(tmpdir(), 'civix-super-admin-e2e-artifacts-'))
const fixtureFile = join(fixtureRoot, 'data.json')
const password = 'Synthetic-Only-Password-934!'
const actorId = '10000000-0000-4000-8000-000000000001'
const otherAdminId = '10000000-0000-4000-8000-000000000002'
const seedCompanyId = '20000000-0000-4000-8000-000000000001'
const seedCompanyAdminId = '30000000-0000-4000-8000-000000000001'
const seedAttendantId = '30000000-0000-4000-8000-000000000002'
const planOneId = '1'
const planTwoId = '2'
const rootEmail = 'root.e2e@example.test'
const otherAdminEmail = 'second.root.e2e@example.test'
const companyAdminEmail = 'company.admin.e2e@example.test'
const attendantEmail = 'attendant.e2e@example.test'
const syntheticCompanyName = 'Empresa sintética inicial E2E'

let backendProcess
let viteServer
let browser
let apiBase
let appBase
let superAdminToken
const capturedRequests = []

function logStep(message) {
  console.log('[E2E] ' + message)
}

function expectStatus(response, status, label) {
  assert.equal(response.status, status, label + ': status HTTP inesperado')
}

async function requestJson(path, options = {}) {
  const headers = { ...(options.token ? { Authorization: 'Bearer ' + options.token } : {}) }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const response = await fetch(apiBase + path, {
    method: options.method || 'GET',
    headers,
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    signal: AbortSignal.timeout(15000),
  })
  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }
  return { status: response.status, payload }
}

function responseData(response) {
  return response.payload && typeof response.payload === 'object' && 'data' in response.payload
    ? response.payload.data
    : response.payload
}

async function readFixture() {
  return JSON.parse(await readFile(fixtureFile, 'utf8'))
}

function latestRequest(path, method) {
  const match = [...capturedRequests].reverse().find(item => item.path === path && item.method === method)
  assert.ok(match, 'A interface não enviou a solicitação esperada.')
  return match.body
}

async function waitForBackend(child, marker) {
  return new Promise((resolveReady, rejectReady) => {
    let output = ''
    const timer = setTimeout(() => rejectReady(new Error('Tempo esgotado ao iniciar a API isolada.')), 20000)
    const finish = (error, port) => {
      clearTimeout(timer)
      if (error) rejectReady(error)
      else resolveReady(port)
    }
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => {
      output += chunk
      const match = output.match(new RegExp(marker + '(\\d+)'))
      if (match) finish(null, Number(match[1]))
    })
    child.once('error', () => finish(new Error('Não foi possível iniciar o processo isolado da API.')))
    child.once('exit', code => {
      if (!output.includes(marker)) finish(new Error('A API isolada encerrou antes de informar a porta (' + code + ').'))
    })
  })
}

async function stopChild(child) {
  if (!child || child.exitCode !== null) return
  await new Promise(resolveStop => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolveStop()
    }, 5000)
    child.once('exit', () => {
      clearTimeout(timer)
      resolveStop()
    })
    child.kill('SIGTERM')
  })
}

function makeCompany(id, nome, cnpj, planId, email) {
  return {
    id,
    nome,
    cnpj,
    descricao: 'Empresa sintética para verificação local.',
    descricao_detalhada: 'Registro temporário criado pelo verificador E2E local.',
    categoria: 'Serviços',
    cidade: 'Fortaleza',
    estado: 'CE',
    status: 'ativo',
    verificado: false,
    tamanho: 'pequena',
    plan_id: planId,
    email,
    telefone: null,
    endereco: null,
    website: null,
    whatsapp: null,
    deleted_at: null,
    deactivation_reason: null,
    deactivated_at: null,
    deactivated_by: null,
  }
}

function makeUser(id, email, role, companyId, hash, name) {
  return {
    id,
    email,
    role,
    name,
    password_hash: hash,
    status: 'active',
    deleted_at: null,
    deactivation_reason: null,
    tokens_revoked_at: null,
    company_id: companyId,
    invite_token: null,
    reset_password_token: null,
    reset_password_expires: null,
  }
}

function makePlan(id, name, slug, price, order) {
  return {
    id,
    name,
    slug,
    description: 'Plano sintético para conferir fluxos comerciais.',
    price,
    billing_period: 'monthly',
    features: ['Recurso sintético'],
    limits: { users: 10 },
    is_featured: false,
    is_active: true,
    display_order: order,
  }
}

async function createFixture() {
  const require = createRequire(join(backendRoot, 'package.json'))
  const bcrypt = require('bcrypt')
  const hash = await bcrypt.hash(password, 4)
  const fixture = {
    version: 1,
    companies: [makeCompany(seedCompanyId, syntheticCompanyName, '00000000000001', planOneId, 'contact.initial@example.test')],
    users: [
      makeUser(actorId, rootEmail, 'super_admin', null, hash, 'Root E2E'),
      makeUser(otherAdminId, otherAdminEmail, 'super_admin', null, hash, 'Outro Root E2E'),
      makeUser(seedCompanyAdminId, companyAdminEmail, 'admin_empresa', seedCompanyId, hash, 'Admin Empresa E2E'),
      makeUser(seedAttendantId, attendantEmail, 'atendente', seedCompanyId, hash, 'Atendente E2E'),
    ],
    images: [],
    plans: [makePlan(planOneId, 'Plano Horizonte E2E', 'horizonte-e2e', '99.90', 10), makePlan(planTwoId, 'Plano Farol E2E', 'farol-e2e', '149.90', 20)],
    sales: [],
    companyRegistrationOperations: [],
    outbox: [],
  }
  await writeFile(fixtureFile, JSON.stringify(fixture, null, 2) + '\n', 'utf8')
}

function setPageNetworkGuard(page) {
  page.on('request', request => {
    const requestUrl = new URL(request.url())
    if (requestUrl.pathname.startsWith('/api/')) {
      const bodyText = request.postData()
      if (bodyText) {
        try {
          capturedRequests.push({ path: requestUrl.pathname, method: request.method(), body: JSON.parse(bodyText) })
        } catch {
          capturedRequests.push({ path: requestUrl.pathname, method: request.method(), body: null })
        }
      }
    }
  })
  return page.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.protocol === 'data:' || url.protocol === 'blob:' || url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      return route.continue()
    }
    return route.abort()
  })
}

async function signInThroughUi(page, email) {
  await page.goto(appBase + '/login/empresa', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Email').fill(email)
  await page.getByRole('textbox', { name: 'Senha' }).fill(password)
  await page.getByRole('button', { name: 'Login' }).click()
  await page.waitForURL('**/super-admin', { timeout: 15000 })
  await page.getByRole('main').waitFor({ state: 'visible' })
}

async function apiSignIn(email, role, loginPassword = password) {
  const response = await requestJson('/api/v1/users/login', { method: 'POST', body: { email, password: loginPassword, role } })
  expectStatus(response, 200, 'Login sintético')
  const result = responseData(response)
  assert.equal(typeof result?.token, 'string', 'A API não retornou a sessão sintética esperada.')
  return result.token
}

async function captureScreenshot(page, name) {
  await page.screenshot({ path: join(artifactRoot, name), fullPage: true, animations: 'disabled' })
}

function parseRgb(color) {
  const values = color.match(/[\d.]+/g)?.map(Number)
  assert.ok(values && values.length >= 3, 'A cor computada não pôde ser interpretada.')
  return { channels: values.slice(0, 3), alpha: values[3] ?? 1 }
}

function luminance(rgb) {
  const linear = rgb.map(channel => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function contrastRatio(foreground, background) {
  const foregroundColor = parseRgb(foreground)
  const backgroundColor = parseRgb(background)
  const composite = foregroundColor.channels.map((channel, index) =>
    foregroundColor.alpha * channel + (1 - foregroundColor.alpha) * backgroundColor.channels[index],
  )
  const first = luminance(composite)
  const second = luminance(backgroundColor.channels)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

async function main() {
  await createFixture()
  const nodeModulesPath = await realpath(resolve(frontendRoot, 'node_modules'))

  backendProcess = spawn(process.execPath, [
    '--import', 'tsx', '--input-type=module', '-e',
    "import { app } from './src/app.ts'; const server = app.listen(0, '127.0.0.1', () => console.log('CIVIX_E2E_API_PORT=' + server.address().port));",
  ], {
    cwd: backendRoot,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      USE_MOCK_DATA: 'true',
      MOCK_DATA_DIR: fixtureRoot,
      DATABASE_URL: '',
      JWT_SECRET: 'synthetic-e2e-jwt-secret-only',
      JWT_INVITE_SECRET: 'synthetic-e2e-invite-secret-only',
      JWT_RESET_SECRET: 'synthetic-e2e-reset-secret-only',
      LOG_LEVEL: 'fatal',
      DOTENV_CONFIG_PATH: join(fixtureRoot, '.env-disabled'),
      PORT: '0',
      FRONTEND_URL: 'http://127.0.0.1:1',
      RESEND_API_KEY: '',
      BREVO_API_KEY: '',
      R2_ACCOUNT_ID: '',
      R2_ACCESS_KEY_ID: '',
      R2_SECRET_ACCESS_KEY: '',
      R2_BUCKET_NAME: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const apiPort = await waitForBackend(backendProcess, 'CIVIX_E2E_API_PORT=')
  apiBase = 'http://127.0.0.1:' + apiPort

  viteServer = await createServer({
    root: frontendRoot,
    envDir: fixtureRoot,
    configFile: resolve(frontendRoot, 'vite.config.ts'),
    logLevel: 'error',
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify(apiBase) },
    server: { host: '127.0.0.1', port: 0, strictPort: false, fs: { allow: [frontendRoot, worktreeRoot, nodeModulesPath] } },
  })
  await viteServer.listen()
  const address = viteServer.httpServer.address()
  assert.ok(address && typeof address !== 'string', 'O Vite não informou a porta local.')
  appBase = 'http://127.0.0.1:' + address.port

  browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await setPageNetworkGuard(page)

  logStep('login superadmin pela interface e tema persistente')
  await signInThroughUi(page, rootEmail)
  superAdminToken = await page.evaluate(() => localStorage.getItem('token'))
  assert.ok(superAdminToken, 'A interface não guardou a sessão de teste.')
  await captureScreenshot(page, 'desktop-light.png')
  const themeToggle = page.getByRole('button', { name: 'Ativar modo escuro' })
  await themeToggle.focus()
  await themeToggle.press('Enter')
  await expect(page.locator('.super-admin-root')).toHaveAttribute('data-theme', 'dark')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('.super-admin-root')).toHaveAttribute('data-theme', 'dark')
  await captureScreenshot(page, 'desktop-dark.png')
  const darkContrast = await page.locator('.super-admin-root h2').first().evaluate(element => {
    const color = getComputedStyle(element).color
    let background = getComputedStyle(element).backgroundColor
    let parent = element.parentElement
    while (parent && (background === 'rgba(0, 0, 0, 0)' || background === 'transparent')) {
      background = getComputedStyle(parent).backgroundColor
      parent = parent.parentElement
    }
    if (background === 'rgba(0, 0, 0, 0)' || background === 'transparent') {
      background = getComputedStyle(document.querySelector('.super-admin-root')).backgroundColor
    }
    return { color, background }
  })
  assert.ok(contrastRatio(darkContrast.color, darkContrast.background) >= 3, 'O contraste de título h2 no tema escuro ficou abaixo de 3:1.')
  await page.getByRole('button', { name: 'Ativar modo claro' }).click()

  logStep('CRUD de planos pelo catálogo comercial')
  await page.goto(appBase + '/super-admin/plans', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Novo plano' }).click()
  const planForm = page.getByRole('form', { name: 'Novo plano' })
  await planForm.getByLabel('Nome do plano').fill('Plano Aurora E2E')
  await planForm.getByLabel('Identificador (slug)').fill('aurora-e2e')
  await planForm.getByLabel('Preço em reais').fill('249.90')
  await planForm.getByLabel('Período comercial').selectOption('yearly')
  await planForm.getByLabel('Descrição').fill('Plano criado pelo verificador isolado.')
  await planForm.getByLabel('Recursos apresentados').fill('Recurso sintético A\nRecurso sintético B')
  await planForm.getByLabel('Ordem de exibição').fill('30')
  await planForm.getByRole('button', { name: 'Salvar plano' }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Plano Aurora E2E' })).toBeVisible()
  const planCreated = (await readFixture()).plans.find(item => item.slug === 'aurora-e2e')
  assert.ok(planCreated, 'O plano criado na interface não foi persistido no fixture JSON.')
  await page.getByRole('button', { name: 'Editar Plano Aurora E2E' }).click()
  const editPlanForm = page.getByRole('form', { name: 'Editar plano' })
  await editPlanForm.getByLabel('Preço em reais').fill('259.90')
  await editPlanForm.getByRole('button', { name: 'Salvar plano' }).click()
  await expect(page.getByRole('status')).toContainText('Plano salvo com sucesso.')
  await page.getByRole('button', { name: 'Desativar Plano Aurora E2E' }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Plano Aurora E2E' })).toContainText('Inativo')
  await page.getByRole('button', { name: 'Ativar Plano Aurora E2E' }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Plano Aurora E2E' })).toContainText('Ativo')
  const planAfterUi = (await readFixture()).plans.find(item => item.id === planCreated.id)
  assert.equal(planAfterUi?.price, '259.90', 'A edição do plano não foi persistida em JSON.')
  assert.equal(planAfterUi?.is_active, true, 'A reativação do plano não foi persistida em JSON.')

  logStep('cadastro de empresa, falha recuperável e operação idempotente')
  await page.goto(appBase + '/super-admin/companies/new', { waitUntil: 'domcontentloaded' })
  const companyForm = page.getByRole('form', { name: 'Cadastrar empresa com plano' })
  await companyForm.getByLabel('Nome da empresa').fill('Empresa de teste browser E2E')
  await companyForm.getByLabel('CNPJ').fill('00998877665544')
  await companyForm.getByLabel('Categoria').fill('Tecnologia')
  await companyForm.getByLabel('Porte').selectOption('pequena')
  await companyForm.getByLabel('Resumo').fill('Resumo da empresa sintética.')
  await companyForm.getByLabel('Descrição detalhada').fill('Descrição gerada exclusivamente pela verificação local.')
  await companyForm.getByLabel('Cidade').fill('Fortaleza')
  await companyForm.getByLabel('Estado').fill('CE')
  await companyForm.getByLabel('E-mail da empresa').fill('contato.browser.e2e@example.test')
  await companyForm.getByLabel('Plano comercial').selectOption(planTwoId)
  await requestJson('/api/v1/platform/plans/' + planTwoId + '/activation', { method: 'POST', token: superAdminToken, body: { active: false } }).then(response => expectStatus(response, 200, 'Desativar plano para falha recuperável'))
  const companyPostPath = '/api/v1/platform/companies'
  await companyForm.getByRole('button', { name: 'Cadastrar empresa e registrar venda' }).click()
  await expect(page.getByRole('alert')).toContainText('plano', { timeout: 15000 })
  const firstCompanyPayload = latestRequest(companyPostPath, 'POST')
  assert.ok(firstCompanyPayload.operationId, 'O cadastro sem sucesso não usou operationId.')
  await requestJson('/api/v1/platform/plans/' + planTwoId + '/activation', { method: 'POST', token: superAdminToken, body: { active: true } }).then(response => expectStatus(response, 200, 'Reativar plano após falha recuperável'))
  await companyForm.getByRole('button', { name: 'Cadastrar empresa e registrar venda' }).click()
  await page.getByRole('heading', { name: 'Empresa cadastrada.' }).waitFor({ state: 'visible', timeout: 15000 })
  const companyPayload = latestRequest(companyPostPath, 'POST')
  assert.equal(companyPayload.operationId, firstCompanyPayload.operationId, 'A repetição do mesmo cadastro alterou operationId.')
  assert.deepEqual(Object.keys(companyPayload).sort(), ['categoria', 'cidade', 'cnpj', 'descricao', 'descricao_detalhada', 'email', 'estado', 'nome', 'operationId', 'planId', 'tamanho'].sort(), 'O payload de cadastro contém propriedades fora da lista autorizada.')
  const companyRegistrationResponse = await requestJson(companyPostPath, { method: 'POST', token: superAdminToken, body: companyPayload })
  expectStatus(companyRegistrationResponse, 201, 'Repetir cadastro com o mesmo operationId')
  const replayedCompany = responseData(companyRegistrationResponse)
  assert.equal(replayedCompany.replayed, true, 'A API não reconheceu a repetição idempotente do cadastro.')
  const createdCompanyId = replayedCompany.company.id
  assert.equal(replayedCompany.sale.companyId, createdCompanyId, 'A venda inicial não ficou vinculada à empresa criada.')
  let dataAfterCreation = await readFixture()
  assert.equal(dataAfterCreation.companies.filter(item => item.id === createdCompanyId).length, 1, 'O replay duplicou a empresa no JSON.')
  assert.equal(dataAfterCreation.sales.filter(item => item.companyId === createdCompanyId).length, 1, 'O replay duplicou a venda inicial no JSON.')
  assert.equal(dataAfterCreation.companyRegistrationOperations.filter(item => item.operationId === companyPayload.operationId).length, 1, 'O JSON deveria preservar uma operação de cadastro.')

  logStep('edição de empresa sem venda automática e limpeza de contatos')
  const saleCountBeforeEdit = dataAfterCreation.sales.length
  await page.goto(appBase + '/super-admin/companies/' + createdCompanyId + '/edit', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/A alteração do plano não gera uma venda automática/).first()).toBeVisible()
  const companyEditForm = page.getByRole('form', { name: 'Editar empresa' })
  await companyEditForm.getByLabel('Plano comercial').selectOption(planOneId)
  await companyEditForm.getByLabel('E-mail da empresa').fill('')
  await companyEditForm.getByRole('button', { name: 'Salvar empresa' }).click()
  await expect(page.getByRole('status')).toContainText('Nenhuma venda foi lançada automaticamente.')
  const updatePayload = latestRequest('/api/v1/platform/companies/' + createdCompanyId, 'PUT')
  assert.equal(updatePayload.planId, planOneId)
  assert.equal(updatePayload.email, null, 'Limpar o e-mail não enviou null ao backend.')
  assert.ok(!['id', 'status', 'data_cadastro', 'verificado', 'plan_id', 'deleted_at', 'createdAt'].some(key => key in updatePayload), 'A edição enviou campos controlados pelo servidor.')
  const afterEdit = await readFixture()
  assert.equal(afterEdit.companies.find(item => item.id === createdCompanyId)?.plan_id, planOneId)
  assert.equal(afterEdit.companies.find(item => item.id === createdCompanyId)?.email, null)
  assert.equal(afterEdit.sales.length, saleCountBeforeEdit, 'A troca de plano lançou uma venda automática.')
  await page.goto(appBase + '/super-admin/companies/' + createdCompanyId, { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('Plano Horizonte E2E', { exact: true })).toBeVisible()
  await captureScreenshot(page, 'company-detail.png')

  logStep('lançamentos por plano e valor manual em UTC passado')
  const salesCountBeforeManual = (await readFixture()).sales.length
  await page.goto(appBase + '/super-admin/sales/new?companyId=' + createdCompanyId, { waitUntil: 'domcontentloaded' })
  const planSaleForm = page.getByRole('form', { name: 'Lançar venda manual' })
  await expect(planSaleForm).toBeVisible()
  await expect(planSaleForm.getByLabel('Valor em reais')).toHaveCount(0)
  await planSaleForm.getByLabel('Data comercial (UTC)').fill('2020-02-03T04:05')
  await planSaleForm.getByLabel(/Descrição \/ motivo/).fill('Venda sintética pelo plano vigente.')
  await planSaleForm.getByRole('button', { name: 'Registrar venda manual' }).click()
  await page.getByRole('heading', { name: 'Venda registrada.' }).waitFor({ state: 'visible', timeout: 15000 })
  const salePostPath = '/api/v1/platform/sales'
  const planSalePayload = latestRequest(salePostPath, 'POST')
  assert.equal(planSalePayload.pricingMode, 'company_plan')
  assert.ok(!('amount' in planSalePayload) && !('planId' in planSalePayload), 'O modo de plano enviou preço ou plano definido pelo cliente.')
  assert.equal(planSalePayload.soldAt, '2020-02-03T04:05:00.000Z', 'A data passada não foi normalizada em UTC.')
  const planSaleReplayResponse = await requestJson(salePostPath, { method: 'POST', token: superAdminToken, body: planSalePayload })
  expectStatus(planSaleReplayResponse, 201, 'Repetir venda por plano')
  assert.equal(responseData(planSaleReplayResponse).replayed, true, 'A repetição da venda não foi reconhecida como replay.')
  await page.getByRole('button', { name: 'Novo lançamento' }).click()
  const manualForm = page.getByRole('form', { name: 'Lançar venda manual' })
  await manualForm.getByLabel('Origem do valor').selectOption('manual_amount')
  await expect(manualForm.getByLabel('Valor em reais')).toBeVisible()
  await manualForm.getByLabel('Valor em reais').fill('45,67')
  await manualForm.getByLabel('Data comercial (UTC)').fill('2020-03-04T05:06')
  const manualPostCountBeforeMissingReason = capturedRequests.filter(item => item.path === salePostPath && item.method === 'POST').length
  await manualForm.getByRole('button', { name: 'Registrar venda manual' }).click()
  assert.equal(await manualForm.getByLabel(/Descrição \/ motivo/).evaluate(element => element.validity.valueMissing), true, 'A descrição de venda manual não ficou obrigatória no formulário.')
  assert.equal(capturedRequests.filter(item => item.path === salePostPath && item.method === 'POST').length, manualPostCountBeforeMissingReason, 'O formulário enviou venda manual sem justificativa.')
  await manualForm.getByLabel(/Descrição \/ motivo/).fill('Ajuste comercial sintético com justificativa.')
  await manualForm.getByRole('button', { name: 'Registrar venda manual' }).click()
  await page.getByRole('heading', { name: 'Venda registrada.' }).waitFor({ state: 'visible', timeout: 15000 })
  const manualSalePayload = latestRequest(salePostPath, 'POST')
  assert.equal(manualSalePayload.pricingMode, 'manual_amount')
  assert.equal(manualSalePayload.amount, '45.67')
  assert.equal(manualSalePayload.soldAt, '2020-03-04T05:06:00.000Z')
  assert.equal(manualSalePayload.description, 'Ajuste comercial sintético com justificativa.')
  assert.notEqual(manualSalePayload.operationId, planSalePayload.operationId, 'Uma venda de conteúdo novo reutilizou operationId anterior.')
  const manualReplay = await requestJson(salePostPath, { method: 'POST', token: superAdminToken, body: manualSalePayload })
  expectStatus(manualReplay, 201, 'Repetir venda manual')
  assert.equal(responseData(manualReplay).replayed, true, 'A repetição da venda manual não foi idempotente.')
  const salesAfterManual = await readFixture()
  assert.equal(salesAfterManual.sales.filter(item => item.companyId === createdCompanyId).length, 3, 'Os lançamentos/replays não preservaram as três vendas esperadas da empresa.')
  assert.equal(salesAfterManual.sales.length, salesCountBeforeManual + 2, 'O replay gravou uma venda manual duplicada.')

  logStep('listagem, filtros, exclusão confirmada e responsividade móvel')
  await page.goto(appBase + '/super-admin/sales', { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Vendas' }).waitFor({ state: 'visible' })
  await expect(page.getByText('Empresa de teste browser E2E', { exact: true }).first()).toBeVisible()
  const salesListScreenshot = 'sales.png'
  await captureScreenshot(page, salesListScreenshot)
  const listPage = await requestJson('/api/v1/platform/sales?page=1', { token: superAdminToken })
  expectStatus(listPage, 200, 'Paginação inicial das vendas')
  assert.equal(listPage.payload.meta?.page, 1)
  assert.equal(listPage.payload.meta?.pageSize, 20)
  const secondListPage = await requestJson('/api/v1/platform/sales?page=2', { token: superAdminToken })
  expectStatus(secondListPage, 200, 'Segunda página das vendas')
  assert.equal(secondListPage.payload.meta?.page, 2)
  const emptySales = await requestJson('/api/v1/platform/sales?planId=999999', { token: superAdminToken })
  expectStatus(emptySales, 200, 'Filtro de vendas sem resultado')
  assert.equal(emptySales.payload.data?.length, 0, 'Filtro de plano inexistente retornou vendas.')
  await page.getByRole('form', { name: 'Filtrar vendas' }).getByLabel('Origem').selectOption('manual')
  await page.getByRole('form', { name: 'Filtrar vendas' }).getByRole('button', { name: 'Filtrar' }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Venda sintética pelo plano vigente.' })).toHaveCount(0)
  await expect(page.getByRole('row').filter({ hasText: 'Ajuste comercial sintético com justificativa.' })).toBeVisible()
  const planFilter = page.getByLabel('Plano comercial')
  if (await planFilter.count()) {
    await planFilter.selectOption({ label: 'Plano Horizonte E2E' })
    await page.getByRole('form', { name: 'Filtrar vendas' }).getByRole('button', { name: 'Filtrar' }).click()
    await expect(page.getByRole('row').filter({ hasText: 'Ajuste comercial sintético com justificativa.' })).toBeVisible()
  }
  const targetRow = page.getByRole('row').filter({ hasText: 'Ajuste comercial sintético com justificativa.' })
  await targetRow.getByRole('button', { name: 'Excluir definitivamente' }).click()
  const deleteDialog = page.getByRole('dialog')
  await expect(deleteDialog).toBeVisible()
  await expect(deleteDialog).toContainText('A empresa e o plano serão preservados.')
  const deletedId = (await readFixture()).sales.find(item => item.description === manualSalePayload.description)?.id
  assert.ok(deletedId)
  await page.setViewportSize({ width: 390, height: 844 })
  const mobileDialogRect = await deleteDialog.evaluate(dialog => {
    const rect = dialog.getBoundingClientRect()
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      viewportWidth: document.documentElement.clientWidth,
      viewportHeight: document.documentElement.clientHeight,
    }
  })
  assert.ok(mobileDialogRect.x >= 0 && mobileDialogRect.x + mobileDialogRect.width <= mobileDialogRect.viewportWidth, 'O diálogo de confirmação ultrapassa as bordas horizontais do viewport móvel.')
  assert.ok(mobileDialogRect.y >= 0 && mobileDialogRect.y + mobileDialogRect.height <= mobileDialogRect.viewportHeight, 'O diálogo de confirmação ultrapassa as bordas verticais do viewport móvel.')
  assert.ok(Math.abs(mobileDialogRect.x + mobileDialogRect.width / 2 - mobileDialogRect.viewportWidth / 2) <= 2, 'O diálogo de confirmação não está centralizado horizontalmente no viewport móvel.')
  assert.ok(Math.abs(mobileDialogRect.y + mobileDialogRect.height / 2 - mobileDialogRect.viewportHeight / 2) <= 2, 'O diálogo de confirmação não está centralizado verticalmente no viewport móvel.')
  console.log('[E2E] Retângulo do diálogo móvel: ' + JSON.stringify(mobileDialogRect))
  await captureScreenshot(page, 'mobile-confirmation.png')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const salesBeforeConfirmedDelete = (await readFixture()).sales.length
  await targetRow.getByRole('button', { name: 'Excluir definitivamente' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.locator('p.sa-feedback[role="status"]')).toContainText('Venda excluída definitivamente.')
  let afterDelete = await readFixture()
  assert.equal(afterDelete.sales.length, salesBeforeConfirmedDelete - 1, 'A confirmação não removeu exatamente uma venda.')
  assert.equal(afterDelete.sales.some(item => item.id === deletedId), false, 'A venda confirmada continuou no JSON.')
  assert.ok(afterDelete.companies.some(item => item.id === createdCompanyId), 'A exclusão da venda removeu a empresa.')
  assert.ok(afterDelete.plans.some(item => String(item.id) === planOneId), 'A exclusão da venda removeu o plano.')
  assert.equal(afterDelete.sales.filter(item => item.companyId === createdCompanyId).length, 2, 'O histórico de outras vendas da empresa foi alterado.')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), true, 'A página de vendas tem rolagem horizontal no viewport móvel.')
  await page.getByRole('button', { name: 'Abrir menu de navegação' }).click()
  const mobileMenu = page.locator('dialog.sa-mobile-menu')
  await expect(mobileMenu).toHaveJSProperty('open', true)
  await captureScreenshot(page, 'mobile-menu.png')
  await page.keyboard.press('Escape')
  await expect(mobileMenu).toHaveJSProperty('open', false)

  logStep('suspensão, bloqueio público e revogação de sessão empresarial')
  const previousCompanyAdminToken = await apiSignIn(companyAdminEmail, 'admin_empresa')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(appBase + '/super-admin/companies/' + seedCompanyId, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Desativar empresa' }).click()
  const suspendDialog = page.getByRole('dialog')
  await suspendDialog.getByLabel('Motivo').fill('   ')
  await suspendDialog.getByRole('button', { name: 'Confirmar' }).click()
  await expect(suspendDialog.getByRole('alert')).toContainText('Informe o motivo.')
  assert.equal((await readFixture()).companies.find(item => item.id === seedCompanyId)?.status, 'ativo', 'A suspensão sem justificativa modificou a empresa.')
  await suspendDialog.getByLabel('Motivo').fill('Revisão operacional sintética E2E.')
  await suspendDialog.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('heading', { name: 'Empresa inativa' })).toBeVisible()
  let seedCompanyAfterSuspend = (await readFixture()).companies.find(item => item.id === seedCompanyId)
  assert.equal(seedCompanyAfterSuspend?.status, 'inativo')
  assert.equal(seedCompanyAfterSuspend?.deactivation_reason, 'Revisão operacional sintética E2E.')
  expectStatus(await requestJson('/api/v1/empresas/' + seedCompanyId), 404, 'Empresa suspensa no catálogo público')
  expectStatus(await requestJson('/api/v1/users/profile', { token: previousCompanyAdminToken }), 401, 'Sessão anterior à suspensão')
  await page.getByRole('button', { name: 'Reativar empresa' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('heading', { name: 'Empresa ativa' })).toBeVisible()
  seedCompanyAfterSuspend = (await readFixture()).companies.find(item => item.id === seedCompanyId)
  assert.equal(seedCompanyAfterSuspend?.status, 'ativo', 'A reativação da empresa não a tornou ativa.')
  expectStatus(await requestJson('/api/v1/users/profile', { token: previousCompanyAdminToken }), 401, 'Sessão anterior após reativação')
  const renewedCompanyAdminToken = await apiSignIn(companyAdminEmail, 'admin_empresa')
  expectStatus(await requestJson('/api/v1/users/profile', { token: renewedCompanyAdminToken }), 200, 'Novo login empresarial após reativação')

  logStep('convite empresarial, primeiro acesso e exclusão lógica de atendente')
  await page.goto(appBase + '/super-admin/companies/' + seedCompanyId + '/users', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Equipe empresarial' })).toBeVisible()
  await expect(page.getByText(attendantEmail)).toBeVisible()
  await captureScreenshot(page, 'users.png')
  await page.getByRole('button', { name: 'Convidar usuário' }).click()
  const teamInviteForm = page.getByRole('form', { name: 'Convidar usuário' })
  await teamInviteForm.getByLabel('Nome').fill('Atendente convidado E2E')
  await teamInviteForm.getByLabel('E-mail').fill('new.attendant.e2e@example.test')
  await teamInviteForm.getByLabel('Perfil').selectOption('atendente')
  await teamInviteForm.getByRole('button', { name: 'Enviar convite' }).click()
  await expect(page.locator('p.sa-feedback[role="status"]')).toContainText('Convite enviado.')
  const teamInvitePath = '/api/v1/platform/companies/' + seedCompanyId + '/users/invitations'
  const teamInvitePayload = latestRequest(teamInvitePath, 'POST')
  assert.deepEqual(Object.keys(teamInvitePayload).sort(), ['email', 'name', 'role'], 'O formulário empresarial enviou campos inesperados no convite.')
  const invitedTeamUser = (await readFixture()).users.find(user => user.email === teamInvitePayload.email)
  assert.equal(invitedTeamUser?.role, 'atendente')
  assert.equal(invitedTeamUser?.company_id, seedCompanyId)
  assert.equal(invitedTeamUser?.status, 'pending')
  const teamOutbox = (await readFixture()).outbox.filter(item => item.email === teamInvitePayload.email && item.kind === 'invite')
  assert.ok(teamOutbox.length)
  const teamInviteUrl = new URL(teamOutbox.at(-1).url)
  const teamInviteToken = teamInviteUrl.searchParams.get('token')
  assert.ok(teamInviteToken, 'O outbox local não contém token de convite.')
  await page.goto(appBase + '/primeiro-acesso?token=' + encodeURIComponent(teamInviteToken), { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('Mínimo de 8 caracteres').fill('SyntheticUser-934!')
  await page.getByPlaceholder('Repita a senha digitada').fill('SyntheticUser-934!')
  await page.getByRole('button', { name: 'Ativar Conta e Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Senha Cadastrada!' })).toBeVisible({ timeout: 15000 })
  const activeTeamUser = (await readFixture()).users.find(user => user.email === teamInvitePayload.email)
  assert.equal(activeTeamUser?.status, 'active', 'O primeiro acesso não ativou o usuário empresarial.')
  assert.equal(activeTeamUser?.invite_token, null, 'O primeiro acesso não invalidou o token de convite.')
  const newAttendantToken = await apiSignIn(teamInvitePayload.email, 'atendente', 'SyntheticUser-934!')
  await page.goto(appBase + '/super-admin/companies/' + seedCompanyId + '/users', { waitUntil: 'domcontentloaded' })
  const invitedUserRow = page.getByRole('row').filter({ hasText: teamInvitePayload.email })
  await invitedUserRow.getByRole('button', { name: 'Excluir atendente' }).click()
  const deleteUserDialog = page.getByRole('dialog')
  await deleteUserDialog.getByLabel('Motivo').fill('Remoção sintética após verificação E2E.')
  await deleteUserDialog.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.locator('p.sa-feedback[role="status"]')).toContainText('Acesso atualizado.')
  let afterTeamRemoval = await readFixture()
  const removedTeamUser = afterTeamRemoval.users.find(user => user.email === teamInvitePayload.email)
  assert.ok(removedTeamUser?.deleted_at, 'A exclusão do atendente não foi lógica.')
  assert.equal(removedTeamUser?.company_id, seedCompanyId, 'A exclusão removeu o vínculo empresarial de referência.')
  assert.ok(afterTeamRemoval.companies.some(company => company.id === seedCompanyId), 'A exclusão do atendente removeu a empresa.')
  expectStatus(await requestJson('/api/v1/users/profile', { token: newAttendantToken }), 401, 'Sessão do atendente excluído')

  logStep('convite global, bloqueio próprio e suspensão/reativação de outro superadmin')
  const previousOtherAdminToken = await apiSignIn(otherAdminEmail, 'super_admin')
  await page.goto(appBase + '/super-admin/administrators', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Superadmins' })).toBeVisible()
  const ownAdminRow = page.getByRole('row').filter({ has: page.getByText(rootEmail, { exact: true }) })
  await expect(ownAdminRow.getByRole('button', { name: 'Desativar' })).toBeDisabled()
  await page.getByRole('button', { name: 'Convidar usuário' }).click()
  const globalInviteForm = page.getByRole('form', { name: 'Convidar usuário' })
  await globalInviteForm.getByLabel('Nome').fill('Novo superadmin E2E')
  await globalInviteForm.getByLabel('E-mail').fill('new.superadmin.e2e@example.test')
  await expect(globalInviteForm.getByLabel('Perfil')).toHaveCount(0)
  await globalInviteForm.getByRole('button', { name: 'Enviar convite' }).click()
  await expect(page.locator('p.sa-feedback[role="status"]')).toContainText('Convite enviado.')
  const globalInvitePayload = latestRequest('/api/v1/platform/administrators/invitations', 'POST')
  assert.deepEqual(Object.keys(globalInvitePayload).sort(), ['email', 'name'], 'O convite global enviou perfil ou senha pelo navegador.')
  const globalInviteUser = (await readFixture()).users.find(user => user.email === globalInvitePayload.email)
  assert.equal(globalInviteUser?.role, 'super_admin')
  assert.equal(globalInviteUser?.company_id, null)
  assert.equal(globalInviteUser?.status, 'pending')
  assert.ok(!('password_hash' in globalInviteUser), 'A conta pendente recebeu hash de senha antes do primeiro acesso.')
  const otherAdminRow = page.getByRole('row').filter({ hasText: otherAdminEmail })
  await otherAdminRow.getByRole('button', { name: 'Desativar' }).click()
  const otherSuspendDialog = page.getByRole('dialog')
  await otherSuspendDialog.getByLabel('Motivo').fill('Revisão sintética do segundo acesso administrativo.')
  await otherSuspendDialog.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('row').filter({ hasText: otherAdminEmail })).toContainText('Desativado')
  expectStatus(await requestJson('/api/v1/users/profile', { token: previousOtherAdminToken }), 401, 'Sessão do superadmin suspenso')
  const suspendedAdminData = (await readFixture()).users.find(user => user.email === otherAdminEmail)
  assert.equal(suspendedAdminData?.status, 'blocked')
  assert.equal(suspendedAdminData?.deactivation_reason, 'Revisão sintética do segundo acesso administrativo.')
  const ownRowWhenLastActive = page.getByRole('row').filter({ has: page.getByText(rootEmail, { exact: true }) })
  await expect(ownRowWhenLastActive.getByRole('button', { name: 'Desativar' })).toBeDisabled()
  await page.getByRole('row').filter({ hasText: otherAdminEmail }).getByRole('button', { name: 'Reativar' }).click()
  const reactivateAdminDialog = page.getByRole('dialog')
  await expect(reactivateAdminDialog.getByLabel('Motivo')).toHaveCount(0)
  await reactivateAdminDialog.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('row').filter({ hasText: otherAdminEmail })).toContainText('Ativo')
  assert.equal((await readFixture()).users.find(user => user.email === otherAdminEmail)?.status, 'active')

  logStep('perfil próprio, atualização do cabeçalho e troca de e-mail')
  await page.goto(appBase + '/super-admin/settings/profile', { waitUntil: 'domcontentloaded' })
  const profileForm = page.getByRole('form', { name: 'Atualizar meu perfil' })
  await profileForm.getByLabel('Nome').fill('Root E2E Atualizado')
  await profileForm.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.locator('.sa-account')).toContainText('Root E2E Atualizado')
  assert.equal((await readFixture()).users.find(user => user.id === actorId)?.name, 'Root E2E Atualizado')
  await profileForm.getByLabel('E-mail').fill('root.updated.e2e@example.test')
  await profileForm.getByRole('button', { name: 'Salvar perfil' }).click()
  await page.waitForURL('**/login/empresa', { timeout: 15000 })
  await expect(page.getByRole('status')).toContainText('Perfil atualizado. Entre novamente com seu novo e-mail.')
  assert.equal(await page.evaluate(() => localStorage.getItem('token')), null, 'A troca de e-mail manteve a sessão antiga no navegador.')
  expectStatus(await requestJson('/api/v1/users/profile', { token: superAdminToken }), 401, 'Sessão superadmin após troca do próprio e-mail')
  await signInThroughUi(page, 'root.updated.e2e@example.test')
  superAdminToken = await page.evaluate(() => localStorage.getItem('token'))
  assert.ok(superAdminToken)

  logStep('arquivamento, restauração inativa e reativação explícita')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(appBase + '/super-admin/companies/' + createdCompanyId, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Arquivar empresa' }).click()
  const archiveDialog = page.getByRole('dialog')
  await archiveDialog.getByLabel('Motivo').fill('Arquivamento sintético para validar restauração.')
  await archiveDialog.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('heading', { name: 'Empresa arquivada' })).toBeVisible()
  afterDelete = await readFixture()
  assert.ok(afterDelete.companies.find(company => company.id === createdCompanyId)?.deleted_at)
  assert.equal(afterDelete.sales.filter(item => item.companyId === createdCompanyId).length, 2, 'Arquivar a empresa apagou seu histórico de vendas.')
  expectStatus(await requestJson('/api/v1/empresas/' + createdCompanyId), 404, 'Empresa arquivada no catálogo público')
  await page.getByRole('button', { name: 'Restaurar empresa' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByText(/Restauração preserva a empresa inativa/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Empresa inativa' })).toBeVisible()
  let restoredCompany = (await readFixture()).companies.find(company => company.id === createdCompanyId)
  assert.equal(restoredCompany?.deleted_at, null)
  assert.equal(restoredCompany?.status, 'inativo', 'A restauração tornou a empresa ativa automaticamente.')
  await page.getByRole('button', { name: 'Reativar empresa' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('heading', { name: 'Empresa ativa' })).toBeVisible()
  restoredCompany = (await readFixture()).companies.find(company => company.id === createdCompanyId)
  assert.equal(restoredCompany?.status, 'ativo', 'A reativação explícita não liberou a empresa restaurada.')

  logStep('arquivos de evidência em ' + artifactRoot)
  console.log('[E2E] Verificação E2E concluída com API real e fixture JSON local.')
}

try {
  await main()
} finally {
  if (browser) await browser.close().catch(() => undefined)
  if (viteServer) await viteServer.close().catch(() => undefined)
  await stopChild(backendProcess)
  const tempRoot = await realpath(tmpdir())
  const fixtureRealPath = await realpath(fixtureRoot).catch(() => null)
  const tempPrefix = tempRoot.endsWith(sep) ? tempRoot : tempRoot + sep
  if (fixtureRealPath && fixtureRealPath.startsWith(tempPrefix) && fixtureRealPath !== tempRoot) {
    await rm(fixtureRealPath, { recursive: true, force: true })
  } else if (fixtureRealPath) {
    throw new Error('O caminho da fixture não está contido no diretório temporário; a remoção foi cancelada.')
  }
  console.log('[E2E] Screenshots preservados em: ' + artifactRoot)
}
